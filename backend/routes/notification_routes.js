const express = require("express");
const router = express.Router();
const notificationService = require("../services/notification_service");
const { authMiddleware } = require("../middlewares/auth");
const { sendError } = require("../utils/response");

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Bildirim yönetimi
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Kullanıcı bildirimlerini getirir
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bildirimler
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await notificationService.getNotifications(req.user.uid);
    res.json(result);
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.post("/send", async (req, res) => {
  try {
    const { target_label, message } = req.body;
    if (!target_label || !message) {
      return sendError(res, 400, "VALIDATION_ERROR", "target_label ve message zorunludur");
    }
    const result = await notificationService.sendNotification(target_label, message);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 404, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.patch("/read-all", async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.uid);
    res.json(result);
  } catch (err) {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const result = await notificationService.markAsRead(req.user.uid, req.params.id);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 404, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(req.user.uid, req.params.id);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) {
      const [code, msg] = err.message.split(":");
      return sendError(res, 404, code, msg);
    }
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
