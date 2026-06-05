"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { env } from "@/lib/env";
import { fetchUserSkills, hasMinimumSkills } from "@/lib/user-skills";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  function handleDemoLogin(profileId: string) {
    localStorage.setItem("teamflow_demo_auth", "true");
    localStorage.setItem("teamflow_demo_profile", profileId);
    localStorage.setItem("teamflow_profile_id", `demo-${profileId}-${Math.floor(Math.random() * 1000)}`);
    router.replace("/feed");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setStatusText("");

    const emailValue = email.trim();
    if (!emailValue || !password.trim()) {
      setErrorText("E-posta ve şifre zorunludur.");
      return;
    }

    setStatusText("Giriş yapılıyor...");

    try {
      const base = (env.apiBaseUrl || "http://localhost:8080").trim().replace(/\/$/, "");
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorText(data.message || "Giriş başarısız.");
        setStatusText("");
        return;
      }

      // Save token
      localStorage.setItem("teamflow_jwt", data.token);
      localStorage.setItem("teamflow_profile_id", data.uid);
      if (data.displayName) {
        localStorage.setItem("teamflow_display_name", data.displayName);
      }
      
      // Clear all demo states
      localStorage.removeItem("teamflow_demo_auth");
      localStorage.removeItem("teamflow_demo_profile");
      localStorage.removeItem("teamflow_demo_notifications");
      localStorage.removeItem("teamflow_apps_frontend");
      localStorage.removeItem("teamflow_apps_backend");
      localStorage.removeItem("teamflow_apps_ai");
      localStorage.removeItem("teamflow_custom_opportunities");

      setStatusText("Giriş başarılı. Yönlendiriliyorsunuz...");

      const skills = await fetchUserSkills();
      if (!hasMinimumSkills(skills, 3)) {
        router.replace("/onboarding");
      } else {
        router.replace("/feed");
      }
    } catch (err) {
      setErrorText("Bağlantı hatası oluştu.");
      setStatusText("");
    }
  }

  return (
    <main className="flex min-h-screen items-stretch">
      <div className="relative flex flex-1 flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 text-center">
            <h1 className="font-[var(--font-fraunces)] text-3xl font-light text-[var(--text-navy)] dark:text-slate-100">
              Giriş Yap
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Hesabınıza giriş yaparak devam edin
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-navy)] dark:text-slate-300">
                E-posta
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-inner outline-none transition placeholder:text-slate-500 focus:border-[var(--flow-blue)] focus:ring-4 focus:ring-[var(--ring)] dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="ornek@teamflow.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-navy)] dark:text-slate-300">
                Şifre
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white pl-4 pr-12 text-[15px] text-slate-900 shadow-inner outline-none transition placeholder:text-slate-500 focus:border-[var(--flow-blue)] focus:ring-4 focus:ring-[var(--ring)] dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="En az 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[var(--flow-blue)] focus:outline-none dark:text-slate-500 dark:hover:text-[var(--flow-blue)]"
                >
                  {showPassword ? "Gizle" : "Göster"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--flow-blue)] to-indigo-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-105 active:scale-[0.98]"
            >
              Giriş Yap
            </button>
          </form>

          {errorText && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {errorText}
            </div>
          )}
          {statusText && !errorText && (
            <div className="mt-6 rounded-lg bg-[var(--flow-blue)]/10 p-4 text-sm text-[var(--flow-blue)] dark:bg-blue-500/10 dark:text-blue-400">
              {statusText}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="w-full flex flex-col items-center gap-2 pt-4 border-t border-slate-200 dark:border-white/10">
              {!showDemoOptions ? (
                <button
                  type="button"
                  onClick={() => setShowDemoOptions(true)}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Demo ile Giriş Yap
                </button>
              ) : (
                <div className="flex flex-col gap-2 w-full mt-2">
                  <p className="text-xs font-semibold text-center text-slate-500 uppercase tracking-widest mb-1">Demo Profili Seçin</p>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("frontend")}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                  >
                    Frontend Geliştirici (React, Next.js)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("backend")}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    Backend Geliştirici (Node.js, PostgreSQL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("ai")}
                    className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors"
                  >
                    Yapay Zeka Uzmanı (Python, PyTorch)
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <Link href="/forgot-password" className="font-semibold text-[var(--flow-blue)] hover:underline">
                Şifremi Unuttum
              </Link>
              <span>•</span>
              <p>
                Hesabınız yok mu?{" "}
                <Link href="/register" className="font-semibold text-[var(--flow-blue)] hover:underline">
                  Kayıt Ol
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
