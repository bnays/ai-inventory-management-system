const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * 1. Fetch all users
 * Used by: UsersTable component
 * Maps 'user_id' to 'id' for MUI DataGrid/Table compatibility.
 */
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT user_id as id, 
                   CONCAT(first_name, ' ', last_name) as name, 
                   email, role, active, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

/**
 * 2. Create Staff Member
 * Used by: "Add Staff Member" Modal
 * Automatically hashes passwords before storage.
 */
exports.createUser = async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (first_name, last_name, email, role, password_hash, active) 
                     VALUES (?, ?, ?, ?, ?, 1)`;
        await db.execute(sql, [firstName, lastName, email, role, hashedPassword]);

        res.status(201).json({ message: "Staff member registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

/**
 * 3. Update User (Admin Level)
 * Used by: "Edit Staff Profile" Modal
 * Only updates password if a new one is provided.
 */
exports.updateUserAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, role, password } = req.body;

    try {
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        let sql, params;

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            sql = `UPDATE users SET first_name = ?, last_name = ?, role = ?, password_hash = ? WHERE user_id = ?`;
            params = [firstName, lastName, role, hashedPassword, id];
        } else {
            sql = `UPDATE users SET first_name = ?, last_name = ?, role = ? WHERE user_id = ?`;
            params = [firstName, lastName, role, id];
        }

        await db.execute(sql, params);
        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};

/**
 * 4. Delete User
 * Used by: "Confirm Deletion" Dialog
 */
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute(`DELETE FROM users WHERE user_id = ?`, [id]);
        res.status(200).json({ message: "Staff member removed from system" });
    } catch (error) {
        res.status(500).json({ message: "Deletion failed", error: error.message });
    }
};

/**
 * 5. Update Own Profile
 * Used by: AccountDetailsForm component
 * Allows users to sync their personal identity within the Sydney Hub.
 */
exports.updateProfile = async (req, res) => {
    const { first_name, last_name } = req.body;
    const userId = req.user.id; // Extracted from JWT by 'protect' middleware

    try {
        // 1. Validation check
        if (!first_name || !last_name) {
            return res.status(400).json({
                message: "Profile requirement: Both first and last names are mandatory."
            });
        }

        // 2. Perform the update
        const sql = `UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?`;
        const [result] = await db.execute(sql, [first_name, last_name, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Sync failed: User record not found." });
        }

        res.status(200).json({
            message: "Profile synchronization complete. Your details have been updated."
        });
    } catch (error) {
        console.error("Profile Update Error:", error.message);
        res.status(500).json({
            message: "Internal system error during profile update.",
            error: error.message
        });
    }
};