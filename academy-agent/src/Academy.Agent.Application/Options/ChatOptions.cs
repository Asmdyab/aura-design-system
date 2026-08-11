namespace Academy.Agent.Application.Options;

public sealed class ChatOptions
{
    public const string SectionName = "Chat";

    public int MaxHistoryMessages { get; set; } = 30;
    public string[] CorsOrigins { get; set; } = Array.Empty<string>();
}
