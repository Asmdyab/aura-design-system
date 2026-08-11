namespace Academy.Agent.Application.Options;

public sealed class WebSearchOptions
{
    public const string SectionName = "GoogleCse";

    public string ApiKey { get; set; } = string.Empty;
    public string SearchEngineId { get; set; } = string.Empty;
    public int MaxResults { get; set; } = 5;
}
