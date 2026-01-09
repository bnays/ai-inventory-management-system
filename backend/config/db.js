// config/db.js
const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool to handle multiple concurrent requests
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    waitForConnections: true,
    connectionLimit: 10, // Adjust based on expected load
    queueLimit: 0
});

// Use the promise-based wrapper for async/await support
const promisePool = pool.promise();

// Test the connection on startup
promisePool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the Logix Warehousing MySQL database');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

module.exports = promisePool;