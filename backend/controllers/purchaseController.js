// src/controllers/purchaseController.js
const db = require('../config/db');

exports.getAllPurchases = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 1. Get total count for pagination
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM purchase_orders');
        const totalItems = countResult[0].total;

        // 2. Fetch orders with supplier names
        const query = `
            SELECT 
                po.id, 
                s.name as supplier_name, 
                po.total_amount, 
                po.status, 
                po.order_date, 
                po.received_date,
                -- Count how many distinct items are in this order
                (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_id = po.id) as item_count
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.order_date DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await db.execute(query, [limit, offset]);

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
        res.status(500).json({ message: "Error fetching purchase orders", error: error.message });
    }
};

// src/controllers/purchaseController.js

exports.getPurchaseById = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch Order Header and Supplier Details
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

        // 2. Fetch specific items linked to this order
        const itemsQuery = `
            SELECT pi.*, p.product_name, p.sku
            FROM purchase_order_items pi
            JOIN products p ON pi.product_id = p.product_id
            WHERE pi.purchase_id = ?
        `;
        const [items] = await db.execute(itemsQuery, [id]);

        // 3. Combine and return
        res.status(200).json({
            ...header[0],
            items
        });
    } catch (error) {
        console.error("Get Purchase Detail Error:", error.message);
        res.status(500).json({ message: "Error fetching order details", error: error.message });
    }
};

exports.createPurchaseOrder = async (req, res) => {
    const { supplier_id, items, tax, shipping_fee } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate total amount from items
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);

        // 2. Insert into purchase_orders
        const orderSql = `
            INSERT INTO purchase_orders (supplier_id, total_amount, tax, shipping_fee) 
            VALUES (?, ?, ?, ?)
        `;
        const [orderResult] = await connection.execute(orderSql, [
            supplier_id, total_amount, tax || 0, shipping_fee || 0
        ]);
        const purchaseId = orderResult.insertId;

        // 3. Insert all line items
        const itemSql = `
            INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price) 
            VALUES (?, ?, ?, ?)
        `;
        const itemPromises = items.map(item =>
            connection.execute(itemSql, [purchaseId, item.product_id, item.quantity, item.cost_price])
        );
        await Promise.all(itemPromises);

        await connection.commit();
        res.status(201).json({ message: "Purchase order created", purchaseId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Failed to create purchase order", error: error.message });
    } finally {
        connection.release();
    }
};

exports.receivePurchaseOrder = async (req, res) => {
    const { id } = req.params; // purchase_id
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Update purchase order status and set received_date
        const updateOrderSql = `
            UPDATE purchase_orders 
            SET status = 'Received', received_date = CURRENT_TIMESTAMP 
            WHERE id = ? AND status = 'Pending'
        `;
        const [orderResult] = await connection.execute(updateOrderSql, [id]);

        if (orderResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Order not found or already received" });
        }

        // 2. Fetch all items in this purchase to update inventory
        const [items] = await connection.execute(
            'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_id = ?',
            [id]
        );

        // 3. Increment quantity_on_hand for each product
        const updateStockSql = `
            UPDATE inventory 
            SET quantity_on_hand = quantity_on_hand + ? 
            WHERE product_id = ?
        `;

        const stockPromises = items.map(item =>
            connection.execute(updateStockSql, [item.quantity, item.product_id])
        );
        await Promise.all(stockPromises);

        await connection.commit();
        res.status(200).json({ message: "Stock successfully updated and order marked as received" });

    } catch (error) {
        await connection.rollback();
        console.error("Receive Order Error:", error.message);
        res.status(500).json({ message: "Failed to process received order", error: error.message });
    } finally {
        connection.release();
    }
};