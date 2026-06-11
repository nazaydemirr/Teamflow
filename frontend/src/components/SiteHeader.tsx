"use client";

import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { useState } from "react";

export function SiteHeader({
  activeTab,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  currentUserFullName,
}: {
  activeTab?: "feed" | "landing" | "profil" | "lider";
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  isSearchOpen?: boolean;
  setIsSearchOpen?: (o: boolean) => void;
  currentUserFullName?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[var(--surface)] dark:border-white/10">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-[var(--flow-blue)] text-sm font-bold text-white shadow-md shadow-blue-500/20 ring-1 ring-white/10">
              T
            </span>
            <span className="font-[var(--font-fraunces)] text-lg font-light tracking-tight text-[var(--text-navy)] dark:text-slate-100">
              TeamFlow
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link
              href="/"
              className={`transition-colors duration-[var(--duration)] ${
                activeTab === "landing"
                  ? "border-b-2 border-[var(--flow-blue)] pb-1 text-[var(--text-navy)] dark:text-slate-100"
                  : "text-[var(--text-slate)] hover:text-[var(--text-navy)] dark:text-slate-300 dark:hover:text-slate-100"
              }`}
            >
              Ana Sayfa
            </Link>
            <Link
              href="/feed"
              className={`transition-colors duration-[var(--duration)] ${
                activeTab === "feed"
                  ? "border-b-2 border-[var(--flow-blue)] pb-1 text-[var(--text-navy)] dark:text-slate-100"
                  : "text-[var(--text-slate)] hover:text-[var(--text-navy)] dark:text-slate-300 dark:hover:text-slate-100"
              }`}
            >
              Akış
            </Link>
            <Link
              href="/profil"
              className={`transition-colors duration-[var(--duration)] ${
                activeTab === "profil"
                  ? "border-b-2 border-[var(--flow-blue)] pb-1 text-[var(--text-navy)] dark:text-slate-100"
                  : "text-[var(--text-slate)] hover:text-[var(--text-navy)] dark:text-slate-300 dark:hover:text-slate-100"
              }`}
            >
              Profil
            </Link>
            <Link
              href="/lider/basvurular"
              className={`transition-colors duration-[var(--duration)] ${
                activeTab === "lider"
                  ? "border-b-2 border-[var(--flow-blue)] pb-1 text-[var(--text-navy)] dark:text-slate-100"
                  : "text-[var(--text-slate)] hover:text-[var(--text-navy)] dark:text-slate-300 dark:hover:text-slate-100"
              }`}
            >
              Lider paneli
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          {isSearchOpen && setSearchQuery ? (
            <div className="flex h-10 items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--flow-blue)] bg-[var(--surface)] px-2 shadow-[0_0_0_2px_rgba(37,99,235,0.2)] transition-all">
              <svg className="size-4 text-[var(--text-slate)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Firsat ara..."
                className="w-32 bg-transparent px-2 py-1.5 text-sm text-[var(--text-navy)] outline-none dark:text-slate-100 sm:w-48"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen?.(false);
                }}
                className="grid size-6 place-items-center rounded-full text-[var(--text-slate)] hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            setIsSearchOpen && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="grid size-10 place-items-center rounded-[var(--radius-md)] text-[var(--text-slate)] transition-colors hover:bg-slate-100 hover:text-[var(--text-navy)] dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )
          )}
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10"></div>
          <ThemeToggle />
          <MobileMenu />
          {currentUserFullName && (
            <Link
              href="/profil"
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 dark:border-slate-700/50 px-2 py-1.5 pr-3 transition-colors hover:border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:bg-white/[0.04]"
            >
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-xs font-semibold text-white ring-1 ring-white/10 uppercase">
                {currentUserFullName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
              </span>
              <span className="hidden text-sm font-medium text-[var(--text-navy)] dark:text-slate-100 sm:inline">
                {currentUserFullName}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
