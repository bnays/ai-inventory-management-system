// controllers/authController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Your MySQL connection pool
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    try {
        // 1. Check if user already exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Hash the password (Cost factor: 10-12)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert into MySQL (Default active: true)
        const sql = `INSERT INTO users (first_name, last_name, email, password_hash, role, active) 
                 VALUES (?, ?, ?, ?, ?, true)`;
        const [result] = await db.execute(sql, [firstName, lastName, email, hashedPassword, role || 'user']);

        // IMPORTANT: Generate a token so the user is logged in immediately
        const token = jwt.sign(
            { id: result.insertId, role: role, email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(201).json({
            message: "User registered successfully",
            token, // Send this so frontend can save it
            user: { id: result.insertId, firstName, lastName, role, email }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user and check if active
        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND active = true', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials or inactive account" });
        }

        const user = users[0];

        // 2. Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 3. Generate JWT (Expires in 1-24 hours)
        const token = jwt.sign(
            { id: user.user_id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // 4. Return user info (Exclude password_hash)
        res.json({
            token,
            user: {
                id: user.user_id,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};

// Add this to your exports in authController.js
exports.getMe = async (req, res) => {
    try {
        // req.user is populated by your 'protect' middleware
        const [users] = await db.execute(
            'SELECT user_id, first_name, last_name, email, role, active FROM users WHERE user_id = ?',
            [req.user.id]
        );

        if (users.length === 0 || !users[0].active) {
            return res.status(404).json({ message: "User not found or inactive" });
        }

        const user = users[0];
        res.json({
            user: {
                id: user.user_id,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data", error: error.message });
    }
};

/**
 * UPDATE USER PASSWORD
 * Securely hashes new credentials and updates the Sydney Hub user record.
 */
exports.updatePassword = async (req, res) => {
    const { password } = req.body;

    try {
        // 1. Validate Input (Basic length check as a fail-safe)
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Security requirement: Password must be at least 6 characters." });
        }

        // 2. Hash the new password with a cost factor of 10
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Update database (req.user.id provided by your auth middleware)
        const sql = 'UPDATE users SET password_hash = ? WHERE user_id = ?';
        const [result] = await db.execute(sql, [hashedPassword, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Update failed: User record not found." });
        }

        res.status(200).json({
            message: "Credential synchronization complete. Your password has been updated."
        });

    } catch (error) {
        console.error("Password Update Error:", error.message);
        res.status(500).json({
            message: "Internal security failure during password update.",
            error: error.message
        });
    }
};