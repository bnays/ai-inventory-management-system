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

exports.updateUserProfile = async (req, res) => {
    const { first_name, last_name } = req.body;
    const userId = req.user.id; // Populated by your protect middleware

    console.log(first_name, last_name, userId);

    try {
        const sql = `UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?`;
        await db.execute(sql, [first_name, last_name, userId]);

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Database update failed", error: error.message });
    }
};