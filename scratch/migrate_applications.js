const { pool } = require('../backend/db');

async function run() {
  try {
    await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS leader_id uuid;`);
    await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicant_email varchar(255);`);
    
    // Update existing records
    await pool.query(`
      UPDATE applications a 
      SET leader_id = t.leader_id 
      FROM teams t 
      WHERE a.team_id = t.id AND (a.leader_id IS NULL OR a.leader_id != t.leader_id);
    `);
    
    await pool.query(`
      UPDATE applications a 
      SET applicant_email = u.email 
      FROM users u 
      WHERE a.applicant_id = u.id AND (a.applicant_email IS NULL OR a.applicant_email != u.email);
    `);
    
    // If there are applications where opp_id is null, update from teams
    await pool.query(`
      UPDATE applications a 
      SET opp_id = t.opp_id 
      FROM teams t 
      WHERE a.team_id = t.id AND a.opp_id IS NULL;
    `);

    console.log("Migration successful");
  } catch(e) {
    console.error("Migration failed:", e);
  } finally {
    pool.end();
  }
}

run();
