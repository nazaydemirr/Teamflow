"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SkillTagPicker } from "@/components/SkillTagPicker";
import type { StoredApplication } from "@/lib/applications";

type ProfilePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  applicant: StoredApplication | null;
};

export function ProfilePreviewModal({ isOpen, onClose, applicant }: ProfilePreviewModalProps) {
  const [messageState, setMessageState] = useState<"idle" | "sending" | "sent">("idle");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !applicant) return null;

  const applicantName = applicant.applicantLabel || "İsimsiz";
  const applicantSkills = applicant.applicantSkills || [];

  const initials = applicantName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "OK";

  const title = applicantSkills.length > 0 
    ? `${applicantSkills[0]} Specialist` 
    : "Teknoloji Meraklısı";
  
  const bio = applicant.applicantBio || `${applicantName}, yazılım ve teknoloji dünyasında yenilikçi çözümler üretmeyi seven tutkulu bir geliştiricidir.`;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] w-full max-w-md max-h-[90vh] rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-black/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Cover & Avatar Header */}
        <div className="relative shrink-0 h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-[var(--flow-blue)]">
          <button
            onClick={() => {
              setMessageState("idle");
              onClose();
            }}
            className="absolute top-4 right-4 rounded-full p-2 bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-md"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute -bottom-10 left-6">
            <div className="grid size-20 place-items-center rounded-2xl bg-[var(--surface)] text-2xl font-bold text-[var(--flow-blue)] shadow-lg border-4 border-[var(--surface)]">
              {initials}
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6 overflow-y-auto">
          <h2 className="text-xl font-bold text-[var(--text-navy)] dark:text-slate-100">{applicantName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{title}</p>
          
          <div className="mt-6 space-y-6">
            
            {/* 1. Profil Bilgileri */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 dark:border-white/5 pb-1">Profil Bilgileri</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">Üniversite:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{applicant.applicantUniversity || "Belirtilmedi"}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Bölüm:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{applicant.applicantDepartment || "Belirtilmedi"}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Sınıf:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{applicant.applicantClassLevel || "Belirtilmedi"}</span></div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
                {bio}
              </p>
              {(applicant.applicantGithub || applicant.applicantLinkedin) && (
                <div className="flex gap-4 mt-3 text-sm">
                  {applicant.applicantGithub && <a href={applicant.applicantGithub} target="_blank" rel="noreferrer" className="text-[var(--flow-blue)] hover:underline flex items-center gap-1"><svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg> GitHub</a>}
                  {applicant.applicantLinkedin && <a href={applicant.applicantLinkedin} target="_blank" rel="noreferrer" className="text-[var(--flow-blue)] hover:underline flex items-center gap-1"><svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"/></svg> LinkedIn</a>}
                </div>
              )}
            </div>

            {/* 2. Yetenekler */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 dark:border-white/5 pb-1">Yetenekler ve Teknolojiler</h3>
              {applicantSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {applicantSkills.map(skill => (
                    <span key={skill} className="text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Belirtilmemiş</p>
              )}
            </div>

            {/* 3. Yarışma ve Takım İstatistikleri */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 dark:border-white/5 pb-1">Yarışma ve Takım İstatistikleri</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-bold text-[var(--flow-blue)]">{applicant.statsCompetitionsJoined ?? 0}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Katıldığı Yarışma</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{applicant.statsCompetitionsCompleted ?? 0}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Tamamladığı Yarışma</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{applicant.statsCompetitionsLed ?? 0}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Lider Olduğu Yarışma</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-500">{applicant.statsTeamsCreated ?? 0}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Kurduğu Takım</div>
                </div>
              </div>
            </div>

            {/* 4. Güncel Takım Durumu */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 dark:border-white/5 pb-1">Güncel Takım Durumu</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 px-3 py-2 rounded border border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-300">Aktif Bulunduğu Takım Sayısı</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{applicant.statsActiveTeams ?? 0}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 px-3 py-2 rounded border border-slate-100 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-300">Liderliğini Yaptığı Takım Sayısı</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{applicant.statsActiveTeamsLed ?? 0}</span>
                </div>
                
                {applicant.statsActiveTeamsNames && applicant.statsActiveTeamsNames.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 block mb-1">Aktif Takımlar:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {applicant.statsActiveTeamsNames.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs rounded-full border border-indigo-100 dark:border-indigo-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {applicant.statsLedTeamsNames && applicant.statsLedTeamsNames.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-slate-500 block mb-1">Lideri Olduğu Takımlar:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {applicant.statsLedTeamsNames.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-xs rounded-full border border-amber-100 dark:border-amber-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Başvuru Durumu */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 dark:border-white/5 pb-1">Başvuru Durumu</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-white/5 text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{applicant.statsActiveApplications ?? 0}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Aktif Başvuru</div>
                </div>
                <div className={`p-2.5 rounded-lg border text-center flex flex-col justify-center ${applicant.statsPendingApplications ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-white/5'}`}>
                  <div className={`text-sm font-bold ${applicant.statsPendingApplications ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}>
                    {applicant.statsPendingApplications ? "Bekleyen Başvuru Var" : "Bekleyen Yok"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 mt-6 sticky bottom-0 bg-[var(--surface)] pb-2">
              <button
                type="button"
                onClick={() => {
                  if (messageState !== "idle") return;
                  setMessageState("sending");
                  setTimeout(() => setMessageState("sent"), 800);
                }}
                disabled={messageState !== "idle"}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
                  messageState === "sent"
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : messageState === "sending"
                    ? "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400 shadow-none cursor-wait"
                    : "bg-[var(--flow-blue)] text-white hover:brightness-110 active:scale-95 shadow-blue-500/20"
                }`}
              >
                {messageState === "sent" ? (
                  <>
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Mesaj Gönderildi
                  </>
                ) : messageState === "sending" ? (
                  "Gönderiliyor..."
                ) : (
                  "Mesaj Gönder"
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
