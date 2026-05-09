"use client";

import { SkillTagPicker } from "@/components/SkillTagPicker";
import { auth, db } from "@/lib/firebase";
import { hasMinimumSkills, writeStoredSkills } from "@/lib/user-skills";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const rawReturn = params.get("return") ?? "/feed";
  const returnTo =
    rawReturn.startsWith("/") &&
    !rawReturn.startsWith("//") &&
    !rawReturn.includes("://") &&
    !rawReturn.includes("..")
      ? rawReturn
      : "/feed";

  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");

  const canContinue = useMemo(() => hasMinimumSkills(skills, 3), [skills]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("teamflow_user_skills_v1");
      if (raw) {
        const p = JSON.parse(raw) as unknown;
        if (Array.isArray(p)) setSkills(p.filter((x): x is string => typeof x === "string"));
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function onSubmit() {
    if (!canContinue) return;
    setSaving(true);
    setErrorText("");
    try {
      writeStoredSkills(skills);
    } catch {
      setErrorText("Yerel kayit basarisiz. Tarayici depolamasini kontrol edin.");
      setSaving(false);
      return;
    }

    const user = auth?.currentUser ?? null;
    if (user && db) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { skills, onboardingComplete: true, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      } catch (e) {
        console.warn("[Teamflow] Firestore onboarding sync failed", e);
      }
    }

    router.replace(returnTo.startsWith("/") ? returnTo : "/feed");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-6 shadow-sm dark:border-[var(--night-border-strong)] dark:bg-[var(--surface-raised)] dark:shadow-lg dark:shadow-black/35 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--flow-blue)]">Teamflow</p>
        <h1 className="mt-3 font-[var(--font-fraunces)] text-3xl font-light text-[var(--text-navy)] dark:text-slate-50">
          Yeteneklerini sec
        </h1>
        <p className="mt-2 text-[15px] text-[var(--text-slate)] dark:text-slate-300">
          PRD G.03: En az <strong>3</strong> yetenek secmeden akisa gecemezsin. Secimler profilinde ve eslesme skorunda kullanilir.
        </p>

        <div className="my-6 rounded-[var(--radius-md)] border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Secilen: {skills.length} / en az 3
        </div>

        <SkillTagPicker selected={skills} onChange={setSkills} />

        {errorText ? (
          <p className="mt-4 text-sm text-[var(--error-red)]">{errorText}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/profil" className="text-sm font-medium text-[var(--flow-blue)] hover:underline">
            Profile don
          </Link>
          <button
            type="button"
            disabled={!canContinue || saving}
            onClick={() => void onSubmit()}
            title={!canContinue ? "En az 3 yetenek secin" : undefined}
            className="h-12 rounded-[var(--radius-md)] bg-[var(--flow-blue)] px-6 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Akisa gec
          </button>
        </div>
      </div>
    </main>
  );
}

function OnboardingFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)]">
      <p className="text-[var(--text-slate)]">Yukleniyor...</p>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingInner />
    </Suspense>
  );
}
