const express = require("express");
const router = express.Router();
const teamService = require("../services/team_service");
const { authMiddleware } = require("../middlewares/auth");
const { sendError } = require("../utils/response");

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Takım yönetimi
 */

/**
 * @swagger
 * /teams:
 *   get:
 *     summary: Takımları listeler
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: opp_id
 *         schema:
 *           type: string
 *         description: Fırsat ID sine göre filtrele
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get("/", async (req, res) => {
  try {
    const result = await teamService.getTeams(req.query.opp_id);
    res.json(result);
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.get("/:id/details", async (req, res) => {
  try {
    const result = await teamService.getTeamDetails(req.params.id);
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
 * /teams:
 *   post:
 *     summary: Yeni takım oluşturur
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               opp_id: { type: string }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Takım oluşturuldu
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const result = await teamService.createTeam(req.user.uid, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 400, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.delete("/:id/leave", authMiddleware, async (req, res) => {
  try {
    await teamService.leaveTeam(req.user.uid, req.params.id);
    res.json({ ok: true, message: "Ekipten ayrılındı" });
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 404, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await teamService.deleteTeam(req.user.uid, req.params.id);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : 403, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
