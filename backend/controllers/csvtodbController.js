const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db'); 

exports.importProducts = async (req, res) => {
    const filePath = path.join(__dirname, './uploads/products.csv');

    if (!fs.existsSync(filePath)) {
        return res.status(400).json({
            message: 'products.csv file not found'
        });
    }

    const products = [];
    let rowNumber = 0;

    try {
        const stream = fs.createReadStream(filePath).pipe(csv());

        for await (const row of stream) {
            rowNumber++;

            // Validation
            if (
                !row.product_name ||
                !row.sku ||
                isNaN(row.category_id) ||
                isNaN(row.unit_price) ||
                isNaN(row.reorder_level)
            ) {
                return res.status(400).json({
                    message: `Invalid data at row ${rowNumber}`
                });
            }

            products.push([
                row.product_name.trim(),
                row.sku.trim(),
                Number(row.category_id),
                Number(row.unit_price),
                Number(row.reorder_level)
            ]);
        }

        if (!products.length) {
            return res.status(400).json({
                message: 'No valid product records found'
            });
        }

        // Transaction 
        await db.beginTransaction();

        const sql = `
            INSERT INTO products
            (product_name, sku, category_id, unit_price, reorder_level)
            VALUES ?
        `;

        await db.query(sql, [products]);

        await db.commit();

        res.status(201).json({
            message: 'Products imported successfully',
            recordsInserted: products.length
        });

    } catch (error) {
        console.error('CSV to DB Error:', error.message);

        await db.rollback();

        res.status(500).json({
            message: 'CSV import failed',
            error: error.message
        });
    }
};
