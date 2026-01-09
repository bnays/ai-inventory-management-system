const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config(); // Ensure your .env variables are loaded

// Use process.env.PORT for the server port (typically 5000)
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
// CRITICAL: This must be active to read JSON data from your Next.js frontend
app.use(express.json());
// Add this immediately after your middleware (cors/express.json)
app.get('/', (req, res) => {
    res.status(200).send('Logix Warehousing API is online and healthy.');
});

// --- Import Routes ---
// Note: Usually, you import from a 'routes' file, not the controller directly
const authRoutes = require('./controllers/authController');
const { protect } = require('./middleware/authMiddleware');

// --- Auth Routes ---
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);

// New route for fetching current user profile
app.get('/api/auth/me', protect(['admin', 'user']), authRoutes.getMe);

// --- Protected Route Example ---
// This follows your RBAC requirements for Admin and Staff
app.get('/api/protected', protect(['admin', 'user']), (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
});

// // Root route for connectivity check
// app.get('/', (req, res) => {
//     res.send('Logix Warehousing API is running!');
// });

app.listen(port, () => {
    console.log(`Logix Backend listening on port ${port}`);
});