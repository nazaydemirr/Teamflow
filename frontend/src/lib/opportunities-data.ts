import { apiDelete, apiPatch, apiGet } from "@/lib/api";

export type Team = {
  id?: string;
  name: string;
  full: boolean;
  description?: string;
  membersMax?: number;
  membersCurrent?: number;
  rolesNeeded?: string[];
  technologies?: string[];
  level?: "Başlangıç" | "Orta" | "İleri";
  communication?: "Discord" | "WhatsApp" | "Telegram";
  isOwner?: boolean;
  leader?: { name: string; initials: string; role: string; id?: string; skills?: string[]; teamsCount?: number; leaderCount?: number; projectsCount?: number; university?: string; department?: string; github?: string; linkedin?: string; };
  members?: { id?: string; name: string; initials: string; role: string; skills?: string[]; teamsCount?: number; leaderCount?: number; projectsCount?: number; university?: string; department?: string; github?: string; linkedin?: string; }[];
};

export type Opportunity = {
  id: string;
  title: string;
  matchPercent: number;
  author: string;
  authorInitials: string;
  tags: string[];
  deadline: string;
  membersCurrent: number;
  membersMax: number;
  description: string;
  rules?: string;
  prize?: string;
  teams: Team[];
  type?: "hackathon" | "yarisma" | "bitirme-projesi" | string;
  createdAt?: string;
};

