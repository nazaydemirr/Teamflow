"use client";

import { setApplicationStatus, deleteApplication, tryBrowserNotify, type StoredApplication } from "@/lib/applications";
import { useApplications } from "@/hooks/useApplications";
import { addNotification } from "@/lib/notifications";
import Link from "next/link";
import { useState, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

function SwipeableApplicationRow({
  a,
  act,
  onDelete,
}: {
  a: StoredApplication;
  act: (row: StoredApplication, next: StoredApplication["status"]) => void;
  onDelete: (id: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const canSwipe = a.status !== "Beklemede";

  function handleStart(clientX: number) {
    if (!canSwipe) return;
    startX.current = clientX;
    setIsDragging(true);
  }

  function handleMove(clientX: number) {
    if (!isDragging) return;
    const diff = clientX - startX.current;
    if (diff < 0) {
      setOffset(diff);
    }
  }

  function handleEnd() {
    if (!isDragging) return;
    setIsDragging(false);
    if (offset < -100) {
      onDelete(a.id);
    } else {
      setOffset(0);
    }
  }

  return (
    <tr
      className="border-b border-slate-100 dark:border-white/5 relative cursor-pointer select-none bg-[var(--surface)] hover:bg-[var(--surface-raised)] transition-colors"
      style={{
        transform: `translateX(${offset}px)`,
        transition: isDragging ? "none" : "transform 0.2s ease",
      }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <td className="px-4 py-3 font-medium text-[var(--text-navy)] dark:text-slate-100">{a.oppTitle}</td>
      <td className="px-4 py-3 text-[var(--text-slate)]">{a.teamName}</td>
      <td className="px-4 py-3 text-[var(--text-slate)]">{a.applicantLabel}</td>
      <td className="max-w-[200px] px-4 py-3 text-[var(--text-slate)]">
        <span className="line-clamp-2">{a.applicantSkills.join(", ") || "—"}</span>
      </td>
      <td className="px-4 py-3 text-[var(--text-slate)]">{a.status}</td>
      <td className="flex items-center gap-2 px-4 py-3 relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            act(a, "Onaylandi");
          }}
          disabled={a.status === "Onaylandi"}
          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          Onayla
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            act(a, "Reddedildi");
          }}
          disabled={a.status === "Reddedildi"}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-[var(--text-navy)] dark:border-white/20 dark:text-slate-200 disabled:opacity-40"
        >
          Reddet
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            alert(a.applicantLabel + " isimli kisiye mesajlasma modulu henuz hazirlanmadi.");
          }}
          className="rounded-md bg-[var(--flow-blue)] px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:brightness-110"
        >
          Mesaj
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(a.id);
          }}
          className="ml-1 flex items-center justify-center rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          title="Sil"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {offset < 0 && (
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center bg-red-500 overflow-hidden rounded-r-md"
            style={{
              left: "100%",
              width: `${Math.abs(offset)}px`,
            }}
          >
            {Math.abs(offset) > 40 && (
              <span className="text-white font-bold text-xs tracking-wider">SİL</span>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export default function LeaderApplicationsPage() {
  const { applications, refresh } = useApplications();
  const [toast, setToast] = useState<string | null>(null);

  function act(row: StoredApplication, next: StoredApplication["status"]) {
    setApplicationStatus(row.id, next);
    refresh();
    const msg =
      next === "Onaylandi"
        ? "Basvuran onaylandi (US.03 / US.04 demo)."
        : next === "Reddedildi"
          ? "Basvuru reddedildi."
          : "Durum guncellendi.";
    setToast(msg);
    setTimeout(() => setToast(null), 2600);

    if (next === "Onaylandi") {
      void tryBrowserNotify("Teamflow — basvuru onayi", `"${row.oppTitle}" icin talebiniz onaylandi.`);
      addNotification(`Tebrikler! "${row.oppTitle}" ilanina yaptiginiz basvuru onaylandi ve takima kabul edildiniz.`);
    }
  }

  function handleDelete(id: string) {
    deleteApplication(id);
    refresh();
    setToast("Basvuru silindi.");
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 pb-16 pt-10 text-[var(--foreground)]">
      <header className="mx-auto mb-10 flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--flow-blue)]">
            PRD — US.03 Ekip lideri
          </p>
          <h1 className="font-[var(--font-fraunces)] text-3xl font-light text-[var(--text-navy)]">
            Basvurulari incele
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-slate)]">
            Tarayicide saklanan basvuru kayitlari (MVP placeholder). Gerçek kurulumda kullanici / rol filtresi ve API ile gelecektir.
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/feed" className="text-[var(--flow-blue)] hover:underline">
            Firsatlara don
          </Link>
          <Link href="/profil" className="text-[var(--text-navy)] hover:underline dark:text-slate-200">
            Profil
          </Link>
          <div className="ml-4 border-l border-slate-200 pl-4 dark:border-white/10">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {toast ? (
        <div className="mx-auto mb-4 max-w-5xl rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl overflow-x-auto rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] shadow-sm dark:border-white/10 dark:bg-[#1e293b]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-[var(--surface-raised)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-slate)] dark:border-white/10">
            <tr>
              <th className="px-4 py-3">Ilan</th>
              <th className="px-4 py-3">Takim</th>
              <th className="px-4 py-3">Basvuran</th>
              <th className="px-4 py-3">Yetenekler</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Islem</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-slate)]">
                  Henuz basvuru kaydi yok. Feed uzerinden &quot;Katil&quot; ile ekleyin (G.09 client-side kayit).
                </td>
              </tr>
            ) : (
              applications.map((a) => (
                <SwipeableApplicationRow key={a.id} a={a} act={act} onDelete={handleDelete} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
