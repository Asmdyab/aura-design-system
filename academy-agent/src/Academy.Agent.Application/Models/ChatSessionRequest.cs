using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Application.Models;

public sealed class ChatSessionRequest
{
    public Channel Channel { get; set; } = Channel.Web;
    public string? ExternalUserId { get; set; }
}
