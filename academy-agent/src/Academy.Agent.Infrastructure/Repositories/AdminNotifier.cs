using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Infrastructure.Persistence;

namespace Academy.Agent.Infrastructure.Repositories;

public sealed class AdminNotifier : IAdminNotifier
{
    private readonly AcademyDbContext _db;

    public AdminNotifier(AcademyDbContext db) => _db = db;

    public async Task NotifyAsync(string type, string message, Guid? reservationId = null, CancellationToken ct = default)
    {
        _db.AdminNotifications.Add(new AdminNotification
        {
            Id = Guid.NewGuid(),
            Type = type,
            Message = message,
            ReservationId = reservationId,
            CreatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);
    }
}
