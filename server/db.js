const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// בדיקת חיבור למסד הנתונים
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release();
    }
});

module.exports = pool.promise();
