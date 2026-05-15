import { useEffect, useState } from "react";
import {
  listNotifications,
  type StoredNotification,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function refresh() {
    const list = listNotifications();
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.read).length);
  }

  useEffect(() => {
    refresh();

    function onUpdate() {
      refresh();
    }

    window.addEventListener("teamflow-notifications", onUpdate);
    return () => window.removeEventListener("teamflow-notifications", onUpdate);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}
