"use client";

import { countActiveApplications, listApplications, type StoredApplication } from "@/lib/applications";
import { useCallback, useEffect, useState } from "react";

export function useApplications() {
  const [applications, setApplicationsState] = useState<StoredApplication[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  const refresh = useCallback(() => {
    setApplicationsState(listApplications());
    setActiveCount(countActiveApplications());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "teamflow_applications_v1") refresh();
    };
    window.addEventListener("teamflow-applications", handler);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("teamflow-applications", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return { applications, activeCount, refresh };
}
