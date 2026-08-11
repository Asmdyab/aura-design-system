export const OPEN_CHAT_EVENT = "academy:open-chat";

export function openChat(): void {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
}
