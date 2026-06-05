import { apiGet, apiPost } from "@/lib/api";

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

export function broadcastApplicationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("teamflow-applications"));
}

function getStorageKey() {
  if (typeof window === "undefined") return "teamflow_applications_v1";
  const profile = localStorage.getItem("teamflow_demo_profile");
  if (profile) return `teamflow_apps_${profile}`;
  return "teamflow_applications_v1";
}

function getPrefilledApplications(profile: string): StoredApplication[] {
  let applicantLabel = "Demo Kullanici";
  let prefill: StoredApplication[] = [];
  const baseApp = {
    status: "Onaylandi" as ApplicationStatus,
    appliedAt: new Date().toISOString()
  };

  if (profile === "frontend") {
    applicantLabel = "Frontend Geliştirici (Demo)";
    prefill = [
      { ...baseApp, id: "app_f1", oppId: "3", oppTitle: "Eğitim Platformu MVP", teamName: "Core", applicantLabel, applicantSkills: ["React"] },
      { ...baseApp, id: "app_f2", oppId: "9", oppTitle: "İç Dokümantasyon Portalı", teamName: "DX", applicantLabel, applicantSkills: ["Next.js"] }
    ];
  } else if (profile === "backend") {
    applicantLabel = "Backend Geliştirici (Demo)";
    prefill = [
      { ...baseApp, id: "app_b1", oppId: "5", oppTitle: "Mobil Ödeme SDK Entegrasyonu", teamName: "Mobile", applicantLabel, applicantSkills: ["Node.js"] },
      { ...baseApp, id: "app_b2", oppId: "11", oppTitle: "Tedarik Zinciri Takip MVP", teamName: "Ops", applicantLabel, applicantSkills: ["PostgreSQL"] }
    ];
  } else if (profile === "ai") {
    applicantLabel = "Yapay Zeka Uzmanı (Demo)";
    prefill = [
      { ...baseApp, id: "app_a1", oppId: "4", oppTitle: "Açık Kaynak Dokümantasyon Asistanı", teamName: "ML Modeli", applicantLabel, applicantSkills: ["Python"] },
      { ...baseApp, id: "app_a2", oppId: "12", oppTitle: "Yapısal Tasarım Asistanı (CAD)", teamName: "Research", applicantLabel, applicantSkills: ["PyTorch"] }
    ];
  }
  return prefill;
}

function listDemoApplications(): StoredApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) {
      const profile = localStorage.getItem("teamflow_demo_profile");
      if (profile) return getPrefilledApplications(profile);
      return [];
    }
    return JSON.parse(raw) as StoredApplication[];
  } catch {
    return [];
  }
}


function persistDemoApplications(list: StoredApplication[]) {
  localStorage.setItem(getStorageKey(), JSON.stringify(list));
  broadcastApplicationsUpdated();
}

export async function fetchApplications(): Promise<StoredApplication[]> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    return listDemoApplications();
  }
  
  try {
    const data = await apiGet("/applications") as any;
    if (!data.items) return [];
    
    return data.items.map((item: any) => ({
      id: item.id,
      oppId: item.opp_id,
      oppTitle: item.oppTitle || `İlan ${item.opp_id.substring(0, 6)}`,
      teamName: item.team_id,
      applicantLabel: item.applicant_label || "",
      applicantSkills: item.applicant_skills || [],
      status: item.status === "pending" ? "Beklemede" : item.status === "approved" ? "Onaylandi" : "Reddedildi",
      appliedAt: item.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export type NewApplicationInput = {
  oppId: string;
  oppTitle: string;
  teamName: string;
  applicantLabel: string;
  applicantSkills: string[];
};

export async function addApprovedMember(entry: NewApplicationInput) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const row: StoredApplication = {
      ...entry,
      status: "Onaylandi",
      id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      appliedAt: new Date().toISOString(),
    };
    persistDemoApplications([...listDemoApplications(), row]);
    return row;
  }

  console.log("Mock addApprovedMember:", entry);
  // Backend doesn't support leaders adding members directly yet in MVP
  // For now, this is a stub.
  return null;
}

export async function addApplication(entry: NewApplicationInput): Promise<StoredApplication | null> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const active = listDemoApplications().filter(a => a.status !== "Reddedildi").length;
    if (active >= 3) return null;
    
    const row: StoredApplication = {
      ...entry,
      status: "Beklemede",
      id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      appliedAt: new Date().toISOString(),
    };
    persistDemoApplications([...listDemoApplications(), row]);
    return row;
  }

  try {
    const data = await apiPost("/applications", {
      opp_id: entry.oppId,
      team_id: entry.teamName,
      applicant_label: entry.applicantLabel,
      applicant_skills: entry.applicantSkills,
    }) as any;
    broadcastApplicationsUpdated();
    return {
      id: data.id,
      oppId: entry.oppId,
      oppTitle: entry.oppTitle,
      teamName: entry.teamName,
      applicantLabel: entry.applicantLabel,
      applicantSkills: entry.applicantSkills,
      status: "Beklemede",
      appliedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function decideApplication(id: string, action: "approve" | "reject") {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const list = listDemoApplications().map((a) => (a.id === id ? { ...a, status: (action === "approve" ? "Onaylandi" : "Reddedildi") as ApplicationStatus } : a));
    persistDemoApplications(list);
    return;
  }

  try {
    await apiPost(`/applications/${id}/decision`, { action });
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function deleteApplication(id: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const list = listDemoApplications().filter((a) => a.id !== id);
    persistDemoApplications(list);
    return;
  }

  // Not implemented in MVP backend, just log it
  console.log(`Delete application ${id} not supported in MVP backend`);
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