/** MVP ilan listesi — services/api/server.js ile aynı veri; Next /api ve harici API ile paylaşılır. */
export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "1",
    title: "AI Destekli Tarım Projesi",
    matchPercent: 85,
    author: "Teamflow Kullanici",
    authorInitials: "TK",
    tags: ["React", "Python", "Tarım", "AI"],
    deadline: "15 Nisan 2026",
    membersCurrent: 2,
    membersMax: 4,
    description:
      "Tarım verilerini yapay zeka ile analiz eden, çiftçilere erken uyarı ve verim önerileri sunan platform. Ekip, sensör entegrasyonu ve web arayüzü üzerinde çalışacak.",
    rules: "1. Tüm kod açık kaynak olmalıdır.\n2. Takımlar en fazla 4 kişi olabilir.\n3. Sunumlar İngilizce yapılacaktır.",
    prize: "1. Takıma 50.000 TL, 2. Takıma 30.000 TL, 3. Takıma 15.000 TL ödül verilecektir.",
    teams: [
      { 
        id: "t1",
        name: "Yapay Zeka ve Veri", 
        full: false,
        description: "IoT sensör verilerini analiz edip anomali tespiti yapacak modelin geliştirilmesi.",
        membersMax: 3,
        membersCurrent: 1,
        rolesNeeded: ["Veri Bilimi", "Backend Developer"],
        technologies: ["Python", "TensorFlow", "PostgreSQL"],
        level: "Orta",
        communication: "Discord",
        leader: { name: "Teamflow Kullanici", initials: "TK", role: "AI / ML Engineer", university: "Boğaziçi Üniversitesi", department: "Bilgisayar Mühendisliği", github: "https://github.com/teamflow", linkedin: "https://linkedin.com/in/teamflow" },
        members: [{ name: "Ahmet Yılmaz", initials: "AY", role: "Frontend Dev", university: "ODTÜ", department: "Yazılım Mühendisliği", github: "https://github.com/ahmetyilmaz", linkedin: "https://linkedin.com/in/ahmetyilmaz" }]
      },
      { 
        id: "t2",
        name: "Sensör Ekibi", 
        full: true,
        description: "Donanım entegrasyonu tamamlandı.",
        membersMax: 2,
        membersCurrent: 2,
        rolesNeeded: [],
        technologies: ["C++", "Arduino"],
        level: "İleri",
        communication: "WhatsApp",
        leader: { name: "Ahmet Y.", initials: "AY", role: "Full Stack", skills: ["React", "Python", "Node.js"], teamsCount: 3, leaderCount: 2, projectsCount: 4 },
        members: [
          { name: "Selin K.", initials: "SK", role: "UI/UX Designer", skills: ["Figma", "UI/UX", "Adobe XD"], teamsCount: 2, leaderCount: 0, projectsCount: 2 },
          { name: "Caner T.", initials: "CT", role: "Frontend", skills: ["React", "Tailwind", "Next.js"], teamsCount: 5, leaderCount: 1, projectsCount: 6 }
        ]
      },
    ],
  },
  {
    id: "2",
    title: "Sürdürülebilir Enerji İzleme",
    matchPercent: 72,
    author: "Teamflow Kullanici",
    authorInitials: "TK",
    tags: ["Next.js", "Node.js", "IoT"],
    deadline: "22 Nisan 2026",
    membersCurrent: 3,
    membersMax: 5,
    description:
      "Binalar ve küçük tesisler için enerji tüketimini gerçek zamanlı izleyen paneller ve raporlama modülü geliştirme.",
    teams: [
      { name: "Ekip A", full: false, membersCurrent: 2, membersMax: 4, description: "Frontend odaklı arayüz geliştirme", rolesNeeded: ["Frontend Developer"], technologies: ["React", "Next.js"] },
      { name: "Ekip B", full: false, membersCurrent: 1, membersMax: 3, description: "Backend ve sensör entegrasyonu", rolesNeeded: ["Backend Developer"], technologies: ["Node.js", "IoT"] },
    ],
  },
  {
    id: "3",
    title: "Eğitim Platformu MVP",
    matchPercent: 61,
    author: "Mehmet Y.",
    authorInitials: "MY",
    tags: ["React", "Firebase", "Eğitim"],
    deadline: "1 Mayıs 2026",
    membersCurrent: 4,
    membersMax: 4,
    description: "Küçük kurs oluşturucular için video ve quiz destekli minimal öğrenme yönetim sistemi.",
    teams: [{ name: "Core", full: true, membersCurrent: 4, membersMax: 4, description: "Çekirdek ekip tamamlandı", rolesNeeded: [], technologies: ["React", "Firebase"] }],
  },
  {
    id: "4",
    title: "Açık Kaynak Dokümantasyon Asistanı",
    matchPercent: 78,
    author: "Deniz L.",
    authorInitials: "DL",
    tags: ["Python", "AI", "LLM"],
    deadline: "10 Mayıs 2026",
    membersCurrent: 1,
    membersMax: 3,
    description: "Repoyu tarayıp dokümantasyon önerileri ve PR açıklamaları üreten CLI ve web arayüzü.",
    teams: [
      { 
        id: "t3",
        name: "Web Arayüzü", 
        full: false,
        description: "CLI aracının ürettiği veriyi görselleştirecek bir dashboard.",
        membersMax: 2,
        membersCurrent: 0,
        rolesNeeded: ["Frontend Developer", "UI/UX Designer"],
        technologies: ["React", "TailwindCSS"],
        level: "Başlangıç",
        communication: "Telegram"
      },
      { name: "ML Modeli", full: false, membersMax: 3, membersCurrent: 1, description: "Prompt engineering ve model entegrasyonu.", rolesNeeded: ["AI Engineer"], technologies: ["Python", "LLM"] },
    ],
  },
  {
    id: "5",
    title: "Mobil Ödeme SDK Entegrasyonu",
    matchPercent: 54,
    author: "Cem T.",
    authorInitials: "CT",
    tags: ["TypeScript", "React Native", "Finans"],
    deadline: "18 Mayıs 2026",
    membersCurrent: 2,
    membersMax: 5,
    description: "Üçüncü parti banka ve sanal POS sağlayıcılarıyla güvenli ödeme akışı tasarlama.",
    teams: [{ name: "Mobile", full: false, membersMax: 5, membersCurrent: 2, description: "React Native ödeme SDK geliştirme.", rolesNeeded: ["React Native Developer"], technologies: ["TypeScript", "React Native"] }],
  },
  {
    id: "6",
    title: "Veri Lake ETL Pipeline",
    matchPercent: 67,
    author: "Seda Ö.",
    authorInitials: "SÖ",
    tags: ["Python", "PostgreSQL", "Airflow"],
    deadline: "5 Haziran 2026",
    membersCurrent: 3,
    membersMax: 4,
    description: "Ham logları normalize ederek analitik için Parquet formatına dönüştüren planlı işler.",
    teams: [
      { name: "Data", full: false, membersMax: 2, membersCurrent: 1, description: "Veri dönüşümleri ve Airflow jobları", rolesNeeded: ["Data Engineer"], technologies: ["Python", "Airflow"] },
      { name: "Infra", full: false, membersMax: 2, membersCurrent: 2, description: "Veritabanı optimizasyonu (Ekip dolu)", rolesNeeded: [], technologies: ["PostgreSQL"] },
    ],
  },
  {
    id: "7",
    title: "HR Onboarding Mikro Frontend",
    matchPercent: 49,
    author: "Emre Y.",
    authorInitials: "EY",
    tags: ["React", "Module Federation"],
    deadline: "20 Haziran 2026",
    membersCurrent: 1,
    membersMax: 3,
    description: "Yeni işe başlayanların eğitim modüllerinin bağımsız deploy ile host uygulamaya bağlanması.",
    teams: [{ name: "Web", full: false, membersMax: 3, membersCurrent: 1, description: "Mikro frontend altyapısı", rolesNeeded: ["Frontend Developer"], technologies: ["React", "Module Federation"] }],
  },
  {
    id: "8",
    title: "Güvenlik Açığı Tarayıcı Yarışması",
    matchPercent: 81,
    author: "Gizem A.",
    authorInitials: "GA",
    tags: ["Go", "Security", "CI"],
    deadline: "1 Temmuz 2026",
    membersCurrent: 2,
    membersMax: 3,
    description: "Repoda bağımlılık ve SAST uyarılarını birleştiren hafif tarama deneyleri.",
    teams: [{ name: "SecLab", full: false, membersMax: 3, membersCurrent: 2, description: "CI entegrasyonu ve güvenlik testleri", rolesNeeded: ["Security Engineer"], technologies: ["Go", "Security", "CI"] }],
  },
  {
    id: "9",
    title: "İç Dokümantasyon Portalı",
    matchPercent: 44,
    author: "Tolga Ş.",
    authorInitials: "TŞ",
    tags: ["Next.js", "MDX"],
    deadline: "12 Temmuz 2026",
    membersCurrent: 4,
    membersMax: 5,
    description: "Ekiplerin runbook ve ADR yazabileceği arama dostu dahili dokümantasyon sitesi.",
    teams: [
      { name: "Platform", full: false, membersMax: 3, membersCurrent: 2, description: "Next.js ve MDX altyapısı", rolesNeeded: ["Frontend Developer"], technologies: ["Next.js", "MDX"] },
      { name: "DX", full: true, membersMax: 2, membersCurrent: 2, description: "Developer Experience takımı", rolesNeeded: [], technologies: ["TypeScript"] },
    ],
  },
  {
    id: "10",
    title: "Gerçek Zamanlı Oyun Sunucusu",
    matchPercent: 73,
    author: "Kaan P.",
    authorInitials: "KP",
    tags: ["Node.js", "WebSocket", "Redis"],
    deadline: "30 Temmuz 2026",
    membersCurrent: 2,
    membersMax: 4,
    description: "Düşük gecikmeli oyuncu eşlemesi ve oda bazlı iletişim katmanı.",
    teams: [{ name: "Realtime", full: false, membersMax: 4, membersCurrent: 2, description: "WebSocket ve Redis ile haberleşme", rolesNeeded: ["Backend Developer"], technologies: ["Node.js", "WebSocket"] }],
  },
  {
    id: "11",
    title: "Tedarik Zinciri Takip MVP",
    matchPercent: 58,
    author: "Leyla B.",
    authorInitials: "LB",
    tags: ["Node.js", "IoT"],
    deadline: "15 Ağustos 2026",
    membersCurrent: 3,
    membersMax: 5,
    description: "Kargo ve sıcaklık sensörlerinden gelen verilerle lot bazlı uyarıların üretildiği görünüm.",
    teams: [
      { name: "Ops", full: false, membersMax: 3, membersCurrent: 2, description: "Operasyon paneli arayüzü", rolesNeeded: ["Frontend Developer"], technologies: ["React"] },
      { name: "Fleet", full: false, membersMax: 2, membersCurrent: 1, description: "IoT veri işleme", rolesNeeded: ["Backend Developer"], technologies: ["Node.js", "IoT"] },
    ],
  },
  {
    id: "12",
    title: "Yapısal Tasarım Asistanı (CAD)",
    matchPercent: 39,
    author: "Mert Ç.",
    authorInitials: "MÇ",
    tags: ["C++", "Python", "3D"],
    deadline: "1 Eylül 2026",
    membersCurrent: 1,
    membersMax: 2,
    description: "Mühendislerin parametrik modellerinden otomatik rapor çıkaran prototip araç zinciri.",
    teams: [{ name: "Research", full: false, membersMax: 2, membersCurrent: 1, description: "Python ile CAD verisi işleme", rolesNeeded: ["C++ Developer"], technologies: ["C++", "Python", "3D"] }],
  },
];

