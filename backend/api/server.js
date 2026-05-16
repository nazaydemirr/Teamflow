const express = require("express");
const cors = require("cors");
const { z } = require("zod");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Sadece Firestore erişimi için kullanıyoruz, Auth için kendi JWT yapımızı kuracağız.
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-teamflow-jwt-key";

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
    const decoded = jwt.verify(token, JWT_SECRET);
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

const port = Number(process.env.PORT || 8080);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TeamFlow API",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [__filename],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: API health check
 *     description: API'nin sağlıklı çalışıp çalışmadığını kontrol eder.
 *     responses:
 *       200:
 *         description: Sağlıklı yanıt döndürür.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Yeni bir kullanıcı kaydeder ve JWT döner.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Başarılı kayıt.
 *       400:
 *         description: E-posta zaten kullanımda veya geçersiz veri.
 */
app.post("/auth/register", async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return sendError(res, 400, "VALIDATION_ERROR", "email, password ve displayName zorunludur.");
  }

  try {
    ensureFirebaseAdmin();
    const db = admin.firestore();
    const usersRef = db.collection("users");
    
    // Check if email already exists
    const snapshot = await usersRef.where("email", "==", email).get();
    if (!snapshot.empty) {
      return sendError(res, 400, "EMAIL_EXISTS", "Bu e-posta adresi zaten kullanımda.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user document
    const docRef = await usersRef.add({
      email,
      passwordHash,
      displayName,
      skills: [], // Default skills
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const token = jwt.sign({ uid: docRef.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, uid: docRef.id, email, displayName });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Kullanıcı girişi yapar ve JWT döner.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Başarılı giriş.
 *       401:
 *         description: Geçersiz e-posta veya şifre.
 */
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 400, "VALIDATION_ERROR", "email ve password zorunludur.");
  }

  try {
    ensureFirebaseAdmin();
    const db = admin.firestore();
    
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) {
      return sendError(res, 401, "UNAUTHENTICATED", "Geçersiz e-posta veya şifre.");
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.passwordHash || "");
    if (!isMatch) {
      return sendError(res, 401, "UNAUTHENTICATED", "Geçersiz e-posta veya şifre.");
    }

    const token = jwt.sign({ uid: userDoc.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ token, uid: userDoc.id, email: userData.email, displayName: userData.displayName });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Şifreyi doğrudan sıfırlar (Geliştirme ortamı için).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Şifre başarıyla güncellendi.
 *       404:
 *         description: Kullanıcı bulunamadı.
 */
app.post("/auth/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return sendError(res, 400, "VALIDATION_ERROR", "email ve newPassword zorunludur.");
  }

  if (newPassword.length < 6) {
    return sendError(res, 400, "VALIDATION_ERROR", "Yeni şifre en az 6 karakter olmalıdır.");
  }

  try {
    ensureFirebaseAdmin();
    const db = admin.firestore();
    
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) {
      return sendError(res, 404, "NOT_FOUND", "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.");
    }

    const userDoc = snapshot.docs[0];
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await userDoc.ref.update({
      passwordHash,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Şifreniz başarıyla güncellendi." });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /me:
 *   get:
 *     tags: [Profile]
 *     summary: Mevcut kullanıcının profilini getirir.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı profili başarıyla getirildi.
 *       404:
 *         description: Kullanıcı bulunamadı.
 */
app.get("/me", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const doc = await db.collection("users").doc(req.user.uid).get();
    if (!doc.exists) {
      return sendError(res, 404, "NOT_FOUND", "Kullanıcı profili bulunamadı");
    }
    res.json({ uid: req.user.uid, ...doc.data() });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

const userSchema = z.object({
  displayName: z.string().min(1, "displayName boş olamaz"),
  skills: z.array(z.string()).min(3, "En az 3 yetenek seçilmelidir"),
  website_url: z.string().url("Geçerli bir URL olmalıdır").optional().or(z.literal("")),
});

/**
 * @swagger
 * /me:
 *   post:
 *     tags: [Profile]
 *     summary: Kullanıcı profili oluşturur.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *               - skills
 *             properties:
 *               displayName:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               website_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profil başarıyla oluşturuldu.
 */
app.post("/me", authMiddleware, async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());
  }

  try {
    const db = admin.firestore();
    const userData = parsed.data;
    await db.collection("users").doc(req.user.uid).set(userData);
    res.status(201).json({ uid: req.user.uid, ...userData });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

const userUpdateSchema = userSchema.partial();

/**
 * @swagger
 * /me:
 *   patch:
 *     tags: [Profile]
 *     summary: Kullanıcı profilini günceller.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               website_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil başarıyla güncellendi.
 */
app.patch("/me", authMiddleware, async (req, res) => {
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());
  }

  try {
    const db = admin.firestore();
    const docRef = db.collection("users").doc(req.user.uid);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return sendError(res, 404, "NOT_FOUND", "Güncellenecek profil bulunamadı");
    }

    await docRef.update(parsed.data);
    res.json({ uid: req.user.uid, ...doc.data(), ...parsed.data });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /me:
 *   delete:
 *     tags: [Profile]
 *     summary: Kullanıcı profilini siler.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil başarıyla silindi.
 */
app.delete("/me", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    await db.collection("users").doc(req.user.uid).delete();
    res.json({ ok: true, message: "Kullanıcı profili silindi" });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

const oppSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string().min(1, "Açıklama zorunludur"),
  tags: z.array(z.string()).min(1, "En az 1 etiket gerekli"),
  deadline: z.string().datetime("Geçerli bir ISO 8601 tarihi olmalıdır"),
  membersMax: z.number().int().positive("Pozitif bir sayı olmalıdır"),
});

const oppUpdateSchema = oppSchema.partial();

/**
 * @swagger
 * /opportunities:
 *   get:
 *     tags: [Opportunities]
 *     summary: Fırsatları yetenek eşleşme oranına (matchScore) göre sıralı listeler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: Sayfalama için cursor (başlangıç indeksi)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Getirilecek kayıt sayısı (varsayılan 20)
 *     responses:
 *       200:
 *         description: Başarılı
 */
app.get("/opportunities", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const userSkills = userDoc.exists && userDoc.data().skills ? userDoc.data().skills : [];

    const limitQuery = parseInt(req.query.limit) || 20;
    const cursorQuery = parseInt(req.query.cursor) || 0;

    const snapshotRaw = await db.collection("opportunities").get();

    let items = snapshotRaw.docs.map(doc => {
      const data = doc.data();
      const oppTags = data.tags || [];
      
      let matchScore = 0;
      if (oppTags.length > 0) {
        const intersection = userSkills.filter(skill => oppTags.includes(skill));
        matchScore = Math.round((100 * intersection.length) / oppTags.length);
      }
      
      return { id: doc.id, ...data, matchScore };
    });

    items.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const paginatedItems = items.slice(cursorQuery, cursorQuery + limitQuery);
    const nextCursor = cursorQuery + limitQuery < items.length ? String(cursorQuery + limitQuery) : null;

    res.json({ items: paginatedItems, nextCursor });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /opportunities/{id}:
 *   get:
 *     tags: [Opportunities]
 *     summary: Belirli bir fırsatı getirir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Başarılı
 */
app.get("/opportunities/:id", async (req, res) => {
  try {
    const db = admin.firestore();
    const doc = await db.collection("opportunities").doc(req.params.id).get();
    if (!doc.exists) return sendError(res, 404, "NOT_FOUND", "Fırsat bulunamadı");
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /opportunities:
 *   post:
 *     tags: [Opportunities]
 *     summary: Yeni fırsat oluşturur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               deadline:
 *                 type: string
 *               membersMax:
 *                 type: number
 *     responses:
 *       201:
 *         description: Fırsat oluşturuldu
 */
app.post("/opportunities", authMiddleware, async (req, res) => {
  const parsed = oppSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());

  try {
    const db = admin.firestore();
    const data = {
      ...parsed.data,
      author_id: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("opportunities").add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /opportunities/{id}:
 *   patch:
 *     tags: [Opportunities]
 *     summary: Fırsatı günceller
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Fırsat güncellendi
 */
app.patch("/opportunities/:id", authMiddleware, async (req, res) => {
  const parsed = oppUpdateSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());

  try {
    const db = admin.firestore();
    const docRef = db.collection("opportunities").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return sendError(res, 404, "NOT_FOUND", "Fırsat bulunamadı");
    if (doc.data().author_id !== req.user.uid) return sendError(res, 403, "FORBIDDEN", "Yetkisiz işlem");

    await docRef.update(parsed.data);
    res.json({ id: docRef.id, ...doc.data(), ...parsed.data });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /opportunities/{id}:
 *   delete:
 *     tags: [Opportunities]
 *     summary: Fırsatı siler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fırsat silindi
 */
app.delete("/opportunities/:id", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("opportunities").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return sendError(res, 404, "NOT_FOUND", "Fırsat bulunamadı");
    if (doc.data().author_id !== req.user.uid) return sendError(res, 403, "FORBIDDEN", "Yetkisiz işlem");

    await docRef.delete();
    res.json({ ok: true, message: "Fırsat silindi" });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

const teamSchema = z.object({
  opp_id: z.string().min(1, "opp_id zorunludur")
});

/**
 * @swagger
 * /teams:
 *   get:
 *     tags: [Teams]
 *     summary: Ekipleri listeler
 *     parameters:
 *       - in: query
 *         name: opp_id
 *         schema:
 *           type: string
 *         description: İlana ait ekipleri filtrelemek için opp_id
 *     responses:
 *       200:
 *         description: Başarılı
 */
app.get("/teams", async (req, res) => {
  try {
    const { opp_id } = req.query;
    const db = admin.firestore();
    let query = db.collection("teams");
    if (opp_id) query = query.where("opp_id", "==", String(opp_id));
    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ items });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /teams:
 *   post:
 *     tags: [Teams]
 *     summary: Yeni ekip oluşturur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               opp_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ekip oluşturuldu
 */
app.post("/teams", authMiddleware, async (req, res) => {
  const parsed = teamSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());

  try {
    const db = admin.firestore();
    const data = {
      opp_id: parsed.data.opp_id,
      leader_id: req.user.uid,
      members: [req.user.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("teams").add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

const applicationSchema = z.object({
  opp_id: z.string().min(1, "opp_id zorunludur"),
  team_id: z.string().min(1, "team_id zorunludur")
});

const decisionSchema = z.object({
  decision: z.enum(["approve", "reject"])
});

/**
 * @swagger
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: Başvuruları listeler
 *     description: Lider için takıma gelen pending başvuruları veya kullanıcının kendi başvurularını listeler.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: (Lider için) Belirli bir takıma gelen pending başvurular
 *     responses:
 *       200:
 *         description: Başarılı
 */
app.get("/applications", authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.query;
    const db = admin.firestore();
    
    if (teamId) {
      const teamDoc = await db.collection("teams").doc(String(teamId)).get();
      if (!teamDoc.exists) return sendError(res, 404, "NOT_FOUND", "Ekip bulunamadı");
      if (teamDoc.data().leader_id !== req.user.uid) return sendError(res, 403, "FORBIDDEN", "Yetkiniz yok");
      
      const snapshot = await db.collection("applications")
        .where("team_id", "==", String(teamId))
        .where("status", "==", "pending")
        .get();
        
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ items });
    } else {
      const snapshot = await db.collection("applications")
        .where("applicant_id", "==", req.user.uid)
        .get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ items });
    }
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /applications:
 *   post:
 *     tags: [Applications]
 *     summary: Yeni başvuru oluşturur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               opp_id:
 *                 type: string
 *               team_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Başvuru oluşturuldu
 */
app.post("/applications", authMiddleware, async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());

  try {
    const db = admin.firestore();
    
    const userAppsSnapshot = await db.collection("applications")
      .where("applicant_id", "==", req.user.uid)
      .where("status", "==", "pending")
      .get();
      
    if (userAppsSnapshot.size >= 3) {
      return sendError(res, 400, "LIMIT_REACHED", "En fazla 3 aktif (pending) başvuru yapabilirsiniz.");
    }
    
    const teamDoc = await db.collection("teams").doc(parsed.data.team_id).get();
    if (!teamDoc.exists) return sendError(res, 404, "NOT_FOUND", "Ekip bulunamadı");
    
    if (teamDoc.data().members.includes(req.user.uid)) {
      return sendError(res, 400, "ALREADY_MEMBER", "Zaten bu ekibin üyesisiniz.");
    }

    const data = {
      opp_id: parsed.data.opp_id,
      team_id: parsed.data.team_id,
      applicant_id: req.user.uid,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("applications").add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /applications/{applicationId}/decision:
 *   post:
 *     tags: [Applications]
 *     summary: Liderin başvuruyu onaylaması veya reddetmesi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: Başvuru durumu güncellendi
 */
app.post("/applications/:applicationId/decision", authMiddleware, async (req, res) => {
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());

  try {
    const db = admin.firestore();
    const appRef = db.collection("applications").doc(req.params.applicationId);
    
    await db.runTransaction(async (t) => {
      const appDoc = await t.get(appRef);
      if (!appDoc.exists) throw new Error("NOT_FOUND:Başvuru bulunamadı");
      
      const appData = appDoc.data();
      if (appData.status !== "pending") throw new Error("INVALID_STATE:Başvuru zaten değerlendirilmiş");
      
      const teamRef = db.collection("teams").doc(appData.team_id);
      const teamDoc = await t.get(teamRef);
      
      if (!teamDoc.exists) throw new Error("NOT_FOUND:Ekip bulunamadı");
      if (teamDoc.data().leader_id !== req.user.uid) throw new Error("FORBIDDEN:Yetkisiz işlem");
      
      if (parsed.data.decision === "approve") {
        t.update(teamRef, {
          members: admin.firestore.FieldValue.arrayUnion(appData.applicant_id)
        });
        t.update(appRef, { status: "approved", updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        
        const notifRef = db.collection("users").doc(appData.applicant_id).collection("notifications").doc();
        t.set(notifRef, {
          message: "Tebrikler! Bir ekibe başvurunuz onaylandı.",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        t.update(appRef, { status: "rejected", updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        
        const notifRef = db.collection("users").doc(appData.applicant_id).collection("notifications").doc();
        t.set(notifRef, {
          message: "Maalesef bir ekibe başvurunuz reddedildi.",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    res.json({ ok: true, message: `Başvuru ${parsed.data.decision === "approve" ? "onaylandı" : "reddedildi"}` });
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 400, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /teams/{id}/leave:
 *   delete:
 *     tags: [Teams]
 *     summary: Ekipten ayrılır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ekipten ayrılındı
 */
app.delete("/teams/:id/leave", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("teams").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return sendError(res, 404, "NOT_FOUND", "Ekip bulunamadı");

    await docRef.update({
      members: admin.firestore.FieldValue.arrayRemove(req.user.uid)
    });

    res.json({ ok: true, message: "Ekipten ayrılındı" });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /chats/{teamId}:
 *   get:
 *     tags: [Chats]
 *     summary: Ekip içi mesajları listeler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Başarılı
 */
app.get("/chats/:teamId", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const teamDoc = await db.collection("teams").doc(req.params.teamId).get();
    if (!teamDoc.exists) return sendError(res, 404, "NOT_FOUND", "Ekip bulunamadı");
    
    const isMember = teamDoc.data().members.includes(req.user.uid) || teamDoc.data().leader_id === req.user.uid;
    if (!isMember) return sendError(res, 403, "FORBIDDEN", "Bu ekibin mesajlarını göremezsiniz");

    const snapshot = await db.collection("teams").doc(req.params.teamId).collection("messages").orderBy("timestamp", "asc").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ items });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

const chatSchema = z.object({
  text: z.string().min(1, "Mesaj boş olamaz")
});

/**
 * @swagger
 * /chats/{teamId}:
 *   post:
 *     tags: [Chats]
 *     summary: Ekibe mesaj gönderir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mesaj gönderildi
 */
app.post("/chats/:teamId", authMiddleware, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten());

  try {
    const db = admin.firestore();
    const teamDoc = await db.collection("teams").doc(req.params.teamId).get();
    if (!teamDoc.exists) return sendError(res, 404, "NOT_FOUND", "Ekip bulunamadı");
    
    const isMember = teamDoc.data().members.includes(req.user.uid) || teamDoc.data().leader_id === req.user.uid;
    if (!isMember) return sendError(res, 403, "FORBIDDEN", "Bu ekibe mesaj gönderemezsiniz");

    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const senderName = userDoc.exists ? userDoc.data().displayName : "Bilinmeyen Kullanıcı";

    const data = {
      teamId: req.params.teamId,
      senderId: req.user.uid,
      senderName,
      text: parsed.data.text,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection("teams").doc(req.params.teamId).collection("messages").add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Bildirimleri listeler
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 */
app.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("users").doc(req.user.uid).collection("notifications").orderBy("createdAt", "desc").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ items });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Bildirimi okundu işaretler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bildirim güncellendi
 */
app.patch("/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("users").doc(req.user.uid).collection("notifications").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return sendError(res, 404, "NOT_FOUND", "Bildirim bulunamadı");
    
    await docRef.update({ read: true });
    res.json({ ok: true });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Tüm bildirimleri okundu işaretler
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bildirimler güncellendi
 */
app.patch("/notifications/read-all", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const batch = db.batch();
    const snapshot = await db.collection("users").doc(req.user.uid).collection("notifications").where("read", "==", false).get();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    res.json({ ok: true, count: snapshot.size });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Bildirimi siler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bildirim silindi
 */
app.delete("/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const db = admin.firestore();
    const docRef = db.collection("users").doc(req.user.uid).collection("notifications").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return sendError(res, 404, "NOT_FOUND", "Bildirim bulunamadı");
    
    await docRef.delete();
    res.json({ ok: true });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

app.use((req, res) => {
  sendError(res, 404, "NOT_FOUND", "Route not found", { method: req.method, path: req.path });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

