"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const theme = localStorage.getItem("teamflow_theme");
    const isDark = theme === "dark" || (!theme && document.documentElement.classList.contains("dark"));
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "teamflow_theme") {
        const newDark = e.newValue === "dark";
        setDarkMode(newDark);
        if (newDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("teamflow_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("teamflow_theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className="size-9 rounded-[var(--radius-md)] border border-slate-300 dark:border-white/15 animate-pulse bg-slate-100 dark:bg-white/5" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={darkMode ? "Açık Mod'a Geç" : "Koyu Mod'a Geç"}
      className="grid size-9 place-items-center rounded-[var(--radius-md)] border border-slate-300 text-[var(--text-slate)] transition-colors hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
    >
      {darkMode ? (
        <svg className="size-4.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="size-4.5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}
