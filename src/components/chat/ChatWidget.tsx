import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, SquarePen, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OPEN_CHAT_EVENT } from "@/lib/chat-open";
import {
  type ChatMessage,
  type ChatSession,
  clearStoredConversation,
  createChatSession,
  getStoredConversationId,
  getStoredMessages,
  storeConversationId,
  storeMessages,
  streamMessage,
} from "@/lib/agent-client";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => getStoredMessages());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    getStoredConversationId(),
  );

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const conversationRef = useRef(conversationId);
  conversationRef.current = conversationId;

  const controllerRef = useRef<AbortController | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const persist = useCallback((next: ChatMessage[]) => {
    storeMessages(next);
  }, []);

  const ensureSession = useCallback(async (): Promise<ChatSession | null> => {
    if (conversationRef.current) return { conversationId: conversationRef.current, greeting: "" };
    const session = await createChatSession(2);
    storeConversationId(session.conversationId);
    setConversationId(session.conversationId);
    return session;
  }, []);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      bottomSentinelRef.current?.scrollIntoView({ behavior: "auto" });
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open, messages, busy]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    let session: ChatSession | null;
    try {
      session = await ensureSession();
    } catch {
      toast.error("تعذر بدء المحادثة حالياً. حاول مرة أخرى.");
      return;
    }
    if (!session) return;

    const base = messagesRef.current;
    const greetingLine =
      base.length === 0 ? [{ role: "assistant" as const, text: session.greeting }] : [];
    const next: ChatMessage[] = [
      ...greetingLine,
      ...base,
      { role: "user", text },
      { role: "assistant", text: "" },
    ];

    setInput("");
    setMessages(next);
    persist(next);
    setBusy(true);

    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    try {
      const full = await streamMessage(
        session.conversationId,
        text,
        {
          onDelta: (delta) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, text: last.text + delta };
              persist(updated);
              return updated;
            });
          },
        },
        signal,
      );

      if (!full) {
        setMessages((prev) => {
          const updated = prev.filter((m) => !(m.role === "assistant" && m.text === ""));
          persist(updated);
          return updated;
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "تعذر الرد الآن. حاول مرة أخرى.");
      setMessages((prev) => {
        const updated = prev.filter((m) => !(m.role === "assistant" && m.text === ""));
        persist(updated);
        return updated;
      });
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  }

  function resetConversation() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setBusy(false);
    setMessages([]);
    setConversationId(null);
    clearStoredConversation();
  }

  function close() {
    resetConversation();
    setOpen(false);
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label="فتح المحادثة"
        onClick={() => (open ? close() : setOpen(true))}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 end-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-elevated)]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "chat"}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 end-6 z-50 flex h-[520px] w-[calc(100vw-3rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center justify-between border-b border-border bg-[#0A5C70] px-4 py-3 text-background">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/15">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">مساعد أكاديمية القرآن</p>
                  <p className="text-xs text-background/70">متاح للرد على استفساراتك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetConversation}
                aria-label="بدء محادثة جديدة"
                title="بدء محادثة جديدة"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-background/15"
              >
                <SquarePen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label="إغلاق المحادثة"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-background/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  مرحباً! اسألني عن البرامج والأسعار أو التسجيل أو أي شيء يخص الأكاديمية.
                </div>
              )}
              {messages.map((m, i) => {
                if (m.role === "assistant" && m.text === "") return null;
                return (
                  <div
                    key={i}
                    className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-card)]",
                        m.role === "user"
                          ? "bg-foreground text-background"
                          : "border border-border bg-background text-foreground",
                      )}
                      dir="auto"
                    >
                      {m.role === "assistant" && m.text === "" ? (
                        <span className="inline-flex gap-1">
                          {[0, 1, 2].map((d) => (
                            <motion.span
                              key={d}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                              className="inline-block h-1.5 w-1.5 rounded-full bg-foreground"
                            />
                          ))}
                        </span>
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                );
              })}
              {busy && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background px-4 py-2.5">
                    <span className="inline-flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                          className="inline-block h-1.5 w-1.5 rounded-full bg-foreground"
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomSentinelRef} />
            </div>

            <div className="flex items-end gap-2 border-t border-border p-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="اكتب رسالتك هنا... (Enter للإرسال)"
                rows={1}
                className="max-h-32 min-h-10 resize-none rounded-2xl border-border bg-background py-2.5"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => void send()}
                disabled={busy || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="إرسال"
              >
                <Send className="h-4 w-4 -scale-x-100" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
