require('dotenv').config();
const { pool } = require('./db');
const { getUserStats } = require('./services/user_stats_service');

async function testStats() {
  try {
    const { rows } = await pool.query(`SELECT id, display_name FROM users WHERE display_name = 'Soru Sor'`);
    if(rows[0]) {
      const stats = await getUserStats(rows[0].id);
      console.log(`Stats for Soru Sor:`, stats);
    }
    
    const { rows: nazlican } = await pool.query(`SELECT id, display_name FROM users WHERE display_name = 'Nazlıcan Aydemir'`);
    if(nazlican[0]) {
      const stats = await getUserStats(nazlican[0].id);
      console.log(`Stats for Nazlıcan:`, stats);
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

testStats();
