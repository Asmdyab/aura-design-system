using System.ComponentModel;
using System.Text;
using Academy.Agent.Application.Ports;
using Microsoft.SemanticKernel;

namespace Academy.Agent.Application.Plugins;

public sealed class SearchPlugin
{
    private static readonly string[] BlockedTerms =
    {
        "سعر", "أسعار", "تكلفة", "باقة", "اشتراك", "خصم", "دفع", "فودافون", "انستاباي",
        "pricing", "price", "cost", "subscription", "discount", "vodafone", "instapay",
        "reservation", "حجز", "تسجيل",
    };

    private readonly IWebSearchService _search;

    public SearchPlugin(IWebSearchService search)
    {
        _search = search;
    }

    [KernelFunction("WebSearch")]
    [Description("يبحث في الإنترنت للحصول على محتوى تعليمي عن القرآن الكريم أو الحديث الشريف أو التجويد فقط (نصوص الآيات والأحاديث ومراجعها من مصادر موثوقة مثل quran.com و sunnah.com). يُمنع منعًا باتًا استخدامه للأسعار أو معلومات الاشتراك.")]
    public async Task<string> WebSearchAsync(string query, CancellationToken ct)
    {
        if (ContainsBlockedTerm(query))
            return "لا يمكنني استخدام البحث في الويب للأسعار أو معلومات الاشتراك. هذه المعلومات تأتي فقط من بيانات الأكاديمية الرسمية عبر GetPricing و ListPrograms.";

        try
        {
            var results = await _search.SearchAsync(query, maxResults: 5, ct);
            if (results.Count == 0) return "لم أجد نتائج موثوقة متاحة حاليًا.";

            var sb = new StringBuilder();
            foreach (var r in results)
            {
                sb.AppendLine($"- {r.Title}");
                sb.AppendLine($"  {r.Url}");
                if (!string.IsNullOrWhiteSpace(r.Snippet)) sb.AppendLine($"  {r.Snippet}");
            }

            return sb.ToString();
        }
        catch (Exception ex)
        {
            return $"تعذر إجراء البحث حاليًا. ({ex.Message})";
        }
    }

    [KernelFunction("FetchUrl")]
    [Description("يجلب نص صفحة ويب عند الحاجة للتحقق من محتوى تعليمي عن القرآن أو الحديث أو التجويد. يُمنع استخدامه للأسعار أو معلومات الاشتراك.")]
    public async Task<string> FetchUrlAsync(string url, CancellationToken ct)
    {
        if (ContainsBlockedTerm(url))
            return "لا يمكنني جلب محتوى للأسعار أو معلومات الاشتراك.";

        try
        {
            var text = await _search.FetchUrlAsync(url, ct);
            if (string.IsNullOrWhiteSpace(text)) return "لم أتمكن من قراءة محتوى الصفحة.";

            return text.Length <= 4000 ? text : text[..4000] + "\n[مقتطف]";
        }
        catch (Exception ex)
        {
            return $"تعذر جلب الصفحة حاليًا. ({ex.Message})";
        }
    }

    private static bool ContainsBlockedTerm(string input)
    {
        var lowered = input.ToLowerInvariant();
        return BlockedTerms.Any(term => lowered.Contains(term.ToLowerInvariant()));
    }
}
