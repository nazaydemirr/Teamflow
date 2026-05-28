const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-teamflow-jwt-key";

async function registerUser({ email, password, displayName }) {
  if (!email || !password || !displayName) {
    throw new Error("VALIDATION_ERROR:email, password ve displayName zorunludur.");
  }

  const { rows: existing } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.length > 0) {
    throw new Error("EMAIL_EXISTS:Bu e-posta adresi zaten kullanımda.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const { rows } = await pool.query(
    "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name",
    [email, passwordHash, displayName]
  );
  
  const user = rows[0];
  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: "7d" });

  return { token, uid: user.id, email: user.email, displayName: user.display_name };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("VALIDATION_ERROR:email ve password zorunludur.");
  }

  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  if (rows.length === 0) {
    throw new Error("UNAUTHENTICATED:Geçersiz e-posta veya şifre.");
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("UNAUTHENTICATED:Geçersiz e-posta veya şifre.");
  }

  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return { token, uid: user.id, email: user.email, displayName: user.display_name };
}

async function resetPassword({ email, newPassword }) {
  if (!email || !newPassword) {
    throw new Error("VALIDATION_ERROR:email ve newPassword zorunludur.");
  }
  if (newPassword.length < 6) {
    throw new Error("VALIDATION_ERROR:Yeni şifre en az 6 karakter olmalıdır.");
  }

  const { rows } = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
  if (rows.length === 0) {
    throw new Error("NOT_FOUND:Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await pool.query("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2", [passwordHash, email]);
  
  return { message: "Şifreniz başarıyla güncellendi." };
}

module.exports = {
  registerUser,
  loginUser,
  resetPassword
};
