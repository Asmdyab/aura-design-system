using Academy.Agent.Application;
using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Enums;
using Microsoft.Extensions.Options;
using Academy.Agent.Application.Options;

namespace Academy.Agent.Api.Webhooks;

public sealed class WhatsAppInboundHandler
{
    private readonly IConversationRepository _conversations;
    private readonly IWhatsAppMessenger _messenger;
    private readonly AgentEngine _agent;
    private readonly WhatsAppOptions _options;
    private readonly ILogger<WhatsAppInboundHandler> _logger;

    public WhatsAppInboundHandler(
        IConversationRepository conversations,
        IWhatsAppMessenger messenger,
        AgentEngine agent,
        IOptions<WhatsAppOptions> options,
        ILogger<WhatsAppInboundHandler> logger)
    {
        _conversations = conversations;
        _messenger = messenger;
        _agent = agent;
        _options = options.Value;
        _logger = logger;
    }

    public async Task HandleAsync(WhatsAppInboundMessage message, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(message.MessageId))
        {
            try
            {
                await _messenger.MarkAsReadAsync(message.MessageId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Mark-as-read failed for {MessageId}.", message.MessageId);
            }
        }

        string userText;
        if (message.Type == "image" && !string.IsNullOrWhiteSpace(message.MediaId))
        {
            var mediaUrl = await _messenger.DownloadMediaAsync(message.MediaId, ct);
            userText = string.IsNullOrWhiteSpace(mediaUrl)
                ? "[أرفق المستخدم صورة إثبات دفع ولكن تعذر تحميلها]"
                : $"[أرفق المستخدم صورة إثبات دفع] رابط الصورة: {mediaUrl}";
        }
        else
        {
            userText = message.Text ?? string.Empty;
        }

        if (string.IsNullOrWhiteSpace(userText)) return;

        var conversation = await _conversations.GetOrCreateAsync(Channel.WhatsApp, message.From, ct);
        var result = await _agent.ReplyAsync(conversation, userText, ct);

        if (!string.IsNullOrWhiteSpace(result.Reply))
        {
            try
            {
                await _messenger.SendTextAsync(message.From, result.Reply, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send WhatsApp reply to {From}.", message.From);
            }
        }
    }
}
