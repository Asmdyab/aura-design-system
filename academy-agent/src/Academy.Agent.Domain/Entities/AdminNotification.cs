namespace Academy.Agent.Domain.Entities;

public class AdminNotification
{
    public Guid Id { get; set; }
    public Guid? ReservationId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool Delivered { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
