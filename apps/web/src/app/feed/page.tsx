"use client";

import type { Opportunity } from "@/hooks/useOpportunitiesFeed";
import { useOpportunitiesFeed } from "@/hooks/useOpportunitiesFeed";
import { useApplications } from "@/hooks/useApplications";
import { useUserSkills } from "@/hooks/useUserSkills";
import {
  addApplication,
  hasApplicationForTeam,
  tryBrowserNotify,
} from "@/lib/applications";
import { intersectionMatchPercent } from "@/lib/match-score";
import { hasMinimumSkills } from "@/lib/user-skills";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

const filterCategories = [
  { id: "teknofest", label: "TEKNOFEST" },
  { id: "hackathon", label: "Hackathon" },
  { id: "bitirme-projesi", label: "Bitirme Projesi" },
  { id: "staj", label: "Staj" },
];

const filterTech = [
  { id: "react", label: "React" },
  { id: "python", label: "Python" },
  { id: "ai", label: "AI" },
  { id: "nextjs", label: "Next.js" },
  { id: "nodejs", label: "Node.js" },
  { id: "firebase", label: "Firebase" },
];

const quickDateFilters = [
  { id: "last-week", label: "Son 1 hafta" },
  { id: "this-month", label: "Bu ay" },
  { id: "upcoming-deadline", label: "Deadline yaklaşanlar" },
] as const;

type QuickDateFilter = (typeof quickDateFilters)[number]["id"] | null;

