"use client";

import { SkillTagPicker } from "@/components/SkillTagPicker";
import { groupSkillsForDisplay } from "@/lib/skills-catalog";
import { auth, db } from "@/lib/firebase";
import { readStoredSkills, writeStoredSkills } from "@/lib/user-skills";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
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
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-[var(--surface)] p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-xl font-semibold text-[var(--text-navy)]">{title}</h2>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [user, setUser] = useState<User | null>(null);
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

  useEffect(() => {
    setIsDemoSession(localStorage.getItem("teamflow_demo_auth") === "true");
    setIsDemoSessionChecked(true);
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
    if (!loading && isDemoSession) {
      const s = readStoredSkills();
      setProfile((prev) => ({ ...prev, skillList: s }));
    }
  }, [loading, isDemoSession]);

  useEffect(() => {
    if (!isDemoSessionChecked) return;

    if (!auth || !db) {
      if (isDemoSession) {
        setErrorText("Demo oturum aktif. Firebase baglantisi olmadan devam ediyorsunuz.");
        setLoading(false);
        return;
      }
      setErrorText("Firebase baglantisi eksik. Login sayfasina yonlendiriliyorsunuz.");
      setLoading(false);
      router.replace("/");
      return;
    }

    const firestore = db;
    const authClient = auth;

    const unsubscribe = onAuthStateChanged(authClient, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        if (isDemoSession) {
          setLoading(false);
          return;
        }
        setLoading(false);
        router.replace("/");
        return;
      }

      try {
        const snapshot = await getDoc(doc(firestore, "users", nextUser.uid));
        const raw = snapshot.exists() ? snapshot.data() : {};

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
          writeStoredSkills(skillList);
        }
        const rawActivities = Array.isArray(raw.activities) ? raw.activities : fallbackActivities;

        setProfile({
          fullName: typeof raw.fullName === "string" && raw.fullName ? raw.fullName : (nextUser.displayName ?? "Teamflow Kullanici"),
          bio:
            typeof raw.bio === "string" && raw.bio
              ? raw.bio
              : "",
          memberSince:
            typeof raw.memberSince === "string" && raw.memberSince
              ? raw.memberSince
              : "",
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
      } catch {
        setErrorText("Profil verisi okunurken bir hata olustu.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isDemoSession, isDemoSessionChecked, router]);

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
      <header className="border-b border-slate-200 bg-white">
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
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className="rounded-[var(--radius-md)] border border-slate-300 px-3 py-2 text-sm text-[var(--text-slate)] dark:border-white/15"
          >
            {darkMode ? "Acik mod" : "Koyu mod"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-12">
        <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-12">
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
                <p className="text-xs text-[var(--text-slate)]">
                  {user?.email ?? "demo@teamflow.com (Demo oturum)"}
                </p>
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
                onClick={async () => {
                  localStorage.removeItem("teamflow_demo_auth");
                  if (auth) {
                    await signOut(auth);
                  }
                  router.push("/");
                }}
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
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm text-[var(--text-slate)] dark:bg-white/10 dark:text-slate-200"
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
              onClick={() => {
                setModalSkills(profile.skillList.length ? profile.skillList : readStoredSkills());
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
                      writeStoredSkills(modalSkills);
                      if (user && db) {
                        await setDoc(
                          doc(db, "users", user.uid),
                          { skills: modalSkills, updatedAt: new Date().toISOString() },
                          { merge: true },
                        );
                      }
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
                    className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:-translate-y-1 hover:shadow-lg"
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
                    <button className="mt-2 h-9 w-full rounded-[var(--radius-md)] border border-slate-300 px-3 text-sm font-medium text-[var(--text-navy)]">
                      Detaylar
                    </button>
                  </article>
                ))
              )}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Ekiplerim">
              <div className="space-y-3">
                {profile.teams.length === 0 ? (
                  <p className="text-sm text-[var(--text-slate)]">Henuz ekip secimi yapilmadi.</p>
                ) : (
                  profile.teams.map((team) => (
                    <article key={team.name} className="rounded-[var(--radius-md)] bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-[var(--text-navy)]">{team.name}</p>
                      <p className="text-lg font-semibold text-[var(--text-navy)]">{team.project}</p>
                      <p className="text-sm text-[var(--text-slate)]">{team.role}</p>
                    </article>
                  ))
                )}
              </div>
            </Card>

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
