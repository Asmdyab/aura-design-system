using Academy.Agent.Domain.Entities;
using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Application.Ports;

public interface IReservationRepository
{
    Task<Reservation> CreateAsync(
        string fullName,
        string whatsappPhone,
        int? programId,
        string? preferredSchedule,
        string? notes,
        bool payNow,
        CancellationToken ct = default);

    Task<Reservation?> GetByReferenceAsync(string referenceNumber, CancellationToken ct = default);
    Task<Reservation?> GetAsync(Guid id, CancellationToken ct = default);

    Task<PaymentProof> AddPaymentProofAsync(
        Guid reservationId,
        PaymentMethod method,
        decimal? amount,
        string? proofUrl,
        string? txnRef,
        CancellationToken ct = default);
}
