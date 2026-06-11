"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { MyTeamsManager } from "@/components/MyTeamsManager";
import { SkillTagPicker } from "@/components/SkillTagPicker";
import { groupSkillsForDisplay } from "@/lib/skills-catalog";
import { apiGet, apiPatch } from "@/lib/api";
import { fetchUserSkills, updateUserSkills, hasMinimumSkills } from "@/lib/user-skills";
import { fetchUserProfileDetails, updateUserProfileDetails, type UserProfileDetails } from "@/lib/user-profile";
import { fetchApplications, deleteApplication } from "@/lib/applications";
import { getAllOpportunities } from "@/lib/opportunities-data";
import { useApplications } from "@/hooks/useApplications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ApplicationStatus = "Onaylandi" | "Beklemede" | "Reddedildi" | "Iptal Edildi";

type Application = {
  id?: string;
  oppId?: string;
  title: string;
  leader: string;
  score: number;
  status: ApplicationStatus;
  description?: string;
};

const fallbackApplications: Application[] = [];

const fallbackTeams: Array<{ name: string; project: string; role: string }> = [];

const fallbackActivities: string[] = [];

type ProfileData = {
  fullName: string;
  bio: string;
  memberSince: string;
  applications: Application[];
  /** Firestore uyumu PRD users.skills: duz liste */
  skillList: string[];
  teams: Array<{ name: string; project: string; role: string }>;
  activities: string[];
  details: UserProfileDetails;
};

function statusStyles(status: ApplicationStatus): string {
  if (status === "Onaylandi") return "text-emerald-700 bg-emerald-50";
  if (status === "Beklemede") return "text-amber-700 bg-amber-50";
  if (status === "Iptal Edildi") return "text-slate-600 bg-slate-100 dark:bg-white/10 dark:text-slate-300";
  return "text-red-700 bg-red-50";
}

