"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { simulateDelay } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Steps: 1: Email, 2: OTP, 3: New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [statusText, setStatusText] = useState("");
  
  // Timer for OTP
  const [timer, setTimer] = useState(600); // 10 minutes (600 seconds)

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorText("");
    if (!email.trim() || !email.includes("@")) {
      setErrorText("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    
    setIsLoading(true);
    await simulateDelay(1200);
    setIsLoading(false);
    
    // Simulate finding user
    if (email === "demo@teamflow.com") {
      setStep(2);
      setTimer(600); // Reset to 10 mins
      // For demo, output code to console
      console.log("DEMO OTP KODU: 123456");
    } else {
      setErrorText("Bu e-posta adresi ile kayıtlı hesap bulunamadı.");
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorText("");
    
    if (timer <= 0) {
      setErrorText("Kodun süresi doldu. Lütfen tekrar deneyin.");
      return;
    }

    if (otp.length < 6) {
      setErrorText("Lütfen 6 haneli kodu girin.");
      return;
    }

    setIsLoading(true);
    await simulateDelay(1000);
    setIsLoading(false);

    if (otp === "123456") {
      setStep(3);
    } else {
      setErrorText("Girdiğiniz kod hatalı.");
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorText("");

    if (newPassword.length < 6) {
      setErrorText("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorText("Şifreler eşleşmiyor.");
      return;
    }

    setIsLoading(true);
    await simulateDelay(1500);
    setIsLoading(false);

    setStatusText("Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...");
    setTimeout(() => {
      router.replace("/login");
    }, 2000);
  }

  return (
    <AuthLayout 
      title="Şifrenizi mi Unuttunuz?" 
      subtitle="Şifrenizi sıfırlamak için e-posta adresinizi girin."
    >
      <div className="space-y-6">
        
        {/* Progress Dots */}
        <div className="flex gap-2 justify-center mb-8">
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-[var(--flow-blue)]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-[var(--flow-blue)]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-[var(--flow-blue)]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
        </div>

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in slide-in-from-right-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">
                Kayıtlı E-posta Adresiniz
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-[var(--text-navy)] focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)] disabled:opacity-50 dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100"
                placeholder="ornek@teamflow.com"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--flow-blue)] px-6 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? <Spinner /> : "Sıfırlama Kodu Gönder"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in slide-in-from-right-4">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 text-center">
              <b>{email}</b> adresine 6 haneli bir kod gönderdik. (Demo Kodu: 123456)
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300 flex justify-between">
                <span>Doğrulama Kodu</span>
                <span className={`font-mono ${timer < 60 ? 'text-red-500' : 'text-slate-400'}`}>
                  {formatTime(timer)}
                </span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading || timer <= 0}
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-center tracking-[0.5em] text-lg font-bold text-[var(--text-navy)] focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)] disabled:opacity-50 dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100"
                placeholder="------"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); }}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={isLoading || timer <= 0 || otp.length < 6}
                className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--flow-blue)] px-6 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? <Spinner /> : "Doğrula"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in slide-in-from-right-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">
                Yeni Şifre
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading || !!statusText}
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-[var(--text-navy)] focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)] disabled:opacity-50 dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100"
                autoFocus
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-navy)] dark:text-slate-300">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !!statusText}
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-[var(--text-navy)] focus:border-[var(--flow-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--flow-blue)] disabled:opacity-50 dark:border-slate-700/50 dark:bg-[#0c1118] dark:text-slate-100"
              />
            </div>

            {statusText ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                {statusText}
              </div>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--flow-blue)] to-indigo-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? <Spinner /> : "Şifreyi Güncelle"}
              </button>
            )}
          </form>
        )}

        {errorText && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 mt-4 animate-in fade-in">
            {errorText}
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 text-center">
            <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-[var(--text-navy)] dark:hover:text-slate-300 transition-colors">
              &larr; Giriş Ekranına Dön
            </Link>
          </div>
        )}
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
