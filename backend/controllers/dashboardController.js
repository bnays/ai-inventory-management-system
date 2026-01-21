const pool = require('../config/db');

exports.getDashboardSummary = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        // 1. Define SQL Queries mapped to ai_inventory_system
        const queries = {
            // Basic KPI Totals
            productCount: 'SELECT COUNT(*) as count FROM products',
            customerCount: 'SELECT COUNT(*) as count FROM customers',
            salesTotal: 'SELECT COALESCE(SUM(total_amount), 0) as total FROM sale_orders',

            // JOIN products and inventory for Sydney hub value
            inventoryValue: `
        SELECT COALESCE(SUM(p.unit_price * i.quantity_on_hand), 0) as val 
        FROM products p 
        JOIN inventory i ON p.product_id = i.product_id`,

            // MySQL Trend: Last 30 days vs Previous 30 days
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

            // Comparative Sales: This Year vs Last Year
            comparativeSales: `
        SELECT 
          YEAR(created_at) as year_val,
          MONTH(created_at) as month_num,
          COALESCE(SUM(total_amount), 0) as total
        FROM sale_orders
        WHERE YEAR(created_at) IN (${currentYear}, ${lastYear})
        GROUP BY year_val, month_num
        ORDER BY year_val DESC, month_num ASC`,

            // TOP 5 SELLING CATEGORIES (Replaces Traffic Source)
            topCategories: `
        SELECT 
          c.name as label, 
          COALESCE(SUM(soi.quantity * soi.unit_price), 0) as revenue
        FROM categories c
        JOIN products p ON c.id = p.category_id
        JOIN sale_order_items soi ON p.product_id = soi.product_id
        GROUP BY c.name
        ORDER BY revenue DESC
        LIMIT 5`,

            recentTransactions: `
        SELECT s.id, c.name as customer_name, s.total_amount as amount, s.created_at as createdAt 
        FROM sale_orders s 
        JOIN customers c ON s.customer_id = c.customer_id 
        ORDER BY s.created_at DESC LIMIT 6`,

            stockHealth: `
        SELECT 
          CASE WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(CASE WHEN i.quantity_on_hand > p.reorder_level THEN 1 END) * 100.0 / COUNT(*)) 
          END as health 
        FROM products p
        JOIN inventory i ON p.product_id = i.product_id`
        };

        // 2. Execute all queries in parallel
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
            pool.query(queries.stockHealth)          // 9
        ]);

        // Helper: Safely extract rows across different DB drivers
        const getRows = (res) => res.rows || res[0] || [];

        // 3. Process Trends
        const calculateDiff = (curr, prev) => {
            const c = Number(curr || 0);
            const p = Number(prev || 0);
            if (p === 0) return c > 0 ? 100 : 0;
            return Math.round(((c - p) / p) * 100);
        };

        const custTrendRows = getRows(results[4])[0];
        const invTrendRows = getRows(results[5])[0];
        const salesRows = getRows(results[6]);
        const catRows = getRows(results[7]);

        // 4. Format Chart Series (Comparative)
        const currentYearData = Array(12).fill(0);
        const lastYearData = Array(12).fill(0);

        salesRows.forEach(row => {
            const amountK = Number(row.total) / 1000;
            if (row.year_val === currentYear) {
                currentYearData[row.month_num - 1] = amountK;
            } else if (row.year_val === lastYear) {
                lastYearData[row.month_num - 1] = amountK;
            }
        });

        // 5. Build and Send Response
        res.json({
            success: true,
            data: {
                // KPI Cards
                totalInventoryValue: (Number(getRows(results[3])[0]?.val || 0) / 1000).toFixed(1),
                retailPartnerCount: parseInt(getRows(results[1])[0]?.count || 0),
                stockHealthScore: Math.round(getRows(results[9])[0]?.health || 0),
                totalSalesRevenue: (Number(getRows(results[2])[0]?.total || 0) / 1000).toFixed(1),

                // Real Dynamic Trends
                invDiff: calculateDiff(invTrendRows?.current_inv, invTrendRows?.last_inv),
                invTrend: Number(invTrendRows?.current_inv || 0) >= Number(invTrendRows?.last_inv || 0) ? 'up' : 'down',
                custDiff: calculateDiff(custTrendRows?.current_month, custTrendRows?.last_month),
                custTrend: Number(custTrendRows?.current_month || 0) >= Number(custTrendRows?.last_month || 0) ? 'up' : 'down',

                // Category Sales (Top 5)
                categoryData: catRows.map(r => parseFloat(r.revenue)),
                categoryLabels: catRows.map(r => r.label),

                // Comparative Sales Chart
                salesChartSeries: [
                    { name: 'This year', data: currentYearData },
                    { name: 'Last year', data: lastYearData }
                ],

                // Recent History
                recentTransactions: getRows(results[8]).map(order => ({
                    id: `SLS-${String(order.id).padStart(3, '0')}`,
                    customer: { name: order.customer_name },
                    amount: Number(order.amount),
                    status: 'Completed',
                    createdAt: order.createdAt
                }))
            }
        });
    } catch (error) {
        console.error("DASHBOARD SQL ERROR:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch real-time Sydney metrics" });
    }
};