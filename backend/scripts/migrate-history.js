const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');
const path = require('path');

async function migrate() {
    const records = [];
    const csvPath = path.resolve(__dirname, '../../ai-module/sku_sales_history_dataset.csv');

    console.log(`Reading from: ${csvPath}`);

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => records.push([data.product_sku, data.quantity_sold, data.date]))
        .on('end', async () => {
            try {
                const sql = 'INSERT INTO sales_history (product_sku, quantity_sold, sale_date) VALUES ?';
                await db.query(sql, [records]);
                console.log(`Successfully migrated ${records.length} records to Sydney Hub.`);
                process.exit(0);
            } catch (err) {
                console.error('Migration failed:', err.message);
                process.exit(1);
            }
        });
}
migrate();