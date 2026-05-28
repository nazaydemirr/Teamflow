const { pool } = require("../db");
const { z } = require("zod");

const milestoneSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz"),
  due_date: z.string().optional()
});

const taskSchema = z.object({
  title: z.string().min(1, "Görev başlığı boş olamaz"),
  assignee_id: z.string().uuid().optional().nullable()
});

const statusSchema = z.object({
  status: z.enum(["todo", "in_progress", "done", "pending", "completed"])
});

async function verifyTeamMember(uid, teamId) {
  const { rows: memberRows } = await pool.query("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, uid]);
  const { rows: leaderRows } = await pool.query("SELECT leader_id FROM teams WHERE id = $1", [teamId]);
  if (leaderRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
  const isMember = memberRows.length > 0 || leaderRows[0].leader_id === uid;
  if (!isMember) throw new Error("FORBIDDEN:Bu ekibin projelerini yönetemezsiniz");
}

async function getMilestones(uid, teamId) {
  await verifyTeamMember(uid, teamId);
  const { rows } = await pool.query("SELECT * FROM team_milestones WHERE team_id = $1 ORDER BY created_at ASC", [teamId]);
  return { items: rows };
}

async function createMilestone(uid, teamId, body) {
  await verifyTeamMember(uid, teamId);
  const parsed = milestoneSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR:Geçersiz veri");

  const { rows } = await pool.query(
    "INSERT INTO team_milestones (team_id, title, due_date) VALUES ($1, $2, $3) RETURNING *",
    [teamId, parsed.data.title, parsed.data.due_date || null]
  );
  return rows[0];
}

async function updateMilestoneStatus(uid, milestoneId, body) {
  const { rows: msRows } = await pool.query("SELECT team_id FROM team_milestones WHERE id = $1", [milestoneId]);
  if (msRows.length === 0) throw new Error("NOT_FOUND:Milestone bulunamadı");
  await verifyTeamMember(uid, msRows[0].team_id);

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR:Geçersiz durum");

  const { rows } = await pool.query("UPDATE team_milestones SET status = $1 WHERE id = $2 RETURNING *", [parsed.data.status, milestoneId]);
  return rows[0];
}

async function getTasks(uid, milestoneId) {
  const { rows: msRows } = await pool.query("SELECT team_id FROM team_milestones WHERE id = $1", [milestoneId]);
  if (msRows.length === 0) throw new Error("NOT_FOUND:Milestone bulunamadı");
  await verifyTeamMember(uid, msRows[0].team_id);

  const { rows } = await pool.query("SELECT * FROM team_tasks WHERE milestone_id = $1 ORDER BY created_at ASC", [milestoneId]);
  return { items: rows };
}

async function createTask(uid, milestoneId, body) {
  const { rows: msRows } = await pool.query("SELECT team_id FROM team_milestones WHERE id = $1", [milestoneId]);
  if (msRows.length === 0) throw new Error("NOT_FOUND:Milestone bulunamadı");
  await verifyTeamMember(uid, msRows[0].team_id);

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR:Geçersiz veri");

  const { rows } = await pool.query(
    "INSERT INTO team_tasks (milestone_id, title, assignee_id) VALUES ($1, $2, $3) RETURNING *",
    [milestoneId, parsed.data.title, parsed.data.assignee_id || null]
  );
  return rows[0];
}

async function updateTaskStatus(uid, taskId, body) {
  const { rows: taskRows } = await pool.query(
    "SELECT tm.team_id FROM team_tasks tt JOIN team_milestones tm ON tt.milestone_id = tm.id WHERE tt.id = $1", 
    [taskId]
  );
  if (taskRows.length === 0) throw new Error("NOT_FOUND:Görev bulunamadı");
  await verifyTeamMember(uid, taskRows[0].team_id);

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR:Geçersiz durum");

  const { rows } = await pool.query("UPDATE team_tasks SET status = $1 WHERE id = $2 RETURNING *", [parsed.data.status, taskId]);
  return rows[0];
}

async function getTeamProgress(uid, teamId) {
  await verifyTeamMember(uid, teamId);
  const { rows } = await pool.query(
    `SELECT status, COUNT(*) as count 
     FROM team_tasks tt 
     JOIN team_milestones tm ON tt.milestone_id = tm.id 
     WHERE tm.team_id = $1 GROUP BY status`, [teamId]
  );
  
  let total = 0;
  let done = 0;
  rows.forEach(r => {
    const c = parseInt(r.count);
    total += c;
    if (r.status === 'done') done += c;
  });

  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  return { progress, totalTasks: total, completedTasks: done };
}

module.exports = {
  getMilestones,
  createMilestone,
  updateMilestoneStatus,
  getTasks,
  createTask,
  updateTaskStatus,
  getTeamProgress
};
