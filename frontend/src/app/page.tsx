"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();

  return (
    <main className="landing-page-bg relative min-h-dvh text-[var(--text-navy)]">
      <div className="landing-grid-mask pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-[1] mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:max-w-4xl lg:pb-20 lg:pt-8">
        <header className="mb-12 lg:mb-16">
          <Link href="/" className="group inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[var(--flow-blue)] to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20 transition group-hover:shadow-blue-500/35">
              T
            </span>
            <div className="leading-tight">
              <span className="font-[var(--font-fraunces)] text-lg font-medium tracking-tight text-[var(--text-navy)] dark:text-slate-100">
                Teamflow
              </span>
              <p className="text-xs font-medium text-[var(--text-slate)]">Yetenek pazaryeri</p>
            </div>
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-[var(--surface)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--flow-blue)] shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-800/60">
            PRD E1 / G.01
          </p>
          <h1 className="mt-5 font-[var(--font-fraunces)] text-[clamp(2.125rem,5.5vw,3.5rem)] font-light leading-[1.08] tracking-tight text-[var(--text-navy)] dark:text-slate-50">
            Ekibini kur,{" "}
            <span className="bg-gradient-to-r from-[var(--flow-blue)] via-indigo-600 to-emerald-600 bg-clip-text font-normal text-transparent">
              akisi
            </span>{" "}
            degistir.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[var(--text-slate)] dark:text-slate-300">
            Yarismalar ve projeler icin teknik uyumunu paylas; filtrelenebilir firsatlarda eslesme skorunu kullan,
            kopmadan ekiplere katil.
          </p>

          <ul className="mt-8 max-w-xl space-y-3.5 text-[15px] text-[var(--text-slate)] dark:text-slate-300">
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <IconCheck className="size-3.5" />
              </span>
              <span>
                <div className="flex gap-4">
                  <Link href="/login" className="font-semibold text-[var(--flow-blue)] hover:underline">
                    Giris Yap
                  </Link>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <Link href="/register" className="font-semibold text-[var(--flow-blue)] hover:underline">
                    Kayıt Ol
                  </Link>
                </div>
                <span>ile kendi hesabınızı oluşturun veya demo ile deneyin.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--flow-blue)]/15 text-[var(--flow-blue)]">
                <IconCheck className="size-3.5" />
              </span>
              <span>Etiket ve tarih filtreleriyle ilanlari kesfet; eslesme yuzdesi aninda hesaplanir.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <IconCheck className="size-3.5" />
              </span>
              <span>Detay panelinden takimlara basvur; lider onayi icin akis takip edilir.</span>
            </li>
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--flow-blue)] to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-105 active:scale-[0.98]"
            >
              Hemen Kayıt Ol
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Giriş Yap
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
