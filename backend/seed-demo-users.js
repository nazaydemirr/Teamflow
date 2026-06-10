const bcrypt = require("bcryptjs");
const { pool } = require("./db");

async function seedDemos() {
  const demos = [
    { email: "demo@teamflow.com", password: "demo123", displayName: "Frontend Dev" },
    { email: "backend@teamflow.com", password: "backend123", displayName: "Backend Dev" },
    { email: "ai@teamflow.com", password: "ai123", displayName: "Yapay Zeka Uzmanı" },
  ];

  try {
    for (const d of demos) {
      const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [d.email]);
      if (rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(d.password, salt);
        await pool.query(
          "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3)",
          [d.email, hash, d.displayName]
        );
        console.log(`${d.email} eklendi.`);
      } else {
        console.log(`${d.email} zaten var.`);
      }
    }
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    await pool.end();
  }
}

seedDemos();
