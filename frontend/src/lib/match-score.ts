/**
 * AC.01 — kullanıcı yetenekleri ile ilan etiketleri kesişim oranı (%).
 * oppTags boşsa 0 döner.
 */
export function intersectionMatchPercent(userSkills: string[], oppTags: string[]): number {
  if (!oppTags.length) return 0;
  const userSet = new Set(userSkills.map((s) => s.toLocaleLowerCase("tr-TR")));
  let inter = 0;
  for (const t of oppTags) {
    if (userSet.has(t.toLocaleLowerCase("tr-TR"))) inter += 1;
  }
  return Math.round((100 * inter) / oppTags.length);
}
