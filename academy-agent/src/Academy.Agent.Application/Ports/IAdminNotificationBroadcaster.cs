namespace Academy.Agent.Application.Ports;

public interface IAdminNotificationBroadcaster
{
    Task BroadcastAsync(string type, string message, Guid? reservationId, DateTime createdAt, CancellationToken ct = default);
}
