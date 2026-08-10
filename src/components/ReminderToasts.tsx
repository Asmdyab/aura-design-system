import { useEffect, useRef } from "react";
import { toast } from "sonner";

const REMINDER_TOAST_ID = "adhkar-reminder";
const FIRST_DELAY = 30_000;
const INTERVAL = 3 * 60_000;
const TOAST_DURATION = 8_000;

const messages = [
  "أستغفر الله العظيم وأتوب إليه",
  "اللهم صلِّ وسلم على نبينا محمد",
  "اللهم صلِّ على محمد وعلى آل محمد",
  "سبحان الله وبحمده، سبحان الله العظيم",
  "استغفروا الله إنه كان غفاراً",
];

function pickMessage(prev: string) {
  const candidates = messages.filter((m) => m !== prev);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function ReminderToasts() {
  const lastMessage = useRef("");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const schedule = (delay: number) => {
      timeoutId = setTimeout(() => {
        const message = pickMessage(lastMessage.current);
        lastMessage.current = message;
        toast(message, { id: REMINDER_TOAST_ID, duration: TOAST_DURATION });
        schedule(INTERVAL);
      }, delay);
    };

    schedule(FIRST_DELAY);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      toast.dismiss(REMINDER_TOAST_ID);
    };
  }, []);

  return null;
}
