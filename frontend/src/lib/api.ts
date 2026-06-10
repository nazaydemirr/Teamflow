import { env } from "@/lib/env";

function resolveFetchUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  // Fallback to localhost:8080 to bypass remote server errors for local testing
  const base = "http://localhost:8080";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getAuthToken(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("teamflow_jwt") || undefined;
}

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(resolveFetchUrl(path), { ...options, headers });
  
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(res.ok ? "Geçersiz JSON yanıtı" : `İstek başarısız: ${res.status} (geçersiz gövde)`);
    }
  }

  if (!res.ok) {
    const msg = data && typeof data === "object" && data !== null && "message" in data && typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `İstek başarısız: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export async function apiGet(path: string) {
  return fetchWithAuth(path, { method: "GET", cache: "no-store" });
}

export async function apiPost(path: string, body?: unknown) {
  return fetchWithAuth(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export async function apiPatch(path: string, body?: unknown) {
  return fetchWithAuth(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
}

export async function apiDelete(path: string) {
  return fetchWithAuth(path, { method: "DELETE" });
}
