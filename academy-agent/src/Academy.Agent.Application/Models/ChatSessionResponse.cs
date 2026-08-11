namespace Academy.Agent.Application.Models;

public sealed class ChatSessionResponse
{
    public Guid ConversationId { get; set; }
    public string Greeting { get; set; } = string.Empty;
}
