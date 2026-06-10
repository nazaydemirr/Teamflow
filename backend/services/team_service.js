const { pool } = require("../db");
const { z } = require("zod");

const teamSchema = z.object({
  opp_id: z.string().min(1, "opp_id zorunludur"),
  name: z.string().min(1, "Takım adı zorunludur"),
  description: z.string().optional(),
  rolesNeeded: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  level: z.enum(["Başlangıç", "Orta", "İleri"]).optional(),
  communication: z.enum(["Discord", "WhatsApp", "Telegram"]).optional(),
  full: z.boolean().default(false),
  membersMax: z.number().int().optional(),
});

async function getTeams(opp_id) {
  let queryText = "SELECT id, opp_id, name, description, roles_needed as \"rolesNeeded\", technologies, level, communication, is_full as full, members_max as \"membersMax\", members_current as \"membersCurrent\", leader_id FROM teams";
  let params = [];
  if (opp_id) {
    queryText += " WHERE opp_id = $1";
    params.push(opp_id);
  }
  const { rows } = await pool.query(queryText, params);
  return { items: rows };
}

async function createTeam(uid, body) {
  const parsed = teamSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  const { rows: ledTeams } = await pool.query("SELECT count(*) as count FROM teams WHERE leader_id = $1", [uid]);
  if (parseInt(ledTeams[0].count) >= 3) {
    throw new Error("LIMIT_REACHED:Şu anda en fazla 3 takımın lideri olabilirsiniz. Yeni bir takım oluşturamazsınız.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO teams (opp_id, name, description, roles_needed, technologies, level, communication, is_full, members_max, members_current, leader_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
       [
         parsed.data.opp_id, parsed.data.name, parsed.data.description || null, 
         JSON.stringify(parsed.data.rolesNeeded || []), JSON.stringify(parsed.data.technologies || []), 
         parsed.data.level || null, parsed.data.communication || null, 
         parsed.data.full || false, parsed.data.membersMax || 4, 1, uid
       ]
    );
    const teamId = rows[0].id;
    await client.query("INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)", [teamId, uid]);
    await client.query("COMMIT");
    return { id: teamId, ...parsed.data };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function leaveTeam(uid, teamId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rowCount } = await client.query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, uid]);
    if (rowCount > 0) {
      await client.query("UPDATE teams SET members_current = members_current - 1 WHERE id = $1", [teamId]);
    } else {
      throw new Error("NOT_FOUND:Ekip bulunamadı veya üye değilsiniz");
    }
    await client.query("COMMIT");
    return { message: "Ekipten ayrılındı" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getTeamDetails(teamId) {
  const { rows } = await pool.query(`
    SELECT t.name as team_name, o.title as project_title, u.display_name as author_name
    FROM teams t
    JOIN opportunities o ON t.opp_id = o.id
    JOIN users u ON o.author_id = u.id
    WHERE t.id = $1
  `, [teamId]);
  
  if (rows.length === 0) throw new Error("NOT_FOUND:Takım bulunamadı");
  
  return {
    name: rows[0].team_name,
    project: rows[0].project_title,
    author: rows[0].author_name
  };
}

module.exports = {
  getTeams,
  createTeam,
  leaveTeam,
  getTeamDetails
};
