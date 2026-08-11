namespace Academy.Agent.Application.Ports;

public interface IAdminNotifier
{
    Task NotifyAsync(string type, string message, Guid? reservationId = null, CancellationToken ct = default);
}
