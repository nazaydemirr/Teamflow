const { pool } = require("./db");

async function run() {
  console.log("Lider düzeltme scripti başlatıldı...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Find bitirme-projesi teams where leader_id != author_id
    const { rows } = await client.query(`
      SELECT t.id as team_id, o.id as opp_id, o.author_id, t.leader_id, o.title
      FROM teams t
      JOIN opportunities o ON t.opp_id = o.id
      WHERE (o.type = 'bitirme-projesi' OR o.title ILIKE '%bitirme%') AND t.leader_id != o.author_id
    `);

    console.log(`Düzeltilecek hatalı lider kaydı sayısı: ${rows.length}`);

    for (const row of rows) {
      console.log(`Düzeltilen Takım: "${row.title}" (Eski Lider: ${row.leader_id}, Yeni Lider: ${row.author_id})`);
      
      // Update team leader
      await client.query("UPDATE teams SET leader_id = $1 WHERE id = $2", [row.author_id, row.team_id]);
      
      // Insert the actual author as a member
      await client.query(`
        INSERT INTO team_members (team_id, user_id)
        SELECT $1, $2
        WHERE NOT EXISTS (
            SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2
        )
      `, [row.team_id, row.author_id]);

      // Remove the old leader from team_members
      await client.query(`
        DELETE FROM team_members WHERE team_id = $1 AND user_id = $2
      `, [row.team_id, row.leader_id]);
    }
    
    await client.query("COMMIT");
    console.log("Lider düzeltme scripti başarıyla tamamlandı.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Hata:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
