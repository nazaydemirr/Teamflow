"use client";

import { useState } from "react";
import { SkillTagPicker } from "@/components/SkillTagPicker";
import { apiPost } from "@/lib/api";
import type { Opportunity } from "@/lib/opportunities-data";

type CreateOpportunityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateOpportunityModal({ isOpen, onClose, onSuccess }: CreateOpportunityModalProps) {
  const [type, setType] = useState<"hackathon" | "yarisma" | "bitirme-projesi" | null>(null);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [membersMax, setMembersMax] = useState<number | "">(4);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError("Lütfen bir tür seçin.");
      return;
    }
    if (type === "bitirme-projesi" && !description.trim()) {
      setError("Bitirme projesi için açıklama zorunludur.");
      return;
    }
    
    setError("");
    setIsSubmitting(true);

    const finalMembersMax = Number(membersMax) || 1;

    try {
      const isDemo = typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true";
      
      if (isDemo) {
        // Demo Mode Save
        const newOpp: Opportunity = {
          id: `custom-${Date.now()}`,
          title,
          type,
          matchPercent: 95, // High match for demo purposes
          author: "Oturum kullanicisi",
          authorInitials: "OK",
          tags: selectedTags.length > 0 ? selectedTags : ["Yeni", type],
          deadline: new Date(deadline).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
          membersCurrent: 1, // Author is in the team
          membersMax: finalMembersMax,
          description,
          teams: type === "bitirme-projesi" ? [{ name: "Proje Ekibi", full: false }] : [],
        };
        
        const stored = localStorage.getItem("teamflow_custom_opportunities");
        const customList = stored ? JSON.parse(stored) : [];
        customList.unshift(newOpp);
        localStorage.setItem("teamflow_custom_opportunities", JSON.stringify(customList));
        
        setTimeout(() => {
          setIsSubmitting(false);
          onSuccess();
        }, 300);
      } else {
        // API Mode Save
        const oppData = {
          title,
          description: description || "Açıklama belirtilmemiş.",
          tags: selectedTags.length > 0 ? selectedTags : ["Yeni", type],
          deadline: new Date(deadline).toISOString(),
          membersMax: finalMembersMax,
        };
        const oppRes = await apiPost("/opportunities", oppData) as { id: string };
        
        // If Bitirme Projesi, automatically create a team for the owner
        if (type === "bitirme-projesi") {
          await apiPost("/teams", { opp_id: oppRes.id });
        }
        
        setIsSubmitting(false);
        onSuccess();
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] w-full max-w-2xl rounded-2xl shadow-2xl shadow-black/50 border border-slate-200 dark:border-slate-700/50 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-xl font-[var(--font-fraunces)] font-medium text-[var(--text-navy)] dark:text-slate-100">
            Yeni Fırsat Oluştur
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Tür Seçimi */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Fırsat Türü</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TypeCard 
                id="hackathon" 
                title="Hackathon" 
                desc="Takımlar oluşturun ve yarışın."
                selected={type === "hackathon"}
                onClick={() => setType("hackathon")}
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />}
              />
              <TypeCard 
                id="yarisma" 
                title="Yarışma" 
                desc="Rekabetçi takım etkinlikleri."
                selected={type === "yarisma"}
                onClick={() => setType("yarisma")}
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />}
              />
              <TypeCard 
                id="bitirme-projesi" 
                title="Bitirme Projesi" 
                desc="Bireysel ilerleyen projenize takım arkadaşı arayın."
                selected={type === "bitirme-projesi"}
                onClick={() => setType("bitirme-projesi")}
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />}
              />
            </div>
          </div>

          {/* Dinamik Alanlar */}
          {type && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Başlık</label>
                <input 
                  type="text" 
                  required 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[var(--soft-slate)] dark:bg-[#0c1118] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-[var(--text-navy)] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--flow-blue)] focus:border-transparent transition-all"
                  placeholder="Fırsat başlığını girin..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tarih (Deadline)</label>
                  <input 
                    type="date" 
                    required 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[var(--soft-slate)] dark:bg-[#0c1118] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-[var(--text-navy)] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--flow-blue)] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">İstenen Kişi Sayısı</label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    max={20}
                    value={membersMax}
                    onChange={(e) => setMembersMax(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[var(--soft-slate)] dark:bg-[#0c1118] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-[var(--text-navy)] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--flow-blue)] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                  Açıklama
                  {type !== "bitirme-projesi" && <span className="text-slate-400 font-normal">(Opsiyonel)</span>}
                  {type === "bitirme-projesi" && <span className="text-red-500 font-normal">Zorunlu</span>}
                </label>
                <textarea 
                  rows={4}
                  required={type === "bitirme-projesi"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[var(--soft-slate)] dark:bg-[#0c1118] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-[var(--text-navy)] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--flow-blue)] transition-all resize-none"
                  placeholder="Proje veya etkinlik hakkında detaylı bilgi verin..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Etiketler / Teknolojiler (Opsiyonel)</label>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-white/[0.02]">
                  <SkillTagPicker selected={selectedTags} onChange={setSelectedTags} />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !type}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--flow-blue)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

function TypeCard({ id, title, desc, icon, selected, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2
        ${selected 
          ? "border-[var(--flow-blue)] bg-blue-50 dark:bg-blue-500/10 shadow-md shadow-blue-500/10" 
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 bg-[var(--surface)]"
        }`}
    >
      <div className={`p-2 rounded-lg w-min ${selected ? "bg-[var(--flow-blue)] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <h4 className={`font-semibold text-sm ${selected ? "text-[var(--flow-blue)]" : "text-slate-800 dark:text-slate-200"}`}>{title}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
      </div>
      {selected && (
        <div className="absolute top-4 right-4 text-[var(--flow-blue)]">
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
