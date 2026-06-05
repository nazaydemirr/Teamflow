"use client";

import { useApplications } from "@/hooks/useApplications";
import { useTeamChat } from "@/hooks/useTeamChat";
import { addApprovedMember, deleteApplication } from "@/lib/applications";
import { getAllOpportunities, type Opportunity } from "@/lib/opportunities-data";
import { sendChatMessage } from "@/lib/chats";
import { useMemo, useState, useEffect } from "react";

function TeamChat({ oppId, userFullName, currentProfileId }: { oppId: string; userFullName: string; currentProfileId: string }) {
  const { messages } = useTeamChat(oppId);
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
              if (e.key === "Enter" && text.trim()) {
                sendChatMessage(oppId, text.trim());
                setText("");
              }
            }}
            placeholder="Takimina bir mesaj yaz..."
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-4 pr-12 text-sm shadow-sm outline-none focus:border-[var(--flow-blue)] dark:border-white/20 dark:bg-[var(--surface-raised)]"
          />
          <button
            onClick={() => {
              if (text.trim()) {
                sendChatMessage(oppId, text.trim());
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

  const ledTeams = useMemo(() => {
    return getAllOpportunities().filter((opp) => opp.author === userFullName);
  }, [userFullName]);

  const joinedTeams = useMemo(() => {
    const approvedApps = applications.filter(a => a.status === "Onaylandi" && (a.applicantLabel === userFullName || a.applicantLabel === "Demo kullanici"));
    const oppIds = new Set(approvedApps.map(a => a.oppId));
    return getAllOpportunities().filter(opp => oppIds.has(opp.id) && opp.author !== userFullName);
  }, [applications, userFullName]);

  const allTeams = [...ledTeams.map(t => ({...t, isLeader: true})), ...joinedTeams.map(t => ({...t, isLeader: false}))];

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
        const applicantMembers = applications.filter((a) => a.oppId === opp.id && a.status === "Onaylandi");
        
        // Lideri otomatik olarak takıma 1 kişi olarak dahil et
        const members = [
          {
            id: `leader-${opp.id}`,
            applicantLabel: `${opp.author} (Lider)`,
            teamName: opp.teams[0]?.name || "Kurucu",
            isLeaderRole: true
          },
          ...applicantMembers.map(m => ({ ...m, isLeaderRole: false }))
        ];

        const isOpen = openAccordionId === opp.id;

        return (
          <div key={opp.id} id={`team-accordion-${opp.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-[var(--surface)] shadow-sm dark:border-white/10">
            {/* Accordion Header */}
            <div 
              className="flex cursor-pointer items-center justify-between p-4 sm:p-5"
              onClick={() => setOpenAccordionId(isOpen ? null : opp.id)}
            >
              <div>
                <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {isLeader ? "AKTIF PROJE TAKIMI (LIDER)" : "AKTIF PROJE TAKIMI (UYE)"}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-navy)] dark:text-slate-100">{opp.title}</h2>
              </div>
              <div className="flex items-center gap-3">
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
                          await addApprovedMember({
                            oppId: opp.id,
                            oppTitle: opp.title,
                            teamName: opp.teams[0]?.name || "Genel",
                            applicantLabel: `Kullanici (${newMemberId.trim()})`,
                            applicantSkills: ["-"],
                          });
                          setNewMemberId("");
                          setAddingMemberToOpp(null);
                          refresh();
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
                                    onClick={() => handleInviteUser(user.id, opp.teams?.[0]?.id)}
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

                {/* Iki Sutunlu Layout: Sol Uyeler, Sag Sohbet */}
                <div className="grid gap-4 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
                  {/* Sol: Uyeler */}
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
                              {isLeader && !m.isLeaderRole && (
                                <button
                                  onClick={async () => {
                                    await deleteApplication(m.id);
                                    refresh();
                                  }}
                                  className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                >
                                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
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

                  {/* Sag: Sohbet */}
                  <div className="flex flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-lg border border-slate-200 dark:border-white/10">
                    <TeamChat oppId={opp.id} userFullName={userFullName} currentProfileId={profileId} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
    </div>
  );
}
