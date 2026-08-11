namespace Academy.Agent.Application.Ports;

public sealed record WebSearchResult(string Title, string Url, string Snippet);

public interface IWebSearchService
{
    Task<IReadOnlyList<WebSearchResult>> SearchAsync(string query, int maxResults, CancellationToken ct = default);
    Task<string?> FetchUrlAsync(string url, CancellationToken ct = default);
}
