namespace Academy.Agent.Application.Ports;

public interface IWhatsAppMessenger
{
    Task SendTextAsync(string toPhoneNumber, string text, CancellationToken ct = default);
    Task SendConfirmationAsync(string toPhoneNumber, string text, CancellationToken ct = default);
    Task MarkAsReadAsync(string messageId, CancellationToken ct = default);
    Task<string?> DownloadMediaAsync(string mediaId, CancellationToken ct = default);
}
