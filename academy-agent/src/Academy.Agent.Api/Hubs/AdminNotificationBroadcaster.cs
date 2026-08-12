using Academy.Agent.Application.Ports;
using Microsoft.AspNetCore.SignalR;

namespace Academy.Agent.Api.Hubs;

public sealed class AdminNotificationBroadcaster : IAdminNotificationBroadcaster
{
    private readonly IHubContext<AdminNotificationsHub> _hub;

    public AdminNotificationBroadcaster(IHubContext<AdminNotificationsHub> hub)
    {
        _hub = hub;
    }

    public async Task BroadcastAsync(string type, string message, Guid? reservationId, DateTime createdAt, CancellationToken ct = default)
    {
        await _hub.Clients.All.SendAsync("adminNotification", new
        {
            type,
            message,
            reservationId,
            createdAt,
        }, ct);
    }
}
