export async function simulateDelay(ms: number = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate Limiting (Local Storage Tabanlı Simülasyon)
const RATE_LIMIT_KEY = "teamflow_login_attempts";
const LOCKOUT_DURATION = 15000; // 15 saniye

export function recordFailedLogin() {
  if (typeof window === "undefined") return;
  
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  const data = raw ? JSON.parse(raw) : { count: 0, lockoutUntil: null };

  if (data.lockoutUntil && Date.now() < data.lockoutUntil) {
    return; // Already locked out
  }

  data.count += 1;
  
  if (data.count >= 3) {
    data.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    data.count = 0; // Reset count for next time
  }

  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
}

export function resetLoginAttempts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RATE_LIMIT_KEY);
}

export function checkRateLimit(): { isLocked: boolean; remainingSeconds: number } {
  if (typeof window === "undefined") return { isLocked: false, remainingSeconds: 0 };
  
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  if (!raw) return { isLocked: false, remainingSeconds: 0 };

  const data = JSON.parse(raw);
  if (data.lockoutUntil && Date.now() < data.lockoutUntil) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((data.lockoutUntil - Date.now()) / 1000)
    };
  }

  return { isLocked: false, remainingSeconds: 0 };
}

// Ortak Sosyal Giriş Davranışı
export async function handleSocialLogin(provider: "google" | "github" | "linkedin", router: any) {
  try {
    const { apiPost } = await import("@/lib/api");
    let displayName = `${provider === "google" ? "Google" : provider === "github" ? "GitHub" : "LinkedIn"} User`;
    let email = `${provider}_user@teamflow.mock`;

    if (provider === "google") {
      const { auth } = await import("@/lib/firebase");
      if (auth) {
        try {
          const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
          const fbProvider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, fbProvider);
          if (result.user) {
            email = result.user.email || email;
            displayName = result.user.displayName || displayName;
          }
        } catch (firebaseErr) {
          console.warn("Firebase Auth Error (Lütfen geçerli bir Firebase API Key girin):", firebaseErr);
        }
      }
    }
    
    const res = await apiPost("/auth/social-login", { provider, email, displayName }) as { token: string, uid: string, displayName: string };

    localStorage.setItem("teamflow_jwt", res.token);
    localStorage.setItem("teamflow_demo_auth", "false"); // Ensure demo mode is OFF
    localStorage.removeItem("teamflow_demo_profile");
    localStorage.setItem("teamflow_profile_id", res.uid);
    localStorage.setItem("teamflow_display_name", res.displayName || displayName);
    
    router.replace("/feed");
  } catch (err: any) {
    console.warn("Sosyal giriş hatası (Backend sunucusu kapalı olabilir):", err.message || err);
    // Fallback if backend doesn't support social-login yet (e.g., pending deployment)
    await simulateDelay(1000);
    localStorage.setItem("teamflow_demo_auth", "false");
    localStorage.removeItem("teamflow_demo_profile");
    localStorage.setItem("teamflow_profile_id", `${provider}-fallback`);
    localStorage.setItem("teamflow_display_name", `${provider === "google" ? "Google" : provider === "github" ? "GitHub" : "LinkedIn"} User`);
    router.replace("/feed");
  }
}
