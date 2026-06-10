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
export async function mockSocialLogin(provider: "google" | "github" | "linkedin", router: any) {
  await simulateDelay(1500); // 1.5 saniye network delay
  
  localStorage.setItem("teamflow_demo_auth", "true");
  // Default to frontend for demo purposes if it's a new social login
  localStorage.setItem("teamflow_demo_profile", "frontend");
  localStorage.setItem("teamflow_profile_id", `${provider}-${Math.floor(Math.random() * 10000)}`);
  localStorage.setItem("teamflow_display_name", `${provider === "google" ? "Google" : provider === "github" ? "GitHub" : "LinkedIn"} User`);
  
  router.replace("/feed");
}
