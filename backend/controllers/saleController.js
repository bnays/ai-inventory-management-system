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

        // 1. Fetch Verified Prices from Database to ensure Profit Margin
        let calculated_total = 0;
        const verifiedItems = [];

        for (const item of items) {
            const [productData] = await connection.execute(
                'SELECT unit_price, product_name, sku FROM products WHERE product_id = ?',
                [item.product_id]
            );

            if (productData.length === 0) throw new Error(`Product ID ${item.product_id} not found.`);

            const retailPrice = Number(productData[0].unit_price);
            calculated_total += (item.quantity * retailPrice);

            verifiedItems.push({
                ...item,
                retailPrice,
                product_name: productData[0].product_name,
                sku: productData[0].sku
            });
        }

        // 2. Insert Header with Server-Calculated Total
        const orderSql = `
            INSERT INTO sale_orders (user_id, customer_id, total_amount, tax, discount, shipping_cost, status, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, 'Completed', ?)
        `;
        const [orderResult] = await connection.execute(orderSql, [
            user_id || 1,
            customer_id,
            calculated_total,
            tax || 0,
            discount || 0,
            shipping_cost || 0,
            payment_method || 'Cash'
        ]);
        const orderId = orderResult.insertId;

        // 3. Process each item (Inventory, Line Items, Transactions, AI Sync)
        for (const item of verifiedItems) {
            // A. Update inventory with strict stock check
            const [updateResult] = await connection.execute(
                'UPDATE inventory SET quantity_on_hand = quantity_on_hand - ? WHERE product_id = ? AND quantity_on_hand >= ?',
                [item.quantity, item.product_id, item.quantity]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error(`Insufficient stock for: ${item.product_name}`);
            }

            // B. Insert Line Item using the Verified Retail Price
            await connection.execute(
                'INSERT INTO sale_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.retailPrice]
            );

            // C. Log Stock Transaction (Outflow)
            await connection.execute(
                `INSERT INTO stock_transactions 
                 (product_id, user_id, transaction_type, quantity_changed, reference_id, reason) 
                 VALUES (?, ?, 'Outflow', ?, ?, ?)`,
                [item.product_id, user_id || 1, -item.quantity, orderId, `Sale Order #${orderId}`]
            );

            // D. Sync with AI Forecasting Engine (Correct Date Format)
            const today = new Date().toISOString().split('T')[0];
            await connection.execute(
                `INSERT INTO sales_history (product_sku, quantity_sold, sale_date) 
                 VALUES (?, ?, ?)`,
                [item.sku, item.quantity, today]
            );

            // E. Post-deduction check for Low Stock Notification
            const [invCheck] = await connection.execute(
                'SELECT i.quantity_on_hand, p.reorder_level FROM inventory i JOIN products p ON i.product_id = p.product_id WHERE i.product_id = ?',
                [item.product_id]
            );

            if (invCheck[0].quantity_on_hand <= invCheck[0].reorder_level) {
                await connection.execute(
                    'INSERT INTO notifications (type, message, product_id) VALUES (?, ?, ?)',
                    ['Low Stock', `Urgent: ${item.product_name} is now at ${invCheck[0].quantity_on_hand} units.`, item.product_id]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: "Sale completed and profit-synced", orderId });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * GET ALL SALES
 * Joins customers and users for the dashboard table
 */
exports.getAllSales = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 1. Get total count for the frontend pagination component
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM sale_orders');
        const totalItems = countResult[0].total;

        // 2. Fetch the specific slice of data with Customer and User details
        const query = `
            SELECT 
                so.*, 
                c.name AS customer_name,
                c.address AS customer_address,
                CONCAT(u.first_name, ' ', u.last_name) AS processed_by
            FROM sale_orders so
            LEFT JOIN customers c ON so.customer_id = c.customer_id
            LEFT JOIN users u ON so.user_id = u.user_id
            ORDER BY so.created_at DESC
            LIMIT ? OFFSET ?;
        `;

        // Note: LIMIT and OFFSET values must be passed as strings for some database drivers
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
        console.error("Fetch Sales Error:", error.message);
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