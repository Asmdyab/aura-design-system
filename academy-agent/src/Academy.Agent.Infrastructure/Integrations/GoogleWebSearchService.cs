using System.Text.Json;
using System.Text.RegularExpressions;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Academy.Agent.Infrastructure.Integrations;

public sealed partial class GoogleWebSearchService : IWebSearchService
{
    private readonly HttpClient _http;
    private readonly WebSearchOptions _options;
    private readonly ILogger<GoogleWebSearchService> _logger;

    public GoogleWebSearchService(
        HttpClient http,
        IOptions<WebSearchOptions> options,
        ILogger<GoogleWebSearchService> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<WebSearchResult>> SearchAsync(string query, int maxResults, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey) || string.IsNullOrWhiteSpace(_options.SearchEngineId))
        {
            _logger.LogWarning("Google CSE not configured; skipping search.");
            return Array.Empty<WebSearchResult>();
        }

        var url =
            $"https://www.googleapis.com/customsearch/v1" +
            $"?key={Uri.EscapeDataString(_options.ApiKey)}" +
            $"&cx={Uri.EscapeDataString(_options.SearchEngineId)}" +
            $"&q={Uri.EscapeDataString(query)}" +
            $"&num={Math.Min(Math.Max(1, maxResults), 10)}";

        using var response = await _http.GetAsync(url, ct);
        var json = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Google CSE search failed ({Status}): {Body}", (int)response.StatusCode, json);
            return Array.Empty<WebSearchResult>();
        }

        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
            return Array.Empty<WebSearchResult>();

        var results = new List<WebSearchResult>();
        foreach (var item in items.EnumerateArray())
        {
            var title = item.TryGetProperty("title", out var t) ? t.GetString() : string.Empty;
            var link = item.TryGetProperty("link", out var l) ? l.GetString() : string.Empty;
            var snippet = item.TryGetProperty("snippet", out var s) ? s.GetString() : string.Empty;
            if (!string.IsNullOrWhiteSpace(link))
                results.Add(new WebSearchResult(title ?? string.Empty, link, snippet ?? string.Empty));
        }

        return results;
    }

    public async Task<string?> FetchUrlAsync(string url, CancellationToken ct = default)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return null;

        using var response = await _http.GetAsync(uri, ct);
        if (!response.IsSuccessStatusCode) return null;

        var html = await response.Content.ReadAsStringAsync(ct);
        var text = HtmlTagRegex().Replace(html, " ");
        text = HtmlEntityRegex().Replace(text, " ");
        text = Regex.Replace(text, @"\s+", " ").Trim();
        return text;
    }

    [GeneratedRegex(@"<[^>]+>", RegexOptions.Compiled)]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"&[a-zA-Z#0-9]+;", RegexOptions.Compiled)]
    private static partial Regex HtmlEntityRegex();
}
