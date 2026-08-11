namespace Academy.Agent.Api.Webhooks;

public sealed class WhatsAppWebhookProcessor : BackgroundService
{
    private readonly WhatsAppWebhookQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WhatsAppWebhookProcessor> _logger;

    public WhatsAppWebhookProcessor(
        WhatsAppWebhookQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<WhatsAppWebhookProcessor> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var handler = scope.ServiceProvider.GetRequiredService<WhatsAppInboundHandler>();
                await handler.HandleAsync(message, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process WhatsApp message from {From}.", message.From);
            }
        }
    }
}
