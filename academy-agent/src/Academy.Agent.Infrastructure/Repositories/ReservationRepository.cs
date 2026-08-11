using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Domain.Enums;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Academy.Agent.Infrastructure.Repositories;

public sealed class ReservationRepository : IReservationRepository
{
    private readonly AcademyDbContext _db;
    private readonly IAdminNotifier _adminNotifier;

    public ReservationRepository(AcademyDbContext db, IAdminNotifier adminNotifier)
    {
        _db = db;
        _adminNotifier = adminNotifier;
    }

    public async Task<Reservation> CreateAsync(
        string fullName,
        string whatsappPhone,
        int? programId,
        string? preferredSchedule,
        string? notes,
        bool payNow,
        CancellationToken ct = default)
    {
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            WhatsappPhone = whatsappPhone,
            ProgramId = programId,
            PreferredSchedule = preferredSchedule,
            Notes = notes,
            PayNow = payNow,
            Status = payNow ? ReservationStatus.PaymentPendingReview : ReservationStatus.Reserved,
            ReferenceNumber = await GenerateUniqueReferenceAsync(ct),
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync(ct);

        await _adminNotifier.NotifyAsync(
            "new_reservation",
            $"حجز جديد من {fullName} ({whatsappPhone})" +
            (programId.HasValue ? $" — البرنامج id={programId}" : "") +
            (payNow ? " — يريد الدفع الآن" : " — حجز بدون دفع (Pay later)") +
            $". الرجاء المتابعة. (مرجع: {reservation.ReferenceNumber})",
            reservation.Id,
            ct);

        return reservation;
    }

    public async Task<Reservation?> GetByReferenceAsync(string referenceNumber, CancellationToken ct = default) =>
        await _db.Reservations.FirstOrDefaultAsync(r => r.ReferenceNumber == referenceNumber, ct);

    public async Task<Reservation?> GetAsync(Guid id, CancellationToken ct = default) =>
        await _db.Reservations.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<PaymentProof> AddPaymentProofAsync(
        Guid reservationId,
        PaymentMethod method,
        decimal? amount,
        string? proofUrl,
        string? txnRef,
        CancellationToken ct = default)
    {
        var reservation = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == reservationId, ct);
        if (reservation is null)
            throw new InvalidOperationException($"Reservation {reservationId} not found.");

        var proof = new PaymentProof
        {
            Id = Guid.NewGuid(),
            ReservationId = reservationId,
            Method = method,
            Amount = amount,
            ProofUrl = proofUrl,
            TxnRef = txnRef,
            Status = PaymentProofStatus.PendingReview,
        };

        _db.PaymentProofs.Add(proof);
        reservation.Status = ReservationStatus.PaymentPendingReview;
        await _db.SaveChangesAsync(ct);

        return proof;
    }

    private async Task<string> GenerateUniqueReferenceAsync(CancellationToken ct)
    {
        var rng = Random.Shared;
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var reference = "ACA-" + rng.Next(100000, 999999).ToString();
            var exists = await _db.Reservations.AnyAsync(r => r.ReferenceNumber == reference, ct);
            if (!exists) return reference;
        }

        throw new InvalidOperationException("Unable to generate a unique reservation reference.");
    }
}
