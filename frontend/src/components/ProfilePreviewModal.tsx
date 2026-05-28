"use client";

import { useState } from "react";
import { SkillTagPicker } from "@/components/SkillTagPicker";

type ProfilePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  applicantName: string;
  applicantSkills: string[];
};

export function ProfilePreviewModal({ isOpen, onClose, applicantName, applicantSkills }: ProfilePreviewModalProps) {
  const [messageState, setMessageState] = useState<"idle" | "sending" | "sent">("idle");

  if (!isOpen) return null;

  const initials = applicantName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "OK";

  // Mock data to make the profile look rich
  const title = applicantSkills.length > 0 
    ? `${applicantSkills[0]} Specialist` 
    : "Teknoloji Meraklısı";
  
  const bio = `${applicantName}, yazılım ve teknoloji dünyasında yenilikçi çözümler üretmeyi seven tutkulu bir geliştiricidir. Takım çalışmasına yatkın ve yeni şeyler öğrenmeye hevesli.`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Cover & Avatar Header */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-[var(--flow-blue)]">
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

        <div className="pt-14 px-6 pb-6">
          <h2 className="text-xl font-bold text-[var(--text-navy)] dark:text-slate-100">{applicantName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{title}</p>
          
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Hakkında</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {bio}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Yetkinlikler</h3>
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
            
            <div className="pt-4 border-t border-slate-100 dark:border-white/5">
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
}
