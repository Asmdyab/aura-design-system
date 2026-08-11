using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Domain.Entities;

public class Conversation
{
    public Guid Id { get; set; }
    public Channel Channel { get; set; }
    public string ExternalUserId { get; set; } = string.Empty;
    public ConversationState State { get; set; } = ConversationState.Idle;
    public string? RegistrationDraftJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
