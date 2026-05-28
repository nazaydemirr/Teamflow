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
  teams: Team[];
  type?: "hackathon" | "yarisma" | "bitirme-projesi" | string;
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
    deadline: "15 Nisan 2024",
    membersCurrent: 2,
    membersMax: 4,
    description:
      "Tarım verilerini yapay zeka ile analiz eden, çiftçilere erken uyarı ve verim önerileri sunan platform. Ekip, sensör entegrasyonu ve web arayüzü üzerinde çalışacak.",
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
        communication: "Discord"
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
        communication: "WhatsApp"
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
    deadline: "22 Nisan 2024",
    membersCurrent: 3,
    membersMax: 5,
    description:
      "Binalar ve küçük tesisler için enerji tüketimini gerçek zamanlı izleyen paneller ve raporlama modülü geliştirme.",
    teams: [
      { name: "Ekip A", full: false },
      { name: "Ekip B", full: false },
    ],
  },
  {
    id: "3",
    title: "Eğitim Platformu MVP",
    matchPercent: 61,
    author: "Mehmet Y.",
    authorInitials: "MY",
    tags: ["React", "Firebase", "Eğitim"],
    deadline: "1 Mayıs 2024",
    membersCurrent: 4,
    membersMax: 4,
    description: "Küçük kurs oluşturucular için video ve quiz destekli minimal öğrenme yönetim sistemi.",
    teams: [{ name: "Core", full: true }],
  },
  {
    id: "4",
    title: "Açık Kaynak Dokümantasyon Asistanı",
    matchPercent: 78,
    author: "Deniz L.",
    authorInitials: "DL",
    tags: ["Python", "AI", "LLM"],
    deadline: "10 Mayıs 2024",
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
      { name: "ML Modeli", full: false },
    ],
  },
  {
    id: "5",
    title: "Mobil Ödeme SDK Entegrasyonu",
    matchPercent: 54,
    author: "Cem T.",
    authorInitials: "CT",
    tags: ["TypeScript", "React Native", "Finans"],
    deadline: "18 Mayıs 2024",
    membersCurrent: 2,
    membersMax: 5,
    description: "Üçüncü parti banka ve sanal POS sağlayıcılarıyla güvenli ödeme akışı tasarlama.",
    teams: [{ name: "Mobile", full: false }],
  },
  {
    id: "6",
    title: "Veri Lake ETL Pipeline",
    matchPercent: 67,
    author: "Seda Ö.",
    authorInitials: "SÖ",
    tags: ["Python", "PostgreSQL", "Airflow"],
    deadline: "5 Haziran 2024",
    membersCurrent: 3,
    membersMax: 4,
    description: "Ham logları normalize ederek analitik için Parquet formatına dönüştüren planlı işler.",
    teams: [
      { name: "Data", full: false },
      { name: "Infra", full: false },
    ],
  },
  {
    id: "7",
    title: "HR Onboarding Mikro Frontend",
    matchPercent: 49,
    author: "Emre Y.",
    authorInitials: "EY",
    tags: ["React", "Module Federation"],
    deadline: "20 Haziran 2024",
    membersCurrent: 1,
    membersMax: 3,
    description: "Yeni işe başlayanların eğitim modüllerinin bağımsız deploy ile host uygulamaya bağlanması.",
    teams: [{ name: "Web", full: false }],
  },
  {
    id: "8",
    title: "Güvenlik Açığı Tarayıcı POC",
    matchPercent: 81,
    author: "Gizem A.",
    authorInitials: "GA",
    tags: ["Go", "Security", "CI"],
    deadline: "1 Temmuz 2024",
    membersCurrent: 2,
    membersMax: 3,
    description: "Repoda bağımlılık ve SAST uyarılarını birleştiren hafif tarama deneyleri.",
    teams: [{ name: "SecLab", full: false }],
  },
  {
    id: "9",
    title: "İç Dokümantasyon Portalı",
    matchPercent: 44,
    author: "Tolga Ş.",
    authorInitials: "TŞ",
    tags: ["Next.js", "MDX"],
    deadline: "12 Temmuz 2024",
    membersCurrent: 4,
    membersMax: 5,
    description: "Ekiplerin runbook ve ADR yazabileceği arama dostu dahili dokümantasyon sitesi.",
    teams: [
      { name: "Platform", full: false },
      { name: "DX", full: true },
    ],
  },
  {
    id: "10",
    title: "Gerçek Zamanlı Oyun Sunucusu",
    matchPercent: 73,
    author: "Kaan P.",
    authorInitials: "KP",
    tags: ["Node.js", "WebSocket", "Redis"],
    deadline: "30 Temmuz 2024",
    membersCurrent: 2,
    membersMax: 4,
    description: "Düşük gecikmeli oyuncu eşlemesi ve oda bazlı iletişim katmanı.",
    teams: [{ name: "Realtime", full: false }],
  },
  {
    id: "11",
    title: "Tedarik Zinciri Takip MVP",
    matchPercent: 58,
    author: "Leyla B.",
    authorInitials: "LB",
    tags: ["Node.js", "IoT"],
    deadline: "15 Ağustos 2024",
    membersCurrent: 3,
    membersMax: 5,
    description: "Kargo ve sıcaklık sensörlerinden gelen verilerle lot bazlı uyarıların üretildiği görünüm.",
    teams: [
      { name: "Ops", full: false },
      { name: "Fleet", full: false },
    ],
  },
  {
    id: "12",
    title: "Yapısal Tasarım Asistanı (CAD)",
    matchPercent: 39,
    author: "Mert Ç.",
    authorInitials: "MÇ",
    tags: ["C++", "Python", "3D"],
    deadline: "1 Eylül 2024",
    membersCurrent: 1,
    membersMax: 2,
    description: "Mühendislerin parametrik modellerinden otomatik rapor çıkaran prototip araç zinciri.",
    teams: [{ name: "Research", full: false }],
  },
];

export type OpportunitiesPage = {
  items: Opportunity[];
  nextCursor: string | null;
};

export function getOpportunitiesPage(limit: number, cursor: string | null | undefined): OpportunitiesPage {
  let customList: Opportunity[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("teamflow_custom_opportunities");
      if (stored) customList = JSON.parse(stored) as Opportunity[];
    } catch (e) {
      console.error("Failed to parse custom opportunities", e);
    }
  }

  const allOpportunities = [...customList, ...OPPORTUNITIES];

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
