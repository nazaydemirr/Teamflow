export type ApplicationStatus = "Beklemede" | "Onaylandi" | "Reddedildi";

export type StoredApplication = {
  id: string;
  oppId: string;
  oppTitle: string;
  teamName: string;
  applicantLabel: string;
  applicantSkills: string[];
  status: ApplicationStatus;
  appliedAt: string;
};

const STORAGE_KEY = "teamflow_applications_v1";

export function broadcastApplicationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("teamflow-applications"));
}

export function listApplications(): StoredApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredApplication => {
      const a = item as Partial<StoredApplication>;
      return (
        typeof a.id === "string" &&
        typeof a.oppId === "string" &&
        typeof a.teamName === "string" &&
        typeof a.status === "string"
      );
    });
  } catch {
    return [];
  }
}

function persist(list: StoredApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  broadcastApplicationsUpdated();
}

/** AC.03 — aktif: bekleyen + onaylı (reddedilmiş sayılmaz). */
export function countActiveApplications(): number {
  return listApplications().filter((a) => a.status === "Beklemede" || a.status === "Onaylandi").length;
}

export function hasApplicationForTeam(oppId: string, teamName: string): boolean {
  return listApplications().some((a) => a.oppId === oppId && a.teamName === teamName && a.status !== "Reddedildi");
}

export type NewApplicationInput = {
  oppId: string;
  oppTitle: string;
  teamName: string;
  applicantLabel: string;
  applicantSkills: string[];
};

export function addApplication(entry: NewApplicationInput): StoredApplication | null {
  const active = countActiveApplications();
  if (active >= 3) return null;
  if (hasApplicationForTeam(entry.oppId, entry.teamName)) return null;

  const row: StoredApplication = {
    ...entry,
    status: "Beklemede",
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    appliedAt: new Date().toISOString(),
  };
  persist([...listApplications(), row]);
  return row;
}

export function setApplicationStatus(id: string, status: ApplicationStatus) {
  const list = listApplications().map((a) => (a.id === id ? { ...a, status } : a));
  persist(list);
}

export async function tryBrowserNotify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
    return;
  }
  if (Notification.permission !== "denied") {
    const p = await Notification.requestPermission();
    if (p === "granted") new Notification(title, { body });
  }
}
