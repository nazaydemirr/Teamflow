"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRedirectResult,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { env, isFirebaseConfigured } from "@/lib/env";
import { hasMinimumSkills, readStoredSkills } from "@/lib/user-skills";

function routeAfterAuth(router: ReturnType<typeof useRouter>) {
  const skills = readStoredSkills();
  if (!hasMinimumSkills(skills, 3)) {
    router.replace("/onboarding");
  } else {
    router.replace("/feed");
  }
}

function IconGoogle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function IconGithub({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    if (!auth || !isFirebaseConfigured()) return;
    void getRedirectResult(auth)
      .then((result) => {
        if (result?.user) routeAfterAuth(router);
      })
      .catch(() => {
        /* kullanici iptal / hata */
      });
  }, [router]);

  const firebaseReady = useMemo(() => Boolean(isFirebaseConfigured() && auth), []);
  const missingFirebaseFields = useMemo(() => {
    const missing: string[] = [];
    if (!env.firebase.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!env.firebase.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (!env.firebase.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!env.firebase.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
    return missing;
  }, []);

  const [email, setEmail] = useState("demo@teamflow.com");
  const [password, setPassword] = useState("demo123");
  const [rememberMe, setRememberMe] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function openSocialAuth(provider: GoogleAuthProvider | GithubAuthProvider, label: string) {
    if (!auth || !firebaseReady) {
      setErrorText(
        missingFirebaseFields.length
          ? `${label}: Eksik env: ${missingFirebaseFields.join(", ")}`
          : `${label} ile giris kullanilamiyor.`,
      );
      return;
    }

    setErrorText("");
    setStatusText(`${label} ile giris...`);
    try {
      await signInWithPopup(auth, provider);
      setStatusText("Giris basarili.");
      routeAfterAuth(router);
    } catch (error) {
      const authError = error as Partial<AuthError>;
      if (authError.code === "auth/popup-blocked") {
        setStatusText("Popup engellendi. Yonlendirme ile deneniyor...");
        await signInWithRedirect(auth, provider);
        return;
      }

      if (authError.code === "auth/popup-closed-by-user") {
        setErrorText(`${label} penceresi kapatildi.`);
        setStatusText("");
        return;
      }

      setErrorText(
        authError.code ? `${label} girisi basarisiz: ${authError.code}` : `${label} girisi basarisiz.`,
      );
      setStatusText("");
    } finally {
      setTimeout(() => setStatusText(""), 1500);
    }
  }

  function onSocialGoogleLogin() {
    void openSocialAuth(new GoogleAuthProvider(), "Google");
  }

  function onSocialGithubLogin() {
    void openSocialAuth(new GithubAuthProvider(), "GitHub");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setStatusText("");

    const emailValue = email.trim();
    if (!emailValue || !password.trim()) {
      setErrorText("E-posta/kullanici adi ve sifre zorunludur.");
      return;
    }

    if (!emailValue.includes("@") && emailValue.length < 3) {
      setErrorText("Gecerli bir e-posta veya kullanici adi girin.");
      return;
    }

    if (password.length < 6) {
      setErrorText("Sifre en az 6 karakter olmalidir.");
      return;
    }

    if (emailValue !== "demo@teamflow.com" || password !== "demo123") {
      setErrorText("Su an formda sadece demo hesapla giris acik: demo@teamflow.com / demo123");
      return;
    }

    try {
      localStorage.setItem("teamflow_demo_auth", "true");
    } catch {
      setErrorText("Tarayici depolamasi kullanilamiyor (gizli mod veya kisit). Demo girisi acilamadi.");
      return;
    }
    setStatusText(
      rememberMe ? "Beni hatirla acik. Demo giris yapiliyor..." : "Demo giris yapiliyor...",
    );
    routeAfterAuth(router);
  }

  return (
    <main className="landing-page-bg relative min-h-dvh text-[var(--text-navy)]">
      <div className="landing-grid-mask pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-[1] mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--flow-blue)] transition hover:text-indigo-600 hover:underline"
          >
            Ana sayfaya don
          </Link>
          <Link
            href="/feed"
            className="text-sm font-medium text-[var(--text-slate)] transition hover:text-[var(--text-navy)] dark:hover:text-slate-200"
          >
            Akisi onizle
          </Link>
        </div>

        <div className="relative rounded-[var(--radius-lg)] border border-slate-200/80 bg-[var(--surface)]/85 p-6 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.18)] ring-1 ring-[var(--flow-blue)]/[0.06] backdrop-blur-md sm:p-8 dark:border-[var(--night-border-strong)] dark:bg-[color-mix(in_srgb,var(--surface-raised)_92%,transparent)] dark:ring-[var(--flow-blue)]/20 dark:shadow-[0_28px_56px_-12px_rgba(0,0,0,0.55)]">
          <div className="relative text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 text-slate-600 shadow-inner dark:from-slate-800 dark:to-slate-900 dark:text-slate-300">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--flow-blue)]">Kayit / giris</p>
            <h1 className="mt-2 font-[var(--font-fraunces)] text-2xl font-light text-[var(--text-navy)] dark:text-slate-50">
              Hesabini olustur veya giris yap
            </h1>
            <p className="mt-1.5 text-sm text-[var(--text-slate)] dark:text-slate-400">
              MVP: Google, GitHub veya demo hesap (PRD G.01).
            </p>
          </div>

          <div className="relative mt-7 space-y-3">
            <button
              type="button"
              onClick={onSocialGoogleLogin}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-md)] border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/90"
            >
              <IconGoogle className="size-5" />
              Google ile devam et
            </button>
            <button
              type="button"
              onClick={onSocialGithubLogin}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-md)] border border-slate-800 bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] dark:border-white/10"
            >
              <IconGithub className="size-5 text-white" />
              GitHub ile devam et
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/15" />
            </div>
            <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
              <span className="bg-[var(--surface)] px-3 text-[var(--text-slate)] dark:bg-slate-900 dark:text-slate-500">
                veya demo ile
              </span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="relative space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-navy)] dark:text-slate-300">
                E-posta
              </span>
              <input
                type="text"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-inner outline-none ring-0 transition placeholder:text-slate-500 focus:border-[var(--flow-blue)] focus:ring-4 focus:ring-[var(--ring)] dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="ornek@teamflow.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-navy)] dark:text-slate-300">
                Sifre
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-inner outline-none transition placeholder:text-slate-500 focus:border-[var(--flow-blue)] focus:ring-4 focus:ring-[var(--ring)] dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="En az 6 karakter"
              />
            </label>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[var(--text-slate)] dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="size-4 rounded border-slate-300 text-[var(--flow-blue)] focus:ring-[var(--ring)] dark:border-slate-600"
                />
                Beni hatirla
              </label>
              <a
                href="/forgot-password"
                className="text-sm font-semibold text-[var(--flow-blue)] transition hover:text-indigo-600 hover:underline"
              >
                Sifremi unuttum
              </a>
            </div>

            <button
              type="submit"
              className="h-12 w-full rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--flow-blue)] to-indigo-600 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:brightness-105 active:scale-[0.98]"
            >
              Demo ile giris yap
            </button>

            {errorText ? (
              <p
                role="alert"
                className="rounded-[var(--radius-md)] border border-[var(--error-red)]/35 bg-[var(--error-red)]/10 px-3 py-2.5 text-sm text-[var(--error-red)] dark:bg-[var(--error-red)]/15"
              >
                {errorText}
              </p>
            ) : null}

            {statusText ? (
              <p className="text-center text-sm text-[var(--text-slate)] dark:text-slate-400">{statusText}</p>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
}
