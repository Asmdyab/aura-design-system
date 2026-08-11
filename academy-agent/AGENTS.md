# Academy Agent — Backend

ASP.NET Core (.NET 10) chat agent using Microsoft Semantic Kernel 1.79. Serves SSE-streamed chat to the frontend (`src/`) and a WhatsApp webhook channel.

## LLM provider configuration

The active LLM provider is selected via the **`LLM`** configuration section. Each provider has a **`UseThisProvider`** flag — set exactly one to `true` to activate it.

```json
"LLM": {
  "Gemini": {
    "UseThisProvider": true,
    "ApiKey": "...",
    "ModelId": "gemini-flash-latest"
  },
  "OpenAI": {
    "UseThisProvider": false,
    "ApiKey": "...",
    "ModelId": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "BaseUrl": "https://api.tokenrouter.com/v1"
  },
  "OpenRouter": {
    "UseThisProvider": false,
    "ApiKey": "...",
    "ModelId": "meta-llama/llama-3.3-70b-instruct",
    "BaseUrl": "https://openrouter.ai/api/v1",
    "Referer": "https://your-site.com",
    "SiteTitle": "Academy Agent"
  }
}
```

- **To switch providers**, set exactly one `UseThisProvider` to `true` and restart. No code changes needed.
- `Gemini` — Google Gemini via `AddGoogleAIGeminiChatCompletion` (`Microsoft.SemanticKernel.Connectors.Google`).
- `OpenAI` — any **OpenAI-compatible** chat-completions API (OpenAI, OpenRouter, TokenRouter, local proxies, …) via `AddOpenAIChatCompletion` (`Microsoft.SemanticKernel.Connectors.OpenAI`). Set `BaseUrl` for a custom endpoint; leave it empty for the real OpenAI API.
- `OpenRouter` — OpenRouter (OpenAI-compatible) via the same connector. Also sends optional `Referer` (→ `HTTP-Referer`) and `SiteTitle` (→ `X-OpenRouter-Title`) attribution headers on the shared `HttpClient` when active.
  - **Important:** `BaseUrl` must be `https://openrouter.ai/api/v1` — do NOT include `/chat/completions` (the SDK appends it; an extra suffix causes 404).
  - Model ids use OpenRouter's `vendor/model` form (e.g. `meta-llama/llama-3.3-70b-instruct`).
- All paths pass the shared `HttpClient`, attach the same four plugins (Academy / Registration / WhatsApp / Search), and use `FunctionChoiceBehavior.Auto()`.

### Fallback / legacy

If **no** provider has `UseThisProvider = true`, the engine falls back to the legacy **`Gemini`** configuration section (top-level, bound to `SemanticKernelOptions`). Keep that section for backward compatibility.

## Key files

| Concern | File |
|---|---|
| Provider options + resolution | `src/Academy.Agent.Application/Options/LlmOptions.cs` (`LlmOptions`, `ProviderOptions`, `SemanticKernelOptions`, `LlmOptionsResolver`) |
| Agent creation + streaming | `src/Academy.Agent.Application/AgentEngine.cs` (`CreateAgent()`) |
| DI wiring + conditional HTTP handler/headers | `src/Academy.Agent.Application/DependencyInjection.cs` (Gemini handler only when Gemini active; OpenRouter `HTTP-Referer`/`X-OpenRouter-Title` headers when OpenRouter active) |
| Gemini-only role rewrite handler | `src/Academy.Agent.Application/Http/GeminiFunctionRoleCompatibilityHandler.cs` (applied only when Gemini is active) |
| REST/SSE endpoints | `src/Academy.Agent.Api/Controllers/ChatController.cs` |

## Notes

- The `GeminiFunctionRoleCompatibilityHandler` rewrites `"role":"function"` → `"user"` (a Gemini-only requirement). It is registered **only** when Gemini is the active provider — it would corrupt OpenAI-format tool messages.
- Prefer not to commit real API keys. Use User Secrets / environment variables for both providers' keys.
