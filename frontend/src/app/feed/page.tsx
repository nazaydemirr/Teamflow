"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenu } from "@/components/MobileMenu";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateOpportunityModal } from "@/components/CreateOpportunityModal";
import { CreateTeamModal } from "@/components/CreateTeamModal";
import { MemberProfileModal } from "@/components/MemberProfileModal";
import { updateOpportunity } from "@/lib/opportunities-data";
import { apiPost } from "@/lib/api";
import type { Opportunity, Team } from "@/hooks/useOpportunitiesFeed";
import { useOpportunitiesFeed } from "@/hooks/useOpportunitiesFeed";
import { useApplications } from "@/hooks/useApplications";
import { useUserSkills } from "@/hooks/useUserSkills";
import {
  addApplication,
  tryBrowserNotify,
} from "@/lib/applications";
import { intersectionMatchPercent } from "@/lib/match-score";
import { hasMinimumSkills } from "@/lib/user-skills";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

const filterCategories = [
  { id: "bitirme-projesi", label: "Bitirme Projesi" },
  { id: "hackathon", label: "Hackathon" },
  { id: "yarisma", label: "Yarışma" },
];

const filterTech = [
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" },
  { id: "angular", label: "Angular" },
  { id: "nodejs", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "go", label: "Go" },
  { id: "ruby", label: "Ruby" },
  { id: "php", label: "PHP" },
  { id: "aws", label: "AWS" },
  { id: "docker", label: "Docker" },
  { id: "kubernetes", label: "Kubernetes" },
  { id: "firebase", label: "Firebase" },
  { id: "mongodb", label: "MongoDB" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "mysql", label: "MySQL" },
  { id: "ai", label: "AI" },
  { id: "machinelearning", label: "Machine Learning" },
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
  if (haystack.includes("hackathon")) return "hackathon";
  if (haystack.includes("yarisma") || haystack.includes("yarışma")) return "yarisma";
  if (haystack.includes("proje") || haystack.includes("mvp") || haystack.includes("bitirme")) return "bitirme-projesi";
  return "hackathon";
}

function parseTurkishDeadline(deadline: string) {
  if (!deadline) return null;
  // If it's already a valid date string (e.g. ISO string), use it directly
  const d = new Date(deadline);
  if (!isNaN(d.getTime())) {
    return d;
  }

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

export function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    }
  } catch {}
  return dateStr;
}

type FilterPanelProps = {
  categoryState: Record<string, boolean>;
  techState: Record<string, boolean>;
  quickDateFilter: QuickDateFilter;
  customDateStart: string;
  customDateEnd: string;
  onToggleCategory: (categoryId: string, checked: boolean) => void;
  onSetTechState: (next: Record<string, boolean>) => void;
  onSetQuickDateFilter: (next: QuickDateFilter) => void;
  onSetCustomDateStart: (val: string) => void;
  onSetCustomDateEnd: (val: string) => void;
  onClearFilters: () => void;
};

