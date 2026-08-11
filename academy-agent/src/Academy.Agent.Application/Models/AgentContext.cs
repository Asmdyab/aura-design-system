using Academy.Agent.Domain.Entities;

namespace Academy.Agent.Application.Models;

public sealed class AgentContext
{
    public Conversation? CurrentConversation { get; set; }
    public Guid? CurrentReservationId { get; set; }
}
