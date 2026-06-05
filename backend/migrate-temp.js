const { pool } = require('./db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE notifications RENAME COLUMN read TO is_read;
      ALTER TABLE notifications ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
    `);
    console.log('Migration Başarılı: notifications tablosu güncellendi.');
  } catch (err) {
    console.log('Hata veya tablo zaten güncel: ' + err.message);
  } finally {
    pool.end();
  }
}

migrate();
