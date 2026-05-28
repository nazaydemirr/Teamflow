const express = require("express");
const router = express.Router();
const profileService = require("../services/profile_service");
const { authMiddleware } = require("../middlewares/auth");
const { sendError } = require("../utils/response");

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Kullanıcı profili işlemleri
 */

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Mevcut profil bilgilerini getirir
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil bilgileri
 */
router.get("/", async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user.uid);
    res.json(profile);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : 400, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const profile = await profileService.updateProfile(req.user.uid, req.body, false);
    res.status(201).json(profile);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "VALIDATION_ERROR" ? 400 : 404, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.patch("/", async (req, res) => {
  try {
    const profile = await profileService.updateProfile(req.user.uid, req.body, true);
    res.json(profile);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "VALIDATION_ERROR" ? 400 : 404, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.delete("/", async (req, res) => {
  try {
    await profileService.deleteProfile(req.user.uid);
    res.json({ ok: true, message: "Kullanıcı profili silindi" });
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
