import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { env, isFirebaseConfigured } from "@/lib/env";

export const firebaseApp = (() => {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length) return getApps()[0]!;
  return initializeApp({
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    appId: env.firebase.appId,
  });
})();

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

