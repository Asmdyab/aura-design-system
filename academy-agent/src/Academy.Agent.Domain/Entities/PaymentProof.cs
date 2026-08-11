using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Domain.Entities;

public class PaymentProof
{
    public Guid Id { get; set; }
    public Guid ReservationId { get; set; }
    public Reservation? Reservation { get; set; }
    public PaymentMethod Method { get; set; }
    public decimal? Amount { get; set; }
    public string? ProofUrl { get; set; }
    public string? TxnRef { get; set; }
    public PaymentProofStatus Status { get; set; } = PaymentProofStatus.PendingReview;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
