const express = require("express");
const router = express.Router();
const applicationService = require("../services/application_service");
const { authMiddleware } = require("../middlewares/auth");
const { sendError } = require("../utils/response");

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Başvuru yönetimi
 */

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: Başvuruları listeler
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başvurular
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await applicationService.getApplications(req.user.uid, req.query.teamId);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : 403, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /applications/accept-invite:
 *   post:
 *     summary: Daveti kabul eder ve takıma katılır
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               team_id: { type: string }
 *     responses:
 *       200:
 *         description: Takıma katılındı
 */
router.post("/accept-invite", authMiddleware, async (req, res) => {
  try {
    const result = await applicationService.acceptInvite(req.user.uid, req.body.team_id);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 400, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Yeni başvuru yapar
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               team_id: { type: string }
 *     responses:
 *       201:
 *         description: Başvuru alındı
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const result = await applicationService.createApplication(req.user.uid, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 400, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.post("/:applicationId/decision", async (req, res) => {
  try {
    const result = await applicationService.handleDecision(req.user.uid, req.params.applicationId, req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 400, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
