const { pool } = require('./db');

async function addTestUser() {
  try {
    await pool.query(`
      INSERT INTO users (email, password_hash, display_name, skills)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['test_react_user@example.com', 'hashedpassword', 'React Uzmanı Test Kullanıcısı', JSON.stringify(["React"])]);
    console.log('Test kullanıcısı eklendi!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

addTestUser();
