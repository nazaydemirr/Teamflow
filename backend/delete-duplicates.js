const { pool } = require("./db");

async function run() {
  console.log("Güvenli duplicate temizleme başlatılıyor...");
  try {
    const { rows } = await pool.query(`
      SELECT title, author_id, array_agg(id ORDER BY created_at ASC) as ids
      FROM opportunities
      GROUP BY title, author_id
      HAVING count(id) > 1
    `);
    
    for (const row of rows) {
      if (row.ids.length <= 1) continue;

      console.log(`Grup bulundu: "${row.title}" (Toplam ${row.ids.length} kayıt)`);

      // We need to fetch details to decide which to keep (the one with team/application, published, or oldest)
      const { rows: details } = await pool.query(`
        SELECT o.id, o.created_at, 
               (SELECT count(id) FROM teams t WHERE t.opp_id = o.id) as team_count
        FROM opportunities o
        WHERE o.id = ANY($1)
        ORDER BY o.created_at ASC
      `, [row.ids]);

      // Priority: 1. Has team, 2. Oldest
      let keepId = details[0].id;
      for (const d of details) {
        if (parseInt(d.team_count) > 0) {
          keepId = d.id;
          break; // First one with a team wins
        }
      }

      const deleteIds = row.ids.filter(id => id !== keepId);

      if (deleteIds.length === row.ids.length) {
        throw new Error("Safety stop: Cleanup would delete all listings in duplicate group.");
      }

      if (deleteIds.length > 0) {
        console.log(`- Korunacak kayıt ID: ${keepId}`);
        console.log(`- Silinecek kayıtlar: ${deleteIds.join(", ")}`);
        const { rowCount } = await pool.query('DELETE FROM opportunities WHERE id = ANY($1)', [deleteIds]);
        console.log(`- ${rowCount} adet kopya silindi.`);
      }
    }
    
    console.log("Güvenli temizleme tamamlandı.");
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    await pool.end();
  }
}

run();
