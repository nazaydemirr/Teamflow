require('dotenv').config();
const { pool } = require('./db');

async function checkApps() {
  try {
    const { rows: nazlican } = await pool.query(`SELECT id, email, display_name FROM users WHERE display_name = 'Nazlıcan Aydemir'`);
    if(nazlican.length === 0) {
      console.log("Nazlıcan not found!");
      return;
    }
    const nid = nazlican[0].id;
    console.log(`Nazlıcan ID: ${nid}`);

    const { rows: apps } = await pool.query(`
      SELECT a.id, a.team_id, a.opp_id, a.leader_id, a.applicant_id, a.status, u.display_name as applicant_name
      FROM applications a
      LEFT JOIN users u ON a.applicant_id = u.id
      WHERE a.leader_id = $1
    `, [nid]);

    console.log(`Nazlıcan's Leader Panel Applications:`);
    console.table(apps);

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
checkApps();