export type OpportunitiesPage = {
  items: Opportunity[];
  nextCursor: string | null;
};

export function getAllOpportunities(): Opportunity[] {
  let customList: Opportunity[] = [];
  let deletedList: string[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("teamflow_custom_opportunities");
      if (stored) customList = JSON.parse(stored) as Opportunity[];
      const deleted = localStorage.getItem("teamflow_deleted_opportunities");
      if (deleted) deletedList = JSON.parse(deleted) as string[];
    } catch (e) {
      console.error("Failed to parse custom opportunities", e);
    }
  }

  const isDemo = typeof window !== "undefined" ? localStorage.getItem("teamflow_demo_auth") === "true" : false;
  const profileType = typeof window !== "undefined" ? localStorage.getItem("teamflow_demo_profile") : null;

  const baseList = isDemo ? customList : [...customList, ...OPPORTUNITIES];

  return baseList
    .filter(opp => !deletedList.includes(opp.id))
    .map(opp => {
    if (!isDemo || !profileType) return opp;
    
    // Her profilin kendi oluşturduğu takımları (lider olduğu projeleri) dinamik yapıyoruz
    if (profileType === "frontend") {
      if (opp.id === "4") return { ...opp, author: "Frontend Geliştirici (Demo)", authorInitials: "FG" };
      if (opp.id === "7") return { ...opp, author: "Frontend Geliştirici (Demo)", authorInitials: "FG" };
    } else if (profileType === "backend") {
      if (opp.id === "6") return { ...opp, author: "Backend Geliştirici (Demo)", authorInitials: "BG" };
      if (opp.id === "10") return { ...opp, author: "Backend Geliştirici (Demo)", authorInitials: "BG" };
    } else if (profileType === "ai") {
      if (opp.id === "1") return { ...opp, author: "Yapay Zeka Uzmanı (Demo)", authorInitials: "YU" };
      if (opp.id === "8") return { ...opp, author: "Yapay Zeka Uzmanı (Demo)", authorInitials: "YU" };
    }
    
    return opp;
  });
}

