using System.Text.Json;
using System.Text.Json.Serialization;

namespace Academy.Agent.Application.Models;

public sealed class RegistrationDraft
{
    public string? FullName { get; set; }
    public string? WhatsappPhone { get; set; }
    public bool? ConsentForWhatsApp { get; set; }
    public int? ProgramId { get; set; }
    public string? PreferredSchedule { get; set; }
    public bool? PayNow { get; set; }
    public Guid? ReservationId { get; set; }

    public static RegistrationDraft FromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new RegistrationDraft();
        try
        {
            return JsonSerializer.Deserialize<RegistrationDraft>(json) ?? new RegistrationDraft();
        }
        catch (JsonException)
        {
            return new RegistrationDraft();
        }
    }

    public string ToJson() => JsonSerializer.Serialize(this);
}
