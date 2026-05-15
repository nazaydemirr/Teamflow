"use client";

import { SKILL_CATALOG } from "@/lib/skills-catalog";

type SkillTagPickerProps = {
  selected: string[];
  onChange: (skills: string[]) => void;
};

export function SkillTagPicker({ selected, onChange }: SkillTagPickerProps) {
  const set = new Set(selected);

  function toggle(tag: string) {
    const next = new Set(set);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange([...next]);
  }

  return (
    <div className="space-y-6">
      {SKILL_CATALOG.map((cat) => (
        <div key={cat.category}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">{cat.category}</p>
          <div className="flex flex-wrap gap-2">
            {cat.tags.map((tag) => {
              const on = set.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    on
                      ? "border-[var(--flow-blue)] bg-[var(--flow-blue)] text-white shadow-md shadow-blue-500/20 dark:shadow-blue-500/25"
                      : "border-[var(--skill-tag-border)] bg-[var(--skill-tag-bg)] text-[var(--skill-tag-text)] hover:opacity-80"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
