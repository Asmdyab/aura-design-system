using System.ComponentModel;
using System.Text;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;

namespace Academy.Agent.Application.Plugins;

public sealed class AcademyPlugin
{
    private readonly IAcademyRepository _academy;
    private readonly PaymentInstructionsOptions _paymentInstructions;

    public AcademyPlugin(IAcademyRepository academy, IOptions<PaymentInstructionsOptions> paymentInstructions)
    {
        _academy = academy;
        _paymentInstructions = paymentInstructions.Value;
    }

    [KernelFunction("GetPricing")]
    [Description("ترجع الأسعار الرسمية لجميع باقات الاشتراك وخطط الأسعار من بيانات الأكاديمية (الاسم، السعر، الفترة، المميزات). استخدمها حصرًا لأي سؤال عن الأسعار أو الخطط أو الخصومات أو مواعيد الدفع. لا تستخدم البحث في الويب للأسعار أبدًا.")]
    public async Task<string> GetPricingAsync(CancellationToken ct)
    {
        var programs = await _academy.GetActiveProgramsAsync(ct);
        if (programs.Count == 0) return "لا توجد بيانات أسعار متاحة حاليًا.";

        var sb = new StringBuilder();
        foreach (var group in programs.GroupBy(p => p.Category))
        {
            sb.AppendLine($"## {group.Key}");
            foreach (var p in group)
            {
                sb.Append("- ").Append(p.Name);
                if (!string.IsNullOrWhiteSpace(p.Notes)) sb.Append(" (").Append(p.Notes).Append(')');
                sb.Append(": ").Append(p.Price.ToString("0.##")).Append(" ج.م / ").Append(p.Period);
                if (p.Features.Count > 0) sb.Append(" — ").Append(string.Join("، ", p.Features));
                sb.AppendLine();
            }
        }

        return sb.ToString();
    }

    [KernelFunction("ListPrograms")]
    [Description("ترجع قائمة البرامج/الكورسات/المستويات المتاحة مع المعرّف والاسم والفئة والسعر. استخدمها لمساعدة المستخدم على اختيار البرنامج المناسب وأثناء التسجيل.")]
    public async Task<string> ListProgramsAsync(CancellationToken ct)
    {
        var programs = await _academy.GetActiveProgramsAsync(ct);
        if (programs.Count == 0) return "لا توجد برامج متاحة حاليًا.";

        var lines = programs
            .Select(p => $"id={p.Id} | {p.Name} | {p.Category} | {p.Price.ToString("0.##")} ج.م / {p.Period}")
            .ToList();

        return string.Join("\n", lines);
    }

    [KernelFunction("GetPaymentInstructions")]
    [Description("ترجع إرشادات الدفع اليدوي الرسمية للأكاديمية. الوسيط إما VodafoneCash أو Instapay. استخدمها عندما يختار المستخدم الدفع الآن يدويًا.")]
    public string GetPaymentInstructions(string method)
    {
        var normalized = method.Trim().ToLowerInvariant();
        if (normalized.Contains("insta") || normalized.Contains("انستا") || normalized.Contains("انستاباي"))
            return _paymentInstructions.Instapay;

        return _paymentInstructions.VodafoneCash;
    }
}
