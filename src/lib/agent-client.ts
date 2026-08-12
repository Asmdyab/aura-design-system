const API_BASE = import.meta.env.VITE_AGENT_API_URL ?? "";

const SESSION_KEY = "academy-agent-conversation-id";
const MESSAGES_KEY = "academy-agent-messages";

export type ChatRole = "user" | "assistant";

export type PlanCard = {
  id: number;
  name: string;
  category: string;
  notes?: string | null;
  price: number;
  period: string;
  features: string[];
};

export type PaymentUploadRequest = {
  reservationId?: string | null;
  reservationRef?: string | null;
};

export type PaymentUploadState = PaymentUploadRequest & {
  status: "ready" | "uploading" | "done" | "error";
  proofUrl?: string;
  error?: string;
};

export type ChatMessage = {
  role: ChatRole;
  text: string;
  plans?: PlanCard[];
  payment?: PaymentUploadState;
};

export type PaymentProofResult = {
  proofId: string;
  reservationId: string;
  reservationRef: string;
  url: string;
};

export type ChatSession = {
  conversationId: string;
  greeting: string;
};

type SseBlock = {
  event: string;
  data: string;
};

function parseSseBlock(raw: string): SseBlock | null {
  let event = "";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice("event:".length).trim();
    else if (line.startsWith("data:")) data = line.slice("data:".length).trim();
  }
  if (!event && !data) return null;
  return { event, data };
}

export async function createChatSession(
  channel = 2,
  externalUserId?: string,
  signal?: AbortSignal,
): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/api/chat/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, externalUserId }),
    signal,
  });
  if (!res.ok) throw new Error(`تعذر بدء المحادثة (${res.status})`);
  return (await res.json()) as ChatSession;
}

export async function streamMessage(
  conversationId: string,
  message: string,
  events: {
    onMeta?: (conversationId: string) => void;
    onDelta?: (text: string) => void;
    onPlans?: (plans: PlanCard[]) => void;
    onPaymentUpload?: (request: PaymentUploadRequest) => void;
  },
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`تعذر إرسال الرسالة (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let serverError: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = parseSseBlock(buffer.slice(0, sep));
      buffer = buffer.slice(sep + 2);
      if (!block) continue;

      if (block.event === "delta") {
        const text = (JSON.parse(block.data) as { text?: string }).text ?? "";
        if (text) {
          full += text;
          events.onDelta?.(text);
        }
      } else if (block.event === "meta") {
        const meta = JSON.parse(block.data) as { conversationId?: string };
        if (meta.conversationId) events.onMeta?.(meta.conversationId);
      } else if (block.event === "plans") {
        const plans = JSON.parse(block.data) as PlanCard[];
        if (Array.isArray(plans)) events.onPlans?.(plans);
      } else if (block.event === "payment-upload") {
        const request = JSON.parse(block.data) as PaymentUploadRequest;
        events.onPaymentUpload?.(request);
      } else if (block.event === "error") {
        const err = JSON.parse(block.data) as { error?: string };
        serverError = err.error ?? "تعذر الرد حالياً.";
      }
    }
  }

  if (serverError) throw new Error(serverError);
  return full;
}

export function getStoredConversationId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function storeConversationId(conversationId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SESSION_KEY, conversationId);
}

export async function uploadPaymentProof(opts: {
  file: File;
  conversationId: string;
  reservationId?: string | null;
  method?: string;
  amount?: string;
  txnRef?: string;
}): Promise<PaymentProofResult> {
  const form = new FormData();
  form.append("file", opts.file);
  form.append("conversationId", opts.conversationId);
  if (opts.reservationId) form.append("reservationId", opts.reservationId);
  if (opts.method) form.append("method", opts.method);
  if (opts.amount) form.append("amount", opts.amount);
  if (opts.txnRef) form.append("txnRef", opts.txnRef);

  const res = await fetch(`${API_BASE}/api/chat/payment-proof`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let message = "تعذر حفظ إثبات الدفع. حاول مرة أخرى.";
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }
  return (await res.json()) as PaymentProofResult;
}

export function getStoredMessages(): ChatMessage[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? "[]") as ChatMessage[];
    return Array.isArray(parsed) ? parsed.filter((m) => m && typeof m.text === "string") : [];
  } catch {
    return [];
  }
}

export function storeMessages(messages: ChatMessage[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function clearStoredConversation(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(MESSAGES_KEY);
}
