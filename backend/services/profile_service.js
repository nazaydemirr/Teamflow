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
  return rows[0];
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
