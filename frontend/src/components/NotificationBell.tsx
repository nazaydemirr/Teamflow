"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { getAllOpportunities } from "@/lib/opportunities-data";

type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  team_id?: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [acceptingTeamId, setAcceptingTeamId] = useState<string | null>(null);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const [teamDetailsCache, setTeamDetailsCache] = useState<Record<string, any>>({});

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
      if (isDemo) {
        const profile = localStorage.getItem("teamflow_demo_profile") || "frontend";
        const targetProfileKey = `teamflow_demo_notifications_${profile}`;
        
        const demoNotifs = JSON.parse(localStorage.getItem(targetProfileKey) || "[]");
        const updated = demoNotifs.filter((n: Notification) => n.id !== id);
        localStorage.setItem(targetProfileKey, JSON.stringify(updated));
        
        const legacyNotifs = JSON.parse(localStorage.getItem("teamflow_demo_notifications") || "[]");
        const updatedLegacy = legacyNotifs.filter((n: Notification) => n.id !== id);
        localStorage.setItem("teamflow_demo_notifications", JSON.stringify(updatedLegacy));

        setNotifications((prev) => prev.filter((n) => n.id !== id));
        return;
      }
      
      const { apiDelete } = await import("@/lib/api");
      await apiDelete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Bildirim silinirken hata:", error);
    }
  };

  const handleToggleDetails = (teamId: string, notifId: string) => {
    if (expandedNotifId === notifId) {
      setExpandedNotifId(null);
      return;
    }
    
    if (!teamDetailsCache[teamId]) {
      const opps = getAllOpportunities();
      let foundTeam = null;
      let foundOpp = null;
      for (const opp of opps) {
        if (opp.teams) {
           const t = opp.teams.find(x => x.id === teamId);
           if (t) {
              foundTeam = t;
              foundOpp = opp;
              break;
           }
        }
      }
      
      setTeamDetailsCache(prev => ({
        ...prev,
        [teamId]: foundTeam ? { name: foundTeam.name, author: foundOpp?.author, project: foundOpp?.title } : { name: "Bilinmeyen Takım" }
      }));
    }
    
    setExpandedNotifId(notifId);
  };

  const handleAcceptInvite = async (teamId: string, notifId: string) => {
    setAcceptingTeamId(teamId);
    try {
      const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1000));
        alert("Takıma başarıyla katıldınız!");
        
        const profile = localStorage.getItem("teamflow_demo_profile") || "frontend";
        const targetProfileKey = `teamflow_demo_notifications_${profile}`;
        
        const demoNotifs = JSON.parse(localStorage.getItem(targetProfileKey) || "[]");
        const updated = demoNotifs.map((n: Notification) => n.id === notifId ? { ...n, is_read: true, message: n.message + " (Kabul Edildi)", team_id: undefined } : n);
        localStorage.setItem(targetProfileKey, JSON.stringify(updated));
        
        // Legacy check
        const legacyNotifs = JSON.parse(localStorage.getItem("teamflow_demo_notifications") || "[]");
        const updatedLegacy = legacyNotifs.map((n: Notification) => n.id === notifId ? { ...n, is_read: true, message: n.message + " (Kabul Edildi)", team_id: undefined } : n);
        localStorage.setItem("teamflow_demo_notifications", JSON.stringify(updatedLegacy));

        setNotifications([...updated, ...updatedLegacy]);
        window.dispatchEvent(new Event("teamflow-applications"));
      } else {
        const { apiPost } = await import("@/lib/api");
        await apiPost("/applications/accept-invite", { team_id: teamId });
        await markAsRead(notifId);
        alert("Takıma başarıyla katıldınız!");
        window.dispatchEvent(new Event("teamflow-applications"));
      }
    } catch (error: any) {
      alert("Takıma katılırken hata: " + (error.message || "Bir hata oluştu"));
    } finally {
      setAcceptingTeamId(null);
    }
  };

  // Bildirimleri API'den çek
  const fetchNotifications = async () => {
    try {
      const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
      if (isDemo) {
        const profile = localStorage.getItem("teamflow_demo_profile") || "frontend";
        const targetProfileKey = `teamflow_demo_notifications_${profile}`;
        const demoNotifs = JSON.parse(localStorage.getItem(targetProfileKey) || "[]");
        
        // Geriye dönük uyumluluk için eski genel bildirimleri de ekle (eğer varsa ve henüz silinmemişse)
        const legacyNotifs = JSON.parse(localStorage.getItem("teamflow_demo_notifications") || "[]");
        
        setNotifications([...demoNotifs, ...legacyNotifs]);
        return;
      }
      
      // apiGet, mevcut kullanıcının tokenını otomatik ekler
      const data = await apiGet("/notifications") as any;
      if (data && data.items) {
        setNotifications(data.items);
      }
    } catch (error) {
      console.error("Bildirimler çekilirken hata:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Gerekirse başka bileşenlerden güncellemeyi tetiklemek için
    const handleUpdate = () => fetchNotifications();
    window.addEventListener("teamflow-notifications", handleUpdate);

    return () => {
      window.removeEventListener("teamflow-notifications", handleUpdate);
    };
  }, []);

  // Dropdown dışında bir yere tıklanınca menüyü kapat
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

  const markAsRead = async (id: string) => {
    try {
      const isDemo = localStorage.getItem("teamflow_demo_auth") === "true";
      if (isDemo) {
        const profile = localStorage.getItem("teamflow_demo_profile") || "frontend";
        const targetProfileKey = `teamflow_demo_notifications_${profile}`;
        
        // Yeni sisteme göre kontrol et
        const demoNotifs = JSON.parse(localStorage.getItem(targetProfileKey) || "[]");
        if (demoNotifs.some((n: Notification) => n.id === id)) {
          const updated = demoNotifs.map((n: Notification) => n.id === id ? { ...n, is_read: true } : n);
          localStorage.setItem(targetProfileKey, JSON.stringify(updated));
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
          return;
        }

        // Eski sistemde (teamflow_demo_notifications) ise
        const legacyNotifs = JSON.parse(localStorage.getItem("teamflow_demo_notifications") || "[]");
        if (legacyNotifs.some((n: Notification) => n.id === id)) {
           const updated = legacyNotifs.map((n: Notification) => n.id === id ? { ...n, is_read: true } : n);
           localStorage.setItem("teamflow_demo_notifications", JSON.stringify(updated));
           setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        }
        return;
      }

      await apiPatch(`/notifications/${id}/read`);
      // UI'da hemen güncelle
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Bildirim okundu işaretlenirken hata:", error);
    }
  };

  // is_read'i false olanların sayısını bul
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
      >
        <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg overflow-hidden z-50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Bildirimler</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                Henüz bildiriminiz yok.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                  }}
                  className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors relative group ${
                    !n.is_read 
                      ? "bg-blue-50 dark:bg-blue-900/20" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <button 
                    onClick={(e) => handleDelete(e, n.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className={`text-sm pr-6 ${!n.is_read ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`}>
                    {n.message}
                  </p>
                  {n.team_id && (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDetails(n.team_id as string, n.id);
                          }}
                          className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        >
                          {expandedNotifId === n.id ? "Detayı Gizle" : "Detay"}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptInvite(n.team_id as string, n.id);
                          }}
                          disabled={acceptingTeamId === n.team_id}
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {acceptingTeamId === n.team_id ? "Katılım Sağlanıyor..." : "Kabul Et"}
                        </button>
                      </div>
                      
                      {expandedNotifId === n.id && teamDetailsCache[n.team_id] && (
                        <div className="mt-2 p-2.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                          <p className="mb-1"><strong className="text-slate-700 dark:text-slate-300">Takım Adı:</strong> <span className="text-slate-600 dark:text-slate-400">{teamDetailsCache[n.team_id].name}</span></p>
                          {teamDetailsCache[n.team_id].project && <p className="mb-1"><strong className="text-slate-700 dark:text-slate-300">Bağlı Olduğu Proje:</strong> <span className="text-slate-600 dark:text-slate-400">{teamDetailsCache[n.team_id].project}</span></p>}
                          {teamDetailsCache[n.team_id].author && <p><strong className="text-slate-700 dark:text-slate-300">Kurucu/Lider:</strong> <span className="text-slate-600 dark:text-slate-400">{teamDetailsCache[n.team_id].author}</span></p>}
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 block">
                    {new Date(n.created_at).toLocaleString("tr-TR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
