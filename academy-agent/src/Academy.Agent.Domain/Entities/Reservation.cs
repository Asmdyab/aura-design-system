using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Domain.Entities;

public class Reservation
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string WhatsappPhone { get; set; } = string.Empty;
    public int? ProgramId { get; set; }
    public AcademyProgram? Program { get; set; }
    public string? PreferredSchedule { get; set; }
    public string? Notes { get; set; }
    public bool PayNow { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Reserved;
    public string? ReferenceNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PaymentProof> PaymentProofs { get; set; } = new List<PaymentProof>();
}
