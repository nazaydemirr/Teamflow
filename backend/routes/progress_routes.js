const express = require("express");
const router = express.Router();
const progressService = require("../services/progress_service");
const { authMiddleware } = require("../middlewares/auth");
const { sendError } = require("../utils/response");

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: İlerleme ve Milestone takibi
 */

// /progress/teams/:teamId
/**
 * @swagger
 * /progress/teams/{teamId}:
 *   get:
 *     summary: Takımın genel progress'ini getirir
 *     tags: [Progress]
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
router.get("/teams/:teamId", async (req, res) => {
  try {
    const result = await progressService.getTeamProgress(req.user.uid, req.params.teamId);
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
 * /progress/teams/{teamId}/milestones:
 *   get:
 *     summary: Takımın milestone'larını getirir
 *     tags: [Progress]
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
router.get("/teams/:teamId/milestones", async (req, res) => {
  try {
    const result = await progressService.getMilestones(req.user.uid, req.params.teamId);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) return sendError(res, 403, err.message.split(":")[0], err.message.split(":")[1]);
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.post("/teams/:teamId/milestones", async (req, res) => {
  try {
    const result = await progressService.createMilestone(req.user.uid, req.params.teamId, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes(":")) return sendError(res, 400, err.message.split(":")[0], err.message.split(":")[1]);
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.patch("/milestones/:milestoneId/status", async (req, res) => {
  try {
    const result = await progressService.updateMilestoneStatus(req.user.uid, req.params.milestoneId, req.body);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) return sendError(res, 400, err.message.split(":")[0], err.message.split(":")[1]);
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.get("/milestones/:milestoneId/tasks", async (req, res) => {
  try {
    const result = await progressService.getTasks(req.user.uid, req.params.milestoneId);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) return sendError(res, 403, err.message.split(":")[0], err.message.split(":")[1]);
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.post("/milestones/:milestoneId/tasks", async (req, res) => {
  try {
    const result = await progressService.createTask(req.user.uid, req.params.milestoneId, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes(":")) return sendError(res, 400, err.message.split(":")[0], err.message.split(":")[1]);
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

router.patch("/tasks/:taskId/status", async (req, res) => {
  try {
    const result = await progressService.updateTaskStatus(req.user.uid, req.params.taskId, req.body);
    res.json(result);
  } catch (err) {
    if (err.message.includes(":")) return sendError(res, 400, err.message.split(":")[0], err.message.split(":")[1]);
    sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message);
  }
});

module.exports = router;
