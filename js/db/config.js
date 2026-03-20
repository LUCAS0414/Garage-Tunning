const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',      
  password: '', 
  database: 'garage',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criando o Pool
const pool = mysql.createPool(dbConfig);

module.exports = pool;