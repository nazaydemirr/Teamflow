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

  const { rows: oppRows } = await pool.query("SELECT id, title, description, tags, deadline, members_max as \"membersMax\", type, author_id FROM opportunities");
  
  let items = oppRows.map(opp => {
    const oppTags = opp.tags || [];
    let matchScore = 0;
    if (oppTags.length > 0) {
      const intersection = userSkills.filter(skill => oppTags.includes(skill));
      matchScore = Math.round((100 * intersection.length) / oppTags.length);
    }
    return { ...opp, matchScore };
  });

  items.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const paginatedItems = items.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < items.length ? String(cursor + limit) : null;

  return { items: paginatedItems, nextCursor };
}

async function getOpportunityById(id) {
  const { rows } = await pool.query("SELECT id, title, description, tags, deadline, members_max as \"membersMax\", type, author_id FROM opportunities WHERE id = $1", [id]);
  if (rows.length === 0) throw new Error("NOT_FOUND:Fırsat bulunamadı");
  return rows[0];
}

async function createOpportunity(uid, body) {
  const parsed = oppSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  const { rows } = await pool.query(
    `INSERT INTO opportunities (title, description, tags, deadline, members_max, type, author_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [parsed.data.title, parsed.data.description, JSON.stringify(parsed.data.tags), parsed.data.deadline, parsed.data.membersMax, parsed.data.type || null, uid]
  );
  return { id: rows[0].id, ...parsed.data, author_id: uid };
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
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
