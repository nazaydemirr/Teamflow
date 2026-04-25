"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { apiGet } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { env, isFirebaseConfigured } from "@/lib/env";

export default function Home() {
  const firebaseReady = useMemo(() => isFirebaseConfigured() && auth, []);
  const [status, setStatus] = useState<string>("checking /health…");
  const [token, setToken] = useState<string>("");
  const [health, setHealth] = useState<unknown>(null);
  const [me, setMe] = useState<unknown>(null);

  useEffect(() => {
    apiGet("/health")
      .then((data) => setHealth(data))
      .catch((e) => setHealth({ error: String(e?.message ?? e) }))
      .finally(() => setStatus("idle"));
  }, []);

  async function onLogin() {
    if (!auth) return;
    setStatus("logging in…");
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const t = await cred.user.getIdToken();
      setToken(t);
    } finally {
      setStatus("idle");
    }
  }

  async function onLogout() {
    if (!auth) return;
    setStatus("logging out…");
    try {
      await signOut(auth);
      setToken("");
      setMe(null);
    } finally {
      setStatus("idle");
    }
  }

  async function onFetchMe() {
    setStatus("calling /me…");
    try {
      const data = await apiGet("/me", token || undefined);
      setMe(data);
    } catch (e: unknown) {
      setMe({ error: String((e as { message?: string } | null)?.message ?? e) });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Teamflow Web (bootstrap)</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            API: <span className="font-mono">{env.apiBaseUrl}</span>
          </p>
        </header>

        <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Smoke: /health</h2>
          <pre className="mt-3 overflow-auto rounded-xl bg-zinc-100 p-3 text-sm dark:bg-black">
            {JSON.stringify(health, null, 2)}
          </pre>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Auth + API token</h2>

          {!firebaseReady ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Firebase env eksik. `apps/web/.env.local` içine `.env.local.example`’daki alanları doldur.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onLogin}
                className="h-11 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Google ile giriş
              </button>
              <button
                onClick={onLogout}
                className="h-11 rounded-full border border-black/15 px-5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Çıkış
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onFetchMe}
              className="h-11 rounded-full border border-black/15 px-5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              /me çağır
            </button>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Status: <span className="font-mono">{status}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Token</div>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-zinc-100 p-3 text-xs dark:bg-black">
                {token ? `${token.slice(0, 24)}…` : "(yok)"}
              </pre>
            </div>
            <div>
              <div className="text-sm font-medium">/me response</div>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-zinc-100 p-3 text-xs dark:bg-black">
                {JSON.stringify(me, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
