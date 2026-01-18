// src/controllers/saleController.js
const db = require('../config/db');

/**
 * CREATE SALE ORDER
 * Handles the header, line items, and atomic inventory deduction
 */
exports.createSaleOrder = async (req, res) => {
    const { user_id, items, tax, discount, shipping_cost, payment_method } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate total amount from items
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // 2. Insert into sale_orders (Header)
        const orderSql = `
            INSERT INTO sale_orders (user_id, total_amount, tax, discount, shipping_cost, status, payment_method) 
            VALUES (?, ?, ?, ?, ?, 'Completed', ?)
        `;
        const [orderResult] = await connection.execute(orderSql, [
            user_id, total_amount, tax || 0, discount || 0, shipping_cost || 0, payment_method || 'Cash'
        ]);
        const orderId = orderResult.insertId;

        // 3. Process each item: Add to order_items and Deduct from inventory
        for (const item of items) {
            // Insert line item
            await connection.execute(
                'INSERT INTO sale_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unit_price]
            );

            // Deduct from inventory only if enough stock exists
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
        console.error("Sale Transaction Error:", error.message);
        res.status(500).json({ message: "Failed to process sale", error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * GET ALL SALES
 * Fetches transaction history with pagination for the dashboard
 */
exports.getAllSales = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM sale_orders');
        const totalItems = countResult[0].total;

        const query = `
            SELECT so.*, u.username 
            FROM sale_orders so
            LEFT JOIN users u ON so.user_id = u.user_id
            ORDER BY so.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(query, [limit, offset]);

        res.status(200).json({
            data: rows,
            meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching sales history", error: error.message });
    }
};

/**
 * GET SALE BY ID
 * Provides detailed breakdown of items within a specific sale
 */
exports.getSaleById = async (req, res) => {
    const { id } = req.params;
    try {
        const [header] = await db.execute('SELECT * FROM sale_orders WHERE id = ?', [id]);
        if (header.length === 0) return res.status(404).json({ message: "Sale not found" });

        const [items] = await db.execute(`
            SELECT soi.*, p.product_name, p.sku 
            FROM sale_order_items soi
            JOIN products p ON soi.product_id = p.product_id
            WHERE soi.order_id = ?
        `, [id]);

        res.status(200).json({ ...header[0], items });
    } catch (error) {
        res.status(500).json({ message: "Error fetching sale details", error: error.message });
    }
};