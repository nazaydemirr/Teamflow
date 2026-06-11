const { pool } = require("../db");
const { z } = require("zod");

const userSchema = z.object({
  displayName: z.string().min(1, "displayName boş olamaz"),
  skills: z.array(z.string()).min(1, "En az 1 yetenek seçilmelidir").optional().default([]),
  website_url: z.string().url("Geçerli bir URL olmalıdır").optional().or(z.literal("")),
  university: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  grade: z.string().optional().or(z.literal("")),
  interests: z.array(z.string()).optional().default([]),
  experience_level: z.string().optional().or(z.literal("")),
  github_url: z.string().url("Geçerli bir URL olmalıdır").optional().or(z.literal("")),
  linkedin_url: z.string().url("Geçerli bir URL olmalıdır").optional().or(z.literal("")),
});
const userUpdateSchema = userSchema.partial();

async function getProfile(uid) {
  const { rows } = await pool.query(`
    SELECT 
      id as uid, email, display_name as "displayName", skills, website_url,
      university, department, grade, interests, experience_level, github_url, linkedin_url, created_at
    FROM users WHERE id = $1
  `, [uid]);
  if (rows.length === 0) throw new Error("NOT_FOUND:Kullanıcı profili bulunamadı");
  
  const user = rows[0];
  user.memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : "Belirtilmedi";
  delete user.created_at;

  // Active Applications Count (Beklemede veya Onaylandi) ve Uye oldugu takimlar (Lideri haric)
  const { rows: activeStats } = await pool.query(`
    SELECT 
      (SELECT count(*) FROM applications WHERE applicant_id = $1 AND status = 'pending') +
      (SELECT count(*) FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = $1 AND t.leader_id != $1) as count
  `, [uid]);
  const activeCount = parseInt(activeStats[0].count);

  const { rows: memberStats } = await pool.query(`
    SELECT count(*) as count FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = $1 AND t.leader_id != $1
  `, [uid]);
  const memberTeamsCount = parseInt(memberStats[0].count);

  // Leader Count (Kendi actigi firsatlar + Lideri oldugu takimlar)
  const { rows: leaderStats } = await pool.query(`
    SELECT count(DISTINCT o.id) as opp_count, count(DISTINCT t.id) as team_count
    FROM opportunities o
    LEFT JOIN teams t ON o.id = t.opp_id
    WHERE o.author_id = $1 OR t.leader_id = $1
  `, [uid]);
  
  const leaderCount = parseInt(leaderStats[0].team_count) > 0 ? parseInt(leaderStats[0].team_count) : parseInt(leaderStats[0].opp_count);

  const { rows: leaderTeamsStats } = await pool.query(`
    SELECT count(DISTINCT t.id) as count FROM teams t WHERE t.leader_id = $1
  `, [uid]);
  const leaderTeamsCount = parseInt(leaderTeamsStats[0].count);

  return { ...user, stats: { activeCount, leaderCount, memberTeamsCount, leaderTeamsCount } };
}

async function updateProfile(uid, body, isPartial = false) {
  const schema = isPartial ? userUpdateSchema : userSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error("VALIDATION_ERROR:Geçersiz veri");
    error.details = parsed.error.flatten();
    throw error;
  }

  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [uid]);
  if (rows.length === 0) throw new Error("NOT_FOUND:Güncellenecek profil bulunamadı");
  
  const user = rows[0];
  
  const data = parsed.data;
  const newDisplayName = data.displayName !== undefined ? data.displayName : user.display_name;
  const newSkills = data.skills !== undefined ? data.skills : user.skills;
  const newWebsiteUrl = data.website_url !== undefined ? data.website_url : user.website_url;
  const newUniversity = data.university !== undefined ? data.university : user.university;
  const newDepartment = data.department !== undefined ? data.department : user.department;
  const newGrade = data.grade !== undefined ? data.grade : user.grade;
  const newInterests = data.interests !== undefined ? data.interests : user.interests;
  const newExperience = data.experience_level !== undefined ? data.experience_level : user.experience_level;
  const newGithubUrl = data.github_url !== undefined ? data.github_url : user.github_url;
  const newLinkedinUrl = data.linkedin_url !== undefined ? data.linkedin_url : user.linkedin_url;

  await pool.query(`
    UPDATE users 
    SET 
      display_name = $1, skills = $2, website_url = $3, 
      university = $4, department = $5, grade = $6, 
      interests = $7, experience_level = $8, github_url = $9, linkedin_url = $10,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = $11
  `, [
    newDisplayName, JSON.stringify(newSkills || []), newWebsiteUrl, 
    newUniversity, newDepartment, newGrade, 
    JSON.stringify(newInterests || []), newExperience, newGithubUrl, newLinkedinUrl,
    uid
  ]);

  return { 
    uid, displayName: newDisplayName, skills: newSkills, website_url: newWebsiteUrl,
    university: newUniversity, department: newDepartment, grade: newGrade,
    interests: newInterests, experience_level: newExperience, 
    github_url: newGithubUrl, linkedin_url: newLinkedinUrl
  };
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
