using System.ComponentModel;
using Academy.Agent.Application.Ports;
using Microsoft.SemanticKernel;

namespace Academy.Agent.Application.Plugins;

public sealed class WhatsAppPlugin
{
    private readonly IWhatsAppMessenger _messenger;

    public WhatsAppPlugin(IWhatsAppMessenger messenger)
    {
        _messenger = messenger;
    }

    [KernelFunction("SendWhatsAppConfirmation")]
    [Description("يرسل رسالة تأكيد عبر واتساب للمستخدم على رقم هاتفه. لا تستخدمها إلا بعد موافقة المستخدم الصريحة على إرسال تأكيد عبر واتساب.")]
    public async Task<string> SendWhatsAppConfirmationAsync(string whatsappPhone, string message, CancellationToken ct)
    {
        var normalized = new string(whatsappPhone.Where(char.IsDigit).ToArray());
        if (normalized.Length is < 10 or > 15)
            return "خطأ: رقم واتساب غير صالح، لم يتم إرسال الرسالة.";

        try
        {
            await _messenger.SendConfirmationAsync(normalized, message, ct);
            return "تم إرسال رسالة التأكيد عبر واتساب بنجاح.";
        }
        catch (Exception ex)
        {
            return $"تعذر إرسال رسالة واتساب حاليًا (خطأ تقني). يمكن إعادة المحاولة لاحقًا. ({ex.Message})";
        }
    }
}
