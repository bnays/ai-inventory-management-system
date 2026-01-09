const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config(); // Ensure your .env variables are loaded

// 1. Import Controllers
const inventoryController = require('./controllers/inventoryController');
const userController = require('./controllers/userController');

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

// --- Inventory Routes ---

// Staff and Admins can view the stock list
app.get('/api/inventory',
    protect(['admin', 'user']),
    inventoryController.getAllInventory
);

// Only Admins can create new product records
app.post('/api/inventory',
    protect(['admin']),
    inventoryController.createProduct
);

// Staff and Admins can update stock levels (e.g., after a sale or shipment)
app.patch('/api/inventory/:id',
    protect(['admin', 'user']),
    inventoryController.updateStock
);

// Only Admins can delete products from the system
app.delete('/api/inventory/:id',
    protect(['admin']),
    inventoryController.deleteProduct
);

// --- User Management Routes ---
// Only Admins can delete see all the users list
app.get('/api/users',
    protect(['admin']),
    userController.getAllUsers
);

app.listen(port, () => {
    console.log(`Logix Backend listening on port ${port}`);
});