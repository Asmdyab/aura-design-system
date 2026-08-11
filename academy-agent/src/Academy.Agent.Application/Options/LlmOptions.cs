namespace Academy.Agent.Application.Options;

/// <summary>
/// Per-provider settings for a single LLM provider.
/// Set <see cref="UseThisProvider"/> to true to activate this provider.
/// </summary>
public sealed class ProviderOptions
{
    /// <summary>Set to true to use this provider. Only one provider should be enabled.</summary>
    public bool UseThisProvider { get; set; }

    public string ApiKey { get; set; } = string.Empty;

    public string ModelId { get; set; } = string.Empty;

    public double Temperature { get; set; } = 0.3;

    /// <summary>Optional custom endpoint for OpenAI-compatible providers (e.g. https://api.tokenrouter.com/v1).</summary>
    public string? BaseUrl { get; set; }

    /// <summary>Optional HTTP-Referer header (used by OpenRouter for attribution).</summary>
    public string? Referer { get; set; }

    /// <summary>Optional X-OpenRouter-Title header (used by OpenRouter for attribution).</summary>
    public string? SiteTitle { get; set; }
}

/// <summary>
/// Multi-provider LLM settings. The active provider is whichever has UseThisProvider = true.
/// </summary>
public sealed class LlmOptions
{
    public const string SectionName = "LLM";

    public ProviderOptions Gemini { get; set; } = new();

    public ProviderOptions OpenAI { get; set; } = new();

    public ProviderOptions OpenRouter { get; set; } = new();
}

/// <summary>
/// Legacy single-provider (Gemini) options, kept for backward compatibility with the "Gemini" config section.
/// </summary>
public sealed class SemanticKernelOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;
    public string ModelId { get; set; } = "gemini-2.5-flash";
    public double Temperature { get; set; } = 0.3;
}

/// <summary>Identifies the active LLM provider.</summary>
public enum LlmProvider
{
    Gemini,
    OpenAI,
    OpenRouter
}

/// <summary>The fully-resolved settings for the active provider.</summary>
public sealed class ResolvedLlmSettings
{
    public LlmProvider Provider { get; init; }
    public string ApiKey { get; init; } = string.Empty;
    public string ModelId { get; init; } = string.Empty;
    public double Temperature { get; init; }
    public string? BaseUrl { get; init; }
    public string? Referer { get; init; }
    public string? SiteTitle { get; init; }
}

public static class LlmOptionsResolver
{
    /// <summary>
    /// Resolves the active provider from the multi-provider "LLM" section.
    /// If no provider has UseThisProvider set, falls back to the legacy "Gemini" section.
    /// </summary>
    public static ResolvedLlmSettings Resolve(LlmOptions llm, SemanticKernelOptions legacy)
    {
        if (llm.Gemini.UseThisProvider)
        {
            return new ResolvedLlmSettings
            {
                Provider = LlmProvider.Gemini,
                ApiKey = llm.Gemini.ApiKey,
                ModelId = llm.Gemini.ModelId,
                Temperature = llm.Gemini.Temperature,
            };
        }

        if (llm.OpenAI.UseThisProvider)
        {
            return new ResolvedLlmSettings
            {
                Provider = LlmProvider.OpenAI,
                ApiKey = llm.OpenAI.ApiKey,
                ModelId = llm.OpenAI.ModelId,
                Temperature = llm.OpenAI.Temperature,
                BaseUrl = llm.OpenAI.BaseUrl,
            };
        }

        if (llm.OpenRouter.UseThisProvider)
        {
            return new ResolvedLlmSettings
            {
                Provider = LlmProvider.OpenRouter,
                ApiKey = llm.OpenRouter.ApiKey,
                ModelId = llm.OpenRouter.ModelId,
                Temperature = llm.OpenRouter.Temperature,
                BaseUrl = llm.OpenRouter.BaseUrl,
                Referer = llm.OpenRouter.Referer,
                SiteTitle = llm.OpenRouter.SiteTitle,
            };
        }

        // Legacy fallback: "Gemini" section with no UseThisProvider anywhere.
        return new ResolvedLlmSettings
        {
            Provider = LlmProvider.Gemini,
            ApiKey = legacy.ApiKey,
            ModelId = legacy.ModelId,
            Temperature = legacy.Temperature,
        };
    }
}
