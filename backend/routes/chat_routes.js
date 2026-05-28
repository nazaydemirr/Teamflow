const express = require("express");
const router = express.Router();
const chatService = require("../services/chat_service");
const { authMiddleware } = require("../middlewares/auth");
const { sendError } = require("../utils/response");

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Mesajlaşma sistemi
 */

/**
 * @swagger
 * /chat/{teamId}:
 *   get:
 *     summary: Takım mesajlarını getirir
 *     tags: [Chat]
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
 *         description: Mesajlar listesi
 */
router.get("/:teamId", async (req, res) => {
  try {
    const result = await chatService.getChats(req.user.uid, req.params.teamId);
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
 * /chat/{teamId}:
 *   post:
 *     summary: Mesaj gönderir
 *     tags: [Chat]
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
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Mesaj gönderildi
 */
router.post("/:teamId", async (req, res) => {
  try {
    const result = await chatService.sendChat(req.user.uid, req.params.teamId, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 400, code, msg, err.details);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
