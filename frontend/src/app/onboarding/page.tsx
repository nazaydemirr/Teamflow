"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { simulateDelay } from "@/lib/auth";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const SKILLS_SUGGESTIONS = ["React", "Node.js", "Python", "Java", "Flutter", "UI/UX", "DevOps", "Next.js", "TypeScript", "C++", "C#", "Go", "Figma", "AWS", "Docker"];
const INTEREST_SUGGESTIONS = ["Hackathon", "Yarışmalar", "Bitirme Projeleri", "Startup Projeleri", "Açık Kaynak", "Web3", "Yapay Zeka", "Oyun Geliştirme"];
const EXP_LEVELS = [
  { id: "junior", label: "Junior", desc: "Öğrenci, yeni mezun veya 0-2 yıl deneyimli" },
  { id: "mid", label: "Mid-level", desc: "Sektörde 2-4 yıl aktif deneyimli" },
  { id: "senior", label: "Senior", desc: "Sektörde 5+ yıl deneyimli" },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState("");
  
  // Step 2
  const [skills, setSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  
  // Step 3
  const [interests, setInterests] = useState<string[]>([]);
  
  // Step 4
  const [expLevel, setExpLevel] = useState("");
  
  // Step 5
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  // Load from demo profile if exists
  useEffect(() => {
    const savedName = localStorage.getItem("teamflow_display_name");
    if (savedName) setName(savedName);
  }, []);

  // Filter skills
  const filteredSkills = SKILLS_SUGGESTIONS.filter(
    s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.includes(s)
  );

  const toggleSkill = (sk: string) => {
    if (skills.includes(sk)) setSkills(skills.filter(s => s !== sk));
    else setSkills([...skills, sk]);
  };

  const toggleInterest = (int: string) => {
    if (interests.includes(int)) setInterests(interests.filter(i => i !== int));
    else setInterests([...interests, int]);
  };

  async function completeOnboarding() {
    setIsLoading(true);
    
    try {
      const { apiPatch } = await import("@/lib/api");
      await apiPatch("/auth/profile", {
        university,
        department,
        grade,
        skills,
        interests,
        experience_level: expLevel,
        github_url: github,
        linkedin_url: linkedin,
        website_url: portfolio
      });
      
      // Onboarding complete, feed will load real data
      
      router.replace("/feed");
    } catch (err: any) {
      alert("Profil güncellenirken hata oluştu: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const goNext = () => setStep((prev) => Math.min(prev + 1, 5) as any);
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 1) as any);
  
  const skipToFeed = () => router.replace("/feed");

  const progress = step * 20;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 bg-[var(--surface)]">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-[var(--flow-blue)] p-1.5 shadow-sm">
            <svg className="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-[var(--font-fraunces)] text-lg font-bold text-[var(--text-navy)] dark:text-slate-100 hidden sm:inline-block">
            Teamflow
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <button onClick={skipToFeed} className="text-sm font-semibold text-slate-500 hover:text-[var(--text-navy)] dark:hover:text-slate-300 transition-colors">
            Sonra Tamamla
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
        <div 
          className="h-full bg-[var(--flow-blue)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-12">
        <div className="w-full max-w-xl">
          
          <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold text-[var(--text-navy)] dark:text-slate-100 mb-2">
              Profilini Tamamla
            </h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400">
              Sana en uygun ekipleri önerebilmemiz için profilini güçlendir. (%{progress} tamamlandı)
            </p>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-sm">
            
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 group-hover:border-[var(--flow-blue)] transition-colors overflow-hidden">
                      <svg className="size-8 text-slate-400 group-hover:text-[var(--flow-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold">Fotoğraf Seç</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">Ad Soyad</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">Üniversite</label>
                    <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100" placeholder="Örn: İTÜ" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">Bölüm</label>
                      <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100" placeholder="Bilgisayar Müh." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">Sınıf</label>
                      <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100 appearance-none">
                        <option value="">Seçiniz</option>
                        <option value="1">1. Sınıf</option>
                        <option value="2">2. Sınıf</option>
                        <option value="3">3. Sınıf</option>
                        <option value="4">4. Sınıf</option>
                        <option value="mezun">Mezun</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-navy)] dark:text-slate-100 mb-1">Teknik Yetenekler</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Platformda hangi araçları, dilleri veya yetkinlikleri sunabileceğini seç.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <svg className="absolute left-3 top-3.5 size-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                      type="text" 
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Yetenek ara (örn: React, Python)" 
                      className="w-full h-11 rounded-xl border border-slate-300 bg-white pl-9 pr-4 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100" 
                    />
                  </div>

                  {skills.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">Seçilenler</label>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(sk => (
                          <button key={sk} onClick={() => toggleSkill(sk)} className="flex items-center gap-1 rounded-lg bg-[var(--flow-blue)] px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                            {sk} <span>×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Önerilenler</label>
                    <div className="flex flex-wrap gap-2">
                      {filteredSkills.slice(0, 8).map(sk => (
                        <button key={sk} onClick={() => toggleSkill(sk)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-[var(--flow-blue)] hover:text-[var(--flow-blue)] transition-colors">
                          + {sk}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-navy)] dark:text-slate-100 mb-1">İlgi Alanları</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Teamflow'da en çok hangi alandaki projelere dahil olmak istersin?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INTEREST_SUGGESTIONS.map(int => {
                    const isSelected = interests.includes(int);
                    return (
                      <button 
                        key={int}
                        onClick={() => toggleInterest(int)}
                        className={`flex items-center p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-[var(--flow-blue)] bg-[var(--flow-blue)]/5 ring-1 ring-[var(--flow-blue)]' : 'border-slate-200 dark:border-slate-700 hover:border-[var(--flow-blue)]/50'}`}
                      >
                        <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${isSelected ? 'bg-[var(--flow-blue)] border-[var(--flow-blue)]' : 'border-slate-300 dark:border-slate-600'}`}>
                          {isSelected && <svg className="size-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-[var(--flow-blue)]' : 'text-slate-700 dark:text-slate-300'}`}>{int}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-navy)] dark:text-slate-100 mb-1">Deneyim Seviyesi</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Kendini hangi teknik veya mesleki seviyede konumlandırırsın?</p>
                </div>

                <div className="space-y-3">
                  {EXP_LEVELS.map(level => {
                    const isSelected = expLevel === level.id;
                    return (
                      <button 
                        key={level.id}
                        onClick={() => setExpLevel(level.id)}
                        className={`w-full flex items-start p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-[var(--flow-blue)] bg-[var(--flow-blue)]/5 ring-1 ring-[var(--flow-blue)]' : 'border-slate-200 dark:border-slate-700 hover:border-[var(--flow-blue)]/50'}`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex-shrink-0 mr-3 flex items-center justify-center ${isSelected ? 'border-[var(--flow-blue)]' : 'border-slate-300 dark:border-slate-600'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--flow-blue)]"></div>}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isSelected ? 'text-[var(--flow-blue)]' : 'text-slate-700 dark:text-slate-300'}`}>{level.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{level.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-navy)] dark:text-slate-100 mb-1">Sosyal & Portföy (Opsiyonel)</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Geçmiş projelerini veya kimliğini gösterebileceğin bağlantılar.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">GitHub</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm dark:border-slate-700/50 dark:bg-slate-800">github.com/</span>
                      <input type="text" value={github} onChange={(e) => setGithub(e.target.value)} className="flex-1 h-11 rounded-none rounded-r-xl border border-slate-300 bg-white px-3 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">LinkedIn</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm dark:border-slate-700/50 dark:bg-slate-800">linkedin.com/in/</span>
                      <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="flex-1 h-11 rounded-none rounded-r-xl border border-slate-300 bg-white px-3 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">Portföy / Kişisel Site</label>
                    <input type="text" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-[var(--flow-blue)] focus:outline-none dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100" placeholder="https://" />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <button 
                onClick={goPrev} 
                className={`px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[var(--text-navy)] dark:text-slate-400 dark:hover:text-slate-200 transition-colors ${step === 1 ? 'invisible' : ''}`}
              >
                &larr; Geri
              </button>
              
              {step < 5 ? (
                <button 
                  onClick={goNext}
                  className="flex items-center gap-2 rounded-xl bg-[var(--flow-blue)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 active:scale-95 transition-all"
                >
                  Devam Et &rarr;
                </button>
              ) : (
                <button 
                  onClick={completeOnboarding}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--flow-blue)] to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <svg className="animate-spin size-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : "Profili Tamamla"}
                </button>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
