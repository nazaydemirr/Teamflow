"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { useState, useRef, useEffect } from "react";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--night-border)] text-[var(--night-text-secondary)] transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97] hover:border-[var(--night-border-strong)] hover:bg-white/[0.05] dark:text-slate-300"
        aria-label="Bildirimler"
      >
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 flex size-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-[var(--surface)]"></span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-[var(--radius-lg)] border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-[var(--night-border-strong)] dark:bg-[var(--night-surface)] z-50">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-white/10">
            <h3 className="text-sm font-semibold text-[var(--text-navy)] dark:text-slate-100">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-[var(--flow-blue)] hover:underline"
              >
                Tumunu okundu isaretle
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--text-slate)] dark:text-slate-400">
                Henuz bildiriminiz yok.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`mb-1 cursor-pointer rounded-[var(--radius-md)] p-3 transition-colors ${
                    n.read
                      ? "hover:bg-slate-50 dark:hover:bg-white/5"
                      : "bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-500/10 dark:hover:bg-blue-500/15"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p
                      className={`text-sm ${
                        n.read ? "text-[var(--text-slate)] dark:text-slate-300" : "font-medium text-[var(--text-navy)] dark:text-slate-100"
                      }`}
                    >
                      {n.message}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="ml-2 flex-shrink-0 rounded p-1 text-[var(--text-slate)] hover:bg-slate-200 hover:text-red-500 dark:hover:bg-white/10 dark:hover:text-red-400"
                      title="Sil"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--text-slate)] dark:text-slate-500">
                    {new Date(n.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
