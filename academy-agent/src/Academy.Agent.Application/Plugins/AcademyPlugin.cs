using System.ComponentModel;
using System.Text;
using Academy.Agent.Application.Models;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;

namespace Academy.Agent.Application.Plugins;

public sealed class AcademyPlugin
{
    private readonly IAcademyRepository _academy;
    private readonly PaymentInstructionsOptions _paymentInstructions;
    private readonly AgentContext _context;

    public AcademyPlugin(
        IAcademyRepository academy,
        IOptions<PaymentInstructionsOptions> paymentInstructions,
        AgentContext context)
    {
        _academy = academy;
        _paymentInstructions = paymentInstructions.Value;
        _context = context;
    }

    [KernelFunction("GetPricing")]
    [Description("ترجع الأسعار الرسمية لجميع باقات الاشتراك وخطط الأسعار من بيانات الأكاديمية (الاسم، السعر، الفترة، المميزات). استخدمها حصرًا لأي سؤال عن الأسعار أو الخطط أو الخصومات أو مواعيد الدفع. لا تستخدم البحث في الويب للأسعار أبدًا.")]
    public async Task<string> GetPricingAsync(CancellationToken ct)
    {
        var programs = await _academy.GetActiveProgramsAsync(ct);
        if (programs.Count == 0) return "لا توجد بيانات أسعار متاحة حاليًا.";

        _context.CurrentPlans = programs;
        // IMPORTANT for the LLM: output is pre-formatted with one item per line.
        // Every program line starts with a bullet "•" so that it stays a separate
        // visual item even if whitespace is collapsed. Do not merge lines.
        var sb = new StringBuilder();
        sb.AppendLine("باقات الاشتراك المتاحة:");
        sb.AppendLine();

        var groups = programs
            .GroupBy(p => string.IsNullOrWhiteSpace(p.Category) ? "أخرى" : p.Category.Trim())
            .ToList();

        foreach (var group in groups)
        {
            // Category header — own line, framed by a divider for visual separation.
            sb.AppendLine().Append("◼ ").Append(NormalizeSpaces(group.Key)).AppendLine(" ◼");
            sb.AppendLine("────────────");

            foreach (var p in group)
            {
                // Package line: "• الاسم — 350 ج.م / شهر — التفاصيل"
                // Keep name+price+details on ONE logical line so an item never splits awkwardly,
                // and rely on the bullet "•" to mark each package start.
                sb.Append("• ")
                    .Append(NormalizeSpaces(p.Name))
                    .Append(" — ")
                    .Append(p.Price.ToString("0.##"))
                    .Append(" ج.م / ")
                    .Append(NormalizePeriod(p.Period));

                var details = BuildDetailsLine(p);
                if (details is not null)
                    sb.Append(" — ").Append(details);
                sb.AppendLine();
            }
        }

        return sb.ToString().TrimEnd();
    }

    // Combine Notes + Features onto a single secondary line (only when present).
    private static string? BuildDetailsLine(Domain.Entities.AcademyProgram p)
    {
        var parts = new List<string>();
        if (p.Features.Count > 0)
            parts.Add(string.Join("، ", p.Features.Select(NormalizeSpaces)));
        if (!string.IsNullOrWhiteSpace(p.Notes))
            parts.Add(NormalizeSpaces(p.Notes!));

        return parts.Count == 0 ? null : string.Join(" | ", parts);
    }

    // Ensure a space between digits and Arabic letters ("باقة3 حصص" -> "باقة 3 حصص").
    private static string NormalizeSpaces(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var t = System.Text.RegularExpressions.Regex.Replace(text, @"(?<=[\p{IsArabic}])(?=\d)", " ");
        t = System.Text.RegularExpressions.Regex.Replace(t, @"(?<=\d)(?=[\p{IsArabic}])", " ");
        return t.Trim();
    }

    // Map terse period values to friendly Arabic.
    private static string NormalizePeriod(string period)
    {
        if (string.IsNullOrWhiteSpace(period)) return "الشهر";
        var p = period.Trim().ToLowerInvariant();
        return p switch
        {
            "month" or "monthly" or "شهري" or "شهرياً" or "شهريا" => "الشهر",
            "once" or "one-time" or "onetime" or "مرة واحدة" => "مرة واحدة",
            "week" or "weekly" or "أسبوعي" or "اسبوعي" or "أسبوعياً" => "الأسبوع",
            "year" or "yearly" or "annually" or "سنوي" or "سنوياً" => "السنة",
            _ => NormalizeSpaces(period),
        };
    }

    [KernelFunction("ListPrograms")]
    [Description("ترجع قائمة البرامج/الكورسات/المستويات المتاحة مع المعرّف والاسم والفئة والسعر. استخدمها لمساعدة المستخدم على اختيار البرنامج المناسب وأثناء التسجيل.")]
    public async Task<string> ListProgramsAsync(CancellationToken ct)
    {
        var programs = await _academy.GetActiveProgramsAsync(ct);
        if (programs.Count == 0) return "لا توجد برامج متاحة حاليًا.";

        _context.CurrentPlans = programs;

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
