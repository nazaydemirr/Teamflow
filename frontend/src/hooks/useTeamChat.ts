import { useEffect, useState } from "react";
import { getChatMessages, type ChatMessage } from "@/lib/chats";

export function useTeamChat(teamId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setMessages(getChatMessages(teamId));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.teamId === teamId) {
        setMessages(getChatMessages(teamId));
      }
    };

    window.addEventListener("teamflow-chats-updated", handleUpdate);
    return () => window.removeEventListener("teamflow-chats-updated", handleUpdate);
  }, [teamId]);

  return { messages };
}
