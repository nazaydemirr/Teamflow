"use client";

import { getOpportunitiesPage, type OpportunitiesPage, type Opportunity } from "@/lib/opportunities-data";
import { apiGet } from "@/lib/api";
import { env } from "@/lib/env";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type { Opportunity, OpportunitiesPage } from "@/lib/opportunities-data";

const DEFAULT_LIMIT = 12;
const LOAD_MORE_THRESHOLD = 0.8;

async function fetchOpportunitiesPage(cursor: string | null, limit = DEFAULT_LIMIT): Promise<OpportunitiesPage> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getOpportunitiesPage(limit, cursor));
      }, 50); // Simulate network latency
    });
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  const path = (env.apiBaseUrl || "").trim() ? `/opportunities?${qs}` : `/api/opportunities?${qs}`;
  return apiGet(path) as Promise<OpportunitiesPage>;
}

export function useOpportunitiesFeed() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Eşzamanlı veya zincir içi çift isteği önlemek için senkron kilit */
  const fetchLockedRef = useRef(false);

  /** hasMore güncellenmeden tetiklenebilecek scroll için ref */
  const hasMoreRef = useRef(false);

  const hasMore = useMemo(() => nextCursor !== null, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    let cancelled = false;

    async function initial() {
      if (fetchLockedRef.current) return;
      fetchLockedRef.current = true;
      setInitialLoading(true);
      setLoadError(null);
      try {
        const page = await fetchOpportunitiesPage(null);
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Yükleme hatası");
      } finally {
        fetchLockedRef.current = false;
        if (!cancelled) setInitialLoading(false);
      }
    }

    void initial();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (fetchLockedRef.current || !hasMoreRef.current || nextCursor === null) return;

    fetchLockedRef.current = true;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const page = await fetchOpportunitiesPage(nextCursor);
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Devam yükleme hatası");
    } finally {
      fetchLockedRef.current = false;
      setLoadingMore(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    function maybeLoadMore() {
      if (!hasMoreRef.current || fetchLockedRef.current) return;
      const doc = document.documentElement;
      const viewport = doc.clientHeight;
      const scrollHeight = doc.scrollHeight;
      const fillsViewport = scrollHeight <= viewport + 2;
      const progress = scrollHeight > 0 ? (doc.scrollTop + viewport) / scrollHeight : 0;
      if (fillsViewport || progress >= LOAD_MORE_THRESHOLD) void loadMore();
    }

    window.addEventListener("scroll", maybeLoadMore, { passive: true });
    return () => window.removeEventListener("scroll", maybeLoadMore);
  }, [loadMore]);

  /** İçerik viewport’u doldurmuyorsa (kısa liste) scroll olmadan sonraki sayfayı çek */
  useEffect(() => {
    if (initialLoading || loadingMore || !hasMoreRef.current) return;
    const id = requestAnimationFrame(() => {
      if (!hasMoreRef.current || fetchLockedRef.current) return;
      const doc = document.documentElement;
      if (doc.scrollHeight <= doc.clientHeight + 2) void loadMore();
    });
    return () => cancelAnimationFrame(id);
  }, [items, initialLoading, loadingMore, loadMore]);

  const isFetching = initialLoading || loadingMore;

  return {
    opportunities: items,
    initialLoading,
    loadingMore,
    isFetching,
    loadError,
    hasMore,
    retry: async () => {
      if (fetchLockedRef.current) return;
      fetchLockedRef.current = true;
      setLoadError(null);
      setInitialLoading(true);
      try {
        const page = await fetchOpportunitiesPage(null);
        setItems(page.items);
        setNextCursor(page.nextCursor);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Yükleme hatası");
      } finally {
        fetchLockedRef.current = false;
        setInitialLoading(false);
      }
    },
  };
}
