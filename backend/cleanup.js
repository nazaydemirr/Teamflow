const { pool } = require("./db");

async function cleanup() {
  try {
    console.log("Hatalı veriler temizleniyor...");
    
    const { rows } = await pool.query(`
      SELECT o.id 
      FROM opportunities o
      LEFT JOIN teams t ON o.id = t.opp_id
      WHERE o.type = 'bitirme-projesi' AND t.id IS NULL
    `);
    
    console.log(`Takımı olmayan ${rows.length} adet 'bitirme-projesi' bulundu.`);
    
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      
      const { rowCount } = await pool.query('DELETE FROM opportunities WHERE id = ANY($1)', [ids]);
      console.log(`Başarıyla ${rowCount} adet fırsat silindi.`);
    } else {
        console.log("Silinecek fırsat bulunamadı.");
    }
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    await pool.end();
  }
}

cleanup();
