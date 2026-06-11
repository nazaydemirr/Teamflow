const { pool } = require("./db");

async function checkApps() {
  const { rows } = await pool.query("SELECT * FROM applications");
  console.log("All Applications:", rows);
  
  const { rows: oRows } = await pool.query("SELECT id, author_id FROM opportunities");
  console.log("Opportunities:", oRows);
  
  const { rows: tRows } = await pool.query("SELECT id, leader_id FROM teams");
  console.log("Teams:", tRows);

  pool.end();
}
checkApps();
