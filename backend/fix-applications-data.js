require('dotenv').config();
const { pool } = require('./db');

async function fixApplications() {
  try {
    console.log("Starting data fix script...");
    
    // 1. & 3. Fix leader_id (if null or mismatch)
    const leaderFixResult = await pool.query(`
      UPDATE applications a 
      SET leader_id = t.leader_id 
      FROM teams t 
      WHERE a.team_id = t.id AND (a.leader_id IS NULL OR a.leader_id != t.leader_id)
      RETURNING a.id, a.leader_id;
    `);
    console.log(`Fixed leader_id for ${leaderFixResult.rowCount} applications.`);

    // 2. Fix listing_id (opp_id) if null
    const oppFixResult = await pool.query(`
      UPDATE applications a 
      SET opp_id = t.opp_id 
      FROM teams t 
      WHERE a.team_id = t.id AND a.opp_id IS NULL
      RETURNING a.id, a.opp_id;
    `);
    console.log(`Fixed opp_id for ${oppFixResult.rowCount} applications.`);

    // Check consistency
    const { rows: broken } = await pool.query(`
      SELECT a.id, a.leader_id, a.opp_id, a.team_id 
      FROM applications a
      LEFT JOIN teams t ON a.team_id = t.id
      WHERE a.leader_id IS NULL OR a.opp_id IS NULL OR a.leader_id != t.leader_id
    `);
    
    if (broken.length > 0) {
      console.log(`WARNING: Still found ${broken.length} broken applications. Make sure teams exist for them.`);
      console.log(broken);
    } else {
      console.log("SUCCESS: All applications are consistent!");
    }
    
  } catch(e) {
    console.error("Data fix script failed:", e);
  } finally {
    pool.end();
  }
}

fixApplications();
