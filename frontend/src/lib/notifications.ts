export type StoredNotification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const STORAGE_KEY = "teamflow_notifications_v1";

export function broadcastNotificationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("teamflow-notifications"));
}

export function listNotifications(): StoredNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredNotification => {
      const n = item as Partial<StoredNotification>;
      return typeof n.id === "string" && typeof n.message === "string" && typeof n.read === "boolean";
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function persist(list: StoredNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  broadcastNotificationsUpdated();
}

export function addNotification(message: string): StoredNotification {
  const row: StoredNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  persist([...listNotifications(), row]);
  return row;
}

export function markNotificationAsRead(id: string) {
  const list = listNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  persist(list);
}

export function markAllAsRead() {
  const list = listNotifications().map((n) => ({ ...n, read: true }));
  persist(list);
}

export function deleteNotification(id: string) {
  const list = listNotifications().filter((n) => n.id !== id);
  persist(list);
}
