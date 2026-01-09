// controllers/inventoryController.js
const db = require('../config/db');

// Create a new product and initialize its stock
exports.createProduct = async (req, res) => {
    const { product_name, sku, category_id, unit_price, reorder_level } = req.body;

    try {
        // Start a transaction to ensure both tables update or none do
        await db.query('START TRANSACTION');

        // 1. Insert into products table
        const productSql = `INSERT INTO products (product_name, sku, category_id, unit_price, reorder_level) 
                            VALUES (?, ?, ?, ?, ?)`;
        const [productResult] = await db.execute(productSql, [product_name, sku, category_id, unit_price, reorder_level]);

        const newProductId = productResult.insertId;

        // 2. Initialize entry in inventory table with 0 stock
        const inventorySql = `INSERT INTO inventory (product_id, quantity_on_hand) VALUES (?, 0)`;
        await db.execute(inventorySql, [newProductId]);

        // Commit the transaction
        await db.query('COMMIT');

        res.status(201).json({
            message: "Product created and inventory initialized successfully",
            productId: newProductId
        });
    } catch (error) {
        // Rollback if anything fails
        await db.query('ROLLBACK');
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
};