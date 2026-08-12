using System.ComponentModel;
using System.Globalization;
using System.Text.Json;
using Academy.Agent.Application.Models;
using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Enums;
using Microsoft.SemanticKernel;

namespace Academy.Agent.Application.Plugins;

public sealed class RegistrationPlugin
{
    private readonly AgentContext _context;
    private readonly IConversationRepository _conversations;
    private readonly IReservationRepository _reservations;
    private readonly IAdminNotifier _adminNotifier;

    public RegistrationPlugin(
        AgentContext context,
        IConversationRepository conversations,
        IReservationRepository reservations,
        IAdminNotifier adminNotifier)
    {
        _context = context;
        _conversations = conversations;
        _reservations = reservations;
        _adminNotifier = adminNotifier;
    }

    [KernelFunction("SaveDraftField")]
    [Description("يحفظ حقلًا من حقول بيانات التسجيل خطوة بخطوة داخل المحادثة الحالية. الحقول المدعومة: fullName، whatsappPhone، consent، programId، preferredSchedule، payNow. ادعُ هذه الدالة بعد كل معلومة يجمعها المستخدم.")]
    public async Task<string> SaveDraftFieldAsync(string field, string value, CancellationToken ct)
    {
        var conversation = _context.CurrentConversation;
        if (conversation is null) return "خطأ: لا توجد محادثة نشطة.";

        var draft = RegistrationDraft.FromJson(conversation.RegistrationDraftJson);
        var fieldKey = field.Trim().ToLowerInvariant();

        switch (fieldKey)
        {
            case "fullname":
                draft.FullName = value.Trim();
                break;
            case "whatsappphone":
                var normalized = NormalizePhone(value);
                if (!IsValidPhone(normalized))
                    return "رقم الهاتف غير صحيح. يرجى إدخال رقم واتساب صحيح بالصيغة الدولية، مثال: 201012345678.";
                draft.WhatsappPhone = normalized;
                break;
            case "consent":
                draft.ConsentForWhatsApp = value.Trim().StartsWith("ن") || value.Trim().ToLowerInvariant().StartsWith("y");
                break;
            case "programid":
                draft.ProgramId = int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) ? id : null;
                break;
            case "preferredschedule":
                draft.PreferredSchedule = value.Trim();
                break;
            case "paynow":
                draft.PayNow = value.Trim().StartsWith("ن") || value.Trim().ToLowerInvariant().StartsWith("y");
                break;
            default:
                return $"حقل غير معروف: {field}.";
        }

        conversation.RegistrationDraftJson = draft.ToJson();
        conversation.State = ConversationState.InRegistration;
        await _conversations.SetStateAsync(conversation.Id, conversation.State, draft.ToJson(), ct);

