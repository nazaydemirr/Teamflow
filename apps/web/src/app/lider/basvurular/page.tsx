"use client";

import { setApplicationStatus, tryBrowserNotify, type StoredApplication } from "@/lib/applications";
import { useApplications } from "@/hooks/useApplications";
import Link from "next/link";
import { useState } from "react";

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
    }
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
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/feed" className="text-[var(--flow-blue)] hover:underline">
            Firsatlara don
          </Link>
          <Link href="/profil" className="text-[var(--text-navy)] hover:underline dark:text-slate-200">
            Profil
          </Link>
        </nav>
      </header>

      {toast ? (
        <div className="mx-auto mb-4 max-w-5xl rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl overflow-x-auto rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] shadow-sm dark:border-white/10 dark:bg-[#1e293b]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-slate)] dark:border-white/10 dark:bg-black/20">
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
                <tr key={a.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 font-medium text-[var(--text-navy)] dark:text-slate-100">{a.oppTitle}</td>
                  <td className="px-4 py-3 text-[var(--text-slate)]">{a.teamName}</td>
                  <td className="px-4 py-3 text-[var(--text-slate)]">{a.applicantLabel}</td>
                  <td className="max-w-[200px] px-4 py-3 text-[var(--text-slate)]">
                    <span className="line-clamp-2">{a.applicantSkills.join(", ") || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-slate)]">{a.status}</td>
                  <td className="space-x-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => act(a, "Onaylandi")}
                      disabled={a.status === "Onaylandi"}
                      className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => act(a, "Reddedildi")}
                      disabled={a.status === "Reddedildi"}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-[var(--text-navy)] dark:border-white/20 dark:text-slate-200 disabled:opacity-40"
                    >
                      Reddet
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
