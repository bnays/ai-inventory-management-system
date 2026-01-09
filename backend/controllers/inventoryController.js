// controllers/inventoryController.js
const db = require('../config/db');

/**
 * FETCH ALL INVENTORY
 * Uses a LEFT JOIN to combine Product details with current Stock levels
 */
exports.getAllInventory = async (req, res) => {
    try {
        // 1. Get pagination parameters from the URL (e.g., /api/inventory?page=1&limit=10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 2. Get the total count for the frontend pagination UI
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM products');
        const totalItems = countResult[0].total;

        // 3. Fetch the specific slice of data
        const query = `
            SELECT p.product_id, p.product_name, p.sku, c.name as category, 
                   p.unit_price, i.quantity_on_hand, p.reorder_level
            FROM products p
            LEFT JOIN inventory i ON p.product_id = i.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await db.execute(query, [String(limit), String(offset)]);

        res.status(200).json({
            data: rows,
            meta: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching inventory", error: error.message });
    }
};

/**
 * CREATE PRODUCT & INITIALIZE STOCK
 * Uses a Transaction to ensure data integrity across two tables
 */
exports.createProduct = async (req, res) => {
    const { product_name, sku, category_id, unit_price, reorder_level, initial_stock } = req.body;

    // Get a connection from the pool to handle the transaction
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert static product details
        const productSql = `
            INSERT INTO products (product_name, sku, category_id, unit_price, reorder_level) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [productResult] = await connection.execute(productSql, [
            product_name,
            sku,
            category_id,
            unit_price,
            reorder_level
        ]);

        const newProductId = productResult.insertId;

        // 2. Initialize dynamic inventory levels
        const inventorySql = `
            INSERT INTO inventory (product_id, quantity_on_hand) 
            VALUES (?, ?)
        `;
        await connection.execute(inventorySql, [newProductId, initial_stock || 0]);

        // Commit both inserts
        await connection.commit();

        res.status(201).json({
            message: "Product created and inventory initialized successfully",
            productId: newProductId
        });

    } catch (error) {
        // Undo changes if any step fails
        await connection.rollback();
        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        });
    } finally {
        // Release connection back to the pool
        connection.release();
    }
};

/**
 * UPDATE STOCK LEVEL (Adjustment)
 * Used when shipments arrive or manual corrections are needed
 */
exports.updateStock = async (req, res) => {
    const { id } = req.params; // product_id
    const { quantity_change } = req.body; // positive for additions, negative for sales

    try {
        const sql = `
            UPDATE inventory 
            SET quantity_on_hand = quantity_on_hand + ? 
            WHERE product_id = ?
        `;
        await db.execute(sql, [quantity_change, id]);

        res.status(200).json({ message: "Stock updated successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Error updating stock",
            error: error.message
        });
    }
};

/**
 * DELETE PRODUCT
 * Removes inventory record first due to Foreign Key constraints
 */
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Delete inventory first (child)
        await connection.execute('DELETE FROM inventory WHERE product_id = ?', [id]);

        // Delete product (parent)
        await connection.execute('DELETE FROM products WHERE product_id = ?', [id]);

        await connection.commit();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Error deleting product", error: error.message });
    } finally {
        connection.release();
    }
};