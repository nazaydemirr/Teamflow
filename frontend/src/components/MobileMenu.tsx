"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/feed", label: "Ana Sayfa" },
    { href: "/lider/basvurular", label: "Lider Paneli" },
    { href: "/profil", label: "Profil" },
  ];

  return (
    <div className="md:hidden flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-[var(--text-navy)] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Menü"
      >
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[var(--surface)] dark:bg-[#0c1118] border-b border-slate-200 dark:border-white/10 shadow-lg p-4 flex flex-col gap-4 z-50">
          {links.map((link) => {
            const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-lg font-medium py-2 px-4 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-[var(--flow-blue)]/10 text-[var(--flow-blue)] dark:bg-white/10 dark:text-slate-100" 
                    : "text-[var(--text-slate)] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
