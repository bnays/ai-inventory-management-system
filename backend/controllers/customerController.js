const db = require('../config/db');

/**
 * GET ALL CUSTOMERS
 * Used to populate the dropdowns in the Sale Order form
 */
exports.getAllCustomers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM customers ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching customers", error: error.message });
    }
};

/**
 * GET CUSTOMER BY ID
 * Fetches details for a specific customer, including their history
 */
exports.getCustomerById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute('SELECT * FROM customers WHERE customer_id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Error fetching customer details", error: error.message });
    }
};

/**
 * CREATE NEW CUSTOMER
 * Adds a new retail partner or client to the database
 */
exports.createCustomer = async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email, phone, address]
        );
        res.status(201).json({ message: "Customer created successfully", customer_id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Error creating customer", error: error.message });
    }
};

/**
 * UPDATE CUSTOMER
 * Updates contact information or address for a client
 */
exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    try {
        await db.execute(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?',
            [name, email, phone, address, id]
        );
        res.status(200).json({ message: "Customer updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating customer", error: error.message });
    }
};