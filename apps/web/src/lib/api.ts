import { env } from "@/lib/env";

function resolveFetchUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = (env.apiBaseUrl || "").trim().replace(/\/$/, "");
  if (base) return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return path.startsWith("/") ? path : `/${path}`;
}

export async function apiGet(path: string, token?: string) {
  const res = await fetch(resolveFetchUrl(path), {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(res.ok ? "Gecersiz JSON yaniti" : `Request failed: ${res.status} (gecersiz govde)`);
    }
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data !== null && "message" in data && typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

