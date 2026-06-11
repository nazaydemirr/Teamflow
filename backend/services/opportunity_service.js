const { pool } = require("../db");
const { z } = require("zod");

const oppSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string().min(1, "Açıklama zorunludur"),
  tags: z.array(z.string()).min(1, "En az 1 etiket gerekli"),
  deadline: z.string().datetime("Geçerli bir ISO 8601 tarihi olmalıdır"),
  membersMax: z.number().int().positive("Pozitif bir sayı olmalıdır"),
  type: z.string().optional(),
});
const oppUpdateSchema = oppSchema.partial();

async function getOpportunities(uid, limit = 20, cursor = 0) {
  const { rows: userRows } = await pool.query("SELECT skills FROM users WHERE id = $1", [uid]);
  const userSkills = userRows.length > 0 ? (userRows[0].skills || []) : [];

  const { rows: oppRows } = await pool.query(`
    SELECT o.id, o.title, o.description, o.tags, o.deadline, o.members_max as "membersMax", o.type, o.author_id,
           o.created_at as "createdAt",
           u.display_name as author_name
    FROM opportunities o
    LEFT JOIN users u ON o.author_id = u.id
  `);

  const { rows: teamRows } = await pool.query(`
    SELECT t.id, t.opp_id, t.name, t.description, t.roles_needed, t.technologies, t.level, t.communication, 
           t.is_full as full, t.members_max as "membersMax", t.members_current as "membersCurrent", t.leader_id,
           u.display_name as leader_name, u.skills as leader_skills
    FROM teams t
    LEFT JOIN users u ON t.leader_id = u.id
  `);

  const { rows: memberRows } = await pool.query(`
    SELECT tm.team_id, u.id as user_id, u.display_name, u.skills
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
  `);

  const teamsMap = {};
  for (const t of teamRows) {
    if (!teamsMap[t.opp_id]) teamsMap[t.opp_id] = [];
    const leaderInitials = (t.leader_name || "L").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const leader = {
      id: t.leader_id,
      name: t.leader_name || "Lider",
      initials: leaderInitials,
      role: "Lider",
      skills: t.leader_skills || []
    };
    teamsMap[t.opp_id].push({
      id: t.id,
      name: t.name,
      description: t.description,
      rolesNeeded: t.roles_needed,
      technologies: t.technologies,
      level: t.level,
      communication: t.communication,
      full: t.full,
      membersMax: t.membersMax,
      membersCurrent: t.membersCurrent,
      isOwner: t.leader_id === uid,
      leader,
      members: []
    });
  }

  for (const m of memberRows) {
    for (const oppId in teamsMap) {
      const team = teamsMap[oppId].find(tm => tm.id === m.team_id);
      if (team) {
        if (team.leader.id === m.user_id) continue; // Lideri üyeler listesine ekleme (çift görünmesin)
        
        const initials = (m.display_name || "U").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
        team.members.push({
          id: m.user_id,
          name: m.display_name,
          initials,
          role: "Üye",
          skills: m.skills || []
        });
      }
    }
  }

  let items = oppRows.map(opp => {
    const oppTags = opp.tags || [];
    let matchScore = 0;
    if (oppTags.length > 0) {
      const intersection = userSkills.filter(skill => oppTags.includes(skill));
      matchScore = Math.round((100 * intersection.length) / oppTags.length);
    }
    const authorInitials = (opp.author_name || "T").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const teams = teamsMap[opp.id] || [];
    const membersCurrent = teams.reduce((acc, t) => acc + (t.membersCurrent || 1), 0); // Include leader
    return { 
      ...opp, 
      matchPercent: matchScore, // mapped to matchPercent for frontend
      author: opp.author_name || "Bilinmiyor",
      authorInitials,
      teams,
      membersCurrent
    };
  });

  items.sort((a, b) => {
    if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const paginatedItems = items.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < items.length ? String(cursor + limit) : null;

  return { items: paginatedItems, nextCursor };
}

async function getMyOpportunities(uid) {
  // Bütün opportunities'leri çekiyoruz, daha sonra frontend'deki gibi
  // kendi oluşturduğumuz (ledTeams) veya üyesi olduğumuz (joinedTeams) fırsatları filtreleyeceğiz
  // Şimdilik getAll() yapısını kullanıp backend tarafında filtreliyoruz.
  const allRes = await getOpportunities(uid, 1000, 0); // Tüm fırsatları çek (basitlik için limit=1000)
  const items = allRes.items;

  // Lideri olduğumuz (kendi açtığımız fırsatlar veya lideri olduğumuz takımlar)
  // Üyesi olduğumuz (başvurduğumuz ve onaylandığımız takımlar -> takım üyeliği var)
  const myItems = items.filter(opp => {
    if (opp.author_id === uid) return true; // Fırsatın sahibi
    if (opp.teams && opp.teams.length > 0) {
      for (const t of opp.teams) {
        if (t.leader && t.leader.id === uid) return true; // Takımın lideri
        if (t.members && t.members.some(m => m.id === uid)) return true; // Takımın üyesi
      }
    }
    return false;
  });

  return { items: myItems };
}

async function getOpportunityById(id, uid) {
  // getOpportunities'i kullanıp ilgili id'yi bulabiliriz (join'lerle uğraşmamak için)
  const allRes = await getOpportunities(uid, 1000, 0);
  const opp = allRes.items.find(o => o.id === id);
  if (!opp) throw new Error("NOT_FOUND:Fırsat bulunamadı");
  return opp;
}

async function createOpportunity(uid, body) {
  const parsed = oppSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  // Duplicate check
  const { rows: duplicateRows } = await pool.query(
    "SELECT id FROM opportunities WHERE author_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '1 minute'",
    [uid, parsed.data.title]
  );
  if (duplicateRows.length > 0) {
    throw new Error("LIMIT_REACHED:Aynı başlıklı ilanı kısa süre içinde tekrar oluşturamazsınız. Lütfen bekleyin.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO opportunities (title, description, tags, deadline, members_max, type, author_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [parsed.data.title, parsed.data.description, JSON.stringify(parsed.data.tags), parsed.data.deadline, parsed.data.membersMax, parsed.data.type || null, uid]
    );
    const oppId = rows[0].id;

    if (parsed.data.type === "bitirme-projesi") {
      const { rows: teamRows } = await client.query(
        `INSERT INTO teams (opp_id, name, description, leader_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [oppId, "Proje Ekibi", "Bitirme Projesi Takımı", uid]
      );
      await client.query("INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)", [teamRows[0].id, uid]);
    }
    
    await client.query("COMMIT");
    return { id: oppId, ...parsed.data, author_id: uid };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function updateOpportunity(uid, oppId, body) {
  const parsed = oppUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  const { rows } = await pool.query("SELECT * FROM opportunities WHERE id = $1", [oppId]);
  if (rows.length === 0) throw new Error("NOT_FOUND:Fırsat bulunamadı");
  if (rows[0].author_id !== uid) throw new Error("FORBIDDEN:Yetkisiz işlem");
  
  const opp = rows[0];
  const newTitle = parsed.data.title || opp.title;
  const newDesc = parsed.data.description || opp.description;
  const newTags = parsed.data.tags ? JSON.stringify(parsed.data.tags) : JSON.stringify(opp.tags);
  const newDeadline = parsed.data.deadline || opp.deadline;
  const newMembersMax = parsed.data.membersMax || opp.members_max;
  const newType = parsed.data.type !== undefined ? parsed.data.type : opp.type;

  await pool.query(
    `UPDATE opportunities SET title=$1, description=$2, tags=$3, deadline=$4, members_max=$5, type=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7`,
    [newTitle, newDesc, newTags, newDeadline, newMembersMax, newType, oppId]
  );
  
  return { id: oppId, ...parsed.data };
}

async function deleteOpportunity(uid, oppId) {
  const { rows } = await pool.query("SELECT author_id FROM opportunities WHERE id = $1", [oppId]);
  if (rows.length === 0) throw new Error("NOT_FOUND:Fırsat bulunamadı");
  if (rows[0].author_id !== uid) throw new Error("FORBIDDEN:Yetkisiz işlem");
  
  await pool.query("DELETE FROM opportunities WHERE id = $1", [oppId]);
  return { message: "Fırsat silindi" };
}

module.exports = {
  getOpportunities,
  getMyOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
