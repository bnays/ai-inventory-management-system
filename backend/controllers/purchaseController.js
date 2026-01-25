const db = require('../config/db');

/**
 * FETCH ALL PURCHASES
 */
exports.getAllPurchases = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM purchase_orders');
        const totalItems = countResult[0].total;

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
        res.status(500).json({ message: "Error fetching purchase orders", error: error.message });
    }
};

/**
 * GET PURCHASE BY ID
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

        if (header.length === 0) return res.status(404).json({ message: "Purchase order not found" });

        const itemsQuery = `
            SELECT pi.*, p.product_name, p.sku
            FROM purchase_order_items pi
            JOIN products p ON pi.product_id = p.product_id
            WHERE pi.purchase_id = ?
        `;
        const [items] = await db.execute(itemsQuery, [id]);

        res.status(200).json({ ...header[0], items });
    } catch (error) {
        res.status(500).json({ message: "Error fetching order details", error: error.message });
    }
};

/**
 * CREATE PURCHASE ORDER
 */
exports.createPurchaseOrder = async (req, res) => {
    // total_amount here is the frontend-calculated (Subtotal + GST)
    const { supplier_id, items, tax, total_amount, shipping_fee } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Use the total_amount passed from the frontend (which includes GST)
        // rather than re-calculating just the subtotal here.
        const orderSql = `
            INSERT INTO purchase_orders (supplier_id, total_amount, tax, shipping_fee, status) 
            VALUES (?, ?, ?, ?, 'Pending')
        `;
        const [orderResult] = await connection.execute(orderSql, [
            supplier_id,
            total_amount,
            tax || 0,
            shipping_fee || 0
        ]);

        const purchaseId = orderResult.insertId;

        const itemSql = `
            INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price) 
            VALUES (?, ?, ?, ?)
        `;

        for (const item of items) {
            await connection.execute(itemSql, [purchaseId, item.product_id, item.quantity, item.cost_price]);
        }

        await connection.commit();
        res.status(201).json({ message: "Purchase order created with GST calculation", purchaseId });
    } catch (error) {
        await connection.rollback();
        console.error("PO Creation Error:", error.message);
        res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * RECEIVE PURCHASE ORDER
 * Atomic update: Marks order as received, increments stock, and LOGS TRANSACTION.
 */
exports.receivePurchaseOrder = async (req, res) => {
    const { id } = req.params;
    // user_id should ideally come from auth middleware (req.user.user_id)
    const user_id = req.user?.user_id || 1;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Update status
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

        // 2. Fetch items to update inventory and log transactions
        const [items] = await connection.execute(
            'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_id = ?',
            [id]
        );

        for (const item of items) {
            // A. Sync with Inventory table
            await connection.execute(
                'UPDATE inventory SET quantity_on_hand = quantity_on_hand + ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );

            // B. LOG STOCK TRANSACTION (Inflow)
            // Critical for Sydney hub audit trail and AI lead-time analysis
            await connection.execute(
                `INSERT INTO stock_transactions 
                 (product_id, user_id, transaction_type, quantity_changed, reference_id, reason) 
                 VALUES (?, ?, 'Inflow', ?, ?, ?)`,
                [
                    item.product_id,
                    user_id,
                    item.quantity, // Positive represents stock arriving
                    id,
                    `Purchase Order #${id} Received`
                ]
            );
        }

        await connection.commit();
        res.status(200).json({ message: "Stock updated and transaction logged successfully" });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Transaction failed", error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * GENERATE QUICK PURCHASE ORDER
 */
exports.generateQuickPurchase = async (req, res) => {
    const { supplier_id, items } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate Financials
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
        const tax = subtotal * 0.10; // 10% GST
        const total_amount = subtotal + tax;

        // 2. Create Order Header
        const [orderResult] = await connection.execute(
            `INSERT INTO purchase_orders (supplier_id, total_amount, tax, status) 
             VALUES (?, ?, ?, 'Pending')`,
            [supplier_id, total_amount, tax]
        );
        const purchaseId = orderResult.insertId;

        // 3. Create Order Items
        const itemSql = `INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price) VALUES (?, ?, ?, ?)`;
        for (const item of items) {
            await connection.execute(itemSql, [purchaseId, item.product_id, item.quantity, item.cost_price]);
        }

        await connection.commit();
        res.status(201).json({
            success: true,
            message: "Automated Purchase Order generated with GST",
            purchaseId,
            financials: { subtotal, tax, total_amount }
        });

    } catch (error) {
        await connection.rollback();
        console.error("Quick Purchase Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate automated order" });
    } finally {
        connection.release();
    }
};