function Card({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-4 shadow-sm sm:p-5 dark:border-white/10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--text-navy)]">{title}</h2>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { activeCount, refresh: refreshApps } = useApplications();
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [user, setUser] = useState<{ uid: string; displayName?: string; email?: string; photoURL?: string } | null>(null);
  const [profileId, setProfileId] = useState<string>("");
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [isDemoSessionChecked, setIsDemoSessionChecked] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "Teamflow Kullanici",
    bio: "",
    memberSince: "",
    applications: fallbackApplications,
    skillList: [],
    teams: fallbackTeams,
    activities: fallbackActivities,
    details: { university: "", department: "", classLevel: "", bio: "", githubUrl: "", linkedinUrl: "" }
  });

  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState<UserProfileDetails>({
    university: "", department: "", classLevel: "", bio: "", githubUrl: "", linkedinUrl: ""
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [modalSkills, setModalSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [focusTeamId, setFocusTeamId] = useState<string | null>(null);
  const [appDetailModalOpen, setAppDetailModalOpen] = useState(false);
  const [selectedAppDetail, setSelectedAppDetail] = useState<Application | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [appToWithdraw, setAppToWithdraw] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const initials = useMemo(() => {
    const source = profile.fullName || user?.displayName || user?.email || "TF";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("");
  }, [profile.fullName, user?.displayName, user?.email]);

  async function handleLogout() {
    localStorage.removeItem("teamflow_jwt");
    localStorage.removeItem("teamflow_profile_id");
    localStorage.removeItem("teamflow_demo_auth");
    router.replace("/");
  }

  useEffect(() => {
    setIsDemoSession(localStorage.getItem("teamflow_demo_auth") === "true");
    setIsDemoSessionChecked(true);

    let storedId = localStorage.getItem("teamflow_profile_id");
    if (!storedId) {
      storedId = "TF-" + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem("teamflow_profile_id", storedId);
    }
    setProfileId(storedId);

    try {
      setDarkMode(localStorage.getItem("teamflow-theme") === "dark");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("teamflow-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!isDemoSessionChecked) return;

    if (!localStorage.getItem("teamflow_jwt") && !isDemoSession) {
      setErrorText("Giriş yapmanız gerekiyor. Login sayfasına yönlendiriliyorsunuz.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    async function loadProfile() {
      if (isDemoSession) {
        try {
          const s = await fetchUserSkills();
          const apps = await fetchApplications();
          const profileDetails = await fetchUserProfileDetails();
          
          const demoProfileType = localStorage.getItem("teamflow_demo_profile");
          let demoFullName = "Demo Kullanici";
          let demoBio = "Teamflow Demo Hesabı";
          
          if (demoProfileType === "frontend") {
            demoFullName = "Frontend Geliştirici (Demo)";
            demoBio = "React ve Next.js üzerine odaklanmış bir arayüz geliştiricisi.";
          } else if (demoProfileType === "backend") {
            demoFullName = "Backend Geliştirici (Demo)";
            demoBio = "Ölçeklenebilir sistemler kuran bir arka yüz geliştiricisi.";
          } else if (demoProfileType === "ai") {
            demoFullName = "Yapay Zeka Uzmanı (Demo)";
            demoBio = "Veri bilimi ve makine öğrenimi modelleri üzerinde çalışan uzman.";
          }

          const formattedApps: Application[] = apps
            .filter(a => (a.applicantLabel === "Teamflow Kullanici" || a.applicantLabel === "Demo kullanici" || a.applicantLabel === demoFullName) && a.status !== "Iptal Edildi")
            .map(a => {
              const allOpps = getAllOpportunities();
              const opp = allOpps.find(o => o.id === a.oppId);
              return {
                id: a.id,
                oppId: a.oppId,
                title: a.oppTitle,
                leader: opp?.author || "-",
                score: 85, // Fake score for demo
                status: a.status as ApplicationStatus,
                description: opp?.description || "Bu ilan için açıklama bulunamadı."
              };
            });

          setProfile((prev) => ({ 
             ...prev, 
             fullName: demoFullName,
             bio: profileDetails.bio || demoBio,
             skillList: s, 
             applications: formattedApps,
             details: profileDetails
          }));
        } catch (e) {
          // ignore
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const raw = (await apiGet("/me")) as any;
        setUser({ uid: raw.uid, displayName: raw.displayName, email: raw.email });
        const localDetails = await fetchUserProfileDetails();
        const profileDetails = {
          university: raw.university || localDetails.university || "",
          department: raw.department || localDetails.department || "",
          classLevel: raw.grade || localDetails.classLevel || "",
          bio: raw.bio || localDetails.bio || "",
          githubUrl: raw.github_url || localDetails.githubUrl || "",
          linkedinUrl: raw.linkedin_url || localDetails.linkedinUrl || ""
        };

        const apps = await fetchApplications();
        const rawTeams = Array.isArray(raw.teams) ? raw.teams : fallbackTeams;

        let skillList: string[] = [];
        if (Array.isArray(raw.skills)) {
          skillList = raw.skills.filter((item: unknown): item is string => typeof item === "string");
        } else if (raw.skills && typeof raw.skills === "object") {
          skillList = Object.values(raw.skills as Record<string, unknown>).flatMap((value) =>
            Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
          );
        }
        if (skillList.length > 0) {
          updateUserSkills(skillList).catch(console.error);
        }
        const rawActivities = Array.isArray(raw.activities) ? raw.activities : fallbackActivities;

        setProfile({
          fullName: typeof raw.displayName === "string" && raw.displayName ? raw.displayName : "Teamflow Kullanici",
          bio: profileDetails.bio || (typeof raw.bio === "string" && raw.bio ? raw.bio : ""),
          memberSince: typeof raw.memberSince === "string" && raw.memberSince ? raw.memberSince : "",
          skillList,
          details: profileDetails,
          applications: apps
            .filter((item: any) => item.status !== "Iptal Edildi")
            .map((item: any) => {
            const status = item.status;
            const safeStatus: ApplicationStatus =
              status === "Onaylandi" || status === "Beklemede" || status === "Reddedildi"
                ? status
                : "Beklemede";
            return {
              id: item.id || "",
              oppId: item.oppId || "",
              title: item.oppTitle || "Basvuru",
              leader: "-",
              score: 0,
              status: safeStatus,
              description: "Bu ilan için açıklama bulunamadı."
            };
          }),
          teams: rawTeams.map((item: unknown) => {
            const candidate = item as Partial<{ name: string; project: string; role: string }>;
            return {
              name: typeof candidate.name === "string" ? candidate.name : "Takim",
              project: typeof candidate.project === "string" ? candidate.project : "-",
              role: typeof candidate.role === "string" ? candidate.role : "Rol belirtilmedi",
            };
          }),
          activities: rawActivities.filter((item: unknown): item is string => typeof item === "string"),
        });
      } catch (e) {
        setErrorText("Profil verisi okunurken bir hata olustu.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [isDemoSession, isDemoSessionChecked, router]);



  useEffect(() => {
    if (!loading && (user || isDemoSession) && !errorText) {
      if (profile.skillList.length === 0) {
        router.replace("/onboarding?return=/profil");
      }
    }
  }, [loading, user, isDemoSession, errorText, profile.skillList, router]);

  const totalApplications = 3;
  const activeApplications = activeCount;

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] p-4">
        <p className="text-[15px] text-[var(--text-slate)]">Profil verisi yukleniyor...</p>
      </main>
    );
  }

  if (!user && !isDemoSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] p-4">
        <p className="text-[15px] text-[var(--text-slate)]">Login sayfasina yonlendiriliyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-8">
      <SiteHeader activeTab="profil" currentUserFullName={profile.fullName} />

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-12">
        <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-4 shadow-sm sm:p-5 lg:col-span-12 dark:border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user?.photoURL}
                  alt={profile.fullName}
                  className="size-18 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="grid size-18 shrink-0 place-items-center rounded-full bg-slate-200 text-2xl font-semibold text-[var(--text-slate)]">
                  {initials}
                </div>
              )}
              <div className="flex flex-col items-center sm:items-start">
                <h1 className="font-[var(--font-fraunces)] text-3xl sm:text-4xl font-light leading-[1.15] text-[var(--text-navy)]">
                  {profile.fullName}
                </h1>
                <p className="text-[15px] mt-1 text-[var(--text-slate)]">
                  {profile.bio || "Biyografi henuz girilmedi."}
                </p>
                <p className="mt-2 text-sm text-[var(--text-slate)] dark:text-slate-400">
                  {profile.memberSince ? `Üyelik Tarihi: ${profile.memberSince}` : "Üyelik tarihi henüz seçilmedi."}
                </p>
                <div className="mt-2 flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 text-xs text-[var(--text-slate)]">
                  <span className="truncate max-w-[200px] sm:max-w-none">{user?.email ?? "demo@teamflow.com (Demo oturum)"}</span>
                  <span className="flex items-center gap-1 rounded bg-[var(--flow-blue)]/10 px-2 py-0.5 font-mono font-medium text-[var(--flow-blue)]">
                    ID: {profileId}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md">
              <p className="text-lg font-semibold text-[var(--text-navy)]">Basvurularim</p>
              <p className="text-sm text-[var(--text-slate)]">
                Aktif Basvuru Kotasi: {activeApplications}/{totalApplications}
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-[var(--flow-blue)]"
                  style={{
                    width:
                      totalApplications > 0
                        ? `${Math.round((activeApplications / totalApplications) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 rounded-[var(--radius-md)] border border-slate-300 px-3 py-2 text-sm text-[var(--text-slate)]"
              >
                Cikis Yap
              </button>
            </div>
          </div>
        </section>

        {errorText && (
          <section className="rounded-[var(--radius-lg)] border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 p-4 lg:col-span-12">
            <p className="text-sm text-[var(--error-red)]">{errorText}</p>
          </section>
        )}

        <div className="space-y-4 lg:col-span-7">
          <Card title="Basvurularim">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {profile.applications.length === 0 ? (
                <p className="text-sm text-[var(--text-slate)]">
                  Henuz basvuru secimi yapilmadi.
                </p>
              ) : (
                profile.applications.map((app, i) => (
                  <article
                    key={`${app.title}-${i}`}
                    className="rounded-[var(--radius-md)] border border-slate-200 bg-[var(--surface-raised)] p-3 transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:-translate-y-1 hover:shadow-lg dark:border-white/10"
                  >
                    <h3 className="text-sm font-semibold text-[var(--text-navy)]">{app.title}</h3>
                    <p className="mt-1 text-xs text-[var(--text-slate)]">Ekip Lideri: {app.leader}</p>
                    <p className="text-xs text-[var(--text-slate)]">Eslesme skoru: %{app.score}</p>
                    <p
                      className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles(app.status)}`}
                    >
                      {app.status}
                    </p>
                    {app.status === "Onaylandi" && app.oppId && (
                      <button 
                        onClick={() => setFocusTeamId(app.oppId!)}
                        className="mt-3 h-9 w-full rounded-[var(--radius-md)] bg-emerald-600 px-3 text-sm font-medium text-white transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97]">
                        Ekiple Sohbet Et
                      </button>
                    )}
                    {app.status === "Beklemede" && (
                      <button
                        onClick={() => {
                          setAppToWithdraw(app);
                          setWithdrawModalOpen(true);
                        }}
                        className="mt-3 h-9 w-full rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
                      >
                        Başvuruyu Geri Çek
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedAppDetail(app);
                        setAppDetailModalOpen(true);
                      }}
                      className="mt-2 h-9 w-full rounded-[var(--radius-md)] border border-slate-300 px-3 text-sm font-medium text-[var(--text-navy)] dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      Detaylar
                    </button>
                  </article>
                ))
              )}
            </div>
          </Card>

          {/* Application Details Modal */}
          {appDetailModalOpen && selectedAppDetail ? (
            <div
              className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 animate-in fade-in duration-200"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setAppDetailModalOpen(false);
              }}
            >
              <div
                role="dialog"
                aria-modal
                aria-label="İlan Detayı"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-[var(--surface)] p-6 shadow-xl dark:border-white/10 animate-in zoom-in-95 duration-200"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-[var(--font-fraunces)] text-2xl font-bold text-[var(--text-navy)] dark:text-slate-50">
                    {selectedAppDetail.title}
                  </h3>
                  <button
                    onClick={() => setAppDetailModalOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="grid size-6 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    {selectedAppDetail.leader.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="font-medium text-[var(--text-navy)] dark:text-slate-200">
                    Ekip Lideri: {selectedAppDetail.leader}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Proje Açıklaması
                    </h4>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-black/20 dark:text-slate-300">
                      {selectedAppDetail.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Başvuru Durumu</p>
                      <p className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles(selectedAppDetail.status)}`}>
                        {selectedAppDetail.status}
                      </p>
                    </div>
                    {selectedAppDetail.status === "Onaylandi" && selectedAppDetail.oppId && (
                      <button 
                        onClick={() => {
                          setFocusTeamId(selectedAppDetail.oppId!);
                          setAppDetailModalOpen(false);
                        }}
                        className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm active:scale-95">
                        Sohbete Git
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Withdraw Application Modal */}
          {withdrawModalOpen && appToWithdraw ? (
            <div
              className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 animate-in fade-in duration-200"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget && !withdrawing) setWithdrawModalOpen(false);
              }}
            >
              <div
                role="dialog"
                aria-modal
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-[var(--surface)] p-6 shadow-xl dark:border-white/10 animate-in zoom-in-95 duration-200"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-[var(--text-navy)] dark:text-slate-50 mb-2">
                  Başvuruyu Geri Çek
                </h3>
                <p className="text-sm text-[var(--text-slate)] dark:text-slate-400 mb-6">
                  <b>{appToWithdraw.title}</b> ilanına yaptığınız başvuruyu geri çekmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={withdrawing}
                    onClick={() => setWithdrawModalOpen(false)}
                    className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={withdrawing}
                    onClick={async () => {
                      if (!appToWithdraw.id) return;
                      setWithdrawing(true);
                      try {
                        await deleteApplication(appToWithdraw.id);
                        refreshApps();
                        setProfile((prev) => ({
                          ...prev,
                          applications: prev.applications.filter(a => a.id !== appToWithdraw.id)
                        }));
                        setWithdrawModalOpen(false);
                      } catch (err) {
                        alert("Başvuru geri çekilirken hata oluştu.");
                      } finally {
                        setWithdrawing(false);
                      }
                    }}
                    className="flex items-center gap-2 rounded-[var(--radius-md)] bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {withdrawing ? "Geri Çekiliyor..." : "Evet, Geri Çek"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}


          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Son Aktivite Akisi">
              <ul className="space-y-3">
                {profile.activities.length === 0 ? (
                  <li className="text-sm leading-6 text-[var(--text-slate)]">
                    Henuz aktivite secimi yapilmadi.
                  </li>
                ) : (
                  profile.activities.map((item) => (
                    <li key={item} className="text-sm leading-6 text-[var(--text-slate)]">
                      • {item}
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>

          <MyTeamsManager userFullName={profile.fullName} focusTeamId={focusTeamId} onFocusClear={() => setFocusTeamId(null)} />
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Card title="Yetenekler">
            <div className="space-y-4">
              {profile.skillList.length === 0 ? (
                <p className="text-sm text-[var(--text-slate)]">
                  PRD G.02/G.03: onboarding veya buradan en az uc yetenek secin.
                </p>
              ) : (
                Object.entries(groupSkillsForDisplay(profile.skillList)).map(([category, items]) => (
                  <div key={category}>
                    <p className="mb-2 text-base font-semibold text-[var(--text-navy)] dark:text-slate-100">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span
                          key={`${category}-${item}`}
                          className="rounded-full bg-[var(--skill-badge-bg)] px-3 py-1 text-sm text-[var(--skill-badge-text)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={async () => {
                const fetched = await fetchUserSkills();
                setModalSkills(profile.skillList.length ? profile.skillList : fetched);
                setSkillsModalOpen(true);
              }}
              className="mt-5 rounded-[var(--radius-md)] bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97]"
            >
              Yetenekleri Duzenle
            </button>
          </Card>
          
          <Card title="Profil Detayları">
            <div className="space-y-4 text-[15px] text-[var(--text-slate)]">
              <div><strong className="text-[var(--text-navy)] dark:text-slate-100">Üniversite:</strong> {profile.details.university || "Belirtilmedi"}</div>
              <div><strong className="text-[var(--text-navy)] dark:text-slate-100">Bölüm:</strong> {profile.details.department || "Belirtilmedi"}</div>
              <div><strong className="text-[var(--text-navy)] dark:text-slate-100">Sınıf:</strong> {profile.details.classLevel || "Belirtilmedi"}</div>
              <div><strong className="text-[var(--text-navy)] dark:text-slate-100">Kısa Biyografi:</strong> {profile.details.bio || "Belirtilmedi"}</div>
              <div>
                <strong className="text-[var(--text-navy)] dark:text-slate-100">GitHub:</strong>{" "}
                {profile.details.githubUrl ? (
                  <a href={profile.details.githubUrl} target="_blank" rel="noreferrer" className="text-[var(--flow-blue)] hover:underline">
                    {profile.details.githubUrl}
                  </a>
                ) : (
                  "Belirtilmedi"
                )}
              </div>
              <div>
                <strong className="text-[var(--text-navy)] dark:text-slate-100">LinkedIn:</strong>{" "}
                {profile.details.linkedinUrl ? (
                  <a href={profile.details.linkedinUrl} target="_blank" rel="noreferrer" className="text-[var(--flow-blue)] hover:underline">
                    {profile.details.linkedinUrl}
                  </a>
                ) : (
                  "Belirtilmedi"
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalDetails(profile.details);
                setDetailsModalOpen(true);
              }}
              className="mt-5 rounded-[var(--radius-md)] border border-slate-300 dark:border-white/10 px-4 py-2 text-sm font-semibold transition-transform duration-[var(--duration)] active:scale-[0.97] text-[var(--text-navy)] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
            >
              Detayları Düzenle
            </button>
          </Card>
        </div>

        {skillsModalOpen ? (
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSkillsModalOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal
              aria-label="Yetenek secimi"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-5 shadow-xl dark:border-white/10 dark:bg-[#1e293b]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h3 className="font-[var(--font-fraunces)] text-xl text-[var(--text-navy)] dark:text-slate-50">
                Yeteneklerini sec
              </h3>
              <p className="mt-1 text-sm text-[var(--text-slate)]">En az 3 etiket (PRD G.03).</p>
              <div className="mt-4">
                <SkillTagPicker selected={modalSkills} onChange={setModalSkills} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSkillsModalOpen(false)}
                  className="rounded-[var(--radius-md)] border border-slate-300 px-4 py-2 text-sm dark:border-white/20"
                >
                  Iptal
                </button>
                <button
                  type="button"
                  disabled={modalSkills.length < 3 || savingSkills}
                  onClick={async () => {
                    setSavingSkills(true);
                    try {
                      await updateUserSkills(modalSkills);

                      setProfile((prev) => ({ ...prev, skillList: [...modalSkills] }));
                      setSkillsModalOpen(false);
                    } finally {
                      setSavingSkills(false);
                    }
                  }}
                  className="rounded-[var(--radius-md)] bg-[var(--flow-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {detailsModalOpen ? (
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDetailsModalOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal
              aria-label="Profil detayları"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-6 shadow-xl dark:border-white/10 dark:bg-[#1e293b]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h3 className="font-[var(--font-fraunces)] text-2xl text-[var(--text-navy)] dark:text-slate-50 mb-6">
                Profil Detaylarını Düzenle
              </h3>
              
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-navy)] dark:text-slate-300">Üniversite</label>
                    <input 
                      type="text" 
                      value={modalDetails.university} 
                      onChange={e => setModalDetails(p => ({ ...p, university: e.target.value }))}
                      className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-[var(--soft-slate)] px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50 focus:border-[var(--flow-blue)] focus:outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-navy)] dark:text-slate-300">Bölüm</label>
                    <input 
                      type="text" 
                      value={modalDetails.department} 
                      onChange={e => setModalDetails(p => ({ ...p, department: e.target.value }))}
                      className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-[var(--soft-slate)] px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50 focus:border-[var(--flow-blue)] focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-navy)] dark:text-slate-300">Sınıf</label>
                    <input 
                      type="text" 
                      value={modalDetails.classLevel} 
                      onChange={e => setModalDetails(p => ({ ...p, classLevel: e.target.value }))}
                      className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-[var(--soft-slate)] px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50 focus:border-[var(--flow-blue)] focus:outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-navy)] dark:text-slate-300">Kısa Biyografi</label>
                    <input 
                      type="text" 
                      value={modalDetails.bio} 
                      onChange={e => setModalDetails(p => ({ ...p, bio: e.target.value }))}
                      className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-[var(--soft-slate)] px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50 focus:border-[var(--flow-blue)] focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-navy)] dark:text-slate-300">GitHub Linki</label>
                    <input 
                      type="url" 
                      value={modalDetails.githubUrl} 
                      onChange={e => setModalDetails(p => ({ ...p, githubUrl: e.target.value }))}
                      className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-[var(--soft-slate)] px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50 focus:border-[var(--flow-blue)] focus:outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-navy)] dark:text-slate-300">LinkedIn Linki</label>
                    <input 
                      type="url" 
                      value={modalDetails.linkedinUrl} 
                      onChange={e => setModalDetails(p => ({ ...p, linkedinUrl: e.target.value }))}
                      className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-[var(--soft-slate)] px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50 focus:border-[var(--flow-blue)] focus:outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="rounded-[var(--radius-md)] px-4 py-2 text-sm text-[var(--text-slate)] hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={savingDetails}
                  onClick={async () => {
                    setSavingDetails(true);
                    try {
                      await updateUserProfileDetails(modalDetails);
                      if (!isDemoSession) {
                        await apiPatch("/auth/profile", {
                          university: modalDetails.university,
                          department: modalDetails.department,
                          grade: modalDetails.classLevel,
                          bio: modalDetails.bio,
                          github_url: modalDetails.githubUrl,
                          linkedin_url: modalDetails.linkedinUrl,
                        });
                      }
                      setProfile(prev => ({ ...prev, details: modalDetails, bio: modalDetails.bio || prev.bio }));
                    } catch (err) {
                      console.error("Profil kaydedilemedi", err);
                      alert("Profil kaydedilirken hata oluştu");
                    }
                    setSavingDetails(false);
                    setDetailsModalOpen(false);
                  }}
                  className="rounded-[var(--radius-md)] bg-[var(--flow-blue)] px-5 py-2 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        ) : null}


      </div>
    </main>
  );
}
