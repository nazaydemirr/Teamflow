"use client";

import { useState } from "react";
import { SkillTagPicker } from "@/components/SkillTagPicker";
import type { Team } from "@/lib/opportunities-data";

type CreateTeamModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (team: Team) => void;
};

export function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [membersMax, setMembersMax] = useState<number | "">(4);
  const [rolesNeeded, setRolesNeeded] = useState<string[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [level, setLevel] = useState<"Başlangıç" | "Orta" | "İleri" | null>(null);
  const [communication, setCommunication] = useState<"Discord" | "WhatsApp" | "Telegram" | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Takım adı zorunludur.");
      return;
    }
    if (!level) {
      setError("Lütfen bir takım seviyesi seçin.");
      return;
    }
    if (!communication) {
      setError("Lütfen bir iletişim kanalı seçin.");
      return;
    }

    const finalMembersMax = Number(membersMax) || 1;

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      membersMax: finalMembersMax,
      membersCurrent: 1, // Kurucu otomatik olarak takımda
      rolesNeeded,
      technologies,
      level,
      communication,
      full: finalMembersMax <= 1,
      isOwner: true,
    };

    onSuccess(newTeam);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] w-full max-w-3xl rounded-2xl shadow-2xl shadow-black/50 border border-slate-200 dark:border-slate-700/50 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-white/[0.02] rounded-t-2xl">
          <div>
            <h2 className="text-xl font-[var(--font-fraunces)] font-medium text-[var(--text-navy)] dark:text-slate-100">
              Yeni Takım Kur
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Topluluğa takımınızın amacını ve aradığınız takım arkadaşlarını detaylıca anlatın.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Takım Adı</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--soft-slate)] dark:bg-[#0c1118] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-[var(--text-navy)] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--flow-blue)] transition-all"
                placeholder="Örn: UI Wizards, Backend Ninjas..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">İstenen Kişi Sayısı (Siz Dahil)</label>
              <input 
                type="number" 
                required 
                min={2}
                max={20}
                value={membersMax}
                onChange={(e) => setMembersMax(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-[var(--soft-slate)] dark:bg-[#0c1118] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-[var(--text-navy)] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--flow-blue)] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Takım Açıklaması</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--soft-slate)] dark:bg-[#0c1118] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-[var(--text-navy)] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--flow-blue)] transition-all resize-none"
              placeholder="Takımın amacı nedir? Neler geliştirmek istiyorsunuz? Nasıl bir çalışma ortamı hayal ediyorsunuz?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aranan Yetkinlikler / Roller</label>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-white/[0.02]">
                <SkillTagPicker selected={rolesNeeded} onChange={setRolesNeeded} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kullanılacak Teknolojiler</label>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-white/[0.02]">
                <SkillTagPicker selected={technologies} onChange={setTechnologies} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Takım Seviyesi</label>
            <div className="grid grid-cols-3 gap-3">
              {["Başlangıç", "Orta", "İleri"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl as any)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                    level === lvl 
                      ? "border-[var(--flow-blue)] bg-blue-50 dark:bg-blue-500/10 text-[var(--flow-blue)]" 
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">İletişim Tercihi</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "Discord", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                { id: "WhatsApp", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                { id: "Telegram", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" }
              ].map((comm) => (
                <button
                  key={comm.id}
                  type="button"
                  onClick={() => setCommunication(comm.id as any)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    communication === comm.id 
                      ? `border-[var(--flow-blue)] ${comm.bg} ${comm.color}` 
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {communication === comm.id && <div className={`size-2 rounded-full bg-current`} />}
                  {comm.id}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--flow-blue)] hover:brightness-110 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              Takımı Oluştur
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