function FilterPanel({
  categoryState,
  techState,
  quickDateFilter,
  customDateStart,
  customDateEnd,
  onToggleCategory,
  onSetTechState,
  onSetQuickDateFilter,
  onSetCustomDateStart,
  onSetCustomDateEnd,
  onClearFilters,
}: FilterPanelProps) {
  const selectedTech = Object.entries(techState)
    .filter(([, isChecked]) => isChecked)
    .map(([id]) => id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Filtreler</h2>
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-[var(--radius-md)] border border-slate-200 dark:border-slate-700/50 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-slate)] dark:text-slate-300 transition-colors hover:border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:bg-white/[0.04] hover:text-[var(--text-navy)] dark:text-slate-100"
        >
          Temizle
        </button>
      </div>

      <div className="tf-feed-inset rounded-[var(--radius-lg)] p-4 shadow-inner shadow-black/20">
        <p className="mb-3 text-xs font-semibold text-[var(--text-slate)] dark:text-slate-300">Kategoriler (Yarisma Tipi)</p>
        <ul className="space-y-2">
          {filterCategories.map((category) => (
            <li key={category.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-slate)] dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(categoryState[category.id])}
                  onChange={(e) => onToggleCategory(category.id, e.target.checked)}
                  className="size-4 rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-[var(--flow-blue)] focus:ring-[var(--ring)]"
                />
                {category.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="tf-feed-inset rounded-[var(--radius-lg)] p-4 shadow-inner shadow-black/20">
        <p className="mb-3 text-xs font-semibold text-[var(--text-slate)] dark:text-slate-300">Teknoloji (Coklu Secim)</p>
        <select
          multiple
          value={selectedTech}
          onChange={(event) => {
            const selected = new Set(Array.from(event.target.selectedOptions, (option) => option.value));
            onSetTechState(
              Object.fromEntries(filterTech.map((tech) => [tech.id, selected.has(tech.id)])),
            );
          }}
          className="h-32 w-full rounded-[var(--radius-md)] border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 p-2 text-sm text-[var(--text-navy)] dark:text-slate-100 outline-none ring-0 focus:border-[var(--flow-blue)]"
        >
          {filterTech.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">Ctrl/Cmd ile birden fazla secim yapabilirsiniz.</p>
      </div>

      <div className="tf-feed-inset rounded-[var(--radius-lg)] p-4 shadow-inner shadow-black/20">
        <p className="mb-3 text-xs font-semibold text-[var(--text-slate)] dark:text-slate-300">Tarih Araligi</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {quickDateFilters.map((quickFilter) => {
            const selected = quickDateFilter === quickFilter.id;
            return (
              <button
                key={quickFilter.id}
                type="button"
                onClick={() => {
                  onSetQuickDateFilter(selected ? null : quickFilter.id);
                  onSetCustomDateStart("");
                  onSetCustomDateEnd("");
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[var(--flow-blue)] bg-[var(--flow-blue)]/20 text-[#93c5fd]"
                    : "border-slate-200 dark:border-slate-700/50 text-[var(--text-slate)] dark:text-slate-300 hover:border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:bg-white/[0.04]"
                }`}
              >
                {quickFilter.label}
              </button>
            );
          })}
        </div>
        
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-700/50 pt-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Veya Özel Aralık</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-slate-500 mb-1.5 block font-medium">Başlangıç</label>
              <input 
                type="date" 
                value={customDateStart || ""}
                onChange={(e) => {
                  onSetCustomDateStart(e.target.value);
                  onSetQuickDateFilter(null);
                }}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-[var(--text-navy)] dark:text-slate-200 outline-none transition-colors focus:border-[var(--flow-blue)]" 
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1.5 block font-medium">Bitiş</label>
              <input 
                type="date" 
                value={customDateEnd || ""}
                onChange={(e) => {
                  onSetCustomDateEnd(e.target.value);
                  onSetQuickDateFilter(null);
                }}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-[var(--text-navy)] dark:text-slate-200 outline-none transition-colors focus:border-[var(--flow-blue)]" 
              />
            </div>
          </div>
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
        <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-5 w-20 shrink-0 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="mb-3 flex items-center gap-2">
        <div className="size-8 shrink-0 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-3">
        <div className="h-3 w-32 rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
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
          ? "flex items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-700 dark:text-emerald-400"
          : isMid
            ? "flex items-center justify-center rounded-full border border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-700 dark:text-amber-400"
            : "flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-300"
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
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [localTeams, setLocalTeams] = useState(opp.teams);
  const [profileId, setProfileId] = useState("");
  const [currentUserFullName, setCurrentUserFullName] = useState("");

  useEffect(() => {
    setProfileId(localStorage.getItem("teamflow_profile_id") || "");
    const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
    if (isDemo) {
      const pType = localStorage.getItem("teamflow_demo_profile");
      if (pType === "frontend") setCurrentUserFullName("Frontend Geliştirici (Demo)");
      else if (pType === "backend") setCurrentUserFullName("Backend Geliştirici (Demo)");
      else if (pType === "ai") setCurrentUserFullName("Yapay Zeka Uzmanı (Demo)");
      else setCurrentUserFullName("Demo Kullanici");
    } else {
      setCurrentUserFullName(localStorage.getItem("teamflow_display_name") || "");
    }
  }, []);

  useEffect(() => {
    setLocalTeams(opp.teams);
  }, [opp.teams]);

  const handleCreateTeamSuccess = async (newTeam: Team) => {
    if (localTeams.some(t => t.name.toLowerCase() === newTeam.name.toLowerCase())) {
      alert("Bu isimde bir takım zaten var.");
      return;
    }
    
    let finalTeam = newTeam;
    const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
    if (!isDemo) {
      try {
        const res = await apiPost("/teams", {
          opp_id: opp.id,
          name: newTeam.name,
          description: newTeam.description,
          rolesNeeded: newTeam.rolesNeeded,
          technologies: newTeam.technologies,
          level: newTeam.level,
          communication: newTeam.communication,
          full: newTeam.full,
          membersMax: newTeam.membersMax
        }) as any;
        finalTeam = { ...newTeam, id: res.id };
      } catch (err: any) {
        alert("Takım oluşturulurken hata: " + err.message);
        return;
      }
    }

    const updatedTeams = [...localTeams, finalTeam];
    setLocalTeams(updatedTeams);
    updateOpportunity(opp.id, { teams: updatedTeams });
    setIsTeamModalOpen(false);
  };

  const kontenjanKalan = Math.max(0, opp.membersMax - opp.membersCurrent);
  const effectiveType = opp.type || inferCategory(opp.title, opp.tags);
  const isBitirme = effectiveType === "bitirme-projesi";

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3 sticky top-0 bg-[var(--surface)] z-10 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-[var(--flow-blue)]">
          İlan Detayları
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="mb-6">
        <div className="mb-2">
          <span className="inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[var(--flow-blue)] bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
            {effectiveType === "hackathon" ? "Hackathon" : effectiveType === "yarisma" ? "Yarışma" : "Bitirme Projesi"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-2xl font-bold text-[var(--text-navy)] dark:text-slate-100">{opp.title}</h3>
          <MatchBadge percent={matchPercent} />
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 dark:text-slate-400 mb-5">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-100 dark:border-rose-500/20">
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Son Başvuru: {formatDisplayDate(opp.deadline)}
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert prose-sm mb-6 max-w-none">
          <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">{opp.description}</p>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[var(--text-navy)] dark:text-slate-200 mb-3 flex items-center gap-2">
            <svg className="size-4 text-[var(--flow-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            İstenen Teknolojiler
          </h4>
          <div className="flex flex-wrap gap-2">
            {opp.tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {!isBitirme && (opp.rules || opp.prize) && (
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {opp.rules && (
              <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Yarışma Kuralları
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 whitespace-pre-wrap">{opp.rules}</p>
              </div>
            )}
            {opp.prize && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                  Ödül Bilgileri
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300/80 whitespace-pre-wrap">{opp.prize}</p>
              </div>
            )}
          </div>
        )}

        {!isBitirme && (
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-[#0c1118] shadow-sm mb-8">
            <div className="flex-1">
              <h4 className="text-base font-bold text-[var(--text-navy)] dark:text-slate-100 mb-1">Kendi Takımını Kur</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Aradığın takımı bulamadın mı? Liderliği eline al ve kendi takımını kur.</p>
            </div>
            <button 
              onClick={() => setIsTeamModalOpen(true)} 
              className="shrink-0 bg-[var(--flow-blue)] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Takım Oluştur
            </button>
          </div>
        )}
      </div>

      {isBitirme && localTeams.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <h4 className="text-lg font-bold text-[var(--text-navy)] dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 size-8 flex items-center justify-center rounded-lg">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </span>
            Proje Ekibi
          </h4>
          
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            {localTeams[0].leader && (
              <div className="mb-6">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Proje Lideri</h5>
                <div className="flex items-center justify-between bg-white dark:bg-[#0c1118] p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="size-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-sm font-bold ring-2 ring-blue-50 dark:ring-blue-900/20">
                      {localTeams[0].leader.initials}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{localTeams[0].leader.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Lider / {localTeams[0].leader.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMember(localTeams[0].leader)} className="text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                    Profili Gör
                  </button>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Ekip Üyeleri</h5>
              {(!localTeams[0].members || localTeams[0].members.length === 0) ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Henüz projeye katılan başka bir üye bulunmuyor.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {localTeams[0].members?.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-[#0c1118] p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="size-10 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center text-sm font-bold ring-2 ring-slate-50 dark:ring-slate-800/50">
                          {m.initials}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{m.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{m.role}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedMember(m)} className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                        Profili Gör
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {localTeams[0].rolesNeeded && localTeams[0].rolesNeeded.length > 0 && (
              <div className="mb-6">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Ekipte İhtiyaç Duyulan Roller</h5>
                <div className="flex flex-wrap gap-2">
                  {localTeams[0].rolesNeeded.map(role => (
                    <span key={role} className="text-xs font-semibold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              {(() => {
                const team = localTeams[0];
                const isActualOwner = Boolean(profileId && team.leader?.id === profileId);
                const isMember = Boolean(team.members?.some(m => profileId && m.id === profileId));
                const joined = joinedTeams.has(team.id || "");
                const blockedByCap = atApplicationCap && !joined && !isMember;
                const disabled = joined || isMember || blockedByCap || isActualOwner;

                return (
                  <button
                    title={blockedByCap ? "En fazla 3 takımda üye olabilir veya bekleyen başvuruya sahip olabilirsiniz." : undefined}
                    onClick={() => {
                      if (blockedByCap) {
                        alert("En fazla 3 takımda üye olabilir veya bekleyen başvuruya sahip olabilirsiniz.");
                        return;
                      }
                      !disabled && onJoinTeam(team.id || "");
                    }}
                    disabled={disabled}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
                      isActualOwner
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-not-allowed"
                        : (joined || isMember)
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-not-allowed"
                        : disabled
                        ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed"
                        : "bg-[var(--flow-blue)] text-white hover:brightness-110 active:scale-95"
                    }`}
                  >
                    {isActualOwner ? "Proje Sahibisin" : isMember ? "Zaten Üyesin" : joined ? "Başvuruldu" : blockedByCap ? "Limit Doldu" : "Projeye Başvur"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {!isBitirme && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <h4 className="text-lg font-bold text-[var(--text-navy)] dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 size-8 flex items-center justify-center rounded-lg">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </span>
            Aktif Takımlar
          </h4>

          {localTeams.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Henüz bir takım kurulmamış. İlk takımı sen kur!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
            {localTeams.map((team) => {
              const isActualOwner = Boolean(profileId && team.leader?.id === profileId);
              const isMember = Boolean(team.members?.some(m => profileId && m.id === profileId));
              const joined = joinedTeams.has(team.id || "");
              const blockedByCap = atApplicationCap && !joined && !isMember;
              const missingSlots = team.membersMax && team.membersCurrent !== undefined ? team.membersMax - team.membersCurrent : null;
              const isFull = team.full || (missingSlots !== null && missingSlots <= 0);
              const disabled = isFull || joined || isMember || blockedByCap || isActualOwner;

              return (
                <div key={team.id || team.name} className="bg-white dark:bg-[#0c1118] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h5 className="text-lg font-bold text-[var(--text-navy)] dark:text-slate-100 flex items-center gap-2 mb-1">
                        {team.name}
                        {isFull ? (
                          <span className="text-[10px] bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-200 dark:border-red-500/20">Dolu</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">Aktif</span>
                        )}
                      </h5>
                      <div className="flex items-center gap-3 text-[13px] text-slate-500">
                        {team.leader && (
                          <span>Lider: <span className="font-semibold text-slate-700 dark:text-slate-300">{team.leader.name}</span></span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          {team.membersCurrent ?? 0}/{team.membersMax ?? "?"} Kişi
                        </span>
                        <button
                          title={blockedByCap ? "En fazla 3 takımda üye olabilir veya bekleyen başvuruya sahip olabilirsiniz." : undefined}
                          onClick={() => {
                            if (blockedByCap) {
                              alert("En fazla 3 takımda üye olabilir veya bekleyen başvuruya sahip olabilirsiniz.");
                              return;
                            }
                            !disabled && onJoinTeam(team.id || "");
                          }}
                          disabled={isFull || joined || isActualOwner}
                          className={`hidden sm:block shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            isActualOwner
                              ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed"
                              : (joined || isMember)
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-not-allowed"
                              : disabled
                              ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed"
                              : "bg-[var(--flow-blue)] text-white hover:brightness-110 active:scale-95"
                          }`}
                        >
                          {isActualOwner ? (isBitirme ? "Proje Sahibisin" : "Kaptansın") : isMember ? "Zaten Üyesin" : joined ? "Başvuruldu" : isFull ? "Dolu" : blockedByCap ? "Limit Doldu" : (isBitirme ? "Projeye Başvur" : "Takıma Katıl")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobil Görünüm */}
                  <div className="flex sm:hidden flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedMember(team.leader)} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[var(--flow-blue)] transition-colors">
                        <span className="grid size-5 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">L</span> Lideri Gör
                      </button>
                    </div>
                    <button
                      title={blockedByCap ? "En fazla 3 takımda üye olabilir veya bekleyen başvuruya sahip olabilirsiniz." : undefined}
                      onClick={() => {
                        if (blockedByCap) {
                          alert("En fazla 3 takımda üye olabilir veya bekleyen başvuruya sahip olabilirsiniz.");
                          return;
                        }
                        !disabled && onJoinTeam(team.id || "");
                      }}
                      disabled={isFull || joined || isActualOwner}
                      className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                        isActualOwner
                          ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed"
                          : joined
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : isFull || blockedByCap
                          ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed"
                          : "bg-[var(--flow-blue)] text-white hover:brightness-110 active:scale-95"
                      }`}
                    >
                      {isActualOwner ? (isBitirme ? "Proje Sahibisin" : "Kaptansın") : joined ? "Başvuruldu" : isFull ? "Dolu" : blockedByCap ? "Limit Doldu" : (isBitirme ? "Başvur" : "Katıl")}
                    </button>
                  </div>

                  {team.rolesNeeded && team.rolesNeeded.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aranan Roller</p>
                      <div className="flex flex-wrap gap-2">
                        {team.rolesNeeded.map(role => (
                          <span key={role} className="text-xs font-semibold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Mevcut Üyeler</p>
                    {(!team.leader && (!team.members || team.members.length === 0)) ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 ml-1 italic pb-1">Bu takımda henüz kayıtlı bir üye bulunmuyor.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {team.leader && (
                          <div className="flex items-center justify-between bg-white dark:bg-[#0c1118] p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2.5">
                              <span className="size-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-xs font-bold ring-2 ring-blue-50 dark:ring-blue-900/20">
                                {team.leader.initials}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{team.leader.name}</p>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Lider / {team.leader.role}</p>
                              </div>
                            </div>
                            <button onClick={() => setSelectedMember(team.leader)} className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md transition-colors">
                              Detayları Gör
                            </button>
                          </div>
                        )}
                        {team.members?.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-[#0c1118] p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="size-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center text-xs font-bold ring-2 ring-slate-50 dark:ring-slate-800/50">
                              {m.initials}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{m.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{m.role}</p>
                            </div>
                          </div>
                          <button onClick={() => setSelectedMember(m)} className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md transition-colors">
                            Detayları Gör
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      )}

      <MemberProfileModal 
        isOpen={!!selectedMember} 
        onClose={() => setSelectedMember(null)} 
        member={selectedMember} 
      />

      <CreateTeamModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)}
        onSuccess={handleCreateTeamSuccess}
      />
    </div>
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
  const { applications, activeCount, leaderCount } = useApplications();

  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryState, setCategoryState] = useState<Record<string, boolean>>({});
  const [techState, setTechState] = useState<Record<string, boolean>>({});
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateFilter>(null);
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [currentUserFullName, setCurrentUserFullName] = useState("Oturum kullanicisi");
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    setProfileId(localStorage.getItem("teamflow_profile_id") || "");
  }, []);

  useEffect(() => {
    const isDemo = typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true";
    if (isDemo) {
      const pType = localStorage.getItem("teamflow_demo_profile");
      if (pType === "frontend") setCurrentUserFullName("Frontend Geliştirici (Demo)");
      else if (pType === "backend") setCurrentUserFullName("Backend Geliştirici (Demo)");
      else if (pType === "ai") setCurrentUserFullName("Yapay Zeka Uzmanı (Demo)");
      else setCurrentUserFullName("Demo Kullanici");
    } else if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("teamflow_display_name");
      if (savedName) {
        setCurrentUserFullName(savedName);
      }
    }
  }, []);

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
    if (skills.length === 0) {
      const qs = searchParams.toString();
      const ret = qs ? `/feed?${qs}` : "/feed";
      router.replace(`/onboarding?return=${encodeURIComponent(ret)}`);
    }
  }, [skills, skillsHydrated, router, searchParams]);

  const filteredOpportunities = useMemo(() => {
    const now = new Date();
    // Günü sıfırlayalım, sadece tarih bazlı kıyaslama yapmak daha doğru olabilir (opsiyonel)
    now.setHours(0, 0, 0, 0);

    return opportunities.filter((opportunity) => {
      const oppDeadline = parseTurkishDeadline(opportunity.deadline);
      // Deadline geçmişse akışta gösterme (bugün bitenler ve geçmiş olanlar görünmemeli)
      if (oppDeadline && oppDeadline.getTime() <= new Date().getTime()) {
        return false;
      }

      if (activeCategories.length > 0) {
        const inferredCategory = opportunity.type || inferCategory(opportunity.title, opportunity.tags);
        if (!activeCategories.includes(inferredCategory)) return false;
      }

      if (activeTech.length > 0) {
        const normalizedTags = opportunity.tags.map((tag) => tag.toLocaleLowerCase("tr-TR"));
        const containsAnySelectedTech = activeTech.some((tech) => normalizedTags.includes(tech));
        if (!containsAnySelectedTech) return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLocaleLowerCase("tr-TR");
        const tTitle = (opportunity.title || "").toLocaleLowerCase("tr-TR");
        const tAuthor = (opportunity.author || "").toLocaleLowerCase("tr-TR");
        const tTags = opportunity.tags || [];

        if (
          !tTitle.includes(q) &&
          !tAuthor.includes(q) &&
          !tTags.some((tag) => tag.toLocaleLowerCase("tr-TR").includes(q))
        ) {
          return false;
        }
      }

      if (customDateStart || customDateEnd) {
        // Özel aralık: createdAt üzerinden (eğer yoksa fallback olarak şu anki zaman kabul edilebilir veya deadline, ama gerçek db'de var)
        const createDateStr = opportunity.createdAt || opportunity.deadline;
        const oppCreatedAt = new Date(createDateStr);
        if (isNaN(oppCreatedAt.getTime())) return false;
        
        if (customDateStart) {
          const start = new Date(customDateStart);
          start.setHours(0, 0, 0, 0);
          if (oppCreatedAt < start) return false;
        }
        if (customDateEnd) {
          const end = new Date(customDateEnd);
          end.setHours(23, 59, 59, 999);
          if (oppCreatedAt > end) return false;
        }
        return true;
      }

      if (!quickDateFilter) return true;

      // Deadline yaklaşanlar: deadline üzerinden (önümüzdeki 3 gün içinde)
      if (quickDateFilter === "upcoming-deadline") {
        const deadlineDate = parseTurkishDeadline(opportunity.deadline);
        if (!deadlineDate) return false;
        const diffDays = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 3;
      }

      // Son 1 hafta ve Bu ay: createdAt üzerinden
      const createDateStr = opportunity.createdAt || new Date().toISOString(); 
      const oppCreatedAt = new Date(createDateStr);
      if (isNaN(oppCreatedAt.getTime())) return false;
      const createdDiffDays = Math.ceil((now.getTime() - oppCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

      if (quickDateFilter === "last-week") return createdDiffDays >= 0 && createdDiffDays <= 7;
      if (quickDateFilter === "this-month") return createdDiffDays >= 0 && createdDiffDays <= 30; // Son 1 ay
      
      return true;
      return true;
    });
  }, [activeCategories, activeTech, opportunities, quickDateFilter, customDateStart, customDateEnd, searchQuery]);

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
    setCustomDateStart("");
    setCustomDateEnd("");
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

  const myApplications = useMemo(() => {
    const isDemo = typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true";
    if (!isDemo) return applications;
    return applications.filter(a => a.applicantLabel === "Teamflow Kullanici" || a.applicantLabel === "Demo kullanici" || a.applicantLabel === currentUserFullName);
  }, [applications, currentUserFullName]);

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
      myApplications
        .filter((a) => a.oppId === selectedOpportunity.id && a.status !== "Reddedildi" && a.status !== "Iptal Edildi")
        .map((a) => a.teamName),
    );
  }, [myApplications, selectedOpportunity]);

  const atApplicationCap = activeCount >= 3;

  const handleJoinTeam = useCallback(
    async (teamId: string) => {
      if (!selectedOpportunity) return;
      if (atApplicationCap) {
        alert("Maksimum ekip üyeliği limitine ulaştınız. Bir kullanıcı aynı anda en fazla 3 ekipte yer alabilir. Bu nedenle yeni bir takıma başvuru yapamazsınız.");
        return;
      }
      if (myApplications.some(a => a.oppId === selectedOpportunity.id && a.teamName === teamId && a.status !== "Reddedildi" && a.status !== "Iptal Edildi")) return;

      if (selectedOpportunity.author === currentUserFullName) {
        alert("Kendi oluşturduğunuz ilana veya takıma başvuru yapamazsınız.");
        return;
      }
      
      const targetTeam = selectedOpportunity.teams?.find((t) => t.name === teamId || t.id === teamId);
      if (targetTeam?.leader?.name === currentUserFullName) {
        alert("Lideri olduğunuz takıma başvuru yapamazsınız.");
        return;
      }

      const row = await addApplication({
        oppId: selectedOpportunity.id,
        oppTitle: selectedOpportunity.title,
        teamName: teamId,
        applicantLabel: currentUserFullName,
        applicantSkills: skills,
      });
      if (!row) {
        alert("Başvuru yapılamadı. Kotanızı doldurmuş olabilirsiniz.");
        return;
      }

      void tryBrowserNotify("Teamflow", "Basvurunuz kaydedildi. Onay bekleniyor.");
      alert("Başvurunuz başarıyla kaydedildi! Lider onayı bekleniyor.");

      queueMicrotask(() => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
          void Notification.requestPermission();
        }
      });
    },
    [selectedOpportunity, skills, atApplicationCap, currentUserFullName, myApplications],
  );

  const handleDirectJoin = async (opp: Opportunity, teamName: string) => {
    if (atApplicationCap) {
      alert("Maksimum ekip üyeliği limitine ulaştınız. Bir kullanıcı aynı anda en fazla 3 ekipte yer alabilir. Bu nedenle yeni bir takıma başvuru yapamazsınız.");
      return;
    }
    if (myApplications.some(a => a.oppId === opp.id && a.teamName === teamName && a.status !== "Reddedildi" && a.status !== "Iptal Edildi")) {
      alert("Bu projeye zaten başvurdunuz.");
      return;
    }

    if (opp.author === currentUserFullName) {
      alert("Kendi oluşturduğunuz ilana veya takıma başvuru yapamazsınız.");
      return;
    }
    
    const targetTeam = opp.teams?.find((t) => t.name === teamName || t.id === teamName);
    if (targetTeam?.leader?.name === currentUserFullName) {
      alert("Lideri olduğunuz takıma başvuru yapamazsınız.");
      return;
    }

    const row = await addApplication({
      oppId: opp.id,
      oppTitle: opp.title,
      teamName,
      applicantLabel: currentUserFullName,
      applicantSkills: skills,
    });
    if (row) {
      void tryBrowserNotify("Teamflow", "Başvurunuz kaydedildi. Onay bekleniyor.");
      alert("Başvurunuz başarıyla kaydedildi!");
    }
  };

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
      <SiteHeader
        activeTab="feed"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        currentUserFullName={currentUserFullName}
      />

      <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        {/* Sol: Filtreler (desktop) */}
        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <FilterPanel
            categoryState={categoryState}
            techState={techState}
            quickDateFilter={quickDateFilter}
            customDateStart={customDateStart}
            customDateEnd={customDateEnd}
            onToggleCategory={(categoryId, checked) =>
              setCategoryState((prev) => ({ ...prev, [categoryId]: checked }))
            }
            onSetTechState={setTechState}
            onSetQuickDateFilter={setQuickDateFilter}
            onSetCustomDateStart={setCustomDateStart}
            onSetCustomDateEnd={setCustomDateEnd}
            onClearFilters={clearFilters}
          />
        </aside>

        {/* Orta: Fırsat kartları */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-[var(--font-fraunces)] text-2xl font-light text-[var(--text-navy)] dark:text-slate-100 md:text-[28px] md:leading-[1.2]">
              Fırsat Akışı
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(true)}
                className="rounded-[var(--radius-md)] border border-slate-200 dark:border-slate-700/50 bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-slate)] dark:text-slate-300 transition-colors hover:border-slate-300 dark:border-slate-600 hover:text-[var(--text-navy)] dark:text-slate-100 md:hidden"
              >
                Filtrele
              </button>
              <button
                type="button"
                aria-label="Grid View"
                onClick={() => setViewMode("grid")}
                className={`rounded-[var(--radius-md)] p-2 transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97] ${
                  viewMode === "grid"
                    ? "bg-[var(--flow-blue)] text-white shadow-md shadow-blue-500/25"
                    : "border border-slate-200 dark:border-slate-700/50 bg-[var(--surface)] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:border-slate-600 hover:text-[var(--text-navy)] dark:text-slate-100"
                }`}
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="List View"
                onClick={() => setViewMode("list")}
                className={`rounded-[var(--radius-md)] p-2 transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97] ${
                  viewMode === "list"
                    ? "bg-[var(--flow-blue)] text-white shadow-md shadow-blue-500/25"
                    : "border border-slate-200 dark:border-slate-700/50 bg-[var(--surface)] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:border-slate-600 hover:text-[var(--text-navy)] dark:text-slate-100"
                }`}
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">Opportunity Cards</p>

          {loadError ? (
            <div className="rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p className="mb-2">{loadError}</p>
              <button
                type="button"
                onClick={() => void retry()}
                className="rounded-[var(--radius-md)] bg-slate-200 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
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
              : displayOpportunities.map((opp, i) => {
                  const isSelected = opp.id === selectedOppId;
                  const effectiveType = opp.type || inferCategory(opp.title, opp.tags);
                  const isBitirme = effectiveType === "bitirme-projesi";

                  return (
                    <div
                      key={`${opp.id}-${i}`}
                      className={`tf-feed-card w-full flex flex-col transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:-translate-y-0.5 hover:shadow-xl ${
                        isSelected ? "tf-feed-card-selected ring-2 ring-[var(--flow-blue)]" : "border border-slate-200 dark:border-slate-800"
                      } bg-white dark:bg-[#0c1118] rounded-2xl overflow-hidden`}
                    >
                      <button
                        type="button"
                        onClick={() => selectOpportunityCard(opp.id)}
                        className="text-left flex-1 w-full flex flex-col justify-start p-5"
                      >
                        <div className="mb-2">
                          <span className="inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[var(--flow-blue)] bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                            {effectiveType === "hackathon" ? "Hackathon" : effectiveType === "yarisma" ? "Yarışma" : "Bitirme Projesi"}
                          </span>
                        </div>
                        <div className="w-full flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-bold text-[var(--text-navy)] dark:text-slate-100">{opp.title}</h3>
                          <MatchBadge percent={opp.matchPercent} />
                        </div>
                        
                        {opp.description && (
                          <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                            {opp.description}
                          </p>
                        )}
                        
                        <div className="w-full mb-4 flex flex-wrap gap-1.5">
                          {opp.tags.map((tag, tagIndex) => (
                            <span
                              key={`${tag}-${tagIndex}`}
                              className="rounded-md bg-slate-100 dark:bg-white/[0.06] px-2 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-white/[0.01]">
                        <div className="flex flex-wrap gap-4 text-[12px] font-medium text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDisplayDate(opp.deadline)}
                          </span>
                          {!isBitirme && opp.teams && (
                            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {opp.teams.length} Aktif Takım
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
                          {opp.teams?.some(t => profileId && t.leader?.id === profileId) ? (
                            <button onClick={() => router.push("/profil")} className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:brightness-110 transition-all active:scale-95">
                              {isBitirme ? "Proje Sahibisin" : "Kaptansın (Takımı Yönet)"}
                            </button>
                          ) : (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); selectOpportunityCard(opp.id); }} className="bg-white dark:bg-[#0c1118] text-[var(--flow-blue)] border border-slate-200 dark:border-slate-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95">
                                {isBitirme ? "Projeyi İncele" : "Takımları Gör"}
                              </button>
                              {!isBitirme && (
                                <button onClick={(e) => { e.stopPropagation(); selectOpportunityCard(opp.id); /* Team modal handled in details */ }} className="bg-[var(--flow-blue)] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md hover:brightness-110 transition-all active:scale-95">
                                  Takım Oluştur
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            {loadingMore && opportunities.length > 0
              ? Array.from({ length: viewMode === "grid" ? 2 : 1 }, (_, i) => (
                  <OpportunityCardSkeleton key={`more-sk-${i}`} viewMode={viewMode} />
                ))
              : null}
          </div>

          {loadingMore && opportunities.length > 0 ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400" aria-live="polite">
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
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">Filtrelere uygun ilan bulunamadi.</p>
          ) : null}

          {!initialLoading && !hasMore && opportunities.length > 0 ? (
            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">Tüm fırsatlar yüklendi</p>
          ) : null}
        </section>

        {/* Mobil: Filtre bottom-sheet */}
        {isFilterSheetOpen ? (
          <div
            className="fixed inset-0 z-40 flex items-end bg-black/65 backdrop-blur-[2px] md:hidden"
            onClick={() => setIsFilterSheetOpen(false)}
          >
            <div
              className="tf-feed-sheet w-full max-h-[90vh] rounded-t-2xl border border-slate-300 dark:border-slate-600 p-4 shadow-2xl shadow-black/50 flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-center shrink-0">
                <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="mb-4 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-semibold text-[var(--text-navy)] dark:text-slate-100">Filtrele</h3>
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="rounded-[var(--radius-md)] border border-slate-200 dark:border-slate-700/50 px-2.5 py-1 text-xs font-semibold text-[var(--text-slate)] dark:text-slate-300 hover:bg-slate-100 dark:bg-white/[0.05]"
                >
                  Kapat
                </button>
              </div>
              <div className="overflow-y-auto pb-6">
                <FilterPanel
                  categoryState={categoryState}
                  techState={techState}
                  quickDateFilter={quickDateFilter}
                  customDateStart={customDateStart}
                  customDateEnd={customDateEnd}
                  onToggleCategory={(categoryId, checked) =>
                    setCategoryState((prev) => ({ ...prev, [categoryId]: checked }))
                  }
                  onSetTechState={setTechState}
                  onSetQuickDateFilter={setQuickDateFilter}
                  onSetCustomDateStart={setCustomDateStart}
                  onSetCustomDateEnd={setCustomDateEnd}
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
              className="fixed inset-0 z-[55] bg-black/55 backdrop-blur-[2px]"
            />
            {/* >=768px: ortalanmış modal */}
            <div className="fixed inset-0 z-[60] hidden items-center justify-center md:flex pointer-events-none p-4">
              <aside
                className={`pointer-events-auto flex w-full max-w-[560px] max-h-[85vh] flex-col rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0c1118] shadow-2xl shadow-black/40 ${
                  detailPanelEntered ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
                } transition-all duration-300 ease-out`}
                role="dialog"
                aria-label="İlan detayı"
              >
                <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                  <div className="rounded-[var(--radius-lg)] border border-slate-200 dark:border-slate-700/50 bg-[var(--surface)] p-5 shadow-lg shadow-black/30">
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
            </div>
            {/* <768px: bottom-sheet */}
            <div
              className="fixed inset-0 z-[60] flex items-end bg-black/55 backdrop-blur-[2px] md:hidden"
              onClick={closeDetailPanel}
              role="presentation"
            >
              <div
                className={`tf-feed-sheet relative max-h-[85vh] w-full rounded-t-2xl border border-slate-300 dark:border-slate-600 p-4 pb-8 shadow-2xl shadow-black/50 ${
                  detailPanelEntered ? "translate-y-0" : "translate-y-full"
                } transition-transform duration-300 ease-out`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="İlan detayı"
              >
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
                  <div className="rounded-[var(--radius-lg)] border border-slate-200 dark:border-slate-700/50 bg-[var(--surface)] p-5 shadow-lg shadow-black/30">
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

        {/* Floating Action Button for Create Opportunity */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex items-center gap-2 bg-[var(--flow-blue)] text-white p-4 md:px-5 md:py-4 rounded-full md:rounded-xl shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:shadow-[0_8px_40px_rgb(37,99,235,0.6)] hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="md:bg-white/20 rounded-lg md:p-1 group-hover:rotate-90 transition-transform duration-300">
            <svg className="size-6 md:size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="hidden md:inline font-semibold tracking-wide">Fırsat Oluştur</span>
        </button>

        <CreateOpportunityModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            setIsCreateModalOpen(false);
            void retry();
          }} 
        />
      </div>
    </div>
  );
}

function FeedSkeletonHeader() {
  return (
    <div className="tf-feed">
      <header className="tf-feed-header sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center px-4 sm:px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="h-8 max-w-xs animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-slate-100 dark:bg-white/[0.06] ring-1 ring-slate-200 dark:ring-white/10" />
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
