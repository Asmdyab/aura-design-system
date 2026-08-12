namespace Academy.Agent.Application.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "academy-agent";
    public string Audience { get; set; } = "academy-admin";
    public string SigningKey { get; set; } = string.Empty;
    public int ExpiryHours { get; set; } = 12;
}
