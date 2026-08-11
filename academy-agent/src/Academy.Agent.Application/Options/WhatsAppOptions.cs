namespace Academy.Agent.Application.Options;

public sealed class WhatsAppOptions
{
    public const string SectionName = "WhatsApp";

    public string AccessToken { get; set; } = string.Empty;
    public string PhoneNumberId { get; set; } = string.Empty;
    public string VerifyToken { get; set; } = string.Empty;
    public string AppSecret { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "v21.0";
    public string GraphBaseUrl { get; set; } = "https://graph.facebook.com";
}
