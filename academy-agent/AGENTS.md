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

## Admin dashboard, JWT auth & real-time notifications

The API also serves the admin dashboard (frontend at `/dashboard`):

- **Auth** — `POST /api/auth/login` validates against the `AdminUsers` table (PBKDF2-hashed passwords) and returns a JWT (role `Admin`, 12h expiry). Every `/api/admin/*` endpoint requires it. Admin accounts are managed directly in the DB.
- **Config** (`appsettings*.json` / env vars):
  - `Jwt:Issuer`, `Jwt:Audience`, `Jwt:SigningKey` (required — never commit a real secret; use `Jwt__SigningKey` env var).
  - `AdminSeed` — first-run seed: if no `AdminUser` exists when the app starts it creates `AdminSeed:UserName` (`admin`) with `AdminSeed:Password` (env `AdminSeed__Password`). If no password is set it falls back to `Admin@123` and logs a warning. **Change it immediately.**
- **SignalR** — `AdminNotificationsHub` at `/hubs/admin-notifications`, JWT passed in the `?access_token=` query string. `IAdminNotifier` persists notifications and broadcasts them to all connected admins (covers agent-driven new registrations and payment-proof uploads with no plugin changes).
- **Admin endpoints** (`AdminController`, all `[Authorize(Roles="Admin")]`):
  - `GET /api/admin/stats`
  - `GET|POST /api/admin/reservations`, `PATCH /api/admin/reservations/{id}/status`
  - `GET /api/admin/payment-proofs`, `POST /api/admin/payment-proofs/{id}/approve|reject`
  - `GET|POST|PUT|DELETE /api/admin/programs`, `PATCH /api/admin/programs/{id}/toggle`
  - `GET /api/admin/notifications`, `POST /api/admin/notifications/mark-read`, `POST .../mark-all-read`

## Key files

| Concern | File |
|---|---|
| Provider options + resolution | `src/Academy.Agent.Application/Options/LlmOptions.cs` (`LlmOptions`, `ProviderOptions`, `SemanticKernelOptions`, `LlmOptionsResolver`) |
| Agent creation + streaming | `src/Academy.Agent.Application/AgentEngine.cs` (`CreateAgent()`) |
| DI wiring + conditional HTTP handler/headers | `src/Academy.Agent.Application/DependencyInjection.cs` (Gemini handler only when Gemini active; OpenRouter `HTTP-Referer`/`X-OpenRouter-Title` headers when OpenRouter active) |
| Gemini-only role rewrite handler | `src/Academy.Agent.Application/Http/GeminiFunctionRoleCompatibilityHandler.cs` (applied only when Gemini is active) |
| REST/SSE endpoints | `src/Academy.Agent.Api/Controllers/ChatController.cs` |
| Admin dashboard API | `src/Academy.Agent.Api/Controllers/Admin/AdminController.cs` |
| Auth | `src/Academy.Agent.Api/Controllers/AuthController.cs`, `src/Academy.Agent.Infrastructure/Auth/` (`PasswordHasher`, `JwtTokenService`, `AuthService`) |
| Admin SignalR hub | `src/Academy.Agent.Api/Hubs/` (`AdminNotificationsHub`, `AdminNotificationBroadcaster`) |
| First-run admin seed | `src/Academy.Agent.Api/Services/AdminSeedService.cs` |

## Frontend / dashboard

- API client + token storage: `src/lib/admin-api.ts` (JWT in `localStorage`, 401 → `/dashboard/login`).
- Routes: `/dashboard/login`, `/dashboard` (layout + sidebar + notification bell), `/dashboard` stats, `/dashboard/users`, `/dashboard/payments`, `/dashboard/programs`.
- Real-time hook: `src/hooks/use-admin-notifications.ts` (SignalR `@microsoft/signalr`). The hub URL is `${VITE_AGENT_API_URL}/hubs/admin-notifications`.

### Payment screenshot upload card (web chat)

- The agent tool `RequestPaymentProofUpload` (RegistrationPlugin) makes the web chat SSE stream emit `event: payment-upload` (payload: `reservationId`, `reservationRef`) after the reply, mirroring the `plans` card mechanism in `ChatController`.
- The widget renders an upload card and POSTs the screenshot to `POST /api/chat/payment-proof` (multipart: `file`, `conversationId`, `reservationId`, optional `method`/`amount`/`txnRef`). That endpoint saves the file via `IFileStorage`, creates a `PaymentProof` (pending review) via `IReservationRepository.AddPaymentProofAsync`, and notifies admins — without depending on the LLM.
- On WhatsApp, no card is sent; the user just sends the screenshot in chat (existing inbound-media flow).

## Notes

- The `GeminiFunctionRoleCompatibilityHandler` rewrites `"role":"function"` → `"user"` (a Gemini-only requirement). It is registered **only** when Gemini is the active provider — it would corrupt OpenAI-format tool messages.
- Prefer not to commit real API keys. Use User Secrets / environment variables for both providers' keys.
