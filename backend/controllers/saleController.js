const db = require('../config/db');
const { Parser } = require('json2csv');

/**
 * CREATE SALE ORDER
 * Handles atomic inventory deduction, transaction logging, and low-stock alerting.
 */
exports.createSaleOrder = async (req, res) => {
    const { user_id, customer_id, items, tax, discount, shipping_cost, payment_method } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate total and Insert Header
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        const orderSql = `
            INSERT INTO sale_orders (user_id, customer_id, total_amount, tax, discount, shipping_cost, status, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, 'Completed', ?)
        `;
        const [orderResult] = await connection.execute(orderSql, [
            user_id || 1,
            customer_id,
            total_amount,
            tax || 0,
            discount || 0,
            shipping_cost || 0,
            payment_method || 'Cash'
        ]);
        const orderId = orderResult.insertId;

        // 2. Process each item
        for (const item of items) {
            // A. Update inventory with strict stock check
            const [updateResult] = await connection.execute(
                'UPDATE inventory SET quantity_on_hand = quantity_on_hand - ? WHERE product_id = ? AND quantity_on_hand >= ?',
                [item.quantity, item.product_id, item.quantity]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
            }

            // B. Insert Line Item
            await connection.execute(
                'INSERT INTO sale_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unit_price]
            );

            // C. LOG STOCK TRANSACTION (Outflow)
            // Essential for the Sydney hub audit trail
            await connection.execute(
                `INSERT INTO stock_transactions 
                 (product_id, user_id, transaction_type, quantity_changed, reference_id, reason) 
                 VALUES (?, ?, 'Outflow', ?, ?, ?)`,
                [
                    item.product_id,
                    user_id || 1,
                    -item.quantity, // Negative represents stock leaving the warehouse
                    orderId,
                    `Sale Order #${orderId}`
                ]
            );

            // D. Post-deduction check for Low Stock Notification
            const [stockData] = await connection.execute(
                `SELECT p.product_name, i.quantity_on_hand, p.reorder_level 
                 FROM inventory i 
                 JOIN products p ON i.product_id = p.product_id 
                 WHERE i.product_id = ?`,
                [item.product_id]
            );

            const product = stockData[0];
            if (product.quantity_on_hand <= product.reorder_level) {
                await connection.execute(
                    'INSERT INTO notifications (type, message, product_id) VALUES (?, ?, ?)',
                    ['Low Stock', `Urgent: ${product.product_name} is now at ${product.quantity_on_hand} units in Sydney Hub.`, item.product_id]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: "Sale completed, stock updated, and transaction logged", orderId });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: "Transaction failed", error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * GET ALL SALES
 * Joins customers and users for the dashboard table
 */
exports.getAllSales = async (req, res) => {
    try {
        const query = `
            SELECT 
                so.*, 
                c.name AS customer_name,
                c.address AS customer_address,
                CONCAT(u.first_name, ' ', u.last_name) AS processed_by
            FROM sale_orders so
            LEFT JOIN customers c ON so.customer_id = c.customer_id
            LEFT JOIN users u ON so.user_id = u.user_id
            ORDER BY so.created_at DESC;
        `;
        const [rows] = await db.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sales", error: error.message });
    }
};

/**
 * GET SALE BY ID
 * Provides detailed breakdown for the printable dispatch note
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

/**
 * EXPORT SALES CSV
 * Denormalized data for AI training and reporting
 */
exports.exportSalesCSV = async (req, res) => {
    try {
        const query = `
            SELECT 
                so.id AS order_id,
                DATE(so.created_at) AS sale_date,
                c.name AS customer_name,
                p.product_name,
                soi.quantity AS quantity_sold,
                soi.unit_price AS selling_price,
                so.tax,
                so.discount,
                so.status
            FROM sale_order_items soi
            JOIN sale_orders so ON soi.order_id = so.id
            JOIN products p ON soi.product_id = p.product_id
            LEFT JOIN customers c ON so.customer_id = c.customer_id
            WHERE so.status = 'Completed'
            ORDER BY so.created_at DESC;
        `;

        const [rows] = await db.execute(query);
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment(`logix_sales_export_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        res.status(500).json({ message: "Export failed", error: error.message });
    }
};