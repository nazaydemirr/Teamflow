const express = require("express");
const router = express.Router();
const authService = require("../services/auth_service");
const { sendError } = require("../utils/response");
const { authMiddleware } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Kullanıcı kimlik doğrulama
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı oluşturur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               displayName: { type: string }
 *     responses:
 *       201:
 *         description: Kullanıcı oluşturuldu
 */
router.post("/register", async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "VALIDATION_ERROR" || code === "EMAIL_EXISTS" ? 400 : 500, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kullanıcı girişi yapar
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Başarılı giriş, token döner
 */
router.post("/login", async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "UNAUTHENTICATED" ? 401 : 400, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : 400, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Kullanıcının profilini günceller (Onboarding)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               university: { type: string }
 *               department: { type: string }
 *               grade: { type: string }
 *               skills: { type: array, items: { type: string } }
 *               interests: { type: array, items: { type: string } }
 *               experience_level: { type: string }
 *               github_url: { type: string }
 *               linkedin_url: { type: string }
 *               website_url: { type: string }
 *     responses:
 *       200:
 *         description: Profil başarıyla güncellendi
 */
router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const result = await authService.updateProfile(req.user.uid, req.body);
    res.status(200).json(result);
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
