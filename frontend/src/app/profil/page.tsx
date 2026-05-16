"use client";

import { NotificationBell } from "@/components/NotificationBell";
import { MyTeamsManager } from "@/components/MyTeamsManager";
import { ThemeToggle } from "@/components/ThemeToggle";

import { SkillTagPicker } from "@/components/SkillTagPicker";
import { groupSkillsForDisplay } from "@/lib/skills-catalog";
import { apiGet } from "@/lib/api";
import { fetchUserSkills, updateUserSkills, hasMinimumSkills } from "@/lib/user-skills";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ApplicationStatus = "Onaylandi" | "Beklemede" | "Reddedildi";

type Application = {
  title: string;
  leader: string;
  score: number;
  status: ApplicationStatus;
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
};

function statusStyles(status: ApplicationStatus): string {
  if (status === "Onaylandi") return "text-emerald-700 bg-emerald-50";
  if (status === "Beklemede") return "text-amber-700 bg-amber-50";
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
  });

  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [modalSkills, setModalSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
          setProfile((prev) => ({ ...prev, skillList: s }));
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

        const rawApplications = Array.isArray(raw.applications) ? raw.applications : fallbackApplications;
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
          bio: typeof raw.bio === "string" && raw.bio ? raw.bio : "",
          memberSince: typeof raw.memberSince === "string" && raw.memberSince ? raw.memberSince : "",
          skillList,
          applications: rawApplications.map((item: unknown) => {
            const candidate = item as Partial<Application>;
            const status = candidate.status;
            const safeStatus: ApplicationStatus =
              status === "Onaylandi" || status === "Beklemede" || status === "Reddedildi"
                ? status
                : "Beklemede";
            return {
              title: typeof candidate.title === "string" ? candidate.title : "Basvuru",
              leader: typeof candidate.leader === "string" ? candidate.leader : "-",
              score: typeof candidate.score === "number" ? candidate.score : 0,
              status: safeStatus,
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
      if (!hasMinimumSkills(profile.skillList, 3)) {
        router.replace("/onboarding?return=/profil");
      }
    }
  }, [loading, user, isDemoSession, errorText, profile.skillList, router]);

  const totalApplications = profile.applications.length;
  const activeApplications = profile.applications.filter((item) => item.status !== "Reddedildi").length;

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
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--surface)] dark:border-white/10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-[var(--flow-blue)] text-lg font-bold text-white">
              T
            </div>
            <span className="text-lg font-semibold text-[var(--text-navy)]">Teamflow</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--text-slate)] md:flex">
            <Link href="/feed" className="hover:text-[var(--text-navy)] dark:hover:text-slate-100">
              Firsat akisi
            </Link>
            <Link href="/lider/basvurular" className="hover:text-[var(--text-navy)] dark:hover:text-slate-100">
              Lider: basvurular
            </Link>
            <Link href="/profil" className="text-[var(--text-navy)] dark:text-slate-100">
              Profil
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-12">
        <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-4 shadow-sm sm:p-5 lg:col-span-12 dark:border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user?.photoURL}
                  alt={profile.fullName}
                  className="size-18 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="grid size-18 place-items-center rounded-full bg-slate-200 text-2xl font-semibold text-[var(--text-slate)]">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="font-[var(--font-fraunces)] text-4xl font-light leading-[1.15] text-[var(--text-navy)]">
                  {profile.fullName}
                </h1>
                <p className="text-[15px] text-[var(--text-slate)]">
                  {profile.bio || "Biyografi henuz girilmedi."}
                </p>
                <p className="text-sm text-[var(--text-slate)]">
                  {profile.memberSince || "Uyelik tarihi henuz secilmedi."}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-slate)]">
                  <span>{user?.email ?? "demo@teamflow.com (Demo oturum)"}</span>
                  <span className="flex items-center gap-1 rounded bg-[var(--flow-blue)]/10 px-2 py-0.5 font-mono font-medium text-[var(--flow-blue)]">
                    ID: {profileId}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md">
              <p className="text-lg font-semibold text-[var(--text-navy)]">Basvurularim</p>
              <p className="text-sm text-[var(--text-slate)]">
                Toplam aktivite: {activeApplications}/{totalApplications}
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

        <div className="space-y-4 lg:col-span-7">
          <Card title="Basvurularim">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {profile.applications.length === 0 ? (
                <p className="text-sm text-[var(--text-slate)]">
                  Henuz basvuru secimi yapilmadi.
                </p>
              ) : (
                profile.applications.map((app) => (
                  <article
                    key={app.title}
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
                    <button className="mt-3 h-9 w-full rounded-[var(--radius-md)] bg-emerald-600 px-3 text-sm font-medium text-white transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] active:scale-[0.97]">
                      Ekiple Sohbet Et
                    </button>
                    <button className="mt-2 h-9 w-full rounded-[var(--radius-md)] border border-slate-300 px-3 text-sm font-medium text-[var(--text-navy)] dark:border-white/20">
                      Detaylar
                    </button>
                  </article>
                ))
              )}
            </div>
          </Card>

          <MyTeamsManager userFullName={profile.fullName} />

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
        </div>
      </div>
    </main>
  );
}
