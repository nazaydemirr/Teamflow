const { pool } = require('../backend/db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'applications'")
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(() => pool.end());
