const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config(); // Ensure your .env variables are loaded

// 1. Import Controllers
const inventoryController = require('./controllers/inventoryController');
const userController = require('./controllers/userController');
const categoryController = require('./controllers/categoryController');
const supplierController = require('./controllers/supplierController');
const purchaseController = require('./controllers/purchaseController');
const saleController = require('./controllers/saleController');
const customerController = require('./controllers/customerController');

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
app.post('/api/products',
    protect(['admin']),
    inventoryController.createProduct
);

// Staff and Admins can update stock levels (e.g., after a sale or shipment)
app.patch('/api/inventory/:id',
    protect(['admin', 'user']),
    inventoryController.updateStock
);

app.patch('/api/products/:id',
    protect(['admin']),
    inventoryController.updateProduct // Ensure this function exists in your controller!
);

// Only Admins can delete products from the system
app.delete('/api/inventory/:id',
    protect(['admin']),
    inventoryController.deleteProduct
);

// --- Category Routes ---

// All logged-in users can view categories; only admins can create them
app.get('/api/categories', protect(['admin', 'user']), categoryController.getAllCategories);
app.post('/api/categories', protect(['admin']), categoryController.createCategory);
app.patch('/api/categories/:id', protect(['admin']), categoryController.updateCategory);
app.delete('/api/categories/:id', protect(['admin']), categoryController.deleteCategory);

// All logged-in users can view suppliers; only admins can create them
app.get('/api/suppliers', protect(['admin', 'user']), supplierController.getAllSuppliers);
app.post('/api/suppliers', protect(['admin']), supplierController.createSupplier);
app.patch('/api/suppliers/:id', protect(['admin']), supplierController.updateSupplier);

// --- Purchase Module Routes ---
// Record a new bulk order from a supplier
app.post('/api/purchases', protect(['admin']), purchaseController.createPurchaseOrder);

// Fetch all orders for the dashboard table
app.get('/api/purchases', protect(['admin', 'user']), purchaseController.getAllPurchases);

// Fetch specific details for the Order Modal
app.get('/api/purchases/:id', protect(['admin', 'user']), purchaseController.getPurchaseById);

// The critical 'Receive' button that increments inventory
app.patch('/api/purchases/:id/receive', protect(['admin', 'user']), purchaseController.receivePurchaseOrder);

// --- Sales Module Routes ---
// Process a customer sale and deduct inventory automatically
app.post('/api/sales', protect(['admin', 'user']), saleController.createSaleOrder);

// Fetch history for the Sales report
app.get('/api/sales', protect(['admin', 'user']), saleController.getAllSales);

// View specific items sold in a transaction
app.get('/api/sales/:id', protect(['admin', 'user']), saleController.getSaleById);

// --- User Management Routes ---
// Only Admins can delete see all the users list
app.get('/api/users',
    protect(['admin']),
    userController.getAllUsers
);

app.patch('/api/users/profile', protect(['admin', 'user']), userController.updateUserProfile);

// --- Customer Routes ---
// Staff and Admins can view the customer list
app.get('/api/customers',
    protect(['admin', 'user']),
    customerController.getAllCustomers
);

// Only Admins can create or update customer records for the Sydney hub
app.post('/api/customers',
    protect(['admin']),
    customerController.createCustomer
);

app.get('/api/customers/:id',
    protect(['admin', 'user']),
    customerController.getCustomerById
);

app.patch('/api/customers/:id',
    protect(['admin']),
    customerController.updateCustomer
);



app.listen(port, () => {
    console.log(`Logix Backend listening on port ${port}`);
});