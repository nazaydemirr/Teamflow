const { pool } = require("../db");
const { z } = require("zod");

const applicationSchema = z.object({
  opp_id: z.string().min(1, "opp_id zorunludur"),
  team_id: z.string().min(1, "team_id zorunludur")
});

const decisionSchema = z.object({ 
  decision: z.enum(["approve", "reject"]) 
});

async function getApplications(uid, teamId) {
  if (teamId) {
    const { rows: teamRows } = await pool.query("SELECT leader_id FROM teams WHERE id = $1", [teamId]);
    if (teamRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
    if (teamRows[0].leader_id !== uid) throw new Error("FORBIDDEN:Yetkiniz yok");
    
    const { rows } = await pool.query("SELECT * FROM applications WHERE team_id = $1 AND status = 'pending'", [teamId]);
    return { items: rows };
  } else {
    const { rows } = await pool.query("SELECT * FROM applications WHERE applicant_id = $1", [uid]);
    return { items: rows };
  }
}

async function createApplication(uid, body) {
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  const { rows: pendingApps } = await pool.query("SELECT id FROM applications WHERE applicant_id = $1 AND status = 'pending'", [uid]);
  if (pendingApps.length >= 3) {
    throw new Error("LIMIT_REACHED:En fazla 3 aktif (pending) başvuru yapabilirsiniz.");
  }
  
  const { rows: members } = await pool.query("SELECT user_id FROM team_members WHERE team_id = $1 AND user_id = $2", [parsed.data.team_id, uid]);
  if (members.length > 0) {
    throw new Error("ALREADY_MEMBER:Zaten bu ekibin üyesisiniz.");
  }
  
  const { rows } = await pool.query(
    "INSERT INTO applications (opp_id, team_id, applicant_id, status) VALUES ($1, $2, $3, 'pending') RETURNING id",
    [parsed.data.opp_id, parsed.data.team_id, uid]
  );
  
  return { id: rows[0].id, opp_id: parsed.data.opp_id, team_id: parsed.data.team_id, status: "pending" };
}

async function handleDecision(uid, applicationId, body) {
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { rows: appRows } = await client.query("SELECT team_id, applicant_id, status FROM applications WHERE id = $1 FOR UPDATE", [applicationId]);
    if (appRows.length === 0) throw new Error("NOT_FOUND:Başvuru bulunamadı");
    
    const appData = appRows[0];
    if (appData.status !== "pending") throw new Error("INVALID_STATE:Başvuru zaten değerlendirilmiş");
    
    const { rows: teamRows } = await client.query("SELECT leader_id FROM teams WHERE id = $1", [appData.team_id]);
    if (teamRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
    if (teamRows[0].leader_id !== uid) throw new Error("FORBIDDEN:Yetkisiz işlem");
    
    if (parsed.data.decision === "approve") {
      await client.query("INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [appData.team_id, appData.applicant_id]);
      await client.query("UPDATE teams SET members_current = members_current + 1 WHERE id = $1", [appData.team_id]);
      await client.query("UPDATE applications SET status = 'approved' WHERE id = $1", [applicationId]);
      await client.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [appData.applicant_id, "Tebrikler! Bir ekibe başvurunuz onaylandı."]);
    } else {
      await client.query("UPDATE applications SET status = 'rejected' WHERE id = $1", [applicationId]);
      await client.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [appData.applicant_id, "Maalesef bir ekibe başvurunuz reddedildi."]);
    }
    
    await client.query("COMMIT");
    return { message: `Başvuru ${parsed.data.decision === "approve" ? "onaylandı" : "reddedildi"}` };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function acceptInvite(uid, teamId) {
  if (!teamId) throw new Error("VALIDATION_ERROR:team_id zorunludur");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Check if team exists
    const { rows: teamRows } = await client.query("SELECT id, opp_id, leader_id FROM teams WHERE id = $1", [teamId]);
    if (teamRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
    
    // Check if already member
    const { rows: members } = await client.query("SELECT user_id FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, uid]);
    if (members.length > 0) {
      throw new Error("ALREADY_MEMBER:Zaten bu ekibin üyesisiniz.");
    }

    // Add to team_members
    await client.query("INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)", [teamId, uid]);
    await client.query("UPDATE teams SET members_current = members_current + 1 WHERE id = $1", [teamId]);
    
    // Add to applications as 'approved'
    await client.query(
      "INSERT INTO applications (opp_id, team_id, applicant_id, status) VALUES ($1, $2, $3, 'approved')",
      [teamRows[0].opp_id, teamId, uid]
    );
    
    // Add notification to leader
    await client.query(
      "INSERT INTO notifications (user_id, team_id, message) VALUES ($1, $2, $3)", 
      [teamRows[0].leader_id, teamId, "Bir kullanıcı davetinizi kabul etti ve ekibinize katıldı."]
    );
    
    await client.query("COMMIT");
    return { message: "Davet kabul edildi ve takıma katılındı." };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getApplications,
  createApplication,
  handleDecision,
  acceptInvite
};
