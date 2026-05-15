const express = require("express");
const cors = require("cors");
const { z } = require("zod");

// Firebase Admin (token doğrulama + Firestore erişimi)
// Bu dosyada sadece auth middleware'i tanımlıyoruz.
// Gerçek ortamda GOOGLE_APPLICATION_CREDENTIALS veya ADC ile çalışır.
const admin = require("firebase-admin");

function ensureFirebaseAdmin() {
  if (admin.apps.length) return;
  admin.initializeApp();
}

function sendError(res, statusCode, code, message, details) {
  const body = { code, message };
  if (details !== undefined) body.details = details;
  res.status(statusCode).json(body);
}

async function authMiddleware(req, res, next) {
  const auth = req.header("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return sendError(res, 401, "UNAUTHENTICATED", "Missing Bearer token");
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return sendError(res, 401, "UNAUTHENTICATED", "Empty Bearer token");
  }

  try {
    ensureFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid };
    return next();
  } catch (err) {
    return sendError(res, 401, "UNAUTHENTICATED", "Invalid token");
  }
}

const app = express();

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["authorization", "content-type"],
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/me", authMiddleware, async (req, res) => {
  res.json({ uid: req.user.uid, skills: [] });
});

// Örnek: request validation formatı (ileride PATCH /me için kullanılacak)
const exampleSchema = z.object({ example: z.string().min(1) });
app.post("/_validate-example", (req, res) => {
  const parsed = exampleSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten());
  }
  return res.json({ ok: true });
});

/** Feed listesi — imleç = bir sonraki kaydın dizinini temsil eden opak offset (cursor-based pagination MVP) */
const OPPORTUNITIES = [
  {
    id: "1",
    title: "AI Destekli Tarım Projesi",
    matchPercent: 85,
    author: "Zison Mohmet T",
    authorInitials: "ZM",
    tags: ["React", "Python", "Tarım", "AI"],
    deadline: "15 Nisan 2024",
    membersCurrent: 2,
    membersMax: 4,
    description:
      "Tarım verilerini yapay zeka ile analiz eden, çiftçilere erken uyarı ve verim önerileri sunan platform. Ekip, sensör entegrasyonu ve web arayüzü üzerinde çalışacak.",
    teams: [
      { name: "Sadi", full: false },
      { name: "Sani", full: true },
    ],
  },
  {
    id: "2",
    title: "Sürdürülebilir Enerji İzleme",
    matchPercent: 72,
    author: "Ayşe K.",
    authorInitials: "AK",
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
    description:
      "Küçük kurs oluşturucular için video ve quiz destekli minimal öğrenme yönetim sistemi.",
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
    description:
      "Repoyu tarayıp dokümantasyon önerileri ve PR açıklamaları üreten CLI ve web arayüzü.",
    teams: [
      { name: "Docs", full: false },
      { name: "ML", full: false },
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
    teams: [{ name: "Data", full: false }, { name: "Infra", full: false }],
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
    teams: [{ name: "Platform", full: false }, { name: "DX", full: true }],
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
    teams: [{ name: "Ops", full: false }, { name: "Fleet", full: false }],
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

/**
 * GET /opportunities?limit=…&cursor=… → { items, nextCursor }
 * cursor: sıradaki dizin (string); boş ise baştan.
 */
app.get("/opportunities", (req, res) => {
  const rawLimit = Number(req.query.limit);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 4, 1), 20);
  let start = 0;
  if (req.query.cursor != null && String(req.query.cursor).trim() !== "") {
    const parsed = parseInt(String(req.query.cursor), 10);
    if (!Number.isNaN(parsed) && parsed >= 0) start = parsed;
  }
  const items = OPPORTUNITIES.slice(start, start + limit);
  const nextOffset = start + items.length;
  const nextCursor = nextOffset < OPPORTUNITIES.length ? String(nextOffset) : null;
  res.json({ items, nextCursor });
});

app.use((req, res) => {
  sendError(res, 404, "NOT_FOUND", "Route not found", { method: req.method, path: req.path });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

