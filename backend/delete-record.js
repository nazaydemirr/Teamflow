require('dotenv').config();
const { pool } = require('./db');

async function deleteRecord() {
  try {
    const id = '07a1cc66-2f98-4bf7-bf7d-a32ea38224de';
    
    // Check if it's there
    const { rows: before } = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    console.log("Before delete:", before);

    // Delete it
    const res = await pool.query('DELETE FROM applications WHERE id = $1', [id]);
    console.log(`Deleted ${res.rowCount} row(s).`);

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
deleteRecord();
