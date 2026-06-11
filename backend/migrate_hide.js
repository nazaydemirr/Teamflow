const { pool } = require('./db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE applications ADD COLUMN applicant_hidden BOOLEAN DEFAULT false;');
    console.log('Migration successful');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
