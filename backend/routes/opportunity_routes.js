const express = require("express");
const router = express.Router();
const opportunityService = require("../services/opportunity_service");
const { authMiddleware } = require("../middlewares/auth");
const { sendError } = require("../utils/response");

/**
 * @swagger
 * tags:
 *   name: Opportunities
 *   description: Fırsat/İlan yönetimi
 */

/**
 * @swagger
 * /opportunities:
 *   get:
 *     summary: Fırsatları listeler
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fırsatlar listesi
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = parseInt(req.query.cursor) || 0;
    const result = await opportunityService.getOpportunities(req.user.uid, limit, cursor);
    res.json(result);
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await opportunityService.getOpportunityById(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 404, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

/**
 * @swagger
 * /opportunities:
 *   post:
 *     summary: Yeni fırsat oluşturur
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               tags: { type: array, items: { type: string } }
 *               deadline: { type: string }
 *               membersMax: { type: integer }
 *     responses:
 *       201:
 *         description: Fırsat oluşturuldu
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const result = await opportunityService.createOpportunity(req.user.uid, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 400, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await opportunityService.updateOpportunity(req.user.uid, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 400, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await opportunityService.deleteOpportunity(req.user.uid, req.params.id);
    res.json({ ok: true, message: "Fırsat silindi" });
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : 403, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
