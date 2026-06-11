"use client";

import { decideApplication, deleteApplication, tryBrowserNotify, type StoredApplication } from "@/lib/applications";
import { useApplications } from "@/hooks/useApplications";
import { addNotification } from "@/lib/notifications";
import { sendNotificationToUser } from "@/lib/notifications";
import { getAllOpportunities } from "@/lib/opportunities-data";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenu } from "@/components/MobileMenu";
import { ProfilePreviewModal } from "@/components/ProfilePreviewModal";
import { SiteHeader } from "@/components/SiteHeader";

function SwipeableApplicationRow({
  a,
  act,
  onDelete,
  onOpenProfile,
  onMessage,
}: {
  a: StoredApplication;
  act: (row: StoredApplication, next: StoredApplication["status"]) => Promise<void>;
  onDelete: (id: string) => void;
  onOpenProfile: (app: StoredApplication) => void;
  onMessage: (app: StoredApplication) => void;
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
      <td className="px-4 py-3 text-[var(--text-slate)]">
        {a.applicantLabel}
      </td>
      <td className="max-w-[200px] px-4 py-3 text-[var(--text-slate)]">
        <span className="line-clamp-2">{a.applicantSkills.join(", ") || "—"}</span>
      </td>
      <td className="px-4 py-3 text-[var(--text-slate)]">{a.status}</td>
      <td className="flex items-center gap-2 px-4 py-3 relative">
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            await act(a, "Onaylandi");
          }}
          disabled={a.status === "Onaylandi"}
          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          Onayla
        </button>
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            await act(a, "Reddedildi");
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
            onMessage(a);
          }}
          className="rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
        >
          Mesaj
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(a);
          }}
          className="rounded-md bg-slate-200 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold text-[var(--text-navy)] dark:text-slate-200 transition-opacity hover:brightness-110"
        >
          Detay
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
  const [selectedProfile, setSelectedProfile] = useState<StoredApplication | null>(null);
  const [messagingApp, setMessagingApp] = useState<StoredApplication | null>(null);
  const [messageText, setMessageText] = useState("");
  const [leaderApps, setLeaderApps] = useState<StoredApplication[]>([]);

  useEffect(() => {
    async function loadLeaderApps() {
      try {
        const { apiGet } = await import("@/lib/api");
        const data = await apiGet("/applications?as_leader=true") as any;
        if (data && data.items) {
          setLeaderApps(data.items.map((item: any) => ({
            id: item.id,
            oppId: item.opp_id,
            oppTitle: item.oppTitle || `İlan ${item.opp_id?.substring(0, 6) || ""}`,
            teamName: item.team_name || item.team_id,
            applicantLabel: item.applicant_label || "",
            applicantSkills: item.applicant_skills || [],
            status: item.status === "pending" ? "Beklemede" : item.status === "approved" ? "Onaylandi" : "Reddedildi",
            appliedAt: item.createdAt || new Date().toISOString(),
          })));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadLeaderApps();
  }, [applications]);

  async function act(row: StoredApplication, next: StoredApplication["status"]) {
    try {
      const isApprove = next === "Onaylandi";
      const approvedCount = applications.filter(a => a.applicantLabel === row.applicantLabel && a.status === "Onaylandi").length;
      if (isApprove && approvedCount >= 3) {
        alert("Bu kullanıcının maksimum ekip üyeliği limitine ulaştığı tespit edildi. Bir kullanıcı en fazla 3 ekipte yer alabilir. Bu nedenle bu başvuruyu onaylayamazsınız.");
        return;
      }

      const message = window.prompt(`Adaya iletmek istediğiniz ${isApprove ? 'onay' : 'red'} mesajını yazın (Opsiyonel):`, isApprove ? "Ekibimize hoş geldin!" : "Maalesef şu an için ekibimizde yer kalmadı.");

      if (isApprove) {
        await decideApplication(row.id, "approve", message || undefined);
        await tryBrowserNotify("Başvuru Onaylandı", `${row.applicantLabel} adlı kişinin başvurusu onaylandı.`);
      } else {
        await decideApplication(row.id, "reject", message || undefined);
        await tryBrowserNotify("Başvuru Reddedildi", `${row.applicantLabel} adlı kişinin başvurusu reddedildi.`);
      }

      refresh();
      const msg = isApprove ? "Basvuran onaylandi (US.03 / US.04 demo)." : "Basvuru reddedildi.";
      setToast(msg);
      setTimeout(() => setToast(null), 2600);

      if (next === "Onaylandi") {
        void tryBrowserNotify("Teamflow — basvuru onayi", `"${row.oppTitle}" icin talebiniz onaylandi.`);
        addNotification(`Tebrikler! "${row.oppTitle}" ilanina yaptiginiz basvuru onaylandi ve takima kabul edildiniz.`);
        await sendNotificationToUser(row.applicantLabel, `Takım başvurunuz onaylandı. Takıma kabul edildiniz. (${row.oppTitle})`);
      } else if (next === "Reddedildi") {
        await sendNotificationToUser(row.applicantLabel, `Takım başvurunuz reddedildi. (${row.oppTitle})`);
      }
    } catch (err) {
      setToast("Bir hata olustu. Yetkiniz olmayabilir.");
      setTimeout(() => setToast(null), 2600);
    }
  }

  async function handleDelete(id: string) {
    await deleteApplication(id);
    refresh();
    setToast("Basvuru silindi.");
    setTimeout(() => setToast(null), 2600);
  }

  async function handleSendMessage() {
    if (!messagingApp || !messageText.trim()) return;
    try {
      await sendNotificationToUser(messagingApp.applicantLabel, `Başvurduğunuz "${messagingApp.oppTitle}" ilanındaki "${messagingApp.teamName}" takımının lideri size bir mesaj gönderdi: "${messageText}"`);
      setToast("Mesaj başarıyla gönderildi.");
      setTimeout(() => setToast(null), 2600);
      setMessagingApp(null);
      setMessageText("");
    } catch (e) {
      setToast("Mesaj gönderilirken hata oluştu.");
      setTimeout(() => setToast(null), 2600);
    }
  }

  return (
    <>
      <SiteHeader activeTab="lider" />
      <main className="min-h-screen bg-[var(--background)] px-4 pb-16 pt-10 text-[var(--foreground)]">
        <div className="mx-auto mb-10 max-w-5xl">
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
            {leaderApps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-slate)]">
                  Henuz ilanlarınıza yapılmış bir başvuru kaydı yok.
                </td>
              </tr>
            ) : (
              leaderApps.map((a) => (
                <SwipeableApplicationRow 
                  key={a.id} 
                  a={a} 
                  act={act} 
                  onDelete={handleDelete} 
                  onOpenProfile={(app) => setSelectedProfile(app)}
                  onMessage={(app) => setMessagingApp(app)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProfilePreviewModal 
        isOpen={selectedProfile !== null} 
        onClose={() => setSelectedProfile(null)} 
        applicant={selectedProfile}
      />

      {messagingApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-xl dark:border dark:border-white/10 flex flex-col gap-4 animate-in zoom-in-95">
            <h3 className="text-lg font-semibold text-[var(--text-navy)] dark:text-slate-100">
              Mesaj Gönder
            </h3>
            <p className="text-sm text-[var(--text-slate)]">
              {messagingApp.applicantLabel} adlı adaya mesaj gönderiyorsunuz.
            </p>
            <textarea
              className="w-full h-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent p-3 text-sm text-[var(--text-navy)] dark:text-slate-100 outline-none focus:border-[var(--flow-blue)]"
              placeholder="Mesajınızı buraya yazın..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  setMessagingApp(null);
                  setMessageText("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="px-4 py-2 text-sm font-medium bg-[var(--flow-blue)] text-white hover:brightness-110 rounded-lg disabled:opacity-50 transition-all"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  );
}
