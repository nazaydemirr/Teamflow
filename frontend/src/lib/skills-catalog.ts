/** PRD G.02 — kategorize yetenek havuzu (Etiket seçimi / onboarding) */
export const SKILL_CATALOG: { category: string; tags: string[] }[] = [
  {
    category: "Frontend",
    tags: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vue", "Svelte"],
  },
  {
    category: "Backend",
    tags: ["Node.js", "Express", "PostgreSQL", "MongoDB", "REST API", "GraphQL"],
  },
  {
    category: "AI / Veri",
    tags: ["Python", "AI", "LLM", "PyTorch", "ETL", "Airflow"],
  },
  {
    category: "Bulut & DevOps",
    tags: ["Firebase", "Docker", "CI/CD", "GCP", "AWS"],
  },
  {
    category: "Mobil / Gömülü",
    tags: ["React Native", "Flutter", "IoT", "C++", "Go"],
  },
  {
    category: "Ürün",
    tags: ["UI/UX", "Figma", "Eğitim", "Finans", "Güvenlik", "3D"],
  },
];

export function allCatalogTags(): string[] {
  return SKILL_CATALOG.flatMap((c) => c.tags);
}

/** Profil/onboarding görünümü: katalog harici etiketler "Digər" grubunda gösterilir. */
export function groupSkillsForDisplay(flat: string[]): Record<string, string[]> {
  const catalog = new Set(allCatalogTags());
  const grouped: Record<string, string[]> = {};
  const seenFlat = new Set<string>();

  for (const bucket of SKILL_CATALOG) {
    const hit = bucket.tags.filter((t) => flat.includes(t));
    if (hit.length) grouped[bucket.category] = hit;
    hit.forEach((t) => seenFlat.add(t));
  }

  const other = flat.filter((t) => !catalog.has(t) && !seenFlat.has(t));
  if (other.length) grouped.Diger = other;
  return grouped;
}
