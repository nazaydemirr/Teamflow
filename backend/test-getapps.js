require('dotenv').config();
const { pool } = require('./db');
const { getApplications } = require('./services/application_service');

async function run() {
  try {
    const { rows } = await pool.query(`SELECT id FROM users WHERE display_name = 'Nazlıcan Aydemir'`);
    const res = await getApplications(rows[0].id, null, true);
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
