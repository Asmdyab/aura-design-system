namespace Academy.Agent.Application.Options;

public sealed class SemanticKernelOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;
    public string ModelId { get; set; } = "gemini-2.5-flash";
    public double Temperature { get; set; } = 0.3;
}
