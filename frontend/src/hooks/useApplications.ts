"use client";

import { fetchApplications, type StoredApplication } from "@/lib/applications";
import { useCallback, useEffect, useState } from "react";

export function useApplications() {
  const [applications, setApplicationsState] = useState<StoredApplication[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  const refresh = useCallback(async () => {
    const list = await fetchApplications();
    setApplicationsState(list);
    setActiveCount(list.filter((a) => a.status === "Beklemede" || a.status === "Onaylandi").length);
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    
    window.addEventListener("teamflow-applications", handler);
    return () => {
      window.removeEventListener("teamflow-applications", handler);
    };
  }, [refresh]);

  return { applications, activeCount, refresh };
}