function normalizeText(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

function inferCategory(opportunityTitle: string, opportunityTags: string[]) {
  const haystack = `${opportunityTitle} ${opportunityTags.join(" ")}`.toLocaleLowerCase("tr-TR");
  if (haystack.includes("teknofest")) return "teknofest";
  if (haystack.includes("hackathon")) return "hackathon";
  if (haystack.includes("staj") || haystack.includes("intern")) return "staj";
  if (haystack.includes("proje") || haystack.includes("mvp")) return "bitirme-projesi";
  return "hackathon";
}

function parseTurkishDeadline(deadline: string) {
  const monthMap: Record<string, number> = {
    ocak: 0,
    subat: 1,
    "şubat": 1,
    mart: 2,
    nisan: 3,
    mayis: 4,
    "mayıs": 4,
    haziran: 5,
    temmuz: 6,
    agustos: 7,
    "ağustos": 7,
    eylul: 8,
    "eylül": 8,
    ekim: 9,
    kasim: 10,
    "kasım": 10,
    aralik: 11,
    "aralık": 11,
  };
  const parts = deadline.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const day = Number.parseInt(parts[0] ?? "", 10);
  const month = monthMap[normalizeText(parts[1] ?? "")];
  if (!Number.isFinite(day) || month === undefined) return null;
  const currentYear = new Date().getFullYear();
  return new Date(currentYear, month, day, 23, 59, 59);
}

type FilterPanelProps = {
  categoryState: Record<string, boolean>;
  techState: Record<string, boolean>;
  quickDateFilter: QuickDateFilter;
  onToggleCategory: (categoryId: string, checked: boolean) => void;
  onSetTechState: (next: Record<string, boolean>) => void;
  onSetQuickDateFilter: (next: QuickDateFilter) => void;
  onClearFilters: () => void;
};

function FilterPanel({
  categoryState,
  techState,
  quickDateFilter,
  onToggleCategory,
  onSetTechState,
  onSetQuickDateFilter,
  onClearFilters,
}: FilterPanelProps) {
  const selectedTech = Object.entries(techState)
    .filter(([, isChecked]) => isChecked)
    .map(([id]) => id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--night-text-dim)]">Filtreler</h2>
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-[var(--radius-md)] border border-[var(--night-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--night-text-secondary)] transition-colors hover:border-[var(--night-border-strong)] hover:bg-white/[0.04] hover:text-[var(--night-text)]"
        >
          Temizle
        </button>
      </div>

      <div className="tf-feed-inset rounded-[var(--radius-lg)] p-4 shadow-inner shadow-black/20">
        <p className="mb-3 text-xs font-semibold text-[var(--night-text-secondary)]">Kategoriler (Yarisma Tipi)</p>
        <ul className="space-y-2">
          {filterCategories.map((category) => (
            <li key={category.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--night-text-secondary)]">
                <input
                  type="checkbox"
                  checked={Boolean(categoryState[category.id])}
                  onChange={(e) => onToggleCategory(category.id, e.target.checked)}
                  className="size-4 rounded border-[var(--night-border-strong)] bg-[var(--night-input)] text-[var(--flow-blue)] focus:ring-[var(--ring)]"
                />
                {category.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="tf-feed-inset rounded-[var(--radius-lg)] p-4 shadow-inner shadow-black/20">
        <p className="mb-3 text-xs font-semibold text-[var(--night-text-secondary)]">Teknoloji (Coklu Secim)</p>
        <select
          multiple
          value={selectedTech}
          onChange={(event) => {
            const selected = new Set(Array.from(event.target.selectedOptions, (option) => option.value));
            onSetTechState(
              Object.fromEntries(filterTech.map((tech) => [tech.id, selected.has(tech.id)])),
            );
          }}
          className="h-32 w-full rounded-[var(--radius-md)] border border-[var(--night-border)] bg-[var(--night-input)] p-2 text-sm text-[var(--night-text)] outline-none ring-0 focus:border-[var(--flow-blue)]"
        >
          {filterTech.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[11px] text-[var(--night-text-dim)]">Ctrl/Cmd ile birden fazla secim yapabilirsiniz.</p>
      </div>

      <div className="tf-feed-inset rounded-[var(--radius-lg)] p-4 shadow-inner shadow-black/20">
        <p className="mb-3 text-xs font-semibold text-[var(--night-text-secondary)]">Tarih Araligi</p>
        <div className="flex flex-wrap gap-2">
          {quickDateFilters.map((quickFilter) => {
            const selected = quickDateFilter === quickFilter.id;
            return (
              <button
                key={quickFilter.id}
                type="button"
                onClick={() => onSetQuickDateFilter(selected ? null : quickFilter.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[var(--flow-blue)] bg-[var(--flow-blue)]/20 text-[#93c5fd]"
                    : "border-[var(--night-border)] text-[var(--night-text-secondary)] hover:border-[var(--night-border-strong)] hover:bg-white/[0.04]"
                }`}
              >
                {quickFilter.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OpportunityCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div
      className={`tf-feed-inset w-full rounded-[var(--radius-lg)] p-4 ${
        viewMode === "list" ? "" : "h-full min-h-[200px]"
      } animate-pulse opacity-90`}
      aria-hidden
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="h-4 flex-1 rounded bg-white/10" />
        <div className="h-5 w-20 shrink-0 rounded-full bg-white/10" />
      </div>
      <div className="mb-3 flex items-center gap-2">
        <div className="size-8 shrink-0 rounded-full bg-white/10" />
        <div className="h-3 w-28 rounded bg-white/10" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="h-5 w-14 rounded-full bg-white/10" />
        <div className="h-5 w-16 rounded-full bg-white/10" />
        <div className="h-5 w-12 rounded-full bg-white/10" />
      </div>
      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-3">
        <div className="h-3 w-32 rounded bg-white/10" />
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
    </div>
  );
}

function MatchBadge({ percent }: { percent: number }) {
  const isHigh = percent >= 70;
  const isMid = percent >= 40 && percent < 70;
  return (
    <span
      className={
        isHigh
          ? "rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300"
          : isMid
            ? "rounded-full border border-amber-500/25 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300"
            : "rounded-full border border-[var(--night-border)] bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-[var(--night-text-secondary)]"
      }
    >
      %{percent} Uygun
    </span>
  );
}

function OpportunitySidePanelBody({
  opp,
  onClose,
  matchPercent,
  atApplicationCap,
  joinedTeams,
  onJoinTeam,
}: {
  opp: Opportunity;
  onClose: () => void;
  matchPercent: number;
  atApplicationCap: boolean;
  joinedTeams: Set<string>;
  onJoinTeam: (teamName: string) => void;
}) {
  const kontenjanKalan = Math.max(0, opp.membersMax - opp.membersCurrent);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--night-text-dim)]">
          Side-Panel — PRD G.07–G.09
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[var(--night-border)] bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-[var(--night-text-dim)]">
            Ad-02
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-md)] border border-[var(--night-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--night-text-secondary)] transition-colors hover:bg-white/[0.05]"
          >
            Kapat
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-[var(--font-fraunces)] text-xl font-light text-[var(--night-text)]">{opp.title}</h3>
        <MatchBadge percent={matchPercent} />
      </div>
      <p className="mb-4 text-[13px] text-[var(--night-text-dim)]">
        Lider: <span className="text-[var(--night-text-secondary)]">{opp.author}</span> · Kontenjan:{" "}
        <span className="text-[var(--night-text-secondary)]">
          {opp.membersCurrent}/{opp.membersMax} uyelik · Yaklasik {kontenjanKalan} bos rozet
        </span>
      </p>
      <p className="mb-6 text-[15px] leading-relaxed text-[var(--night-text-secondary)]">{opp.description}</p>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--night-text-dim)]">Ekipler</p>
      <ul className="mb-6 space-y-3">
        {opp.teams.map((team) => {
          const joined = joinedTeams.has(team.name);
          const blockedByCap = atApplicationCap && !joined;
          const disabled = team.full || joined || blockedByCap;
          let title: string | undefined;
          if (team.full) title = "Bu birim dolu";
          else if (joined) title = "Bu takima zaten basvurdunuz";
          else if (blockedByCap) title = "Limit Dolu";

          return (
            <li key={team.name} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[var(--night-text)]">{team.name}</span>
              <div className="flex flex-col items-start gap-1">
                {team.full ? (
                  <>
                    <button
                      type="button"
                      disabled
                      title="Limit Dolu"
                      className="cursor-not-allowed rounded-[var(--radius-md)] bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-500"
                    >
                      Katıl
                    </button>
                    <span className="text-[11px] font-medium text-[#ef4444]">Birim Limit Dolu</span>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={disabled}
                      title={title}
                      onClick={() => onJoinTeam(team.name)}
                      className="rounded-[var(--radius-md)] bg-[var(--flow-blue)] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] enabled:active:scale-[0.97] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                    >
                      Katıl
                    </button>
                    {joined ? (
                      <span className="text-[11px] font-medium text-emerald-400">Basvuru kayitli</span>
                    ) : null}
                    {blockedByCap ? (
                      <span className="text-[11px] font-medium text-[#ef4444]">
                        Aktif basvuru limiti (PRD AC.03)
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--night-text-dim)]">Üyeler</p>
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--night-border)] bg-[var(--night-surface)] p-3 shadow-inner shadow-black/20">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-sm font-semibold text-white ring-1 ring-white/10">
          MT
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--night-text)]">Mohenet T</p>
          <p className="text-[11px] text-[var(--night-text-dim)]">decomatarayer</p>
        </div>
      </div>

      <div className="mt-8 flex justify-end text-[var(--night-text-dim)]" aria-hidden>
        <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.2h7.6l-6 4.6 2.3 7.2L12 16.4l-6.3 4.6 2.3-7.2-6-4.6h7.6L12 2z" />
        </svg>
      </div>
    </>
  );
}

function FeedPageInner() {
  const {
    opportunities,
    initialLoading,
    loadingMore,
    loadError,
    hasMore,
    retry,
  } = useOpportunitiesFeed();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { skills, hydrated: skillsHydrated } = useUserSkills();
  const { applications, activeCount } = useApplications();

  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryState, setCategoryState] = useState<Record<string, boolean>>({});
  const [techState, setTechState] = useState<Record<string, boolean>>({});
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateFilter>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const activeCategories = useMemo(
    () =>
      filterCategories
        .filter((category) => Boolean(categoryState[category.id]))
        .map((category) => category.id),
    [categoryState],
  );

  const activeTech = useMemo(
    () =>
      filterTech
        .filter((tech) => Boolean(techState[tech.id]))
        .map((tech) => tech.label.toLocaleLowerCase("tr-TR")),
    [techState],
  );

  useEffect(() => {
    if (!skillsHydrated) return;
    if (!hasMinimumSkills(skills, 3)) {
      const qs = searchParams.toString();
      const ret = qs ? `/feed?${qs}` : "/feed";
      router.replace(`/onboarding?return=${encodeURIComponent(ret)}`);
    }
  }, [skills, skillsHydrated, router, searchParams]);

  const filteredOpportunities = useMemo(() => {
    const now = new Date();
    return opportunities.filter((opportunity) => {
      if (activeCategories.length > 0) {
        const inferredCategory = inferCategory(opportunity.title, opportunity.tags);
        if (!activeCategories.includes(inferredCategory)) return false;
      }

      if (activeTech.length > 0) {
        const normalizedTags = opportunity.tags.map((tag) => tag.toLocaleLowerCase("tr-TR"));
        const containsAnySelectedTech = activeTech.some((tech) => normalizedTags.includes(tech));
        if (!containsAnySelectedTech) return false;
      }

      if (!quickDateFilter) return true;
      const deadlineDate = parseTurkishDeadline(opportunity.deadline);
      if (!deadlineDate) return false;
      const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (quickDateFilter === "last-week") return diffDays >= 0 && diffDays <= 7;
      if (quickDateFilter === "this-month") return deadlineDate.getMonth() === now.getMonth();
      if (quickDateFilter === "upcoming-deadline") return diffDays >= 0 && diffDays <= 14;
      return true;
    });
  }, [activeCategories, activeTech, opportunities, quickDateFilter]);

  /** AC.01 — yüzdelik eslesme profil yeteneklerinden yeniden hesaplanir ve listelenir. */
  const displayOpportunities = useMemo(() => {
    const enriched = filteredOpportunities.map((opp) => ({
      ...opp,
      matchPercent: intersectionMatchPercent(skills, opp.tags),
    }));
    enriched.sort((a, b) => b.matchPercent - a.matchPercent || a.title.localeCompare(b.title, "tr"));
    return enriched;
  }, [filteredOpportunities, skills]);

  function clearFilters() {
    setCategoryState({});
    setTechState({});
    setQuickDateFilter(null);
  }

  useLayoutEffect(() => {
    setSelectedOppId(searchParams.get("oppId"));
  }, [searchParams]);

  useEffect(() => {
    const param = searchParams.get("oppId");
    if (!param || initialLoading || opportunities.length === 0) return;
    if (!opportunities.some((o) => o.id === param)) {
      router.replace("/feed", { scroll: false });
    }
  }, [searchParams, opportunities, initialLoading, router]);

  const selectedOpportunity = useMemo(() => {
    if (!selectedOppId) return null;
    return opportunities.find((o) => o.id === selectedOppId) ?? null;
  }, [opportunities, selectedOppId]);

  const selectedDisplay = useMemo(() => {
    if (!selectedOpportunity) return null;
    return (
      displayOpportunities.find((o) => o.id === selectedOpportunity.id) ?? {
        ...selectedOpportunity,
        matchPercent: intersectionMatchPercent(skills, selectedOpportunity.tags),
      }
    );
  }, [displayOpportunities, selectedOpportunity, skills]);

  const joinedTeamsForSelected = useMemo(() => {
    if (!selectedOpportunity) return new Set<string>();
    return new Set(
      applications
        .filter((a) => a.oppId === selectedOpportunity.id && a.status !== "Reddedildi")
        .map((a) => a.teamName),
    );
  }, [applications, selectedOpportunity]);

  const atApplicationCap = activeCount >= 3;

  const handleJoinTeam = useCallback(
    (teamName: string) => {
      if (!selectedOpportunity || atApplicationCap) return;
      if (hasApplicationForTeam(selectedOpportunity.id, teamName)) return;

      const row = addApplication({
        oppId: selectedOpportunity.id,
        oppTitle: selectedOpportunity.title,
        teamName,
        applicantLabel:
          typeof localStorage !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true"
            ? "Demo kullanici"
            : "Oturum kullanicisi",
        applicantSkills: skills,
      });
      if (!row) return;

      void tryBrowserNotify("Teamflow", "Basvurunuz kaydedildi. Onay bekleniyor.");

      queueMicrotask(() => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
          void Notification.requestPermission();
        }
      });
    },
    [selectedOpportunity, skills, atApplicationCap],
  );

  const detailPanelOpen = Boolean(selectedOppId && selectedOpportunity);

  const [detailPanelEntered, setDetailPanelEntered] = useState(false);
  useEffect(() => {
    if (!detailPanelOpen) {
      setDetailPanelEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setDetailPanelEntered(true));
    return () => cancelAnimationFrame(id);
  }, [detailPanelOpen, selectedOppId]);

  const closeDetailPanel = useCallback(() => {
    router.replace("/feed", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!detailPanelOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetailPanel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detailPanelOpen, closeDetailPanel]);

  const selectOpportunityCard = useCallback(
    (oppId: string) => {
      setSelectedOppId(oppId);
      router.push(`/feed?oppId=${encodeURIComponent(oppId)}`, { scroll: false });
    },
    [router],
  );

  if (!skillsHydrated) {
    return <FeedSkeletonHeader />;
  }

  return (
    <div className="tf-feed">
      {/* Üst navigasyon */}
      <header className="tf-feed-header sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-[var(--flow-blue)] text-sm font-bold text-white shadow-md shadow-blue-500/20 ring-1 ring-white/10">
                T
              </span>
              <span className="font-[var(--font-fraunces)] text-lg font-light tracking-tight text-[var(--night-text)]">
                TeamFlow
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <span className="border-b-2 border-[var(--flow-blue)] pb-1 text-[var(--night-text)]">Feed</span>
              <Link
                href="/"
                className="text-[var(--night-text-secondary)] transition-colors duration-[var(--duration)] hover:text-[var(--night-text)]"
              >
                Landing
              </Link>
              <Link
                href="/profil"
                className="text-[var(--night-text-secondary)] transition-colors duration-[var(--duration)] hover:text-[var(--night-text)]"
              >
                Profil
              </Link>
              <Link
                href="/lider/basvurular"
                className="text-[var(--night-text-secondary)] transition-colors duration-[var(--duration)] hover:text-[var(--night-text)]"
              >
                Lider paneli
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--night-border)] text-[var(--night-text-secondary)] transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97] hover:border-[var(--night-border-strong)] hover:bg-white/[0.05]"
              aria-label="Ara"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link
              href="/profil"
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--night-border)] px-2 py-1.5 pr-3 transition-colors hover:border-[var(--night-border-strong)] hover:bg-white/[0.04]"
            >
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-xs font-semibold text-white ring-1 ring-white/10">
                MT
              </span>
              <span className="hidden text-sm font-medium text-[var(--night-text)] sm:inline">Mihneel T</span>
              <svg className="size-4 text-[var(--night-text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        {/* Sol: Filtreler (desktop) */}
        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <FilterPanel
            categoryState={categoryState}
            techState={techState}
            quickDateFilter={quickDateFilter}
            onToggleCategory={(categoryId, checked) =>
              setCategoryState((prev) => ({ ...prev, [categoryId]: checked }))
            }
            onSetTechState={setTechState}
            onSetQuickDateFilter={setQuickDateFilter}
            onClearFilters={clearFilters}
          />
        </aside>

        {/* Orta: Fırsat kartları */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-[var(--font-fraunces)] text-2xl font-light text-[var(--night-text)] md:text-[28px] md:leading-[1.2]">
              Fırsat Akışı
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(true)}
                className="rounded-[var(--radius-md)] border border-[var(--night-border)] bg-[var(--night-card)] px-3 py-1.5 text-xs font-semibold text-[var(--night-text-secondary)] transition-colors hover:border-[var(--night-border-strong)] hover:text-[var(--night-text)] md:hidden"
              >
                Filtrele
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-semibold transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97] ${
                  viewMode === "grid"
                    ? "bg-[var(--flow-blue)] text-white shadow-md shadow-blue-500/25"
                    : "border border-[var(--night-border)] bg-[var(--night-card)] text-[var(--night-text-dim)] hover:border-[var(--night-border-strong)] hover:text-[var(--night-text)]"
                }`}
              >
                Grid View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-semibold transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97] ${
                  viewMode === "list"
                    ? "bg-[var(--flow-blue)] text-white shadow-md shadow-blue-500/25"
                    : "border border-[var(--night-border)] bg-[var(--night-card)] text-[var(--night-text-dim)] hover:border-[var(--night-border-strong)] hover:text-[var(--night-text)]"
                }`}
              >
                List View
              </button>
            </div>
          </div>
          <p className="mb-4 text-xs text-[var(--night-text-dim)]">Opportunity Cards</p>

          {loadError ? (
            <div className="rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p className="mb-2">{loadError}</p>
              <button
                type="button"
                onClick={() => void retry()}
                className="rounded-[var(--radius-md)] bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
              >
                Tekrar dene
              </button>
            </div>
          ) : null}

          <div
            className={
              viewMode === "grid"
                ? "grid gap-6 sm:grid-cols-2"
                : "flex flex-col gap-6"
            }
          >
            {initialLoading && opportunities.length === 0
              ? Array.from({ length: 4 }, (_, i) => (
                  <OpportunityCardSkeleton key={`sk-${i}`} viewMode={viewMode} />
                ))
              : displayOpportunities.map((opp) => {
                  const isSelected = opp.id === selectedOppId;
                  return (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => selectOpportunityCard(opp.id)}
                      className={`tf-feed-card w-full p-4 text-left transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:-translate-y-0.5 hover:shadow-xl ${
                        isSelected ? "tf-feed-card-selected" : ""
                      }`}
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-[15px] font-semibold leading-snug text-[var(--night-text)]">{opp.title}</h3>
                        <MatchBadge percent={opp.matchPercent} />
                      </div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-full bg-slate-600 text-[11px] font-semibold text-white">
                          {opp.authorInitials}
                        </span>
                        <span className="text-[13px] text-[var(--night-text-secondary)]">{opp.author}</span>
                      </div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {opp.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-[var(--night-text-secondary)] ring-1 ring-[var(--night-border)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-4 border-t border-[var(--night-border)] pt-3 text-[12px] text-[var(--night-text-dim)]">
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Deadline {opp.deadline}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          {opp.membersCurrent}/{opp.membersMax} Üye
                        </span>
                      </div>
                    </button>
                  );
                })}
            {loadingMore && opportunities.length > 0
              ? Array.from({ length: viewMode === "grid" ? 2 : 1 }, (_, i) => (
                  <OpportunityCardSkeleton key={`more-sk-${i}`} viewMode={viewMode} />
                ))
              : null}
          </div>

          {loadingMore && opportunities.length > 0 ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-[var(--night-text-dim)]" aria-live="polite">
              <svg className="size-3.5 shrink-0 animate-spin text-[var(--flow-blue)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Daha fazla fırsat yükleniyor…
            </p>
          ) : null}

          {!initialLoading && displayOpportunities.length === 0 ? (
            <p className="mt-6 text-center text-sm text-[var(--night-text-dim)]">Filtrelere uygun ilan bulunamadi.</p>
          ) : null}

          {!initialLoading && !hasMore && opportunities.length > 0 ? (
            <p className="mt-6 text-center text-xs text-[var(--night-text-dim)]">Tüm fırsatlar yüklendi</p>
          ) : null}
        </section>

        {/* Mobil: Filtre bottom-sheet */}
        {isFilterSheetOpen ? (
          <div
            className="fixed inset-0 z-40 flex items-end bg-black/65 backdrop-blur-[2px] md:hidden"
            onClick={() => setIsFilterSheetOpen(false)}
          >
            <div
              className="tf-feed-sheet w-full rounded-t-2xl border border-[var(--night-border-strong)] p-4 shadow-2xl shadow-black/50"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-[var(--night-border-strong)]" />
              </div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--night-text)]">Filtrele</h3>
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="rounded-[var(--radius-md)] border border-[var(--night-border)] px-2.5 py-1 text-xs font-semibold text-[var(--night-text-secondary)] hover:bg-white/[0.05]"
                >
                  Kapat
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto pb-2">
                <FilterPanel
                  categoryState={categoryState}
                  techState={techState}
                  quickDateFilter={quickDateFilter}
                  onToggleCategory={(categoryId, checked) =>
                    setCategoryState((prev) => ({ ...prev, [categoryId]: checked }))
                  }
                  onSetTechState={setTechState}
                  onSetQuickDateFilter={setQuickDateFilter}
                  onClearFilters={clearFilters}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Detay paneli: md+ sabit yan çekmece, <768px bottom-sheet */}
        {detailPanelOpen && selectedOpportunity && selectedDisplay ? (
          <>
            <button
              type="button"
              aria-label="Detay panelini kapat"
              onClick={closeDetailPanel}
              className="fixed inset-0 z-[44] bg-black/55 backdrop-blur-[2px]"
            />
            {/* >=768px: sağdan kayan panel */}
            <aside
              className={`fixed right-0 top-16 z-[45] hidden h-[calc(100vh-4rem)] w-full max-w-[380px] flex-col border-l border-[var(--night-border-strong)] bg-[var(--night-panel)] shadow-2xl shadow-black/40 md:flex ${
                detailPanelEntered ? "translate-x-0" : "translate-x-full"
              } transition-transform duration-300 ease-out`}
              role="complementary"
              aria-label="İlan detayı"
            >
              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                <div className="rounded-[var(--radius-lg)] border border-[var(--night-border)] bg-[var(--night-card)] p-5 shadow-lg shadow-black/30">
                  <OpportunitySidePanelBody
                    opp={selectedOpportunity}
                    onClose={closeDetailPanel}
                    matchPercent={selectedDisplay.matchPercent}
                    atApplicationCap={atApplicationCap}
                    joinedTeams={joinedTeamsForSelected}
                    onJoinTeam={handleJoinTeam}
                  />
                </div>
              </div>
            </aside>
            {/* <768px: bottom-sheet */}
            <div
              className="fixed inset-0 z-[45] flex items-end bg-black/55 backdrop-blur-[2px] md:hidden"
              onClick={closeDetailPanel}
              role="presentation"
            >
              <div
                className={`tf-feed-sheet relative max-h-[85vh] w-full rounded-t-2xl border border-[var(--night-border-strong)] p-4 pb-8 shadow-2xl shadow-black/50 ${
                  detailPanelEntered ? "translate-y-0" : "translate-y-full"
                } transition-transform duration-300 ease-out`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="İlan detayı"
              >
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--night-border-strong)]" />
                <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
                  <div className="rounded-[var(--radius-lg)] border border-[var(--night-border)] bg-[var(--night-card)] p-5 shadow-lg shadow-black/30">
                    <OpportunitySidePanelBody
                      opp={selectedOpportunity}
                      onClose={closeDetailPanel}
                      matchPercent={selectedDisplay.matchPercent}
                      atApplicationCap={atApplicationCap}
                      joinedTeams={joinedTeamsForSelected}
                      onJoinTeam={handleJoinTeam}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function FeedSkeletonHeader() {
  return (
    <div className="tf-feed">
      <header className="tf-feed-header sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center px-4 sm:px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="h-8 max-w-xs animate-pulse rounded bg-white/10" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-white/[0.06] ring-1 ring-[var(--night-border)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeletonHeader />}>
      <FeedPageInner />
    </Suspense>
  );
}
