using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Academy.Agent.Api.Webhooks;
using Academy.Agent.Application.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Academy.Agent.Api.Controllers;

[ApiController]
[Route("api/webhooks/whatsapp")]
public class WhatsAppWebhookController : ControllerBase
{
    private readonly WhatsAppOptions _options;
    private readonly WhatsAppWebhookQueue _queue;
    private readonly ILogger<WhatsAppWebhookController> _logger;

    public WhatsAppWebhookController(
        IOptions<WhatsAppOptions> options,
        WhatsAppWebhookQueue queue,
        ILogger<WhatsAppWebhookController> logger)
    {
        _options = options.Value;
        _queue = queue;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Verify([FromQuery(Name = "hub.mode")] string? mode,
        [FromQuery(Name = "hub.verify_token")] string? verifyToken,
        [FromQuery(Name = "hub.challenge")] string? challenge)
    {
        if (mode == "subscribe" && verifyToken == _options.VerifyToken && !string.IsNullOrWhiteSpace(challenge))
        {
            _logger.LogInformation("WhatsApp webhook verified.");
            return Content(challenge, "text/plain");
        }

        _logger.LogWarning("WhatsApp webhook verification failed.");
        return Forbid();
    }

    [HttpPost]
    public async Task<IActionResult> Receive()
    {
        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync();

        if (!VerifySignature(rawBody))
        {
            _logger.LogWarning("WhatsApp webhook signature verification failed.");
            return Unauthorized();
        }

        try
        {
            using var doc = JsonDocument.Parse(rawBody);
            if (!doc.RootElement.TryGetProperty("entry", out var entries) || entries.ValueKind != JsonValueKind.Array)
                return Ok();

            foreach (var entry in entries.EnumerateArray())
            {
                if (!entry.TryGetProperty("changes", out var changes) || changes.ValueKind != JsonValueKind.Array)
                    continue;

                foreach (var change in changes.EnumerateArray())
                {
                    if (!change.TryGetProperty("value", out var value))
                        continue;

                    if (!value.TryGetProperty("messages", out var messages) || messages.ValueKind != JsonValueKind.Array)
                        continue;

                    foreach (var m in messages.EnumerateArray())
                    {
                        var from = m.TryGetProperty("from", out var fromEl) ? fromEl.GetString() : null;
                        var type = m.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : null;
                        var messageId = m.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;

                        if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(type) || messageId is null)
                            continue;

                        string? text = null;
                        string? mediaId = null;

                        if (type == "text" && m.TryGetProperty("text", out var textEl) && textEl.TryGetProperty("body", out var bodyEl))
                            text = bodyEl.GetString();

                        if ((type == "image" || type == "document" || type == "sticker") &&
                            m.TryGetProperty(type, out var mediaEl) &&
                            mediaEl.TryGetProperty("id", out var mediaIdEl))
                        {
                            mediaId = mediaIdEl.GetString();
                        }

                        _queue.Enqueue(new WhatsAppInboundMessage(from, type, text, mediaId, messageId));
                    }
                }
            }
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Invalid WhatsApp webhook payload.");
            return BadRequest();
        }

        return Ok();
    }

    private bool VerifySignature(string rawBody)
    {
        var header = Request.Headers["X-Hub-Signature-256"].ToString();
        const string prefix = "sha256=";
        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        var provided = header[prefix.Length..];
        if (string.IsNullOrWhiteSpace(_options.AppSecret)) return false;

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_options.AppSecret));
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody))).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(hash),
            Encoding.UTF8.GetBytes(provided));
    }
}
