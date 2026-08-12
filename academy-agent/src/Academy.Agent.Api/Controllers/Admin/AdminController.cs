using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Domain.Enums;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Academy.Agent.Api.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AcademyDbContext _db;
    private readonly IAdminNotifier _notifier;

    public AdminController(AcademyDbContext db, IAdminNotifier notifier)
    {
        _db = db;
        _notifier = notifier;
    }

    // ── Stats ───────────────────────────────────────────────────────────────

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStats>> GetStats(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var reservations = _db.Reservations.AsQueryable();

        var total = await reservations.CountAsync(ct);
        var active = await reservations.CountAsync(r => r.Status == ReservationStatus.Active, ct);
        var pendingPayments = await _db.PaymentProofs.CountAsync(p => p.Status == PaymentProofStatus.PendingReview, ct);
        var reserved = await reservations.CountAsync(r => r.Status == ReservationStatus.Reserved || r.Status == ReservationStatus.PayLater, ct);
        var cancelled = await reservations.CountAsync(r => r.Status == ReservationStatus.Cancelled, ct);
        var newThisMonth = await reservations.CountAsync(r => r.CreatedAt >= monthStart, ct);

        var revenue = await _db.PaymentProofs
            .Where(p => p.Status == PaymentProofStatus.Approved && p.CreatedAt >= monthStart)
            .SumAsync(p => p.Amount ?? 0, ct);

        var recent = await _db.Reservations
            .Include(r => r.Program)
            .OrderByDescending(r => r.CreatedAt)
            .Take(8)
            .Select(r => ToListItem(r))
            .ToListAsync(ct);

        return Ok(new AdminStats
        {
            TotalUsers = total,
            Active = active,
            PendingPayments = pendingPayments,
            Reserved = reserved,
            Cancelled = cancelled,
            RevenueThisMonth = revenue,
            NewThisMonth = newThisMonth,
            RecentReservations = recent,
        });
    }

    // ── Reservations / users ────────────────────────────────────────────────

    [HttpGet("reservations")]
    public async Task<ActionResult<PagedResponse<ReservationListItem>>> GetReservations(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Reservations.Include(r => r.Program).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(r =>
                r.FullName.Contains(s) ||
                r.WhatsappPhone.Contains(s) ||
                (r.ReferenceNumber != null && r.ReferenceNumber.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReservationStatus>(status, true, out var statusEnum))
        {
            query = query.Where(r => r.Status == statusEnum);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => ToListItem(r))
            .ToListAsync(ct);

        return Ok(new PagedResponse<ReservationListItem>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpPost("reservations")]
    public async Task<ActionResult<ReservationListItem>> CreateReservation(
        [FromBody] CreateReservationRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { error = "الاسم مطلوب." });
        if (string.IsNullOrWhiteSpace(request.WhatsappPhone))
            return BadRequest(new { error = "رقم الواتساب مطلوب." });

        if (request.ProgramId.HasValue)
        {
            var programExists = await _db.Programs.AnyAsync(p => p.Id == request.ProgramId.Value, ct);
            if (!programExists)
                return BadRequest(new { error = "البرنامج غير موجود." });
        }

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            WhatsappPhone = request.WhatsappPhone.Trim(),
            ProgramId = request.ProgramId,
            PreferredSchedule = request.PreferredSchedule,
            Notes = request.Notes,
            PayNow = request.PayNow,
            Status = request.PayNow ? ReservationStatus.PaymentPendingReview : ReservationStatus.Reserved,
            ReferenceNumber = await GenerateUniqueReferenceAsync(ct),
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync(ct);

        await _notifier.NotifyAsync(
            "new_reservation",
            $"تسجيل يدوي بواسطة الأدمن — {reservation.FullName} ({reservation.WhatsappPhone})" +
            (reservation.ProgramId.HasValue ? $" — برنامج id={reservation.ProgramId}" : "") +
            $". (مرجع: {reservation.ReferenceNumber})",
            reservation.Id,
            ct);

        var created = await _db.Reservations.Include(r => r.Program)
            .FirstAsync(r => r.Id == reservation.Id, ct);
        return Ok(ToListItem(created));
    }

    [HttpPatch("reservations/{id:guid}/status")]
    public async Task<ActionResult<ReservationListItem>> UpdateReservationStatus(
        Guid id,
        [FromBody] UpdateReservationStatusRequest request,
        CancellationToken ct)
    {
        var reservation = await _db.Reservations.Include(r => r.Program)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        if (reservation is null)
            return NotFound(new { error = "الحجز غير موجود." });

        reservation.Status = request.Status;
        await _db.SaveChangesAsync(ct);

        return Ok(ToListItem(reservation));
    }

    // ── Payment proofs ──────────────────────────────────────────────────────

    [HttpGet("payment-proofs")]
    public async Task<ActionResult<PagedResponse<PaymentProofListItem>>> GetPaymentProofs(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.PaymentProofs.Include(p => p.Reservation).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PaymentProofStatus>(status, true, out var statusEnum))
        {
            query = query.Where(p => p.Status == statusEnum);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PaymentProofListItem
            {
                Id = p.Id,
                ReservationId = p.ReservationId,
                ReservationRef = p.Reservation!.ReferenceNumber ?? string.Empty,
                UserName = p.Reservation.FullName,
                UserPhone = p.Reservation.WhatsappPhone,
                Method = p.Method.ToString(),
                Amount = p.Amount,
                ProofUrl = p.ProofUrl,
                TxnRef = p.TxnRef,
                Status = p.Status.ToString(),
                CreatedAt = p.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(new PagedResponse<PaymentProofListItem>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpPost("payment-proofs/{id:guid}/approve")]
    public async Task<IActionResult> ApprovePaymentProof(Guid id, CancellationToken ct)
    {
        var proof = await _db.PaymentProofs.Include(p => p.Reservation)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proof is null)
            return NotFound(new { error = "إثبات الدفع غير موجود." });

        proof.Status = PaymentProofStatus.Approved;
        if (proof.Reservation is not null)
            proof.Reservation.Status = ReservationStatus.Active;

        await _db.SaveChangesAsync(ct);

        await _notifier.NotifyAsync(
            "payment_approved",
            $"تم قبول دفع {proof.Amount?.ToString("N2") ?? "—"} للحجز {proof.Reservation?.ReferenceNumber ?? "—"}.",
            proof.ReservationId,
            ct);

        return NoContent();
    }

    [HttpPost("payment-proofs/{id:guid}/reject")]
    public async Task<IActionResult> RejectPaymentProof(
        Guid id,
        [FromBody] RejectPaymentProofRequest request,
        CancellationToken ct)
    {
        var proof = await _db.PaymentProofs.Include(p => p.Reservation)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proof is null)
            return NotFound(new { error = "إثبات الدفع غير موجود." });

        proof.Status = PaymentProofStatus.Rejected;
        if (proof.Reservation is not null)
            proof.Reservation.Status = ReservationStatus.Reserved;

        await _db.SaveChangesAsync(ct);

        await _notifier.NotifyAsync(
            "payment_rejected",
            $"تم رفض إثبات الدفع للحجز {proof.Reservation?.ReferenceNumber ?? "—"}" +
            (!string.IsNullOrWhiteSpace(request.Reason) ? $" — السبب: {request.Reason}" : "") + ".",
            proof.ReservationId,
            ct);

        return NoContent();
    }

    // ── Programs ────────────────────────────────────────────────────────────

    [HttpGet("programs")]
    public async Task<ActionResult<IReadOnlyList<ProgramListItem>>> GetPrograms(CancellationToken ct)
    {
        var programs = await _db.Programs
            .OrderBy(p => p.Category)
            .ThenBy(p => p.Price)
            .Select(p => new ProgramListItem
            {
                Id = p.Id,
                Name = p.Name,
                Category = p.Category,
                Notes = p.Notes,
                Price = p.Price,
                Period = p.Period,
                Features = p.Features,
                Description = p.Description,
                IsActive = p.IsActive,
            })
            .ToListAsync(ct);

        return Ok(programs);
    }

    [HttpPost("programs")]
    public async Task<ActionResult<ProgramListItem>> CreateProgram(
        [FromBody] CreateProgramRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "اسم البرنامج مطلوب." });
        if (string.IsNullOrWhiteSpace(request.Category))
            return BadRequest(new { error = "الفئة مطلوبة." });

        var program = new AcademyProgram
        {
            Name = request.Name.Trim(),
            Category = request.Category.Trim(),
            Notes = request.Notes,
            Price = request.Price,
            Period = request.Period.Trim(),
            Features = request.Features,
            Description = request.Description,
            IsActive = true,
        };

        _db.Programs.Add(program);
        await _db.SaveChangesAsync(ct);

        return Ok(ToProgramItem(program));
    }

    [HttpPut("programs/{id:int}")]
    public async Task<ActionResult<ProgramListItem>> UpdateProgram(
        int id, [FromBody] UpdateProgramRequest request, CancellationToken ct)
    {
        var program = await _db.Programs.FindAsync(new object[] { id }, ct);
        if (program is null)
            return NotFound(new { error = "البرنامج غير موجود." });

        program.Name = request.Name.Trim();
        program.Category = request.Category.Trim();
        program.Notes = request.Notes;
        program.Price = request.Price;
        program.Period = request.Period.Trim();
        program.Features = request.Features;
        program.Description = request.Description;

        await _db.SaveChangesAsync(ct);

        return Ok(ToProgramItem(program));
    }

    [HttpPatch("programs/{id:int}/toggle")]
    public async Task<IActionResult> ToggleProgram(int id, CancellationToken ct)
    {
        var program = await _db.Programs.FindAsync(new object[] { id }, ct);
        if (program is null)
            return NotFound(new { error = "البرنامج غير موجود." });

        program.IsActive = !program.IsActive;
        await _db.SaveChangesAsync(ct);

        return Ok(new { program.Id, program.IsActive });
    }

    [HttpDelete("programs/{id:int}")]
    public async Task<IActionResult> DeleteProgram(int id, CancellationToken ct)
    {
        var program = await _db.Programs.FindAsync(new object[] { id }, ct);
        if (program is null)
            return NotFound(new { error = "البرنامج غير موجود." });

        var linked = await _db.Reservations.AnyAsync(r => r.ProgramId == id, ct);
        if (linked)
            return Conflict(new { error = "هذا البرنامج لديه مشتركين ولا يمكن حذفه. يمكنك إيقافه بدلاً من الحذف." });

        _db.Programs.Remove(program);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    [HttpGet("notifications")]
    public async Task<ActionResult<PagedResponse<NotificationListItem>>> GetNotifications(
        [FromQuery] bool? unreadOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.AdminNotifications.AsQueryable();

        if (unreadOnly == true)
            query = query.Where(n => !n.IsRead);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationListItem
            {
                Id = n.Id,
                Type = n.Type,
                Message = n.Message,
                ReservationId = n.ReservationId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(new PagedResponse<NotificationListItem>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpPost("notifications/mark-read")]
    public async Task<IActionResult> MarkNotificationsRead(
        [FromBody] MarkNotificationsReadRequest request,
        CancellationToken ct)
    {
        var query = _db.AdminNotifications.Where(n => !n.IsRead);

        if (request.Ids is { Count: > 0 })
            query = query.Where(n => request.Ids.Contains(n.Id));

        await query.ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        return NoContent();
    }

    [HttpPost("notifications/mark-all-read")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _db.AdminNotifications
            .Where(n => !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        return NoContent();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static ReservationListItem ToListItem(Reservation r) => new()
    {
        Id = r.Id,
        FullName = r.FullName,
        WhatsappPhone = r.WhatsappPhone,
        ProgramId = r.ProgramId,
        ProgramName = r.Program?.Name,
        ProgramPrice = r.Program?.Price,
        PreferredSchedule = r.PreferredSchedule,
        Notes = r.Notes,
        PayNow = r.PayNow,
        Status = r.Status.ToString(),
        ReferenceNumber = r.ReferenceNumber,
        CreatedAt = r.CreatedAt,
    };

    private static ProgramListItem ToProgramItem(AcademyProgram p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Category = p.Category,
        Notes = p.Notes,
        Price = p.Price,
        Period = p.Period,
        Features = p.Features,
        Description = p.Description,
        IsActive = p.IsActive,
    };

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
