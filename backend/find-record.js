const { pool } = require("./db");

async function run() {
  try {
    const { rows } = await pool.query("SELECT * FROM opportunities WHERE title = 'Ceo!nun bitirme projesi'");
    console.log("Bulunan kayitlar:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
