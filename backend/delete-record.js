const { pool } = require("./db");

async function run() {
  try {
    const { rowCount } = await pool.query("DELETE FROM opportunities WHERE id = '5471f324-1634-4d59-8ec2-75ceb4496b62'");
    console.log(`Silinen kayit sayisi: ${rowCount}`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
