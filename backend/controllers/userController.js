// controllers/userController.js
const db = require('../config/db');

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT user_id, first_name, last_name, email, role, active, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};