const { pool } = require("./db");

async function test() {
  const uid = '2f7f7273-9671-4374-bb61-78242213c69a'; // The ID of A from before

  try {
    const { rows } = await pool.query(`
      SELECT 
        a.*, 
        o.title as "oppTitle",
        t.name as team_name,
        u.display_name as applicant_label, 
        u.skills as applicant_skills,
        u.university as applicant_university,
        u.department as applicant_department,
        u.grade as applicant_classlevel,
        NULL as applicant_bio,
        u.github_url as applicant_github,
        u.linkedin_url as applicant_linkedin,
        (SELECT count(*) FROM team_members tm WHERE tm.user_id = u.id) as stats_active_teams,
        (SELECT count(*) FROM teams t2 WHERE t2.leader_id = u.id) as stats_active_teams_led,
        (SELECT count(*) FROM applications a2 WHERE a2.applicant_id = u.id AND a2.status IN ('pending', 'approved')) as stats_active_applications,
        (SELECT count(*) > 0 FROM applications a2 WHERE a2.applicant_id = u.id AND a2.status = 'pending') as stats_pending_applications,
        (SELECT array_agg(t2.name) FROM team_members tm JOIN teams t2 ON tm.team_id = t2.id WHERE tm.user_id = u.id) as stats_active_teams_names,
        (SELECT array_agg(t2.name) FROM teams t2 WHERE t2.leader_id = u.id) as stats_led_teams_names
      FROM applications a
      JOIN opportunities o ON a.opp_id = o.id
      LEFT JOIN teams t ON a.team_id = t.id
      JOIN users u ON a.applicant_id = u.id
      WHERE (t.leader_id = $1 OR o.author_id = $1) AND a.status = 'pending'
    `, [uid]);
    console.log("ROWS:", rows);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    pool.end();
  }
}
test();
