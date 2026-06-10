"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type MemberData = {
  name: string;
  initials: string;
  role: string;
  id?: string;
  skills?: string[];
  teamsCount?: number;
  leaderCount?: number;
  projectsCount?: number;
  university?: string;
  department?: string;
  github?: string;
  linkedin?: string;
};

type MemberProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  member: MemberData | null;
};

export function MemberProfileModal({ isOpen, onClose, member }: MemberProfileModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !member) return null;

  // Use mock values if none provided
  const skills = member.skills || ["HTML", "CSS", "JavaScript"];
  const teamsCount = member.teamsCount ?? Math.floor(Math.random() * 5) + 1;
  const leaderCount = member.leaderCount ?? Math.floor(Math.random() * 3);
  const projectsCount = member.projectsCount ?? Math.floor(Math.random() * 8) + 2;
  const university = member.university || "Bilinmiyor";
  const department = member.department || "Bilinmiyor";

  const modalContent = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[var(--surface)] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-700/50 flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative pt-10 pb-6 px-6 bg-gradient-to-br from-[var(--flow-blue)] to-blue-700 text-center flex flex-col items-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="size-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold shadow-lg mb-4 ring-4 ring-white/20">
            {member.initials}
          </div>
          <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
            {member.name}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white mb-3">
            {member.role}
          </div>
          <div className="flex items-center gap-4 text-white/90 text-[13px] font-medium">
            {member.github && (
              <a href={member.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
            )}
            {member.linkedin && (
              <a href={member.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="p-2 bg-white dark:bg-white/5 rounded-lg shadow-sm border border-slate-200 dark:border-white/10">
              <svg className="size-5 text-[var(--flow-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Eğitim</p>
              <p className="text-sm font-semibold text-[var(--text-navy)] dark:text-slate-100">{university}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{department}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-[var(--flow-blue)] mb-1">{teamsCount}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Yarışma<br/>Katılımı</p>
            </div>
            <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-amber-500 mb-1">{leaderCount}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Liderlik<br/>Deneyimi</p>
            </div>
            <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-emerald-500 mb-1">{projectsCount}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Tamamlanan<br/>Proje</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <svg className="size-4 text-[var(--flow-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Teknik Yetenekler
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-[var(--flow-blue)] dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
