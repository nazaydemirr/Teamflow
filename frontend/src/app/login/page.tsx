"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { simulateDelay, recordFailedLogin, resetLoginAttempts, checkRateLimit, handleSocialLogin } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemos, setShowDemos] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | "linkedin" | null>(null);
  
  const [errorText, setErrorText] = useState("");
  const [statusText, setStatusText] = useState("");
  
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    // Check rate limit on mount and set interval if locked
    const checkLimit = () => {
      const { isLocked, remainingSeconds } = checkRateLimit();
      if (isLocked) {
        setLockoutTimer(remainingSeconds);
      } else {
        setLockoutTimer(0);
      }
    };
    
    checkLimit();
    const interval = setInterval(checkLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleSocial(provider: "google" | "github" | "linkedin") {
    if (lockoutTimer > 0) return;
    setSocialLoading(provider);
    setErrorText("");
    await handleSocialLogin(provider, router);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lockoutTimer > 0) return;

    setErrorText("");
    setStatusText("");

    const emailValue = email.trim();
    if (!emailValue || !password.trim()) {
      setErrorText("E-posta ve şifre zorunludur.");
      return;
    }

    setIsLoading(true);

    try {
      // Regular auth validation via API
      if (emailValue.includes("@") && password.length > 0) {
        const { apiPost } = await import("@/lib/api");
        
        try {
          const res = await apiPost("/auth/login", { email: emailValue, password }) as { token: string, uid: string, email: string, displayName: string };
          
          resetLoginAttempts();
          setStatusText("Giriş başarılı. Yönlendiriliyorsunuz...");
          
          if (rememberMe) {
            localStorage.setItem("teamflow_jwt", res.token);
          } else {
            sessionStorage.setItem("teamflow_jwt", res.token);
          }

          localStorage.setItem("teamflow_demo_auth", "false"); // Gerçek kullanıcı!
          localStorage.removeItem("teamflow_demo_profile"); 
          localStorage.setItem("teamflow_profile_id", res.uid);
          localStorage.setItem("teamflow_display_name", res.displayName || "Kullanıcı");
          
          router.replace("/feed");
        } catch (err: any) {
          recordFailedLogin();
          const { isLocked } = checkRateLimit();
          if (isLocked) {
            setErrorText("Çok fazla başarısız deneme. Lütfen bekleyin.");
          } else {
            setErrorText(err.message || "Giriş başarısız.");
          }
        }
      } else {
        setErrorText("Lütfen geçerli bir e-posta ve şifre girin.");
      }
    } catch (err) {
      setErrorText("Bağlantı hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loginAsDemo(profile: string, name: string) {
    setIsLoading(true);
    
    try {
      await simulateDelay(800); // Mock network delay
      const uid = `demo-${profile}-${Math.floor(Math.random() * 1000)}`;
      const token = `fake-jwt-for-${profile}`;
      
      localStorage.setItem("teamflow_jwt", token);
      localStorage.setItem("teamflow_demo_auth", "true");
      localStorage.setItem("teamflow_demo_profile", profile);
      localStorage.setItem("teamflow_profile_id", uid);
      localStorage.setItem("teamflow_display_name", name);
      
      router.replace("/feed");
    } catch (err: any) {
      alert("Demo giriş hatası: " + err.message);
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout 
      title="Hoş Geldiniz" 
      subtitle="Devam etmek için hesabınıza giriş yapın."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => handleSocial("google")}
            disabled={!!socialLoading || lockoutTimer > 0}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-200 dark:hover:bg-white/5"
          >
            {socialLoading === "google" ? (
              <Spinner />
            ) : (
              <svg className="size-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Google
          </button>
          

          

        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            veya e-posta ile
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || lockoutTimer > 0}
              className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-[var(--text-navy)] focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)] disabled:opacity-50 dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100"
              placeholder="ornek@teamflow.com"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">
                Şifre
              </label>
              <Link 
                href="/forgot-password" 
                className="text-xs font-semibold text-[var(--flow-blue)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                tabIndex={-1}
              >
                Şifremi Unuttum
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || lockoutTimer > 0}
                className="w-full h-12 rounded-xl border border-slate-300 bg-white pl-4 pr-12 text-sm text-[var(--text-navy)] focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)] disabled:opacity-50 dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100"
                placeholder="Şifreniz (demo123)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[var(--flow-blue)] focus:outline-none"
              >
                {showPassword ? (
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-5 rounded border-2 border-slate-300 bg-transparent transition-colors peer-checked:border-[var(--flow-blue)] peer-checked:bg-[var(--flow-blue)] group-hover:border-[var(--flow-blue)] dark:border-slate-600"></div>
              <svg className="absolute size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400 select-none">Beni hatırla</span>
          </label>

          {lockoutTimer > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 flex items-center gap-2">
              <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>Çok fazla hatalı giriş yaptınız. <b>{lockoutTimer}</b> saniye sonra tekrar deneyin.</span>
            </div>
          )}

          {errorText && lockoutTimer === 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {errorText}
            </div>
          )}
          {statusText && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-[var(--flow-blue)] dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
              {statusText}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || lockoutTimer > 0}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--flow-blue)] to-indigo-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? <Spinner /> : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="font-semibold text-[var(--flow-blue)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Hemen kayıt olun
          </Link>
        </p>

        {/* Demo Login Flow */}
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          {!showDemos ? (
            <button
              type="button"
              onClick={() => setShowDemos(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition-all hover:border-[var(--flow-blue)] hover:bg-white hover:text-[var(--flow-blue)] dark:border-slate-700 dark:bg-[#0c1118]/50 dark:text-slate-400 dark:hover:border-[var(--flow-blue)] dark:hover:text-[var(--flow-blue)]"
            >
              Demo Hesaplarıyla Giriş Yap
            </button>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demo Profil Seçin</span>
                <button onClick={() => setShowDemos(false)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">İptal</button>
              </div>
              
              <button
                type="button"
                onClick={() => loginAsDemo("frontend", "Frontend Dev")}
                className="flex items-center justify-between w-full p-4 rounded-xl border border-[var(--flow-blue)]/20 bg-[var(--flow-blue)]/5 hover:bg-[var(--flow-blue)]/10 transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-bold text-[var(--flow-blue)] mb-0.5">Frontend Developer</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">demo@teamflow.com</div>
                </div>
                <svg className="size-5 text-[var(--flow-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemo("backend", "Backend Dev")}
                className="flex items-center justify-between w-full p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-0.5">Backend Developer</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">backend@teamflow.com</div>
                </div>
                <svg className="size-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemo("ai", "Yapay Zeka Uzmanı")}
                className="flex items-center justify-between w-full p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Yapay Zeka Uzmanı</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">ai@teamflow.com</div>
                </div>
                <svg className="size-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin size-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
