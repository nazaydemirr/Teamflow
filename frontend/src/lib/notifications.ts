import { apiGet, apiPatch, apiDelete, apiPost } from "@/lib/api";

export type StoredNotification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function broadcastNotificationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("teamflow-notifications"));
}

const STORAGE_KEY = "teamflow_notifications_v1";

function listDemoNotifications(): StoredNotification[] {
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

function persistDemoNotifications(list: StoredNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  broadcastNotificationsUpdated();
}

export function addNotification(message: string): StoredNotification | null {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const row: StoredNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    persistDemoNotifications([...listDemoNotifications(), row]);
    return row;
  }
  return null;
}

export async function sendNotificationToUser(applicantLabel: string, message: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    let profileKey = "frontend";
    const labelLower = applicantLabel.toLowerCase();
    if (labelLower.includes("backend")) profileKey = "backend";
    else if (labelLower.includes("yapay zeka") || labelLower.includes("ai")) profileKey = "ai";
    else if (labelLower.includes("frontend")) profileKey = "frontend";

    const targetKey = `teamflow_demo_notifications_${profileKey}`;
    const row = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem(targetKey) || "[]");
    localStorage.setItem(targetKey, JSON.stringify([row, ...existing]));
    broadcastNotificationsUpdated();
    return row;
  }

  try {
    // Demo dışı (gerçek Backend) ortamında çağrılacak API isteği
    await apiPost("/notifications/send", { target_label: applicantLabel, message });
    broadcastNotificationsUpdated();
  } catch (err) {
    console.error("API Error sending notification to user:", err);
    throw err;
  }
}

export async function fetchNotifications(): Promise<StoredNotification[]> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    return listDemoNotifications();
  }

  try {
    const data = await apiGet("/notifications") as any;
    return data.items || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function markNotificationAsRead(id: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const list = listDemoNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    persistDemoNotifications(list);
    return;
  }

  try {
    await apiPatch(`/notifications/${id}/read`);
    broadcastNotificationsUpdated();
  } catch (err) {
    console.error(err);
  }
}

export async function markAllAsRead() {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const list = listDemoNotifications().map((n) => ({ ...n, read: true }));
    persistDemoNotifications(list);
    return;
  }

  try {
    await apiPatch("/notifications/read-all");
    broadcastNotificationsUpdated();
  } catch (err) {
    console.error(err);
  }
}

export async function deleteNotification(id: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const list = listDemoNotifications().filter((n) => n.id !== id);
    persistDemoNotifications(list);
    return;
  }

  try {
    await apiDelete(`/notifications/${id}`);
    broadcastNotificationsUpdated();
  } catch (err) {
    console.error(err);
  }
}
