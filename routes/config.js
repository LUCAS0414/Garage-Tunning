require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            parseInt(process.env.DB_PORT) || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'garage',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '-03:00',
});

// Testar conexão na inicialização
pool.getConnection()
  .then(conn => {
    console.log('[DB] Conectado ao MySQL — banco:', process.env.DB_NAME || 'garage');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] Falha na conexão:', err.message);
    process.exit(1);
  });

module.exports = pool;
