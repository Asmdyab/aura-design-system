using Academy.Agent.Domain.Enums;

namespace Academy.Agent.Api.Controllers.Admin;

// ── Shared / pagination ─────────────────────────────────────────────────────

public record PagedResponse<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Total { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

// ── Auth ─────────────────────────────────────────────────────────────────────
// (handled in AuthController)

// ── Stats ───────────────────────────────────────────────────────────────────

public record AdminStats
{
    public int TotalUsers { get; init; }
    public int Active { get; init; }
    public int PendingPayments { get; init; }
    public int Reserved { get; init; }
    public int Cancelled { get; init; }
    public decimal RevenueThisMonth { get; init; }
    public int NewThisMonth { get; init; }
    public IReadOnlyList<ReservationListItem> RecentReservations { get; init; } = Array.Empty<ReservationListItem>();
}

// ── Reservations ────────────────────────────────────────────────────────────

public record ReservationListItem
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string WhatsappPhone { get; init; } = string.Empty;
    public int? ProgramId { get; init; }
    public string? ProgramName { get; init; }
    public decimal? ProgramPrice { get; init; }
    public string? PreferredSchedule { get; init; }
    public string? Notes { get; init; }
    public bool PayNow { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? ReferenceNumber { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CreateReservationRequest
{
    public string FullName { get; init; } = string.Empty;
    public string WhatsappPhone { get; init; } = string.Empty;
    public int? ProgramId { get; init; }
    public string? PreferredSchedule { get; init; }
    public string? Notes { get; init; }
    public bool PayNow { get; init; }
}

public record UpdateReservationStatusRequest
{
    public ReservationStatus Status { get; init; }
}

// ── Payment proofs ──────────────────────────────────────────────────────────

public record PaymentProofListItem
{
    public Guid Id { get; init; }
    public Guid ReservationId { get; init; }
    public string ReservationRef { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string UserPhone { get; init; } = string.Empty;
    public string Method { get; init; } = string.Empty;
    public decimal? Amount { get; init; }
    public string? ProofUrl { get; init; }
    public string? TxnRef { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public record RejectPaymentProofRequest
{
    public string? Reason { get; init; }
}

// ── Programs ────────────────────────────────────────────────────────────────

public record ProgramListItem
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public decimal Price { get; init; }
    public string Period { get; init; } = string.Empty;
    public List<string> Features { get; init; } = new();
    public string? Description { get; init; }
    public bool IsActive { get; init; }
}

public record CreateProgramRequest
{
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public decimal Price { get; init; }
    public string Period { get; init; } = string.Empty;
    public List<string> Features { get; init; } = new();
    public string? Description { get; init; }
}

public record UpdateProgramRequest
{
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public decimal Price { get; init; }
    public string Period { get; init; } = string.Empty;
    public List<string> Features { get; init; } = new();
    public string? Description { get; init; }
}

// ── Notifications ───────────────────────────────────────────────────────────

public record NotificationListItem
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public Guid? ReservationId { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record MarkNotificationsReadRequest
{
    public List<Guid>? Ids { get; init; }
}
