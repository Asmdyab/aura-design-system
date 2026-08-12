using System.Text.Json;
using Academy.Agent.Application;
using Academy.Agent.Application.Models;
using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Academy.Agent.Api.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly ILogger<ChatController> _logger;
    private readonly IConversationRepository _conversations;
    private readonly IReservationRepository _reservations;
    private readonly AgentEngine _agent;
    private readonly IFileStorage _fileStorage;
    private readonly AgentContext _context;
    private readonly IAcademyRepository _academy;

    private static readonly System.Text.Json.JsonSerializerOptions SseJsonOptions =
        new(System.Text.Json.JsonSerializerDefaults.Web);

    public ChatController(
        ILogger<ChatController> logger,
        IConversationRepository conversations,
        IReservationRepository reservations,
        AgentEngine agent,
        IFileStorage fileStorage,
        AgentContext context,
        IAcademyRepository academy)
    {
        _logger = logger;
        _conversations = conversations;
        _reservations = reservations;
        _agent = agent;
        _fileStorage = fileStorage;
        _context = context;
        _academy = academy;
    }

    [HttpPost("session")]
    public async Task<ActionResult<ChatSessionResponse>> CreateSession([FromBody] ChatSessionRequest request)
    {
        var externalUserId = string.IsNullOrWhiteSpace(request.ExternalUserId)
            ? Guid.NewGuid().ToString("N")
            : request.ExternalUserId;

        var conversation = await _conversations.GetOrCreateAsync(request.Channel, externalUserId);
        return Ok(new ChatSessionResponse
        {
            ConversationId = conversation.Id,
            Greeting = await _agent.GetGreetingAsync(),
        });
    }

    [HttpPost("messages")]
    public async Task Message([FromBody] ChatMessageRequest request)
    {
        var message = request.Message?.Trim();
        if (string.IsNullOrWhiteSpace(message))
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsJsonAsync(new { error = "Message is required." });
            return;
        }

        Conversation? conversation;
        if (request.ConversationId is { } conversationId)
        {
            conversation = await _conversations.GetAsync(conversationId);
            if (conversation is null)
            {
                Response.StatusCode = StatusCodes.Status404NotFound;
                await Response.WriteAsJsonAsync(new { error = "Conversation not found." });
                return;
            }
        }
        else
        {
            var externalUserId = string.IsNullOrWhiteSpace(request.ExternalUserId)
                ? Guid.NewGuid().ToString("N")
                : request.ExternalUserId;
            conversation = await _conversations.GetOrCreateAsync(request.Channel, externalUserId);
        }

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no";

        await Response.StartAsync();

        async Task Send(string name, object payload)
        {
            var json = JsonSerializer.Serialize(payload, SseJsonOptions);
            await Response.WriteAsync($"event: {name}\ndata: {json}\n\n", HttpContext.RequestAborted);
            await Response.Body.FlushAsync(HttpContext.RequestAborted);
        }

        try
        {
            await Send("meta", new { conversationId = conversation.Id });

            IReadOnlyList<AcademyProgram>? plans = null;
            var plansEmitted = false;

            async Task EmitPlansAsync()
            {
                if (plansEmitted || plans is not { Count: > 0 }) return;
                await Send("plans", BuildPlanCards(plans));
                plansEmitted = true;
            }

            // The pricing tool runs while the reply is streaming, so check after each
            // delta and emit the cards as soon as they are available — the frontend then
            // renders cards directly instead of plain text first.
            await foreach (var delta in _agent.StreamReplyAsync(conversation, message, HttpContext.RequestAborted))
            {
                plans ??= _context.CurrentPlans;
                await EmitPlansAsync();
                await Send("delta", new { text = delta });
            }

            // Backstop: if the model answered a pricing question without invoking the tool.
            if (plans is not { Count: > 0 } && conversation.Channel == Channel.Web && IsPricingQuery(message))
            {
                plans = await _academy.GetActiveProgramsAsync(HttpContext.RequestAborted);
            }

            await EmitPlansAsync();

            // The agent requested a payment-proof upload card for this turn.
            if (_context.RequestPaymentUpload && conversation.Channel == Channel.Web)
            {
                _context.RequestPaymentUpload = false;
                var reservation = await ResolveCurrentReservationAsync(conversation, HttpContext.RequestAborted);
                await Send("payment-upload", new
                {
                    reservationId = reservation?.Id,
                    reservationRef = reservation?.ReferenceNumber,
                });
            }

            await Send("done", new { });
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chat stream failed for conversation {ConversationId}.", conversation.Id);
            try
            {
                await Send("error", new { error = "تعذر إكمال الرد حالياً. حاول مرة أخرى." });
                await Send("done", new { });
            }
            catch (Exception sendEx)
            {
                _logger.LogWarning(sendEx, "Failed to write error event to SSE stream.");
            }
        }
    }

    [HttpGet("conversations/{id:guid}/messages")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> History(Guid id)
    {
        var messages = await _conversations.GetRecentMessagesAsync(id, 200);
        var dtos = messages.Select(m => new ChatMessageDto
        {
            Role = m.Role,
            Content = m.Content,
            CreatedAt = m.CreatedAt,
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult> Upload([FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "File is required." });

        await using var stream = file.OpenReadStream();
        var storedPath = await _fileStorage.SaveAsync(stream, file.FileName, file.ContentType);

        return Ok(new { url = _fileStorage.ResolveUrl(storedPath) });
    }

    [HttpPost("payment-proof")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<IActionResult> UploadPaymentProof(
        [FromForm] IFormFile file,
        [FromForm] string? conversationId,
        [FromForm] string? reservationId,
        [FromForm] string? method,
        [FromForm] string? amount,
        [FromForm] string? txnRef,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "يرجى اختيار صورة إثبات الدفع أولاً." });

        if (!Guid.TryParse(reservationId, out var reservationGuid) &&
            Guid.TryParse(conversationId, out var conversationGuid))
        {
            var conversation = await _conversations.GetAsync(conversationGuid, ct);
            var draft = RegistrationDraft.FromJson(conversation?.RegistrationDraftJson);
            reservationGuid = draft.ReservationId ?? Guid.Empty;
        }

        var reservation = reservationGuid != Guid.Empty
            ? await _reservations.GetAsync(reservationGuid, ct)
            : null;
        if (reservation is null)
            return BadRequest(new { error = "لم يتم العثور على الحجز. يرجى إكمال خطوة الحجز أولاً." });

        await using var stream = file.OpenReadStream();
        var storedPath = await _fileStorage.SaveAsync(stream, file.FileName, file.ContentType);
        var proofUrl = _fileStorage.ResolveUrl(storedPath);

        var paymentMethod = PaymentMethod.VodafoneCash;
        if (!string.IsNullOrWhiteSpace(method))
        {
            var normalized = method.Trim().ToLowerInvariant();
            if (normalized.Contains("insta") || normalized.Contains("انستا"))
                paymentMethod = PaymentMethod.Instapay;
        }

        decimal? amountValue = null;
        if (decimal.TryParse(amount, System.Globalization.NumberStyles.Number,
                System.Globalization.CultureInfo.InvariantCulture, out var parsedAmount))
            amountValue = parsedAmount;

        var proof = await _reservations.AddPaymentProofAsync(
            reservation.Id,
            paymentMethod,
            amountValue,
            proofUrl,
            txnRef,
            ct);

        return Ok(new
        {
            proofId = proof.Id,
            reservationId = reservation.Id,
            reservationRef = reservation.ReferenceNumber,
            url = proofUrl,
        });
    }

    private async Task<Reservation?> ResolveCurrentReservationAsync(Conversation conversation, CancellationToken ct)
    {
        if (_context.CurrentReservationId is { } currentId) return await _reservations.GetAsync(currentId, ct);

        var draft = RegistrationDraft.FromJson(conversation.RegistrationDraftJson);
        return draft.ReservationId is { } draftId ? await _reservations.GetAsync(draftId, ct) : null;
    }

    private static bool IsPricingQuery(string message)
    {
        var text = message.Trim().ToLowerInvariant();
        return new[]
        {
            "سعر", "أسعار", "ثمن", "باقة", "باقات", "خطة", "خطط", "تفاصيل الخطط",
            "برنامج", "برامج", "اشتراك", "اشترك", "تكلفة", "تكلف", "حصص", "عروض", "خصم",
        }.Any(keyword => text.IndexOf(keyword, StringComparison.Ordinal) >= 0);
    }

    private static List<PlanCardDto> BuildPlanCards(IReadOnlyList<AcademyProgram> plans) =>
        plans.Select(p => new PlanCardDto
        {
            Id = p.Id,
            Name = p.Name,
            Category = string.IsNullOrWhiteSpace(p.Category) ? "أخرى" : p.Category.Trim(),
            Notes = p.Notes,
            Price = p.Price,
            Period = p.Period,
            Features = p.Features,
        }).ToList();
}
