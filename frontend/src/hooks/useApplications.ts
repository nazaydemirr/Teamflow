"use client";

import { fetchApplications, type StoredApplication } from "@/lib/applications";
import { getAllOpportunities } from "@/lib/opportunities-data";
import { apiGet } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export function useApplications() {
  const [applications, setApplicationsState] = useState<StoredApplication[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [leaderCount, setLeaderCount] = useState(0);

  const refresh = useCallback(async () => {
    const list = await fetchApplications();
    setApplicationsState(list);
    let lCount = 0;
    if (typeof window !== "undefined") {
      const profileId = localStorage.getItem("teamflow_profile_id") || "";
      let fullName = "Demo Kullanici";
      const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
      if (isDemo) {
        const pType = localStorage.getItem("teamflow_demo_profile");
        if (pType === "frontend") fullName = "Frontend Geliştirici (Demo)";
        else if (pType === "backend") fullName = "Backend Geliştirici (Demo)";
        else if (pType === "ai") fullName = "Yapay Zeka Uzmanı (Demo)";
      } else {
        fullName = localStorage.getItem("teamflow_display_name") || "Kullanıcı";
      }

      if (isDemo) {
        setActiveCount(list.filter((a) => (a.status === "Beklemede" || a.status === "Onaylandi") && a.applicantLabel === fullName).length);

        lCount = 0;
        const opps = getAllOpportunities();
        opps.forEach(opp => {
          if (opp.teams && opp.teams.length > 0) {
            const ledTeams = opp.teams.filter(t => (profileId && t.leader?.id === profileId) || t.leader?.name === fullName);
            lCount += ledTeams.length;
          } else if (opp.author === fullName) {
            lCount += 1;
          }
        });
        setLeaderCount(lCount);
      } else {
        try {
          const meData = await apiGet("/me") as any;
          if (meData && meData.stats) {
            setActiveCount(meData.stats.activeCount || 0);
            setLeaderCount(meData.stats.leaderCount || 0);
          }
        } catch (e) {
          console.error("Failed to fetch /me stats", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    
    window.addEventListener("teamflow-applications", handler);
    return () => {
      window.removeEventListener("teamflow-applications", handler);
    };
  }, [refresh]);

  return { applications, activeCount, leaderCount, refresh };
}
