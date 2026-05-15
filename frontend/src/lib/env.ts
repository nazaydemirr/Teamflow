export const env = {
  /** Bos: ayni origin uzerinde /api/opportunities (Next Route Handler). Harici API icin or. http://localhost:8080 */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  },
};

export function isFirebaseConfigured() {
  return Boolean(
    env.firebase.apiKey &&
      env.firebase.authDomain &&
      env.firebase.projectId &&
      env.firebase.appId,
  );
}

