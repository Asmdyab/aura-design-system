namespace Academy.Agent.Application.Options;

public sealed class PaymentInstructionsOptions
{
    public const string SectionName = "PaymentInstructions";

    public string VodafoneCash { get; set; } = string.Empty;
    public string Instapay { get; set; } = string.Empty;
}
