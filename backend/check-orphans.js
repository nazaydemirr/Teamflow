require('dotenv').config();
const { pool } = require('./db');

async function checkOrphans() {
  try {
    const oppId = '0d885b9f-dce3-4174-919f-a58a23e7206c';
    const teamId = 'b7ddf9d8-9791-492e-9a8d-bd3754fea347';
    
    const {rows: opp} = await pool.query('SELECT id, title FROM opportunities WHERE id = $1', [oppId]);
    const {rows: team} = await pool.query('SELECT id, name FROM teams WHERE id = $1', [teamId]);
    
    console.log({opp, team});
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
checkOrphans();
