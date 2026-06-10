const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
// Eğer URL 'localhost' içeriyorsa SSL kullanma, değilse (örneğin Render) SSL kullan.
const isLocalhost = connectionString ? connectionString.includes('localhost') || connectionString.includes('127.0.0.1') : true;

// Production (Render) ortamında DATABASE_URL kullanılır.
const pool = new Pool(
  connectionString
    ? {
        connectionString: connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
      }
    : {
        // Eski lokal ayarlarınız yedek olarak durabilir
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || "teamflow_db",
      }
);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
