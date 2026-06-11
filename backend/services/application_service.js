const { pool } = require("../db");
const { z } = require("zod");

const applicationSchema = z.object({
  opp_id: z.string().min(1, "opp_id zorunludur"),
  team_id: z.string().min(1, "team_id zorunludur")
});

const decisionSchema = z.object({ 
  decision: z.enum(["approve", "reject"]),
  message: z.string().optional()
});

async function getApplications(uid, teamId, asLeader = false) {
  if (teamId) {
    const { rows: teamRows } = await pool.query("SELECT leader_id FROM teams WHERE id = $1", [teamId]);
    if (teamRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
    if (teamRows[0].leader_id !== uid) throw new Error("FORBIDDEN:Yetkiniz yok");
    
    const { rows } = await pool.query(`
      SELECT a.*, u.display_name as applicant_label, u.skills as applicant_skills 
      FROM applications a
      JOIN users u ON a.applicant_id = u.id
      WHERE a.team_id = $1 AND a.status = 'pending'
    `, [teamId]);
    return { items: rows };
  } else if (asLeader) {
    const { rows } = await pool.query(`
      SELECT a.*, u.display_name as applicant_label, u.skills as applicant_skills 
      FROM applications a
      JOIN teams t ON a.team_id = t.id
      JOIN users u ON a.applicant_id = u.id
      WHERE t.leader_id = $1 AND a.status = 'pending'
    `, [uid]);
    return { items: rows };
  } else {
    const { rows } = await pool.query(`
      SELECT a.*, u.display_name as applicant_label, u.skills as applicant_skills 
      FROM applications a
      JOIN users u ON a.applicant_id = u.id
      WHERE a.applicant_id = $1
    `, [uid]);
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

  const { rows: pendingApps } = await pool.query("SELECT count(*) as count FROM applications WHERE applicant_id = $1 AND status = 'pending'", [uid]);
  const { rows: memberTeams } = await pool.query(`
    SELECT count(*) as count 
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = $1 AND t.leader_id != $1
  `, [uid]);
  const totalCount = parseInt(pendingApps[0].count) + parseInt(memberTeams[0].count);

  if (totalCount >= 3) {
    throw new Error("LIMIT_REACHED:En fazla 3 takımda üye olabilir veya bekleyen başvuruya sahip olabilirsiniz.");
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
    
    const { rows: teamRows } = await client.query("SELECT leader_id, name FROM teams WHERE id = $1", [appData.team_id]);
    if (teamRows.length === 0) throw new Error("NOT_FOUND:Ekip bulunamadı");
    if (teamRows[0].leader_id !== uid) throw new Error("FORBIDDEN:Yetkisiz işlem");
    
    const teamName = teamRows[0].name;
    const leaderMessage = parsed.data.message ? `\nLiderin Mesajı: "${parsed.data.message}"` : "";

    if (parsed.data.decision === "approve") {
      await client.query("INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [appData.team_id, appData.applicant_id]);
      await client.query("UPDATE teams SET members_current = members_current + 1 WHERE id = $1", [appData.team_id]);
      await client.query("UPDATE applications SET status = 'approved' WHERE id = $1", [applicationId]);
      await client.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [
        appData.applicant_id, 
        `Tebrikler! Başvurduğunuz "${teamName}" takımı başvurunuzu onayladı.${leaderMessage}`
      ]);
    } else {
      await client.query("UPDATE applications SET status = 'rejected' WHERE id = $1", [applicationId]);
      await client.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [
        appData.applicant_id, 
        `Maalesef, başvurduğunuz "${teamName}" takımı başvurunuzu reddetti.${leaderMessage}`
      ]);
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
    
    // Update application status to 'approved' if it was 'invited', else insert 'approved'
    const { rowCount } = await client.query(
      "UPDATE applications SET status = 'approved' WHERE team_id = $1 AND applicant_id = $2 AND status = 'invited'",
      [teamId, uid]
    );
    if (rowCount === 0) {
      await client.query(
        "INSERT INTO applications (opp_id, team_id, applicant_id, status) VALUES ($1, $2, $3, 'approved')",
        [teamRows[0].opp_id, teamId, uid]
      );
    }
    
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

async function addMemberDirectly(uid, teamId, targetUserId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Check team exists and uid is leader
    const { rows: teamRows } = await client.query("SELECT * FROM teams WHERE id = $1 FOR UPDATE", [teamId]);
    if (teamRows.length === 0) throw new Error("NOT_FOUND:Takım bulunamadı");
    if (teamRows[0].leader_id !== uid) throw new Error("FORBIDDEN:Yetkiniz yok");
    
    // Check target user exists
    const { rows: userRows } = await client.query("SELECT id FROM users WHERE id = $1", [targetUserId]);
    if (userRows.length === 0) throw new Error("NOT_FOUND:Kullanıcı bulunamadı");
    
    // Check team full
    if (teamRows[0].members_max && teamRows[0].members_current >= teamRows[0].members_max) {
      throw new Error("VALIDATION_ERROR:Takım kapasitesi dolu");
    }

    // Check if user is already in team
    const { rows: existingMember } = await client.query("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, targetUserId]);
    if (existingMember.length > 0) throw new Error("VALIDATION_ERROR:Kullanıcı zaten takımda");
    
    // Add to applications as 'invited' instead of 'approved' and don't add to team_members yet
    await client.query(
      "INSERT INTO applications (opp_id, team_id, applicant_id, status) VALUES ($1, $2, $3, 'invited') ON CONFLICT DO NOTHING",
      [teamRows[0].opp_id, teamId, targetUserId]
    );
    
    // Send notification to the user
    await client.query(
      "INSERT INTO notifications (user_id, team_id, message) VALUES ($1, $2, $3)", 
      [targetUserId, teamId, `Sizi takıma (${teamRows[0].name}) davet ettiler!`]
    );
    
    await client.query("COMMIT");
    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function removeMemberDirectly(uid, teamId, targetUserId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Check team exists and uid is leader
    const { rows: teamRows } = await client.query("SELECT * FROM teams WHERE id = $1 FOR UPDATE", [teamId]);
    if (teamRows.length === 0) throw new Error("NOT_FOUND:Takım bulunamadı");
    if (teamRows[0].leader_id !== uid) throw new Error("FORBIDDEN:Yetkiniz yok");
    
    // Remove from team_members
    const { rowCount } = await client.query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, targetUserId]);
    if (rowCount > 0) {
      await client.query("UPDATE teams SET members_current = GREATEST(0, members_current - 1) WHERE id = $1", [teamId]);
    }
    
    // Mark application as cancelled or deleted
    await client.query(
      "DELETE FROM applications WHERE team_id = $1 AND applicant_id = $2",
      [teamId, targetUserId]
    );
    
    // Send notification to the user
    await client.query(
      "INSERT INTO notifications (user_id, team_id, message) VALUES ($1, $2, $3)", 
      [targetUserId, teamId, `Takımdan (${teamRows[0].name}) çıkarıldınız.`]
    );
    
    await client.query("COMMIT");
    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteApplication(uid, applicationId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Uygulamanın ve takımın bilgilerini al
    const { rows: appRows } = await client.query(
      `SELECT a.id, a.applicant_id, a.team_id, a.status, t.leader_id 
       FROM applications a
       JOIN teams t ON a.team_id = t.id
       WHERE a.id = $1 FOR UPDATE`, 
      [applicationId]
    );
    
    if (appRows.length === 0) throw new Error("NOT_FOUND:Başvuru bulunamadı");
    
    const app = appRows[0];
    
    // Sadece başvuru sahibi veya takım lideri iptal edebilir
    if (app.applicant_id !== uid && app.leader_id !== uid) {
      throw new Error("FORBIDDEN:Bu işlemi yapmaya yetkiniz yok");
    }

    // Kabul edilmiş veya reddedilmiş başvurular geri çekilemez/iptal edilemez
    if (app.status === 'approved' || app.status === 'rejected') {
      throw new Error("INVALID_STATE:Sonuçlanmış başvurular iptal edilemez");
    }

    // Başvuruyu iptal et (soft delete)
    await client.query("UPDATE applications SET status = 'cancelled' WHERE id = $1", [applicationId]);
    
    await client.query("COMMIT");
    return { message: "Başvuru başarıyla geri çekildi." };
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
  acceptInvite,
  deleteApplication,
  addMemberDirectly,
  removeMemberDirectly
};
