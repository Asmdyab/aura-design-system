using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Academy.Agent.Infrastructure.Integrations;

public sealed class WhatsAppMessenger : IWhatsAppMessenger
{
    private readonly HttpClient _http;
    private readonly WhatsAppOptions _options;
    private readonly IFileStorage _fileStorage;
    private readonly ILogger<WhatsAppMessenger> _logger;

    public WhatsAppMessenger(
        HttpClient http,
        IOptions<WhatsAppOptions> options,
        IFileStorage fileStorage,
        ILogger<WhatsAppMessenger> logger)
    {
        _http = http;
        _options = options.Value;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task SendTextAsync(string toPhoneNumber, string text, CancellationToken ct = default)
        => await SendTextCoreAsync(toPhoneNumber, text, "text", ct);

    public async Task SendConfirmationAsync(string toPhoneNumber, string text, CancellationToken ct = default)
        => await SendTextCoreAsync(toPhoneNumber, text, "confirmation", ct);

    public async Task MarkAsReadAsync(string messageId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.AccessToken) || string.IsNullOrWhiteSpace(_options.PhoneNumberId))
            return;

        var payload = JsonSerializer.Serialize(new
        {
            messaging_product = "whatsapp",
            status = "read",
            message_id = messageId,
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.GraphBaseUrl}/{_options.ApiVersion}/{_options.PhoneNumberId}/messages")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);

        using var response = await _http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("WhatsApp mark-as-read failed ({Status}).", (int)response.StatusCode);
        }
    }

    private async Task SendTextCoreAsync(string toPhoneNumber, string text, string messageKind, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.AccessToken) || string.IsNullOrWhiteSpace(_options.PhoneNumberId))
        {
            _logger.LogWarning("WhatsApp not configured; skipped sending {Kind} to {To}.", messageKind, toPhoneNumber);
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            messaging_product = "whatsapp",
            recipient_type = "individual",
            to = toPhoneNumber,
            type = "text",
            text = new { body = text },
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.GraphBaseUrl}/{_options.ApiVersion}/{_options.PhoneNumberId}/messages")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);

        using var response = await _http.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("WhatsApp send failed ({Status}): {Body}", (int)response.StatusCode, body);
            throw new InvalidOperationException($"WhatsApp API error: {(int)response.StatusCode} {body}");
        }
    }

    public async Task<string?> DownloadMediaAsync(string mediaId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            _logger.LogWarning("WhatsApp not configured; skipped media download.");
            return null;
        }

        using var metaRequest = new HttpRequestMessage(HttpMethod.Get, $"{_options.GraphBaseUrl}/{_options.ApiVersion}/{mediaId}");
        metaRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);

        using var metaResponse = await _http.SendAsync(metaRequest, ct);
        metaResponse.EnsureSuccessStatusCode();
        var metaJson = await metaResponse.Content.ReadAsStringAsync(ct);
        using var metaDoc = JsonDocument.Parse(metaJson);
        var mediaUrl = metaDoc.RootElement.GetProperty("url").GetString();
        if (string.IsNullOrWhiteSpace(mediaUrl)) return null;

        var mimeType = metaDoc.RootElement.TryGetProperty("mime_type", out var mimeEl) ? mimeEl.GetString() : null;

        using var mediaRequest = new HttpRequestMessage(HttpMethod.Get, mediaUrl);
        mediaRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);

        using var mediaResponse = await _http.SendAsync(mediaRequest, ct);
        mediaResponse.EnsureSuccessStatusCode();
        await using var stream = await mediaResponse.Content.ReadAsStreamAsync(ct);

        var extension = mimeType switch
        {
            "image/png" => "png",
            "image/jpeg" => "jpg",
            "image/webp" => "webp",
            "application/pdf" => "pdf",
            _ => "bin",
        };

        var storedPath = await _fileStorage.SaveAsync(stream, $"whatsapp_{mediaId}.{extension}", mimeType ?? "application/octet-stream", ct);
        return _fileStorage.ResolveUrl(storedPath);
    }
}
