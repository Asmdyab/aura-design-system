using System.Threading.Channels;

namespace Academy.Agent.Api.Webhooks;

public sealed class WhatsAppWebhookQueue
{
    private readonly Channel<WhatsAppInboundMessage> _channel = Channel.CreateUnbounded<WhatsAppInboundMessage>();

    public void Enqueue(WhatsAppInboundMessage message) => _channel.Writer.TryWrite(message);

    public ChannelReader<WhatsAppInboundMessage> Reader => _channel.Reader;
}
