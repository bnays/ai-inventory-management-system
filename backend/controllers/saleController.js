const db = require('../config/db');

/**
 * CREATE SALE ORDER
 * Now includes customer_id and strict inventory validation.
 */
exports.createSaleOrder = async (req, res) => {
    // Note: user_id should ideally come from your auth middleware (req.user.id)
    const { user_id, customer_id, items, tax, discount, shipping_cost, payment_method } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate total and verify stock
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // 2. Insert into sale_orders (Header)
        // Now includes customer_id for full traceability
        const orderSql = `
            INSERT INTO sale_orders (user_id, customer_id, total_amount, tax, discount, shipping_cost, status, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, 'Completed', ?)
        `;
        const [orderResult] = await connection.execute(orderSql, [
            user_id || 1, // Fallback to 1 for testing if user_id isn't in body
            customer_id,
            total_amount,
            tax || 0,
            discount || 0,
            shipping_cost || 0,
            payment_method || 'Cash'
        ]);
        const orderId = orderResult.insertId;

        // 3. Process each item: Add to order_items and Deduct from inventory
        for (const item of items) {
            await connection.execute(
                'INSERT INTO sale_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unit_price]
            );

            const [updateResult] = await connection.execute(
                'UPDATE inventory SET quantity_on_hand = quantity_on_hand - ? WHERE product_id = ? AND quantity_on_hand >= ?',
                [item.quantity, item.product_id, item.quantity]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
            }
        }

        await connection.commit();
        res.status(201).json({ message: "Sale completed and stock updated", orderId });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: "Transaction failed", error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * GET ALL SALES
 * Joins both users (staff) and customers for the main table
 */
exports.getAllSales = async (req, res) => {
    try {
        const query = `
            SELECT 
                so.*, 
                c.name AS customer_name,
                CONCAT(u.first_name, ' ', u.last_name) AS processed_by
            FROM sale_orders so
            LEFT JOIN customers c ON so.customer_id = c.customer_id
            LEFT JOIN users u ON so.user_id = u.user_id
            ORDER BY so.created_at DESC
            LIMIT 20 OFFSET 0;
        `;
        const [rows] = await db.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sales", error: error.message });
    }
};

/**
 * GET SALE BY ID
 * Provides full breakdown including customer address for the printable invoice
 */
exports.getSaleById = async (req, res) => {
    const { id } = req.params;
    try {
        const headerQuery = `
            SELECT 
                so.*, 
                c.name AS customer_name, 
                c.address AS customer_address, 
                c.phone AS customer_phone,
                CONCAT(u.first_name, ' ', u.last_name) AS processed_by,
                u.role AS processed_by_role
            FROM sale_orders so
            LEFT JOIN customers c ON so.customer_id = c.customer_id
            LEFT JOIN users u ON so.user_id = u.user_id
            WHERE so.id = ?
        `;
        const [header] = await db.execute(headerQuery, [id]);

        if (header.length === 0) return res.status(404).json({ message: "Sale not found" });

        const [items] = await db.execute(`
            SELECT soi.*, p.product_name, p.sku 
            FROM sale_order_items soi
            JOIN products p ON soi.product_id = p.product_id
            WHERE soi.order_id = ?
        `, [id]);

        res.status(200).json({ ...header[0], items });
    } catch (error) {
        res.status(500).json({ message: "Error fetching details", error: error.message });
    }
};