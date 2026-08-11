using Academy.Agent.Domain.Entities;
using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Application.Ports;

public interface IConversationRepository
{
    Task<Conversation> GetOrCreateAsync(Channel channel, string externalUserId, CancellationToken ct = default);
    Task<Conversation?> GetAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<ChatMessage>> GetRecentMessagesAsync(Guid conversationId, int limit, CancellationToken ct = default);

    Task<ChatMessage> AddMessageAsync(Guid conversationId, string role, string content, CancellationToken ct = default);

    Task SetStateAsync(Guid conversationId, ConversationState state, string? draftJson = null, CancellationToken ct = default);
}
