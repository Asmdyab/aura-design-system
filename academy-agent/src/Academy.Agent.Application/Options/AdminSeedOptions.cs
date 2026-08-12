namespace Academy.Agent.Application.Options;

public class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";

    public string UserName { get; set; } = "admin";
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = "مدير النظام";
}
