import { env } from "@/lib/env";

export async function apiGet(path: string, token?: string) {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : `Request failed: ${res.status}`,
    );
  }

  return data;
}

