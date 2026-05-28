const { pool } = require("../db");
const { z } = require("zod");

const chatSchema = z.object({ text: z.string().min(1, "Mesaj boş olamaz") });

async function getChats(uid, teamId) {
  const { rows: memberRows } = await pool.query("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, uid]);
  const { rows: leaderRows } = await pool.query("SELECT leader_id FROM teams WHERE id = $1", [teamId]);
  
  if (leaderRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
  
  const isMember = memberRows.length > 0 || leaderRows[0].leader_id === uid;
  if (!isMember) throw new Error("FORBIDDEN:Bu ekibin mesajlarını göremezsiniz");
  
  const { rows } = await pool.query("SELECT id, team_id, sender_id, sender_name, text, timestamp FROM messages WHERE team_id = $1 ORDER BY timestamp ASC", [teamId]);
  return { items: rows };
}

async function sendChat(uid, teamId, body) {
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  const { rows: memberRows } = await pool.query("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, uid]);
  const { rows: leaderRows } = await pool.query("SELECT leader_id FROM teams WHERE id = $1", [teamId]);
  if (leaderRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
  
  const isMember = memberRows.length > 0 || leaderRows[0].leader_id === uid;
  if (!isMember) throw new Error("FORBIDDEN:Bu ekibe mesaj gönderemezsiniz");
  
  const { rows: userRows } = await pool.query("SELECT display_name FROM users WHERE id = $1", [uid]);
  const senderName = userRows.length > 0 ? userRows[0].display_name : "Bilinmeyen Kullanıcı";
  
  const { rows } = await pool.query(
    "INSERT INTO messages (team_id, sender_id, sender_name, text) VALUES ($1, $2, $3, $4) RETURNING id, timestamp",
    [teamId, uid, senderName, parsed.data.text]
  );
  
  return { id: rows[0].id, text: parsed.data.text, senderName, timestamp: rows[0].timestamp };
}

module.exports = {
  getChats,
  sendChat
};
