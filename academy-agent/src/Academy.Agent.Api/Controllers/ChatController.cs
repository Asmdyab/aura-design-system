using System.Text.Json;
using Academy.Agent.Application;
using Academy.Agent.Application.Models;
using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Academy.Agent.Api.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly ILogger<ChatController> _logger;
    private readonly IConversationRepository _conversations;
    private readonly AgentEngine _agent;
    private readonly IFileStorage _fileStorage;

    public ChatController(
        ILogger<ChatController> logger,
        IConversationRepository conversations,
        AgentEngine agent,
        IFileStorage fileStorage)
    {
        _logger = logger;
        _conversations = conversations;
        _agent = agent;
        _fileStorage = fileStorage;
    }

    [HttpPost("session")]
    public async Task<ActionResult<ChatSessionResponse>> CreateSession([FromBody] ChatSessionRequest request)
    {
        var externalUserId = string.IsNullOrWhiteSpace(request.ExternalUserId)
            ? Guid.NewGuid().ToString("N")
            : request.ExternalUserId;

        var conversation = await _conversations.GetOrCreateAsync(request.Channel, externalUserId);
        return Ok(new ChatSessionResponse
        {
            ConversationId = conversation.Id,
            Greeting = await _agent.GetGreetingAsync(),
        });
    }

    [HttpPost("messages")]
    public async Task Message([FromBody] ChatMessageRequest request)
    {
        var message = request.Message?.Trim();
        if (string.IsNullOrWhiteSpace(message))
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsJsonAsync(new { error = "Message is required." });
            return;
        }

        Conversation? conversation;
        if (request.ConversationId is { } conversationId)
        {
            conversation = await _conversations.GetAsync(conversationId);
            if (conversation is null)
            {
                Response.StatusCode = StatusCodes.Status404NotFound;
                await Response.WriteAsJsonAsync(new { error = "Conversation not found." });
                return;
            }
        }
        else
        {
            var externalUserId = string.IsNullOrWhiteSpace(request.ExternalUserId)
                ? Guid.NewGuid().ToString("N")
                : request.ExternalUserId;
            conversation = await _conversations.GetOrCreateAsync(request.Channel, externalUserId);
        }

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no";

        await Response.StartAsync();

        async Task Send(string name, object payload)
        {
            var json = JsonSerializer.Serialize(payload);
            await Response.WriteAsync($"event: {name}\ndata: {json}\n\n", HttpContext.RequestAborted);
            await Response.Body.FlushAsync(HttpContext.RequestAborted);
        }

        try
        {
            await Send("meta", new { conversationId = conversation.Id });

            await foreach (var delta in _agent.StreamReplyAsync(conversation, message, HttpContext.RequestAborted))
            {
                await Send("delta", new { text = delta });
            }

            await Send("done", new { });
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chat stream failed for conversation {ConversationId}.", conversation.Id);
            try
            {
                await Send("error", new { error = "تعذر إكمال الرد حالياً. حاول مرة أخرى." });
                await Send("done", new { });
            }
            catch (Exception sendEx)
            {
                _logger.LogWarning(sendEx, "Failed to write error event to SSE stream.");
            }
        }
    }

    [HttpGet("conversations/{id:guid}/messages")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> History(Guid id)
    {
        var messages = await _conversations.GetRecentMessagesAsync(id, 200);
        var dtos = messages.Select(m => new ChatMessageDto
        {
            Role = m.Role,
            Content = m.Content,
            CreatedAt = m.CreatedAt,
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult> Upload([FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "File is required." });

        await using var stream = file.OpenReadStream();
        var storedPath = await _fileStorage.SaveAsync(stream, file.FileName, file.ContentType);

        return Ok(new { url = _fileStorage.ResolveUrl(storedPath) });
    }
}
