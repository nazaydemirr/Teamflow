import { useEffect, useState, useCallback } from "react";
import { fetchChatMessages, type ChatMessage } from "@/lib/chats";

export function useTeamChat(teamId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const refresh = useCallback(async () => {
    const data = await fetchChatMessages(teamId);
    setMessages(data);
  }, [teamId]);

  useEffect(() => {
    refresh();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.teamId === teamId) {
        refresh();
      }
    };

    window.addEventListener("teamflow-chats-updated", handleUpdate);
    return () => window.removeEventListener("teamflow-chats-updated", handleUpdate);
  }, [teamId, refresh]);

  return { messages };
}
