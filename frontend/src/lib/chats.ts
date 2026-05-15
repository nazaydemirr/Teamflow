export type ChatMessage = {
  id: string;
  teamId: string; // Fırsat / Ekip ID'si
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
};

const CHAT_STORAGE_KEY = "teamflow_chats_v1";

export function getChatMessages(teamId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as ChatMessage[];
    return all.filter((m) => m.teamId === teamId);
  } catch {
    return [];
  }
}

export function sendChatMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    
    all.push(newMsg);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("teamflow-chats-updated", { detail: { teamId: msg.teamId } }));
  } catch (e) {
    console.error(e);
  }
}
