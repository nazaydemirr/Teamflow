"use client";

import { useApplications } from "@/hooks/useApplications";
import { useTeamChat } from "@/hooks/useTeamChat";
import { addMemberById, deleteApplication, deleteApplicationsByOpp, removeTeamMemberById } from "@/lib/applications";
import { getAllOpportunities, fetchMyOpportunities, deleteOpportunityAsync, type Opportunity, type Team } from "@/lib/opportunities-data";
import { EditTeamModal } from "./EditTeamModal";
import { sendChatMessage } from "@/lib/chats";
import { useMemo, useState, useEffect } from "react";

function TeamChat({ teamId, userFullName, currentProfileId }: { teamId?: string; userFullName: string; currentProfileId: string }) {
  const { messages } = useTeamChat(teamId || "");
  const [text, setText] = useState("");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4 dark:border-white/10">
        <h4 className="font-semibold text-[var(--text-navy)] dark:text-slate-100 flex items-center gap-2">
          <svg className="size-5 text-[var(--text-slate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Ekip Sohbet Odasi
        </h4>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 min-h-[250px] bg-slate-50 dark:bg-[var(--background)]">
        {messages.length === 0 ? (
          <div className="m-auto text-center">
            <svg className="mx-auto mb-3 size-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-semibold text-[var(--text-navy)] dark:text-slate-200">Sohbet henuz bos</p>
            <p className="mt-1 text-xs text-[var(--text-slate)]">Ilk mesaji gondererek ekibinle fikir alisverisine basla!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentProfileId;
            return (
              <div key={m.id} className={`flex max-w-[85%] flex-col ${isMe ? "self-end" : "self-start"}`}>
                <span className={`mb-0.5 text-[10px] ${isMe ? "text-right text-[var(--flow-blue)]" : "text-left text-[var(--text-slate)]"}`}>
                  {isMe ? "Sen" : m.senderName}
                </span>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe
                      ? "rounded-tr-sm bg-[var(--flow-blue)] text-white"
                      : "rounded-tl-sm bg-[var(--surface-raised)] border border-slate-200 text-[var(--text-navy)] dark:border-white/10"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-4 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim() && teamId) {
                sendChatMessage(teamId, text.trim());
                setText("");
              }
            }}
            placeholder="Takimina bir mesaj yaz..."
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-4 pr-12 text-sm shadow-sm outline-none focus:border-[var(--flow-blue)] dark:border-white/20 dark:bg-[var(--surface-raised)]"
          />
          <button
            onClick={() => {
              if (text.trim() && teamId) {
                sendChatMessage(teamId, text.trim());
                setText("");
              }
            }}
            className="absolute right-1.5 flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <svg className="size-4 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function MyTeamsManager({ userFullName, focusTeamId, onFocusClear }: { userFullName: string; focusTeamId?: string | null; onFocusClear?: () => void }) {
  const { applications, refresh } = useApplications();
  const [addingMemberToOpp, setAddingMemberToOpp] = useState<string | null>(null);
  const [newMemberId, setNewMemberId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [tick, setTick] = useState(0);
  const [myOpps, setMyOpps] = useState<Opportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(true);

  const [matchmakingSkill, setMatchmakingSkill] = useState("");
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchMessage, setMatchMessage] = useState("");
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  const handleInviteUser = async (userId: string, teamId: string | undefined) => {
    setInvitingUserId(userId);
    try {
      const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1000));
        
        // Target profile key (e.g. demo-backend -> teamflow_demo_notifications_backend)
        const targetProfileName = userId.replace('demo-', '');
        const targetProfileKey = `teamflow_demo_notifications_${targetProfileName}`;
        
        const currentNotifs = JSON.parse(localStorage.getItem(targetProfileKey) || "[]");
        const newNotif = {
          id: "demo-notif-" + Math.random().toString(36).substring(2),
          message: `Selam! ${matchmakingSkill.trim()} yeteneğine sahip olduğunu gördüm. Ekibimizde tam da sana ihtiyacımız var!`,
          is_read: false,
          team_id: teamId || "demo-team",
          created_at: new Date().toISOString()
        };
        localStorage.setItem(targetProfileKey, JSON.stringify([newNotif, ...currentNotifs]));
        
        window.dispatchEvent(new Event("teamflow-notifications"));
        alert("Davet başarıyla gönderildi!");
      } else {
        const { apiPost } = await import("@/lib/api");
        await apiPost("/matchmaking/invite", {
          user_id: userId,
          eksik_yetenek: matchmakingSkill.trim(),
          team_id: teamId || null
        });
        alert("Davet başarıyla gönderildi!");
      }
    } catch (error: any) {
      alert("Davet gönderilirken hata oluştu: " + error.message);
    } finally {
      setInvitingUserId(null);
    }
  };

  useEffect(() => {
    if (focusTeamId) {
      setOpenAccordionId(focusTeamId);
      onFocusClear?.();
      
      // Scroll to the accordion gently
      setTimeout(() => {
        const el = document.getElementById(`team-accordion-${focusTeamId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [focusTeamId, onFocusClear]);

  useEffect(() => {
    const id = localStorage.getItem("teamflow_profile_id");
    if (id) setProfileId(id);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingOpps(true);
    fetchMyOpportunities().then(data => {
      if (mounted) {
        setMyOpps(data);
        setLoadingOpps(false);
      }
    });
    return () => { mounted = false; };
  }, [tick]);

  const ledTeams = useMemo(() => {
    return myOpps.filter((opp) => {
      if (opp.author === userFullName) return true;
      if (opp.teams) {
        return opp.teams.some(t => (profileId && t.leader?.id === profileId) || t.leader?.name === userFullName);
      }
      return false;
    });
  }, [myOpps, userFullName, profileId]);

  const joinedTeams = useMemo(() => {
    const approvedApps = applications.filter(a => a.status === "Onaylandi" && (a.applicantLabel === userFullName || a.applicantLabel === "Demo kullanici"));
    const oppIds = new Set(approvedApps.map(a => a.oppId));
    return myOpps.filter(opp => oppIds.has(opp.id) && opp.author !== userFullName);
  }, [applications, myOpps, userFullName]);

  const allTeams = [...ledTeams.map(t => ({...t, isLeader: true})), ...joinedTeams.map(t => ({...t, isLeader: false}))];

  if (loadingOpps) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-8 shadow-sm flex justify-center items-center dark:border-white/10">
        <span className="inline-block size-6 animate-spin rounded-full border-2 border-[var(--flow-blue)] border-t-transparent" />
      </div>
    );
  }

  if (allTeams.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-4 shadow-sm sm:p-5 dark:border-white/10">
        <h2 className="mb-4 text-xl font-semibold text-[var(--text-navy)] dark:text-slate-100">Ekiplerim</h2>
        <p className="text-sm text-[var(--text-slate)]">Henuz lideri oldugunuz veya uye oldugunuz bir takim yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ledTeams.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm dark:bg-indigo-900/10 dark:border-indigo-900/30">
          <h3 className="mb-3 text-sm font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
            <svg className="size-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
            Kaptanı Olduğum Takımlar
          </h3>
          <div className="flex flex-wrap gap-2">
            {ledTeams.map(team => (
              <button 
                key={team.id}
                onClick={() => {
                  setOpenAccordionId(team.id);
                  setTimeout(() => {
                    document.getElementById(`team-accordion-${team.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors dark:bg-[var(--surface)] dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/40"
              >
                {team.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-4 shadow-sm sm:p-5 dark:border-white/10">
        <h2 className="mb-4 text-xl font-semibold text-[var(--text-navy)] dark:text-slate-100">Ekiplerim</h2>
      <div className="space-y-4">
      {allTeams.map((opp) => {
        const isLeader = opp.isLeader;
        const myTeam = opp.teams?.find(t => (profileId && t.leader?.id === profileId) || t.leader?.name === userFullName) || opp.teams?.[0];
        
        // Lideri otomatik olarak takıma 1 kişi olarak dahil et
        const members = [
          {
            id: `leader-${opp.id}`,
            applicantLabel: `${opp.author} (Lider)`,
            teamName: opp.teams[0]?.name || "Kurucu",
            isLeaderRole: true
          },
          ...(opp.teams[0]?.members || []).map((m, idx) => ({ 
            id: m.id || `demo-member-${idx}`, 
            applicantLabel: m.name, 
            teamName: opp.teams[0]?.name || "Takım", 
            isLeaderRole: false 
          }))
        ];

        const isOpen = openAccordionId === opp.id;

        const myApp = applications.find(a => a.oppId === opp.id && a.status === "Onaylandi" && (a.applicantLabel === userFullName || a.applicantLabel === "Demo kullanici"));
        const teamName = isLeader ? (opp.teams[0]?.name || "Proje Ekibi") : (myApp?.teamName || "Takım");
        const leaderName = isLeader ? userFullName : (opp.teams.find(t => t.name === teamName)?.leader?.name || opp.author);
        const effectiveType = opp.type || (opp.title.toLowerCase().includes("proje") || opp.title.toLowerCase().includes("mvp") ? "bitirme-projesi" : "hackathon");
        const typeLabel = effectiveType === "hackathon" ? "Hackathon" : effectiveType === "yarisma" ? "Yarışma" : "Bitirme Projesi";
        const typeColor = effectiveType === "hackathon" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20" : effectiveType === "yarisma" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
        const teamMembersCount = members.filter(m => m.teamName === teamName || m.isLeaderRole).length;

        return (
          <div key={opp.id} id={`team-accordion-${opp.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-[var(--surface)] shadow-sm dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors">
            {/* Accordion Header */}
            <div 
              className="flex flex-wrap cursor-pointer items-start justify-between gap-4 p-4 sm:p-5"
              onClick={() => setOpenAccordionId(isOpen ? null : opp.id)}
            >
              <div className="flex-1 min-w-[200px]">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-block rounded-md bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {isLeader ? "AKTİF PROJE TAKIMI (LİDER)" : "AKTİF PROJE TAKIMI (ÜYE)"}
                  </span>
                  <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold border ${typeColor}`}>
                    {typeLabel}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-navy)] dark:text-slate-100 mb-3">
                  {effectiveType === "bitirme-projesi" ? opp.title : `${opp.title} — ${teamName}`}
                </h2>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-slate)]">
                  <span className="flex items-center gap-1.5"><span className="font-semibold text-slate-700 dark:text-slate-300">Lider:</span> {leaderName}</span>
                  <span className="flex items-center gap-1.5"><span className="font-semibold text-slate-700 dark:text-slate-300">Üye Sayısı:</span> {teamMembersCount} Kişi</span>
                  <span className="flex items-center gap-1.5"><span className="font-semibold text-slate-700 dark:text-slate-300">Oluşturulma:</span> {opp.deadline ? "10 Nisan 2026" : "10 Nisan 2026"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {isLeader && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingMemberToOpp(opp.id);
                      setOpenAccordionId(opp.id);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Uye Ekle
                  </button>
                )}
                <svg className={`size-6 text-[var(--text-slate)] transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Accordion Content */}
            {isOpen && (
              <div className="bg-[#314361] p-4 sm:p-6 dark:bg-black/40">
                {/* Yonetim Butonlari */}
                <div className="mb-4 flex flex-wrap gap-3">
                  {isLeader ? (
                    <>
                      <button 
                        onClick={() => {
                          setEditingOpp(opp);
                          setEditingTeam(opp.teams.find(t => t.name === teamName) || opp.teams[0]);
                        }}
                        className="rounded-lg bg-blue-50 text-blue-700 px-4 py-2 text-sm font-bold shadow-sm border border-blue-200 hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40 dark:hover:bg-blue-900/40"
                      >
                        Ekibi Düzenle
                      </button>
                      <button 
                        onClick={async () => {
                          const isAuthor = opp.author === userFullName;
                          const confirmMsg = isAuthor 
                            ? "Bu ilanı ve (varsa) bağlı tüm takımları tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                            : "Ekibi tamamen kapatmak istediğinize emin misiniz? Bu işlem geri alınamaz ve ekipteki tüm üyeler ekipten çıkarılacaktır.";

                          if (window.confirm(confirmMsg)) {
                            try {
                              const { apiDelete } = await import("@/lib/api");
                              if (isAuthor) {
                                // Yazar fırsatı tamamen silmeli (böylece veritabanında olmayan ghost takımlardan da kurtulur)
                                await apiDelete(`/opportunities/${opp.id}`);
                              } else {
                                // Sadece takımın lideriyse, takımı silmeli
                                const myTeam = opp.teams?.find(t => (profileId && t.leader?.id === profileId) || t.leader?.name === userFullName) || opp.teams?.[0];
                                if (myTeam?.id) {
                                  await apiDelete(`/teams/${myTeam.id}`);
                                } else {
                                  alert("Kapatılacak takım bulunamadı.");
                                  return;
                                }
                              }
                              
                              refresh();
                              setTick(t => t + 1);
                            } catch (e: any) {
                              alert("Kapatılırken hata oluştu: " + e.message);
                            }
                          }
                        }}
                        className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm font-bold shadow-sm border border-red-200 hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/40"
                      >
                        {opp.author === userFullName ? "Projeyi Kapat" : "Ekibi Kapat"}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={async () => {
                        if (window.confirm("Bu ekipten ayrılmak istediğinize emin misiniz?")) {
                          if (myApp) {
                            await deleteApplication(myApp.id);
                            refresh();
                          }
                        }
                      }}
                      className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm font-bold shadow-sm border border-red-200 hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/40"
                    >
                      Ekipten Ayrıl
                    </button>
                  )}
                </div>

                {/* Uye Ekleme Modulu */}
                {isLeader && addingMemberToOpp === opp.id && (
                  <div className="mb-4 rounded-xl bg-white p-4 shadow-md dark:bg-[var(--surface-raised)]">
                    <p className="mb-3 text-sm font-semibold text-[var(--text-navy)] dark:text-slate-100">Profil ID ile Uye Ekle</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Orn: TF-1234"
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/20 dark:bg-black/20"
                      />
                      <button
                        onClick={async () => {
                          if (!newMemberId.trim()) return;
                          const myTeam = opp.teams?.find(t => (profileId && t.leader?.id === profileId) || t.leader?.name === userFullName) || opp.teams?.[0];
                          if (!myTeam?.id) {
                            alert("Üye eklemek için önce bu ilana ait bir takım oluşturmalısınız.");
                            return;
                          }
                          try {
                            await addMemberById(myTeam.id, newMemberId.trim());
                            alert("Kullanıcı başarıyla takıma eklendi!");
                            setNewMemberId("");
                            setAddingMemberToOpp(null);
                            refresh();
                          } catch (err: any) {
                            alert("Kullanıcı eklenirken hata oluştu. Lütfen geçerli bir ID girdiğinizden emin olun.");
                          }
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        Ekle
                      </button>
                      <button
                        onClick={() => {
                          setAddingMemberToOpp(null);
                          setNewMemberId("");
                          setMatchMessage("");
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--text-navy)] hover:bg-slate-50 dark:border-white/20 dark:bg-transparent dark:text-slate-200"
                      >
                        Iptal
                      </button>
                    </div>

                    {/* AI Matchmaking Alanı */}
                    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/10">
                      <p className="mb-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Yapay Zeka ile Takım Arkadaşı Bul
                      </p>
                      <p className="mb-3 text-xs text-[var(--text-slate)]">Gerekli yeteneği yazın, yapay zeka veritabanını tarasın ve uygun kişilere otomatik davet mesajı göndersin.</p>
                      <div className="flex gap-2 flex-col sm:flex-row">
                        <input
                          type="text"
                          placeholder="Aranan yetenek (örn: React, Node.js)"
                          value={matchmakingSkill}
                          onChange={(e) => setMatchmakingSkill(e.target.value)}
                          className="flex-1 rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-900/50 dark:bg-indigo-900/10 dark:text-slate-200"
                        />
                        <button
                          disabled={isMatchmaking || !matchmakingSkill.trim()}
                          onClick={async () => {
                            if (!matchmakingSkill.trim()) return;
                            setIsMatchmaking(true);
                            setMatchMessage("");
                            setMatchedUsers([]);
                            setExpandedUserId(null);
                            try {
                              const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
                              let response: any;

                              if (isDemo) {
                                // Mock response in Demo Mode
                                await new Promise(r => setTimeout(r, 1000));
                                
                                const currentProfile = localStorage.getItem("teamflow_demo_profile") || "frontend";
                                const allDemos = [
                                  {
                                    id: "demo-frontend",
                                    displayName: "Frontend Geliştirici",
                                    skills: ["React", "Next.js", "Tailwind CSS"],
                                    teamsLed: [{ id: "t1", name: "Hackathon Projesi" }],
                                    teamsJoined: [{ id: "t2", name: "E-ticaret MVP" }]
                                  },
                                  {
                                    id: "demo-backend",
                                    displayName: "Backend Geliştirici",
                                    skills: ["Node.js", "Python", "PostgreSQL"],
                                    teamsLed: [],
                                    teamsJoined: [{ id: "t3", name: "Tedarik Zinciri Takip MVP" }]
                                  },
                                  {
                                    id: "demo-ai",
                                    displayName: "Yapay Zeka Uzmanı",
                                    skills: ["Python", "PyTorch", "TensorFlow"],
                                    teamsLed: [{ id: "t4", name: "Açık Kaynak Dokümantasyon Asistanı" }],
                                    teamsJoined: []
                                  }
                                ];

                                // Kendisi dışındaki demo profillerini getir ve aranan yeteneği listelerinin başına ekle
                                const otherProfiles = allDemos.filter(d => d.id !== `demo-${currentProfile}`);
                                const skillLower = matchmakingSkill.trim().toLowerCase();
                                
                                otherProfiles.forEach(profile => {
                                  if (!profile.skills.some(s => s.toLowerCase() === skillLower)) {
                                    profile.skills.unshift(matchmakingSkill.trim());
                                  }
                                });

                                response = {
                                  items: otherProfiles
                                };
                              } else {
                                const { apiGet } = await import("@/lib/api");
                                response = await apiGet(`/matchmaking/search?skill=${encodeURIComponent(matchmakingSkill.trim())}`);
                              }
                              
                              if (response.items && response.items.length > 0) {
                                setMatchedUsers(response.items);
                                setMatchMessage(`${response.items.length} kişi bulundu.`);
                              } else {
                                setMatchedUsers([]);
                                setMatchMessage("Bu yeteneğe sahip kullanıcı bulunamadı.");
                              }
                            } catch (error: any) {
                              setMatchMessage("Hata: " + (error.message || "Bir şeyler ters gitti"));
                            } finally {
                              setIsMatchmaking(false);
                            }
                          }}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                          {isMatchmaking ? (
                            <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          ) : (
                            "Kullanıcı Ara"
                          )}
                        </button>
                      </div>
                      {matchMessage && (
                        <p className={`mt-3 text-sm ${matchMessage.startsWith("Hata") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                          {matchMessage}
                        </p>
                      )}
                      
                      {matchedUsers.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {matchedUsers.map(user => (
                            <div key={user.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/10 bg-white dark:bg-[var(--surface-raised)]">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-[var(--text-navy)] dark:text-slate-100">{user.displayName}</div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                                    className="text-xs px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                                  >
                                    {expandedUserId === user.id ? "Detayı Gizle" : "Detay"}
                                  </button>
                                  <button
                                    disabled={invitingUserId === user.id}
                                    onClick={() => {
                                      const myTeam = opp.teams?.find(t => (profileId && t.leader?.id === profileId) || t.leader?.name === userFullName) || opp.teams?.[0];
                                      if (!myTeam?.id) {
                                        alert("Davet göndermek için önce bu ilana ait bir takım oluşturmalısınız.");
                                        return;
                                      }
                                      handleInviteUser(user.id, myTeam.id);
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                  >
                                    {invitingUserId === user.id ? "Davet Ediliyor..." : "Davet Et"}
                                  </button>
                                </div>
                              </div>
                              
                              {expandedUserId === user.id && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-sm animate-in fade-in slide-in-from-top-1">
                                  <div className="mb-3">
                                    <strong className="text-slate-700 dark:text-slate-300">Yetenekler:</strong>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {user.skills.map((skill: string, idx: number) => (
                                        <span key={`${skill}-${idx}`} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {(user.teamsLed?.length > 0 || user.teamsJoined?.length > 0) ? (
                                    <div>
                                      <strong className="text-slate-700 dark:text-slate-300">Takım Geçmişi:</strong>
                                      <ul className="mt-1.5 list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                        {user.teamsLed?.map((t: any) => <li key={`led-${t.id}`}><span className="font-medium">{t.name}</span> <span className="text-indigo-500 dark:text-indigo-400">(Lider)</span></li>)}
                                        {user.teamsJoined?.map((t: any) => <li key={`joined-${t.id}`}><span className="font-medium">{t.name}</span> (Üye)</li>)}
                                      </ul>
                                    </div>
                                  ) : (
                                    <div>
                                      <strong className="text-slate-700 dark:text-slate-300">Takım Geçmişi:</strong>
                                      <div className="text-xs text-slate-500 mt-1 italic">Daha önce bir takıma katılmamış.</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* Dikey Layout: Ust Uyeler, Alt Sohbet */}
                <div className="flex flex-col gap-4">
                  {/* Ust: Uyeler */}
                  <div className="flex flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-lg border border-slate-200 dark:border-white/10">
                    <div className="border-b border-slate-200 p-4 dark:border-white/10">
                      <h4 className="font-semibold text-[var(--text-navy)] dark:text-slate-100 flex items-center gap-2">
                        <svg className="size-5 text-[var(--text-slate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Takim Arkadaslarin
                      </h4>
                    </div>
                    <div className="flex-1 p-4">
                      {members.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <div className="mb-4 grid size-20 place-items-center rounded-full border-[3px] border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                            <svg className="size-10 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                          <p className="font-bold text-[var(--text-navy)] dark:text-slate-100">Henuz onayli uye yok</p>
                          <p className="mt-2 text-sm text-[var(--text-slate)]">Projeye arkadaslarini davet ederek sinerji yarat!</p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {members.map((m) => (
                            <li key={m.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-black/20">
                              <div className="flex items-center gap-3">
                                <div className="grid size-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                  {m.applicantLabel.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-[var(--text-navy)] dark:text-slate-200">{m.applicantLabel}</p>
                                  <p className="text-xs text-[var(--text-slate)] dark:text-slate-400">Takim: {m.teamName}</p>
                                </div>
                              </div>
                              {isLeader && !m.isLeaderRole && myTeam?.id && (
                                <button
                                  disabled={removingMemberId === m.id}
                                  onClick={async () => {
                                    if (window.confirm("Bu üyeyi ekipten çıkarmak istediğinize emin misiniz?")) {
                                      setRemovingMemberId(m.id);
                                      try {
                                        await removeTeamMemberById(myTeam.id!, m.id);
                                        refresh();
                                      } finally {
                                        setRemovingMemberId(null);
                                      }
                                    }
                                  }}
                                  className="flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                >
                                  {removingMemberId === m.id ? (
                                    <span className="size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
                                  ) : (
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="border-t border-slate-100 p-3 text-center dark:border-white/5">
                      <p className="text-xs font-medium text-[var(--text-slate)]">Olusturulma: 16 Mayis 2026</p>
                    </div>
                  </div>

                  {/* Alt: Sohbet */}
                  <div className="flex flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-lg border border-slate-200 dark:border-white/10 h-[400px]">
                    <TeamChat teamId={myTeam?.id} userFullName={userFullName} currentProfileId={profileId} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>
      </div>

      {editingOpp && editingTeam && (
        <EditTeamModal 
          isOpen={true}
          opp={editingOpp}
          team={editingTeam}
          onClose={() => {
            setEditingOpp(null);
            setEditingTeam(null);
          }}
          onSuccess={() => {
            refresh();
            setTick(t => t + 1);
          }}
        />
      )}
    </div>
  );
}
