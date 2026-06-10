"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Opportunity, Team } from "@/lib/opportunities-data";
import { updateOpportunity } from "@/lib/opportunities-data";

type EditTeamModalProps = {
  isOpen: boolean;
  onClose: () => void;
  opp: Opportunity;
  team: Team;
  onSuccess: () => void;
};

export function EditTeamModal({ isOpen, onClose, opp, team, onSuccess }: EditTeamModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(team.name || opp.title);
      setDescription(team.description || opp.description);
    }
  }, [isOpen, team, opp]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Update the team within the opp
    const updatedTeams = opp.teams.map(t => 
      t.name === team.name ? { ...t, name: name.trim(), description: description.trim() } : t
    );

    // If it's a bitirme projesi or there's only one team, it makes sense to update opp title/desc too.
    const isSingleTeam = opp.teams.length === 1;
    const oppUpdates: Partial<Opportunity> = {
      teams: updatedTeams
    };
    if (isSingleTeam) {
      oppUpdates.title = name.trim();
      oppUpdates.description = description.trim();
    }

    updateOpportunity(opp.id, oppUpdates);
    onSuccess();
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1118] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-lg font-bold text-[var(--text-navy)] dark:text-slate-100">
            Ekibi Düzenle
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 dark:bg-slate-800/50 p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ekip Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[var(--surface-raised)] px-4 py-2.5 text-sm text-[var(--text-navy)] dark:text-slate-100 placeholder:text-slate-400 focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[var(--surface-raised)] px-4 py-2.5 text-sm text-[var(--text-navy)] dark:text-slate-100 placeholder:text-slate-400 focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)]"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--flow-blue)] text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
