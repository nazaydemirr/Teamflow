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
    if (typeof window !== "undefined") {
      if (localStorage.getItem("teamflow_demo_auth") === "true") {
        setActiveCount(list.length);
        setLeaderCount(0);
        return;
      }
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
