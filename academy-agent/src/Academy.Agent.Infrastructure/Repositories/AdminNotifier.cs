using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Infrastructure.Persistence;

namespace Academy.Agent.Infrastructure.Repositories;

public sealed class AdminNotifier : IAdminNotifier
{
    private readonly AcademyDbContext _db;
    private readonly IAdminNotificationBroadcaster _broadcaster;

    public AdminNotifier(AcademyDbContext db, IAdminNotificationBroadcaster broadcaster)
    {
        _db = db;
        _broadcaster = broadcaster;
    }

    public async Task NotifyAsync(string type, string message, Guid? reservationId = null, CancellationToken ct = default)
    {
        var notification = new AdminNotification
        {
            Id = Guid.NewGuid(),
            Type = type,
            Message = message,
            ReservationId = reservationId,
            CreatedAt = DateTime.UtcNow,
        };

        _db.AdminNotifications.Add(notification);
        await _db.SaveChangesAsync(ct);

        await _broadcaster.BroadcastAsync(type, message, reservationId, notification.CreatedAt, ct);
    }
}
