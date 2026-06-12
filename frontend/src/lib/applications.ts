import { apiGet, apiPost, apiDelete, apiPatch } from "@/lib/api";

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
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    try {
      const demoApps = localStorage.getItem("teamflow_demo_applications");
      if (demoApps) {
        return JSON.parse(demoApps);
      }
    } catch {}
    return [];
  }

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
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    const newApp: StoredApplication = {
      id: "demo-" + Math.random().toString(36).substring(2, 9),
      oppId: entry.oppId,
      oppTitle: entry.oppTitle,
      teamName: entry.teamName,
      applicantLabel: entry.applicantLabel,
      applicantSkills: entry.applicantSkills,
      status: "Beklemede",
      appliedAt: new Date().toISOString()
    };
    try {
      const existing = localStorage.getItem("teamflow_demo_applications");
      const list = existing ? JSON.parse(existing) : [];
      list.push(newApp);
      localStorage.setItem("teamflow_demo_applications", JSON.stringify(list));
    } catch {}
    broadcastApplicationsUpdated();
    return newApp;
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
    try {
      const existing = localStorage.getItem("teamflow_demo_applications");
      if (existing) {
        const list = JSON.parse(existing);
        let targetApp = list.find((a: any) => a.id === id);

        if (action === "approve" && targetApp) {
           const { getAllOpportunities, updateOpportunity } = await import("@/lib/opportunities-data");
           const allOpps = getAllOpportunities();
           const oppIdToFind = targetApp.oppId || targetApp.opp_id;
           const opp = allOpps.find((o: any) => o.id === oppIdToFind);
           if (opp && opp.teams) {
              const teamName = targetApp.teamName || targetApp.team_name;
              const teamIndex = opp.teams.findIndex((t: any) => t.name === teamName);
              if (teamIndex !== -1) {
                 const t = opp.teams[teamIndex];
                 if (t.membersMax && t.membersCurrent && t.membersCurrent >= t.membersMax) {
                    throw new Error("Takım kapasitesi dolu. Daha fazla üye kabul edemezsiniz.");
                 }
                 if (!t.members) t.members = [];
                 if (!t.members.find((m: any) => m.name === targetApp.applicantLabel)) {
                     t.membersCurrent = (t.membersCurrent || 0) + 1;
                     t.members.push({
                        id: "usr-" + Math.random().toString(36).slice(2, 8),
                        name: targetApp.applicantLabel,
                        initials: targetApp.applicantLabel.substring(0, 2).toUpperCase(),
                        role: "Üye",
                     });
                     updateOpportunity(opp.id, { teams: opp.teams });
                 }
              }
           }
        }

        const mapped = list.map((a: any) => a.id === id ? { ...a, status: action === "approve" ? "Onaylandi" : "Reddedildi" } : a);
        localStorage.setItem("teamflow_demo_applications", JSON.stringify(mapped));
      }
    } catch (err: any) {
      if (err.message && err.message.includes("kapasite")) throw err;
    }
    broadcastApplicationsUpdated();
    return;
  }

  try {
    await apiPost(`/applications/${id}/decision`, { decision: action, message });
    broadcastApplicationsUpdated();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function deleteApplication(id: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    try {
      const existing = localStorage.getItem("teamflow_demo_applications");
      if (existing) {
        const list = JSON.parse(existing);
        const filtered = list.filter((a: any) => a.id !== id);
        localStorage.setItem("teamflow_demo_applications", JSON.stringify(filtered));
      }
    } catch {}
    broadcastApplicationsUpdated();
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

export async function hideApplication(id: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    try {
      const existing = localStorage.getItem("teamflow_demo_applications");
      if (existing) {
        const list = JSON.parse(existing);
        const filtered = list.filter((a: any) => a.id !== id);
        localStorage.setItem("teamflow_demo_applications", JSON.stringify(filtered));
      }
    } catch {}
    broadcastApplicationsUpdated();
    return;
  }
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
