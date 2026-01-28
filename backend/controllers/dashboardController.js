const pool = require('../config/db');

exports.getDashboardSummary = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        const queries = {
            // ... existing queries 0 through 9 ...
            productCount: 'SELECT COUNT(*) as count FROM products',
            customerCount: 'SELECT COUNT(*) as count FROM customers',
            salesTotal: 'SELECT COALESCE(SUM(total_amount), 0) as total FROM sale_orders',
            inventoryValue: `
                SELECT COALESCE(SUM((p.unit_price / 1.4) * i.quantity_on_hand), 0) as val 
                FROM products p 
                JOIN inventory i ON p.product_id = i.product_id`,
            custTrend: `
                SELECT 
                  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as current_month,
                  COUNT(CASE WHEN created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 31 DAY) THEN 1 END) as last_month
                FROM customers`,
            invTrend: `
                SELECT 
                  COALESCE(SUM(CASE WHEN last_updated >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN quantity_on_hand END), 0) as current_inv,
                  COALESCE(SUM(CASE WHEN last_updated BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 31 DAY) THEN quantity_on_hand END), 0) as last_inv
                FROM inventory`,
            comparativeSales: `
                        SELECT 
                            DATE_FORMAT(created_at, '%b') as month_label,
                            YEAR(created_at) as year_val,
                            MONTH(created_at) as month_num,
                            COALESCE(SUM(total_amount), 0) as total
                        FROM sale_orders 
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                        GROUP BY year_val, month_num, month_label 
                        ORDER BY year_val ASC, month_num ASC`,
            topCategories: `
                SELECT c.name as label, COALESCE(SUM(soi.quantity * soi.unit_price), 0) as revenue
                FROM categories c JOIN products p ON c.id = p.category_id
                JOIN sale_order_items soi ON p.product_id = soi.product_id
                GROUP BY c.name ORDER BY revenue DESC LIMIT 5`,
            recentTransactions: `
                SELECT s.id, c.name as customer_name, s.total_amount as amount, s.created_at as createdAt 
                FROM sale_orders s JOIN customers c ON s.customer_id = c.customer_id 
                ORDER BY s.created_at DESC LIMIT 6`,
            stockHealth: `
                SELECT CASE WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(CASE WHEN i.quantity_on_hand > p.reorder_level THEN 1 END) * 100.0 / COUNT(*)) 
                END as health FROM products p JOIN inventory i ON p.product_id = i.product_id`,

            // --- FIX 1: New Query for New Inventory Widget ---
            recentProducts: `
                SELECT 
                    p.product_id as id,
                    p.product_name as name, 
                    p.sku, 
                    i.quantity_on_hand, 
                    p.reorder_level
                FROM products p
                JOIN inventory i ON p.product_id = i.product_id
                ORDER BY i.last_updated DESC 
                LIMIT 7`
        };

        // Execute all 11 queries
        const results = await Promise.all([
            pool.query(queries.productCount),        // 0
            pool.query(queries.customerCount),       // 1
            pool.query(queries.salesTotal),          // 2
            pool.query(queries.inventoryValue),      // 3
            pool.query(queries.custTrend),           // 4
            pool.query(queries.invTrend),            // 5
            pool.query(queries.comparativeSales),    // 6
            pool.query(queries.topCategories),       // 7
            pool.query(queries.recentTransactions),  // 8
            pool.query(queries.stockHealth),         // 9
            pool.query(queries.recentProducts)       // 10 (NEW)
        ]);

        const getRows = (res) => res.rows || res[0] || [];
        const calculateDiff = (curr, prev) => {
            const c = Number(curr || 0);
            const p = Number(prev || 0);
            return p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);
        };

        const custTrendRows = getRows(results[4])[0];
        const invTrendRows = getRows(results[5])[0];
        const salesRows = getRows(results[6]);
        const catRows = getRows(results[7]);

        const currentYearData = Array(12).fill(0);
        const lastYearData = Array(12).fill(0);
        salesRows.forEach(row => {
            const amountK = Number(row.total) / 1000;
            if (row.year_val === currentYear) currentYearData[row.month_num - 1] = amountK;
            else if (row.year_val === lastYear) lastYearData[row.month_num - 1] = amountK;
        });

        res.json({
            success: true,
            data: {
                totalInventoryValue: (Number(getRows(results[3])[0]?.val || 0) / 1000).toFixed(1),
                retailPartnerCount: parseInt(getRows(results[1])[0]?.count || 0),
                stockHealthScore: Math.round(getRows(results[9])[0]?.health || 0),
                totalSalesRevenue: (Number(getRows(results[2])[0]?.total || 0) / 1000).toFixed(1),
                invDiff: calculateDiff(invTrendRows?.current_inv, invTrendRows?.last_inv),
                invTrend: Number(invTrendRows?.current_inv || 0) >= Number(invTrendRows?.last_inv || 0) ? 'up' : 'down',
                custDiff: calculateDiff(custTrendRows?.current_month, custTrendRows?.last_month),
                custTrend: Number(custTrendRows?.current_month || 0) >= Number(custTrendRows?.last_month || 0) ? 'up' : 'down',
                categoryData: catRows.map(r => parseFloat(r.revenue)),
                categoryLabels: catRows.map(r => r.label),
                salesChartSeries: [{ name: 'This year', data: currentYearData }, { name: 'Last year', data: lastYearData }],

                // --- FIX 2: Correct Mapping for LatestOrders ($NaN Fix) ---
                recentTransactions: getRows(results[8]).map(order => ({
                    id: String(order.id).padStart(3, '0'),
                    customer: { name: order.customer_name },
                    amount: Number(order.amount) || 0, // Ensure this is a valid number
                    status: 'Completed',
                    createdAt: order.createdAt
                })),

                // --- FIX 3: Correct Mapping for New Inventory ---
                recentProducts: getRows(results[10]).map(p => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    quantity_on_hand: Number(p.quantity_on_hand) || 0,
                    reorder_level: Number(p.reorder_level) || 0
                }))
            }
        });
    } catch (error) {
        console.error("DASHBOARD SQL ERROR:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch real-time Sydney metrics" });
    }
};