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

app.use((req, res) => {
  sendError(res, 404, "NOT_FOUND", "Route not found", { method: req.method, path: req.path });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

