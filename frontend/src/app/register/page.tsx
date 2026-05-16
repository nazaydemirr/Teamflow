"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { env } from "@/lib/env";
import { fetchUserSkills, hasMinimumSkills } from "@/lib/user-skills";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setStatusText("");

    const emailValue = email.trim();
    if (!emailValue || !password.trim() || !displayName.trim()) {
      setErrorText("Tüm alanları doldurmanız zorunludur.");
      return;
    }

    if (password.length < 6) {
      setErrorText("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setStatusText("Kayıt olunuyor...");

    try {
      const base = (env.apiBaseUrl || "http://localhost:8080").trim().replace(/\/$/, "");
      const res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, password, displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorText(data.message || "Kayıt başarısız.");
        setStatusText("");
        return;
      }

      // Save token
      localStorage.setItem("teamflow_jwt", data.token);
      localStorage.setItem("teamflow_profile_id", data.uid);
      localStorage.removeItem("teamflow_demo_auth");

      setStatusText("Kayıt başarılı. Yönlendiriliyorsunuz...");

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

  function handleDemoAuth() {
    localStorage.setItem("teamflow_demo_auth", "true");
    router.replace("/onboarding");
  }

  return (
    <main className="flex min-h-screen items-stretch">
      <div className="relative flex flex-1 flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 text-center">
            <h1 className="font-[var(--font-fraunces)] text-3xl font-light text-[var(--text-navy)] dark:text-slate-100">
              Kayıt Ol
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Yeni bir Teamflow hesabı oluşturun
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-navy)] dark:text-slate-300">
                Ad Soyad
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-12 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-inner outline-none transition placeholder:text-slate-500 focus:border-[var(--flow-blue)] focus:ring-4 focus:ring-[var(--ring)] dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Örn: Deniz Yılmaz"
              />
            </label>

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
              Hesap Oluştur
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/15" />
            </div>
            <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
              <span className="bg-[var(--surface)] px-3 text-[var(--text-slate)] dark:bg-slate-900 dark:text-slate-500">
                veya demo
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoAuth}
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--flow-blue)] text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:brightness-105 active:scale-[0.99]"
          >
            Demo ile giriş yap
          </button>

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

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-semibold text-[var(--flow-blue)] hover:underline">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
