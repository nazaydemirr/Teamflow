/** PRD G.02 — kategorize yetenek havuzu (Etiket seçimi / onboarding) */
export const SKILL_CATALOG: { category: string; tags: string[] }[] = [
  {
    category: "Frontend",
    tags: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vue", "Svelte", "Angular", "HTML/CSS", "Nuxt.js", "Redux", "Zustand", "Material UI", "Framer Motion"],
  },
  {
    category: "Backend",
    tags: ["Node.js", "Express", "PostgreSQL", "MongoDB", "REST API", "GraphQL", "NestJS", "Django", "Spring Boot", "Laravel", "MySQL", "Redis", "Kafka"],
  },
  {
    category: "AI / Veri Bilimi",
    tags: ["Python", "Machine Learning", "LLM", "PyTorch", "TensorFlow", "Pandas", "Hugging Face", "ETL", "Airflow", "Data Science", "Computer Vision", "NLP"],
  },
  {
    category: "Bulut & DevOps",
    tags: ["Firebase", "Docker", "Kubernetes", "CI/CD", "AWS", "GCP", "Azure", "Terraform", "Linux", "Nginx", "GitHub Actions", "Vercel", "Supabase"],
  },
  {
    category: "Mobil",
    tags: ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android", "Expo", "Dart"],
  },
  {
    category: "Oyun & Gömülü",
    tags: ["Unity", "Unreal Engine", "C#", "C++", "C", "Rust", "Go", "IoT", "Arduino"],
  },
  {
    category: "Tasarım & Ürün",
    tags: ["UI/UX", "Figma", "Adobe XD", "Photoshop", "Ürün Yönetimi", "Agile", "Scrum", "Proje Yönetimi", "Wireframing"],
  },
  {
    category: "Alan / Sektör",
    tags: ["Finans", "Eğitim", "Sağlık", "Oyun", "Siber Güvenlik", "E-Ticaret", "Web3", "Blockchain", "SaaS"],
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
