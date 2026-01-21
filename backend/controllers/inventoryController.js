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
            SELECT 
                p.product_id, 
                p.product_name, 
                p.sku, 
                c.name as category, 
                p.category_id, 
                p.unit_price, 
                i.quantity_on_hand, 
                p.reorder_level,
                -- Use s.name to avoid the 'ambiguous column' error
                GROUP_CONCAT(s.name SEPARATOR ', ') AS supplier_names
            FROM products p
            LEFT JOIN inventory i ON p.product_id = i.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_suppliers ps ON p.product_id = ps.product_id
            LEFT JOIN suppliers s ON ps.supplier_id = s.id
            -- Required: list all non-aggregated columns here
            GROUP BY p.product_id, c.name, i.quantity_on_hand
            ORDER BY p.product_id DESC 
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
    const {
        product_name,
        sku,
        category_id,
        unit_price,
        reorder_level,
        initial_stock,
        suppliers // Array of { supplier_id, supply_price, lead_time_days }
    } = req.body;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert static product details
        const productSql = `
            INSERT INTO products (product_name, sku, category_id, unit_price, reorder_level) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [productResult] = await connection.execute(productSql, [
            product_name, sku, category_id, unit_price, reorder_level
        ]);

        const newProductId = productResult.insertId;

        // 2. Initialize dynamic inventory levels
        const inventorySql = `INSERT INTO inventory (product_id, quantity_on_hand) VALUES (?, ?)`;
        await connection.execute(inventorySql, [newProductId, initial_stock || 0]);

        // 3. Link multiple suppliers in the junction table
        if (suppliers && suppliers.length > 0) {
            const supplierSql = `
                INSERT INTO product_suppliers (product_id, supplier_id, supply_price, lead_time_days) 
                VALUES (?, ?, ?, ?)
            `;

            // Map each supplier link to a promise
            const supplierPromises = suppliers.map(sup =>
                connection.execute(supplierSql, [
                    newProductId,
                    sup.supplier_id,
                    sup.supply_price || unit_price, // Fallback to unit_price if specific price isn't provided
                    sup.lead_time_days || 7
                ])
            );

            await Promise.all(supplierPromises);
        }

        await connection.commit();

        res.status(201).json({
            message: "Product created, inventory initialized, and suppliers linked successfully",
            productId: newProductId
        });

    } catch (error) {
        await connection.rollback(); // Undo everything if any part fails
        res.status(500).json({ message: "Failed to create product", error: error.message });
    } finally {
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


// backend/controllers/productController.js
// src/controllers/inventoryController.js

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const {
        product_name,
        sku,
        category_id,
        unit_price,
        reorder_level,
        suppliers // Array of { supplier_id, supply_price }
    } = req.body;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Update core product details
        const productSql = `
            UPDATE products 
            SET product_name = ?, sku = ?, category_id = ?, unit_price = ?, reorder_level = ? 
            WHERE product_id = ?
        `;
        await connection.execute(productSql, [
            product_name, sku, category_id, unit_price, reorder_level, id
        ]);

        // 2. Synchronize Many-to-Many Supplier Links
        if (suppliers) {
            // First, remove existing links for this product
            await connection.execute('DELETE FROM product_suppliers WHERE product_id = ?', [id]);

            // Then, insert the new set of links
            if (suppliers.length > 0) {
                const supplierSql = `
                    INSERT INTO product_suppliers (product_id, supplier_id, supply_price) 
                    VALUES (?, ?, ?)
                `;
                const supplierPromises = suppliers.map(sup =>
                    connection.execute(supplierSql, [id, sup.supplier_id, sup.supply_price])
                );
                await Promise.all(supplierPromises);
            }
        }

        await connection.commit();
        res.status(200).json({ message: "Product and supplier links updated successfully" });

    } catch (error) {
        await connection.rollback(); // Undo everything if any step fails
        console.error("Update Error:", error.message);
        res.status(500).json({ message: "Error updating product", error: error.message });
    } finally {
        connection.release();
    }
};

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

/**
 * GET LOW STOCK REPORT
 * Identifies products below reorder_level and suggests purchase quantities.
 */
exports.getLowStockSuggestions = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.product_id,
                p.product_name,
                p.sku,
                i.quantity_on_hand,
                p.reorder_level,
                (p.reorder_level * 2 - i.quantity_on_hand) as suggested_restock_qty,
                s.name as preferred_supplier,
                s.id as supplier_id,
                ps.supply_price,
                -- Subquery to check for orders that are 'Pending' but not yet 'Received'
                (SELECT COUNT(*) 
                 FROM purchase_order_items poi 
                 JOIN purchase_orders po ON poi.purchase_id = po.id 
                 WHERE poi.product_id = p.product_id AND po.status = 'Pending'
                ) as pending_order_count
            FROM products p
            JOIN inventory i ON p.product_id = i.product_id
            JOIN product_suppliers ps ON ps.product_id = p.product_id
            JOIN suppliers s ON ps.supplier_id = s.id
            WHERE i.quantity_on_hand <= p.reorder_level
              AND ps.supply_price = (
                  SELECT MIN(supply_price) 
                  FROM product_suppliers 
                  WHERE product_id = p.product_id
              )
            GROUP BY 
                p.product_id, 
                p.product_name, 
                p.sku, 
                i.quantity_on_hand, 
                p.reorder_level, 
                s.name, 
                s.id, 
                ps.supply_price
            ORDER BY (p.reorder_level - i.quantity_on_hand) DESC;
        `;

        const [rows] = await db.execute(query);

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Low Stock Report Error:", error.message);
        res.status(500).json({
            message: "Error generating report",
            error: error.message
        });
    }
};

/** GET STOCK LEDGER
 * Provides a history of stock adjustments for auditing purposes
 */

exports.getStockLedger = async (req, res) => {
    const { product_id, startDate, endDate } = req.query;
    let query = `
        SELECT 
            st.transaction_id, st.transaction_type, st.quantity_changed, st.reason, st.created_at,
            p.product_name, p.sku, CONCAT(u.first_name, ' ', u.last_name) AS staff_member
        FROM stock_transactions st
        JOIN products p ON st.product_id = p.product_id
        JOIN users u ON st.user_id = u.user_id
        WHERE 1=1
    `;
    const params = [];

    if (product_id) {
        query += ` AND st.product_id = ?`;
        params.push(product_id);
    }
    if (startDate && endDate) {
        query += ` AND st.created_at BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    query += ` ORDER BY st.created_at DESC LIMIT 100`;

    try {
        const [rows] = await db.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Filter failed", error: error.message });
    }
};