namespace Academy.Agent.Application.Models;

public sealed class PlanCardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public decimal Price { get; set; }
    public string Period { get; set; } = string.Empty;
    public List<string> Features { get; set; } = new();
}