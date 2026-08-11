namespace Academy.Agent.Api.Webhooks;

public sealed record WhatsAppInboundMessage(string From, string Type, string? Text, string? MediaId, string MessageId);
