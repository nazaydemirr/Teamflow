export const USER_SKILLS_STORAGE_KEY = "teamflow_user_skills_v1";

export function broadcastSkillsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("teamflow-user-skills"));
}

/** Firestore uyumu: düz string[] (PRD users.skills). */
export function readStoredSkills(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_SKILLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeStoredSkills(skills: string[]) {
  localStorage.setItem(USER_SKILLS_STORAGE_KEY, JSON.stringify(skills));
  broadcastSkillsUpdated();
}

export function hasMinimumSkills(skills: string[], minimum = 3): boolean {
  return skills.length >= minimum;
}