        return "تم حفظ البيانات بنجاح.";
    }

    [KernelFunction("CreateReservation")]
    [Description("ينشئ حجزًا/تسجيلًا في قاعدة البيانات ويُرسل إشعارًا للمسؤول. يجب جمع الاسم الكامل ورقم واتساب واختيار البرنامج قبل استدعائها. ترجع رقم مرجع الحجز (reference) وحالته.")]
    public async Task<string> CreateReservationAsync(
        string fullName,
        string whatsappPhone,
        int programId,
        string? preferredSchedule,
        string? notes,
        bool payNow,
        CancellationToken ct)
    {
        var phone = NormalizePhone(whatsappPhone);
        if (string.IsNullOrWhiteSpace(fullName))
            return "خطأ: الاسم الكامل مطلوب.";
        if (!IsValidPhone(phone))
            return "خطأ: رقم واتساب غير صالح. يرجى إعادة المحاولة بالصيغة الدولية (مثال: 201012345678).";

        var reservation = await _reservations.CreateAsync(
            fullName.Trim(),
            phone,
            programId,
            preferredSchedule,
            notes,
            payNow,
            ct);

        _context.CurrentReservationId = reservation.Id;

        var draft = RegistrationDraft.FromJson(_context.CurrentConversation!.RegistrationDraftJson);
        draft.ReservationId = reservation.Id;
        draft.PayNow = payNow;
        _context.CurrentConversation.RegistrationDraftJson = draft.ToJson();
        await _conversations.SetStateAsync(_context.CurrentConversation.Id, ConversationState.InRegistration, draft.ToJson(), ct);

        var status = payNow ? "قيد المراجعة (بانتظار إثبات الدفع)" : "محجوز";
        var payNote = payNow
            ? "\nيرجى إخبار المستخدم باختيار وسيلة الدفع (فودافون كاش أو انستاباي) لإتمام الخطوة."
            : "\nيمكن للمستخدم إرسال إثبات الدفع لاحقًا.";

        return $"تم إنشاء الحجز بنجاح.\nرقم المرجع: {reservation.ReferenceNumber}\nالحالة: {status}{payNote}";
    }

    [KernelFunction("AttachPaymentProof")]
    [Description("يرفق إثبات الدفع (لقطة شاشة) بالحجز ويُشعر المسؤول للمراجعة والتفعيل اليدوي. الوسيط reservationId هو رقم المرجع (reference) أو معرّف الحجز. method إما VodafoneCash أو Instapay. بعد الإرفاق أخبر المستخدم أن المسؤول سيراجع إثبات الدفع.")]
    public async Task<string> AttachPaymentProofAsync(
        string reservationId,
        string method,
        double? amount,
        string proofFileIdOrUrl,
        string? txnRef,
        CancellationToken ct)
    {
        var reservation = await ResolveReservationAsync(reservationId, ct);
        if (reservation is null)
            return "خطأ: لم يتم العثور على الحجز. يرجى التأكد من رقم المرجع.";

        if (!TryParsePaymentMethod(method, out var paymentMethod))
            return "خطأ: وسيلة الدفع غير معروفة. استخدم VodafoneCash أو Instapay.";

        var proof = await _reservations.AddPaymentProofAsync(
            reservation.Id,
            paymentMethod,
            amount.HasValue ? (decimal?)amount.Value : null,
            proofFileIdOrUrl,
            txnRef,
            ct);

        await _adminNotifier.NotifyAsync(
            "payment_proof",
            $"تم إرفاق إثبات دفع ({amount?.ToString("0.##")} ج.م) بالحجز {reservation.ReferenceNumber} عبر {paymentMethod}. الرجاء المراجعة والتفعيل.",
            reservation.Id,
            ct);

        _context.CurrentReservationId = reservation.Id;
        await _conversations.SetStateAsync(_context.CurrentConversation!.Id, ConversationState.Idle, ct: ct);

        return $"تم استلام إثبات الدفع بنجاح وسيقوم المسؤول بمراجعته وتفعيل الاشتراك يدويًا.\nرقم المرجع: {reservation.ReferenceNumber}";
    }

    [KernelFunction("RequestPaymentProofUpload")]
    [Description("يعرض للمستخدم بطاقة تفاعلية لرفع لقطة شاشة إثبات الدفع على واجهة الدردشة. استدعِها في واجهة الويب فور عرض إرشادات الدفع (فودافون كاش / انستاباي) وطلب وسيلة الدفع قبل إرفاق الإثبات.")]
    public async Task<string> RequestPaymentProofUploadAsync(CancellationToken ct)
    {
        _context.RequestPaymentUpload = true;
        return "سيتم عرض بطاقة رفع لقطة شاشة إثبات الدفع الآن. يرجى توجيه المستخدم لرفع لقطة الشاشة وسيقوم النظام بحفظها وإشعار المسؤول.";
    }

    public static string NormalizePhone(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var digits = new string(value.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("00")) digits = digits[2..];
        if (digits.StartsWith('0') && digits.Length == 11 && digits[1] == '1') digits = "2" + digits;
        return digits;
    }

    public static bool IsValidPhone(string value) => value.Length is >= 10 and <= 15;

    private static bool TryParsePaymentMethod(string value, out PaymentMethod method)
    {
        var normalized = value.Trim().ToLowerInvariant();
        if (normalized.Contains("insta") || normalized.Contains("انستا"))
        {
            method = PaymentMethod.Instapay;
            return true;
        }

        if (normalized.Contains("voda") || normalized.Contains("فودافون") || normalized.Contains("كاش"))
        {
            method = PaymentMethod.VodafoneCash;
            return true;
        }

        method = default;
        return false;
    }

    private async Task<Domain.Entities.Reservation?> ResolveReservationAsync(string reservationId, CancellationToken ct)
    {
        if (Guid.TryParse(reservationId, out var id))
        {
            var byId = await _reservations.GetAsync(id, ct);
            if (byId is not null) return byId;
        }

        return await _reservations.GetByReferenceAsync(reservationId.Trim(), ct);
    }
}
