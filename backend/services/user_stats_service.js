const { pool } = require("../db");

async function getUserStats(userId) {
  // 1. Aktif Bulunduğu Takımlar ve Tamamlanan Projeler
  const { rows: memberRows } = await pool.query(
    `SELECT t.name, o.deadline 
     FROM team_members tm
     JOIN teams t ON tm.team_id = t.id
     JOIN opportunities o ON t.opp_id = o.id
     WHERE tm.user_id = $1`, 
    [userId]
  );
  
  const statsActiveTeamsNames = [];
  let statsCompletedProjects = 0;
  
  const now = new Date();
  
  for (const row of memberRows) {
    statsActiveTeamsNames.push(row.name);
    if (new Date(row.deadline) < now) {
      statsCompletedProjects++;
    }
  }

  // 2. Liderlik Yaptığı Takımlar
  const { rows: ledRows } = await pool.query(
    `SELECT name FROM teams WHERE leader_id = $1`, 
    [userId]
  );
  const statsLedTeamsNames = ledRows.map(r => r.name);

  // 3. Başvurular
  const { rows: appRows } = await pool.query(
    `SELECT status FROM applications WHERE applicant_id = $1 AND status IN ('pending', 'approved')`,
    [userId]
  );
  
  const statsActiveApplications = appRows.length;
  const statsPendingApplications = appRows.some(r => r.status === 'pending');

  return {
    statsActiveTeams: memberRows.length,
    statsActiveTeamsLed: ledRows.length,
    statsCompletedProjects: statsCompletedProjects,
    statsActiveApplications: statsActiveApplications,
    statsPendingApplications: statsPendingApplications,
    statsActiveTeamsNames: statsActiveTeamsNames,
    statsLedTeamsNames: statsLedTeamsNames
  };
}

module.exports = {
  getUserStats
};
