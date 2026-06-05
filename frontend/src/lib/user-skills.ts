import { apiGet, apiPatch, apiPost } from "@/lib/api";

export const USER_SKILLS_STORAGE_KEY = "teamflow_user_skills_v1";

export function broadcastSkillsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("teamflow-user-skills"));
}

export async function fetchUserSkills(): Promise<string[]> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    try {
      const raw = localStorage.getItem(USER_SKILLS_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) return p;
      }
    } catch {
      // ignore
    }

    const demoProfile = localStorage.getItem("teamflow_demo_profile");
    if (demoProfile === "frontend") return ["React", "Next.js", "Tailwind CSS"];
    if (demoProfile === "backend") return ["Node.js", "PostgreSQL", "Docker"];
    if (demoProfile === "ai") return ["Python", "PyTorch", "TensorFlow"];

    return [];
  }

  try {
    const data = await apiGet("/me") as any;
    return data.skills || [];
  } catch {
    return [];
  }
}

export async function updateUserSkills(skills: string[]) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    localStorage.setItem(USER_SKILLS_STORAGE_KEY, JSON.stringify(skills));
    broadcastSkillsUpdated();
    return;
  }

  try {
    await apiPatch("/me", { skills });
  } catch (err: any) {
    if (err.message && err.message.includes("bulunamadı")) {
      await apiPost("/me", { displayName: "Kullanıcı", skills });
    } else {
      throw err;
    }
  }
  broadcastSkillsUpdated();
}

export function hasMinimumSkills(skills: string[], minimum = 3): boolean {
  return skills.length >= minimum;
}
