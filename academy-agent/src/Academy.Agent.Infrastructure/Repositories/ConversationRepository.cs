using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Domain.Enums;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Academy.Agent.Infrastructure.Repositories;

public sealed class ConversationRepository : IConversationRepository
{
    private readonly AcademyDbContext _db;

    public ConversationRepository(AcademyDbContext db) => _db = db;

    public async Task<Conversation> GetOrCreateAsync(Channel channel, string externalUserId, CancellationToken ct = default)
    {
        var existing = await _db.Conversations
            .FirstOrDefaultAsync(c => c.Channel == channel && c.ExternalUserId == externalUserId, ct);

        if (existing is not null) return existing;

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            Channel = channel,
            ExternalUserId = externalUserId,
        };

        _db.Conversations.Add(conversation);
        await _db.SaveChangesAsync(ct);

        return conversation;
    }

    public async Task<Conversation?> GetAsync(Guid id, CancellationToken ct = default) =>
        await _db.Conversations.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<ChatMessage>> GetRecentMessagesAsync(Guid conversationId, int limit, CancellationToken ct = default)
    {
        var messages = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);

        messages.Reverse();
        return messages;
    }

    public async Task<ChatMessage> AddMessageAsync(Guid conversationId, string role, string content, CancellationToken ct = default)
    {
        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            Role = role,
            Content = content,
        };

        _db.ChatMessages.Add(message);

        var conversation = await _db.Conversations.FindAsync([conversationId], ct);
        if (conversation is not null) conversation.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return message;
    }

    public async Task SetStateAsync(Guid conversationId, ConversationState state, string? draftJson = null, CancellationToken ct = default)
    {
        var conversation = await _db.Conversations.FindAsync([conversationId], ct);
        if (conversation is null) return;

        conversation.State = state;
        conversation.UpdatedAt = DateTime.UtcNow;
        if (draftJson is not null) conversation.RegistrationDraftJson = draftJson;

        await _db.SaveChangesAsync(ct);
    }
}
