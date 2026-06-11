import { apiGet, apiPost, apiDelete } from "@/lib/api";

export type ApplicationStatus = "Beklemede" | "Onaylandi" | "Reddedildi" | "Iptal Edildi";

export type StoredApplication = {
  id: string;
  oppId: string;
  oppTitle: string;
  teamName: string;
  applicantLabel: string;
  applicantSkills: string[];
  status: ApplicationStatus;
  appliedAt: string;

  // Profil Ek Bilgileri
  applicantUniversity?: string;
  applicantDepartment?: string;
  applicantClassLevel?: string;
  applicantBio?: string;
  applicantGithub?: string;
  applicantLinkedin?: string;

  // İstatistikler
  statsCompetitionsJoined?: number;
  statsCompetitionsCompleted?: number;
  statsCompetitionsLed?: number;
  statsTeamsCreated?: number;
  statsActiveTeams?: number;
  statsActiveTeamsLed?: number;
  statsActiveTeamsNames?: string[];
  statsLedTeamsNames?: string[];
  statsActiveApplications?: number;
  statsPendingApplications?: boolean;
};

export function broadcastApplicationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("teamflow-applications"));
}

function getStorageKey() {
  return "teamflow_applications_shared_v1";
}

function getPrefilledApplications(): StoredApplication[] {
  const baseApp = {
    appliedAt: new Date().toISOString(),
    applicantUniversity: "Boğaziçi Üniversitesi",
    applicantDepartment: "Bilgisayar Mühendisliği",
    applicantClassLevel: "3. Sınıf",
    applicantBio: "Yazılım geliştirmeye ve yeni teknolojileri keşfetmeye tutkulu.",
    applicantGithub: "https://github.com/demo",
    applicantLinkedin: "https://linkedin.com/in/demo",
    statsCompetitionsJoined: 5,
    statsCompetitionsCompleted: 3,
    statsCompetitionsLed: 2,
    statsTeamsCreated: 2,
    statsActiveTeams: 2,
    statsActiveTeamsLed: 1,
    statsActiveTeamsNames: ["Core", "AI Research"],
    statsLedTeamsNames: ["Core"],
    statsActiveApplications: 1,
    statsPendingApplications: true
  };

  return [
    { 
      ...baseApp, 
      id: "app_f1", 
      oppId: "10", 
      oppTitle: "IoT Akıllı Ev Platformu", 
      teamName: "Backend Team", 
      applicantLabel: "Frontend Geliştirici (Demo)", 
      applicantSkills: ["React", "TypeScript"],
      status: "Beklemede" 
    },
    { 
      ...baseApp, 
      id: "app_a1", 
      oppId: "4", 
      oppTitle: "Açık Kaynak Geliştirici Platformu", 
      teamName: "Proje Ekibi", 
      applicantLabel: "Yapay Zeka Uzmanı (Demo)", 
      applicantSkills: ["Python", "PyTorch"],
      status: "Beklemede" 
    },
    { 
      ...baseApp, 
      id: "app_b1", 
      oppId: "1", 
      oppTitle: "Finansal Veri Analizi", 
      teamName: "Proje Ekibi", 
      applicantLabel: "Backend Geliştirici (Demo)", 
      applicantSkills: ["Node.js", "PostgreSQL"],
      status: "Onaylandi" 
    }
  ];
}

function listDemoApplications(): StoredApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) {
      return getPrefilledApplications();
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
      status: item.status === "pending" ? "Beklemede" : item.status === "approved" ? "Onaylandi" : item.status === "cancelled" ? "Iptal Edildi" : "Reddedildi",
      appliedAt: item.createdAt || new Date().toISOString(),
      leader: item.leader || "-",
      description: item.description || "Bu ilan için açıklama bulunamadı.",
      
      applicantUniversity: item.applicant_university,
      applicantDepartment: item.applicant_department,
      applicantClassLevel: item.applicant_classlevel,
      applicantBio: item.applicant_bio,
      applicantGithub: item.applicant_github,
      applicantLinkedin: item.applicant_linkedin,
      statsActiveTeams: item.stats_active_teams ? parseInt(item.stats_active_teams) : 0,
      statsActiveTeamsLed: item.stats_active_teams_led ? parseInt(item.stats_active_teams_led) : 0,
      statsActiveApplications: item.stats_active_applications ? parseInt(item.stats_active_applications) : 0,
      statsPendingApplications: item.stats_pending_applications === true,
      statsActiveTeamsNames: item.stats_active_teams_names || [],
      statsLedTeamsNames: item.stats_led_teams_names || []
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

export async function addMemberById(teamId: string, userId: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    alert("Demo modunda ID ile üye ekleme desteklenmemektedir.");
    return null;
  }

  try {
    const data = await apiPost("/applications/add-member", { teamId, userId });
    broadcastApplicationsUpdated();
    return data;
  } catch (err) {
    console.error("ID ile uye ekleme hatasi:", err);
    throw err;
  }
}

export async function removeTeamMemberById(teamId: string, userId: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    alert("Demo modunda ekipten üye çıkarma desteklenmemektedir.");
    return;
  }

  try {
    await apiPost("/applications/remove-member", { teamId, userId });
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error("Uye cikarma hatasi:", err);
    throw err;
  }
}

export async function addApplication(entry: NewApplicationInput): Promise<StoredApplication | null> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const activeApplications = listDemoApplications().filter(a => (a.status === "Beklemede" || a.status === "Onaylandi") && a.applicantLabel === entry.applicantLabel).length;
    if (activeApplications >= 3) return null;
    
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

export async function decideApplication(id: string, action: "approve" | "reject", message?: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const list = listDemoApplications().map((a) => (a.id === id ? { ...a, status: (action === "approve" ? "Onaylandi" : "Reddedildi") as ApplicationStatus } : a));
    persistDemoApplications(list);
    return;
  }

  try {
    await apiPost(`/applications/${id}/decision`, { action, message });
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

  try {
    await apiDelete(`/applications/${id}`);
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function deleteApplicationsByOpp(oppId: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const list = listDemoApplications().filter((a) => a.oppId !== oppId);
    persistDemoApplications(list);
    return;
  }
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
