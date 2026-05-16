"use client";

import { fetchUserSkills } from "@/lib/user-skills";
import { useCallback, useEffect, useState } from "react";

export function useUserSkills() {
  const [skills, setSkillsState] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const s = await fetchUserSkills();
    setSkillsState(s);
  }, []);

  useEffect(() => {
    refresh().then(() => setHydrated(true));
    
    const onSkills = () => refresh();
    window.addEventListener("teamflow-user-skills", onSkills);
    
    return () => {
      window.removeEventListener("teamflow-user-skills", onSkills);
    };
  }, [refresh]);

  return { skills, hydrated, refresh };
}
