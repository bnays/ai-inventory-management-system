// controllers/supplierController.js
const db = require('../config/db');

exports.getAllSuppliers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM suppliers ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching suppliers", error: error.message });
    }
};

exports.createSupplier = async (req, res) => {
    // 1. Destructure payment_details from the request body
    const { name, phone_number, email, address, payment_method, payment_details } = req.body;

    try {
        // 2. Add the column and the variable to your SQL statement
        const [result] = await db.execute(
            'INSERT INTO suppliers (name, phone_number, email, address, payment_method, payment_details) VALUES (?, ?, ?, ?, ?, ?)',
            [name, phone_number, email, address, payment_method, payment_details]
        );

        res.status(201).json({
            id: result.insertId,
            message: "Supplier added successfully",
            data: { name, email, phone_number } // Return basic info for the UI
        });
    } catch (error) {
        res.status(500).json({ message: "Error adding supplier", error: error.message });
    }
};


exports.updateSupplier = async (req, res) => {
    const { id } = req.params;

    // Defaulting to null prevents 'undefined' from crashing the query
    const {
        name,
        phone_number,
        email,
        address = null,
        payment_method = null,
        payment_details = null
    } = req.body;

    try {
        const [result] = await db.execute(
            `UPDATE suppliers 
             SET name = ?, phone_number = ?, email = ?, address = ?, payment_method = ?, payment_details = ? 
             WHERE id = ?`,
            [name, phone_number, email, address, payment_method, payment_details, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.status(200).json({ message: "Supplier updated successfully" });
    } catch (error) {
        // Log the exact error to your terminal for debugging
        console.error('SQL Error:', error);
        res.status(500).json({ message: "Error updating supplier", error: error.message });
    }
};