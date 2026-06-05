const { pool } = require("../db");

async function getNotifications(uid) {
  const { rows } = await pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [uid]);
  return { items: rows };
}

async function markAsRead(uid, notificationId) {
  const { rowCount } = await pool.query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2", [notificationId, uid]);
  if (rowCount === 0) throw new Error("NOT_FOUND:Bildirim bulunamadı");
  return { ok: true };
}

async function markAllAsRead(uid) {
  const { rowCount } = await pool.query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false", [uid]);
  return { ok: true, count: rowCount };
}

async function deleteNotification(uid, notificationId) {
  const { rowCount } = await pool.query("DELETE FROM notifications WHERE id = $1 AND user_id = $2", [notificationId, uid]);
  if (rowCount === 0) throw new Error("NOT_FOUND:Bildirim bulunamadı");
  return { ok: true };
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
