require('dotenv').config();
const { pool } = require('./db');

async function debug() {
  try {
    // 1. Get all applications to see what's in the DB
    console.log("=== ALL APPLICATIONS ===");
    const { rows: allApps } = await pool.query("SELECT * FROM applications LIMIT 10");
    console.log(allApps);
    
    // 2. See what teams exist and their leaders
    console.log("\n=== ALL TEAMS ===");
    const { rows: allTeams } = await pool.query("SELECT id, name, leader_id FROM teams LIMIT 10");
    console.log(allTeams);

    // 3. See what the as_leader query returns broadly (ignoring leader_id filter to see all matches)
    console.log("\n=== AS_LEADER QUERY WITHOUT LEADER_ID FILTER ===");
    const { rows: asLeaderRows } = await pool.query(`
      SELECT 
        a.id, a.leader_id, a.status,
        a.created_at as "createdAt",
        o.title as "oppTitle",
        t.name as team_name,
        u.display_name as applicant_label
      FROM applications a
      JOIN opportunities o ON a.opp_id = o.id
      LEFT JOIN teams t ON a.team_id = t.id
      JOIN users u ON a.applicant_id = u.id
      WHERE a.status IN ('pending', 'approved', 'rejected')
    `);
    console.log(asLeaderRows);
    
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

debug();
