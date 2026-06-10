const { pool } = require("../db");
const { z } = require("zod");

const userSchema = z.object({
  displayName: z.string().min(1, "displayName boş olamaz"),
  skills: z.array(z.string()).min(3, "En az 3 yetenek seçilmelidir"),
  website_url: z.string().url("Geçerli bir URL olmalıdır").optional().or(z.literal("")),
});
const userUpdateSchema = userSchema.partial();

async function getProfile(uid) {
  const { rows } = await pool.query("SELECT id as uid, email, display_name as \"displayName\", skills, website_url FROM users WHERE id = $1", [uid]);
  if (rows.length === 0) throw new Error("NOT_FOUND:Kullanıcı profili bulunamadı");
  
  const user = rows[0];

  // Active Applications Count (Beklemede veya Onaylandi) ve Uye oldugu takimlar (Lideri haric)
  const { rows: activeStats } = await pool.query(`
    SELECT 
      (SELECT count(*) FROM applications WHERE applicant_id = $1 AND status = 'pending') +
      (SELECT count(*) FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = $1 AND t.leader_id != $1) as count
  `, [uid]);
  const activeCount = parseInt(activeStats[0].count);

  // Leader Count (Kendi actigi firsatlar + Lideri oldugu takimlar)
  const { rows: oppRows } = await pool.query("SELECT count(*) FROM opportunities WHERE author_id = $1", [uid]);
  const { rows: teamRows } = await pool.query("SELECT count(*) FROM teams WHERE leader_id = $1", [uid]);
  
  // Basitlik adina: bir firsati acmissa 1 puan, takimlar actiysa ve ayni zamandaysa sayilar biraz sisebilir, 
  // ama frontend zaten bunlari esnek davraniyor. En iyisi ikisini toplayip benzer takimlari duseriz 
  // veya sadece takim liderliklerini sayariz. Yalnizca takimlar ve hic takim olmayan firsatlari sayalim:
  const { rows: leaderStats } = await pool.query(`
    SELECT count(DISTINCT o.id) as opp_count, count(DISTINCT t.id) as team_count
    FROM opportunities o
    LEFT JOIN teams t ON o.id = t.opp_id
    WHERE o.author_id = $1 OR t.leader_id = $1
  `, [uid]);
  
  const leaderCount = parseInt(leaderStats[0].team_count) > 0 ? parseInt(leaderStats[0].team_count) : parseInt(leaderStats[0].opp_count);

  return { ...user, stats: { activeCount, leaderCount } };
}

async function updateProfile(uid, body, isPartial = false) {
  const schema = isPartial ? userUpdateSchema : userSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  if (isPartial) {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [uid]);
    if (rows.length === 0) throw new Error("NOT_FOUND:Güncellenecek profil bulunamadı");
    
    const user = rows[0];
    const newDisplayName = parsed.data.displayName !== undefined ? parsed.data.displayName : user.display_name;
    const newSkills = parsed.data.skills !== undefined ? parsed.data.skills : user.skills;
    const newWebsiteUrl = parsed.data.website_url !== undefined ? parsed.data.website_url : user.website_url;
    
    await pool.query("UPDATE users SET display_name = $1, skills = $2, website_url = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4", 
      [newDisplayName, JSON.stringify(newSkills), newWebsiteUrl, uid]);
      
    return { uid, displayName: newDisplayName, skills: newSkills, website_url: newWebsiteUrl };
  } else {
    await pool.query("UPDATE users SET display_name = $1, skills = $2, website_url = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4", 
      [parsed.data.displayName, JSON.stringify(parsed.data.skills), parsed.data.website_url || null, uid]);
    return { uid, ...parsed.data };
  }
}

async function deleteProfile(uid) {
  await pool.query("DELETE FROM users WHERE id = $1", [uid]);
  return { message: "Kullanıcı profili silindi" };
}

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile
};
