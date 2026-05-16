import { apiGet, apiPost } from "@/lib/api";

export type ChatMessage = {
  id: string;
  teamId: string; // Fırsat / Ekip ID'si
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
};

export function broadcastChatsUpdated(teamId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("teamflow-chats-updated", { detail: { teamId } }));
}

const CHAT_STORAGE_KEY = "teamflow_chats_v1";

export async function fetchChatMessages(teamId: string): Promise<ChatMessage[]> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return [];
      const all = JSON.parse(raw) as ChatMessage[];
      return all.filter((m) => m.teamId === teamId);
    } catch {
      return [];
    }
  }

  try {
    const data = await apiGet(`/chats/${teamId}`) as any;
    return data.items || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function sendChatMessage(teamId: string, text: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      const all = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
      
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        teamId,
        senderId: localStorage.getItem("teamflow_profile_id") || "demo_user",
        senderName: "Demo Kullanıcı",
        text,
        timestamp: new Date().toISOString(),
      };
      
      all.push(newMsg);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(all));
      broadcastChatsUpdated(teamId);
      return;
    } catch (e) {
      console.error(e);
      return;
    }
  }

  try {
    await apiPost(`/chats/${teamId}`, { text });
    broadcastChatsUpdated(teamId);
  } catch (err) {
    console.error(err);
  }
}
