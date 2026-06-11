const { pool } = require("./db");

async function run() {
  console.log("Eski ilanları ve hatalı silinen Ceo!nun bitirme projesi'ni geri yükleme başlatıldı...");
  try {
    // Nazlıcan Aydemir'i bul
    const { rows: userRows } = await pool.query("SELECT id FROM users WHERE display_name = 'Nazlıcan Aydemir' LIMIT 1");
    if (userRows.length === 0) {
      console.log("Kullanıcı bulunamadı.");
      return;
    }
    const uid = userRows[0].id;

    // Check if the project already exists
    const { rows: existingRows } = await pool.query("SELECT id FROM opportunities WHERE title = 'Ceo!nun bitirme projesi' LIMIT 1");
    if (existingRows.length > 0) {
      console.log("Bu proje zaten var.");
    } else {
      // Re-create the opportunity
      const title = "Ceo!nun bitirme projesi";
      const description = "<swdefcefe";
      const tags = ["Tailwind CSS", "Nuxt.js", "PostgreSQL", "Airflow", "Ürün Yönetimi", "E-Ticaret", "IoT", "Android", "Vercel"];
      const deadline = new Date("2026-07-02T23:59:59.000Z").toISOString();
      const membersMax = 5; // Default guess
      const type = "bitirme-projesi";

      const { rows } = await pool.query(
        `INSERT INTO opportunities (title, description, tags, deadline, members_max, type, author_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [title, description, JSON.stringify(tags), deadline, membersMax, type, uid]
      );
      
      const oppId = rows[0].id;
      console.log(`İlan başarıyla yeniden oluşturuldu. ID: ${oppId}`);

      // Create the team
      await pool.query(
        `INSERT INTO teams (opp_id, name, description, leader_id) VALUES ($1, $2, $3, $4)`,
        [oppId, "Proje Ekibi", "Bitirme Projesi Takımı", uid]
      );
      console.log("Takım başarıyla oluşturuldu ve ilana bağlandı.");
    }

  } catch (err) {
    console.error("Hata:", err);
  } finally {
    await pool.end();
  }
}

run();
