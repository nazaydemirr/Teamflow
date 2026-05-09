"use client";

import { readStoredSkills } from "@/lib/user-skills";
import { useCallback, useEffect, useState } from "react";

export function useUserSkills() {
  const [skills, setSkillsState] = useState<string[]>([]);
  /** İlk client mount'ta localStorage okunana kadar false — feed onboarding kapısı yanlış tetiklenmesin */
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => setSkillsState(readStoredSkills()), []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    const onSkills = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "teamflow_user_skills_v1") refresh();
    };
    window.addEventListener("teamflow-user-skills", onSkills);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("teamflow-user-skills", onSkills);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return { skills, hydrated, refresh };
}
