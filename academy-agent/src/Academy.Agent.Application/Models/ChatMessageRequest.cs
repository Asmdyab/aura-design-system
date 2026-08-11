using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Application.Models;

public sealed class ChatMessageRequest
{
    public Guid? ConversationId { get; set; }
    public string Message { get; set; } = string.Empty;
    public Channel Channel { get; set; } = Channel.Web;
    public string? ExternalUserId { get; set; }
}