export function getOpportunitiesPage(limit: number, cursor: string | null | undefined): OpportunitiesPage {
  const allOpportunities = getAllOpportunities();
  let start = 0;
  if (cursor != null && String(cursor).trim() !== "") {
    const parsed = parseInt(String(cursor), 10);
    if (!Number.isNaN(parsed) && parsed >= 0) start = parsed;
  }
  const items = allOpportunities.slice(start, start + limit);
  const nextOffset = start + items.length;
  const nextCursor = nextOffset < allOpportunities.length ? String(nextOffset) : null;
  return { items, nextCursor };
}

export function deleteOpportunity(id: string) {
  if (typeof window === "undefined") return;
  const isStatic = OPPORTUNITIES.some(o => o.id === id);
  if (isStatic) {
    let deletedList: string[] = [];
    const deleted = localStorage.getItem("teamflow_deleted_opportunities");
    if (deleted) deletedList = JSON.parse(deleted);
    deletedList.push(id);
    localStorage.setItem("teamflow_deleted_opportunities", JSON.stringify(deletedList));
  } else {
    const stored = localStorage.getItem("teamflow_custom_opportunities");
    if (stored) {
      const customList = JSON.parse(stored) as Opportunity[];
      const filtered = customList.filter((opp) => opp.id !== id);
      localStorage.setItem("teamflow_custom_opportunities", JSON.stringify(filtered));
    }
  }
}


export function updateOpportunity(oppId: string, updates: Partial<Opportunity>) {
  if (typeof window === "undefined") return;
  const all = getAllOpportunities();
  const target = all.find(o => o.id === oppId);
  if (!target) return;

  const updated = { ...target, ...updates };
  
  const stored = localStorage.getItem("teamflow_custom_opportunities");
  let customList = stored ? JSON.parse(stored) as Opportunity[] : [];
  
  const customIndex = customList.findIndex(o => o.id === oppId);
  if (customIndex >= 0) {
    customList[customIndex] = updated;
  } else {
    customList.push(updated);
    const deleted = localStorage.getItem("teamflow_deleted_opportunities");
    let deletedList = deleted ? JSON.parse(deleted) as string[] : [];
    deletedList.push(oppId);
    localStorage.setItem("teamflow_deleted_opportunities", JSON.stringify(deletedList));
  }
  
  localStorage.setItem("teamflow_custom_opportunities", JSON.stringify(customList));
}

export async function deleteOpportunityAsync(oppId: string) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    deleteOpportunity(oppId);
    return;
  }
  
  await apiDelete(`/opportunities/${oppId}`);
}

export async function updateOpportunityAsync(oppId: string, updates: Partial<Opportunity>) {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    updateOpportunity(oppId, updates);
    return;
  }
  
  await apiPatch(`/opportunities/${oppId}`, updates);
}

export async function fetchMyOpportunities(): Promise<Opportunity[]> {
  if (typeof window !== "undefined" && localStorage.getItem("teamflow_demo_auth") === "true") {
    // Demo mantığı: Bütün fırsatları döndür, ardından çağıran yer (MyTeamsManager) filtrelesin.
    return getAllOpportunities();
  }
  
  try {
    const data = await apiGet("/opportunities/my") as { items: Opportunity[] };
    return data.items || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}
