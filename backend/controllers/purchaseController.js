// src/controllers/purchaseController.js
const db = require('../config/db');

/**
 * FETCH ALL PURCHASES
 * Retrieves orders with supplier names and item counts for the dashboard table.
 */
exports.getAllPurchases = async (req, res) => {
    try {
        // Explicitly parse strings from query params to Integers
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 1. Get total count for pagination metadata
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM purchase_orders');
        const totalItems = countResult[0].total;

        // 2. Fetch orders with supplier details
        const query = `
            SELECT 
                po.id, 
                s.name as supplier_name, 
                po.total_amount, 
                po.status, 
                po.order_date, 
                po.received_date,
                (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_id = po.id) as item_count
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.order_date DESC
            LIMIT ? OFFSET ?
        `;

        // Pass variables as numbers to match the MySQL prepared statement
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
        console.error("Fetch Purchases Error:", error.message);
        res.status(500).json({
            message: "Error fetching purchase orders",
            error: error.message // This helps debug if there's still a naming mismatch
        });
    }
};

/**
 * GET PURCHASE BY ID
 * Fetches order header details and joins with specific line items.
 */
exports.getPurchaseById = async (req, res) => {
    const { id } = req.params;

    try {
        const headerQuery = `
            SELECT po.*, s.name as supplier_name, s.email as supplier_email
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.id = ?
        `;
        const [header] = await db.execute(headerQuery, [id]);

        if (header.length === 0) {
            return res.status(404).json({ message: "Purchase order not found" });
        }

        const itemsQuery = `
            SELECT pi.*, p.product_name, p.sku
            FROM purchase_order_items pi
            JOIN products p ON pi.product_id = p.product_id
            WHERE pi.purchase_id = ?
        `;
        const [items] = await db.execute(itemsQuery, [id]);

        res.status(200).json({
            ...header[0],
            items
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching order details", error: error.message });
    }
};

/**
 * CREATE PURCHASE ORDER
 * Initiates an "Inflow" request from a supplier using a transaction.
 */
exports.createPurchaseOrder = async (req, res) => {
    const { supplier_id, items, tax, shipping_fee } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate total
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);

        // 2. Insert Header
        const orderSql = `
            INSERT INTO purchase_orders (supplier_id, total_amount, tax, shipping_fee, status) 
            VALUES (?, ?, ?, ?, 'Pending')
        `;
        const [orderResult] = await connection.execute(orderSql, [
            supplier_id, total_amount, tax || 0, shipping_fee || 0
        ]);
        const purchaseId = orderResult.insertId;

        // 3. Insert Line Items
        const itemSql = `
            INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price) 
            VALUES (?, ?, ?, ?)
        `;
        for (const item of items) {
            await connection.execute(itemSql, [purchaseId, item.product_id, item.quantity, item.cost_price]);
        }

        await connection.commit();
        res.status(201).json({ message: "Purchase order created", purchaseId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * RECEIVE PURCHASE ORDER
 * Atomic update: Marks order as received and increments physical stock.
 */
exports.receivePurchaseOrder = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Update status and set received_date for AI lead-time tracking
        const updateOrderSql = `
            UPDATE purchase_orders 
            SET status = 'Received', received_date = CURRENT_TIMESTAMP 
            WHERE id = ? AND status = 'Pending'
        `;
        const [orderResult] = await connection.execute(updateOrderSql, [id]);

        if (orderResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Order already received or not found" });
        }

        // 2. Fetch items to increment stock
        const [items] = await connection.execute(
            'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_id = ?',
            [id]
        );

        // 3. Sync with Inventory table
        for (const item of items) {
            await connection.execute(
                'UPDATE inventory SET quantity_on_hand = quantity_on_hand + ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();
        res.status(200).json({ message: "Stock updated successfully" });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Transaction failed", error: error.message });
    } finally {
        connection.release();
    }
};