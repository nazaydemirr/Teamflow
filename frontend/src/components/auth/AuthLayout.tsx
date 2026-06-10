"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Left Side - Brand & Visual (Hidden on mobile) */}
      <div className="hidden w-1/2 lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#0B1120] to-[#1E293B]">
        {/* Abstract background graphics */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[var(--flow-blue)]/20 blur-3xl opacity-50 mix-blend-screen"></div>
          <div className="absolute top-1/2 right-12 w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 blur-3xl opacity-50 mix-blend-screen transform -translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--flow-blue)] to-indigo-500 p-2 shadow-lg shadow-[var(--flow-blue)]/30">
              <svg className="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-[var(--font-fraunces)] text-2xl font-bold tracking-tight text-white">
              Teamflow
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-[var(--font-fraunces)] font-light text-white leading-tight mb-6">
            Ekiplerini keşfet, <br />
            <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              projelerini hayata geçir.
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Hackathon, bitirme projesi veya herhangi bir girişim için en doğru takım arkadaşını saniyeler içinde bul.
          </p>
        </div>
          

        
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>© {new Date().getFullYear()} Teamflow Inc.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-slate-300 transition-colors">Gizlilik</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Şartlar</Link>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative p-6 sm:p-12 overflow-y-auto bg-[var(--background)]">
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-[var(--flow-blue)] p-1.5 shadow-sm">
              <svg className="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-[var(--font-fraunces)] text-lg font-bold text-[var(--text-navy)] dark:text-slate-100">
              Teamflow
            </span>
          </Link>
        </div>

        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-[var(--text-navy)] dark:text-slate-100 mb-2">
              {title}
            </h2>
            <p className="text-[15px] text-[var(--text-slate)] dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
