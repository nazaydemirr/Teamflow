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
export async function fetchApplications(): Promise<StoredApplication[]> {
  try {
    const data = await apiGet("/applications") as any;
    if (!data.items) return [];
    
    return data.items.map((item: any) => ({
      id: item.id,
      oppId: item.opp_id,
      oppTitle: item.oppTitle || `İlan ${item.opp_id.substring(0, 6)}`,
      teamName: item.team_name || item.team_id,
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
  

  try {
    await apiPost("/applications/remove-member", { teamId, userId });
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error("Uye cikarma hatasi:", err);
    throw err;
  }
}

export async function addApplication(entry: NewApplicationInput): Promise<StoredApplication | null> {
  

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
  

  try {
    await apiPost(`/applications/${id}/decision`, { decision: action, message });
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function deleteApplication(id: string) {
  try {
    await apiDelete(`/applications/${id}`);
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function hideApplication(id: string) {
  try {
    await apiPatch(`/applications/${id}/hide`);
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error("Başvuru gizlenemedi:", err);
    throw err;
  }
}

export async function deleteApplicationsByOpp(oppId: string) {
  
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
