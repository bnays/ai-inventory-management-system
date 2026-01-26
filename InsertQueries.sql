-- 1. Insert Sample Categories
INSERT INTO categories (name, slug) VALUES 
('Electronics', 'electronics'),
('Office Supplies', 'office-supplies'),
('Furniture', 'furniture'),
('Networking', 'networking');

-- 2. Insert Sample Products 
-- (Note: Assumes category_ids 1-4 match the order above)
INSERT INTO products (product_name, sku, category_id, unit_price, reorder_level) VALUES 
('MacBook Pro 14', 'LAP-001', 1, 1999.99, 5),
('Dell UltraSharp 27', 'MON-002', 1, 450.00, 10),
('Logitech MX Master 3', 'MSE-003', 2, 99.00, 15),
('Keychron K2 Keyboard', 'KBD-004', 2, 79.00, 12),
('Ergonomic Office Chair', 'CHR-005', 3, 299.99, 8),
('Standing Desk', 'DSK-006', 3, 499.00, 5),
('Cisco Network Switch', 'SWI-007', 4, 150.00, 3),
('Ubiquiti Access Point', 'WAP-008', 4, 120.00, 10),
('USB-C Hub', 'HUB-009', 1, 45.00, 20),
('Paper Shredder', 'SHR-010', 2, 120.00, 5),
('iPad Air', 'TAB-011', 1, 599.00, 7),
('Blue Yeti Mic', 'MIC-012', 1, 129.00, 10);

-- 3. Initialize Inventory Levels (Matching product_ids 1 through 12)
INSERT INTO inventory (product_id, quantity_on_hand) VALUES 
(1, 15), (2, 8), (3, 50), (4, 4), (5, 12), (6, 3), 
(7, 2), (8, 25), (9, 100), (10, 6), (11, 20), (12, 1);


INSERT INTO suppliers (name, contact_person, email, phone) VALUES 
('Sydney Tech Wholesale', 'James Cook', 'sales@sydneytech.com.au', '02 9000 1111'),
('NSW Office Solutions', 'Sarah Jenkins', 'orders@nswoffice.com.au', '02 9000 2222'),
('Harbour Furniture Ltd', 'Ben White', 'info@harbourfurniture.com.au', '02 9000 3333'),
('Global Networking AU', 'Amit Patel', 'amit@globalnet.com.au', '02 9000 4444');

-- FORMAT: (product_id, supplier_id, supply_price, lead_time_days)
INSERT INTO product_suppliers (product_id, supplier_id, supply_price, lead_time_days) VALUES 
(1, 1, 1850.00, 3), (1, 2, 1890.00, 14), 
(2, 1, 400.00, 2),  (2, 2, 420.00, 10),

(3, 1, 75.00, 1),
(4, 1, 60.00, 2),

(5, 2, 210.00, 15),
(6, 2, 350.00, 21),

(7, 1, 110.00, 3), (7, 2, 105.00, 12),
(8, 1, 90.00, 3),  (8, 2, 85.00, 12),

(9, 1, 35.00, 1),
(10, 2, 95.00, 7),
(11, 2, 550.00, 10),
(12, 1, 100.00, 2);

-- 1. Create 3 Purchase Order Headers
INSERT INTO purchase_orders (supplier_id, total_amount, status, order_date, received_date)
VALUES 
((SELECT id FROM suppliers LIMIT 1), 1500.00, 'Received', '2026-01-01 10:00:00', '2026-01-05 14:00:00'),
((SELECT id FROM suppliers LIMIT 1 OFFSET 1), 2200.00, 'Received', '2026-01-05 09:30:00', '2026-01-12 11:20:00'),
((SELECT id FROM suppliers LIMIT 1), 800.00, 'Pending', '2026-01-18 15:45:00', NULL);

-- 2. Link Products to these Orders (Line Items)
-- Order #1 items
INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price)
VALUES 
((SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1 OFFSET 2), (SELECT product_id FROM products LIMIT 1), 50, 20.00),
((SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1 OFFSET 2), (SELECT product_id FROM products LIMIT 1 OFFSET 1), 25, 20.00);

-- Order #2 items
INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price)
VALUES 
((SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1 OFFSET 1), (SELECT product_id FROM products LIMIT 1 OFFSET 2), 100, 22.00);

-- 1. Insert 5 more historical Purchase Orders
INSERT INTO purchase_orders (supplier_id, total_amount, status, order_date, received_date)
VALUES 
((SELECT id FROM suppliers LIMIT 1), 3200.50, 'Received', '2025-11-15 10:00:00', '2025-11-20 14:30:00'),
((SELECT id FROM suppliers LIMIT 1 OFFSET 1), 1250.00, 'Received', '2025-12-01 09:15:00', '2025-12-08 11:00:00'),
((SELECT id FROM suppliers LIMIT 1), 4500.00, 'Received', '2025-12-15 14:45:00', '2025-12-18 09:20:00'),
((SELECT id FROM suppliers LIMIT 1 OFFSET 1), 2100.75, 'Received', '2026-01-05 11:30:00', '2026-01-14 16:00:00'),
((SELECT id FROM suppliers LIMIT 1), 950.00, 'Pending', '2026-01-19 08:00:00', NULL);

-- 2. Link existing products to these orders (Line Items)
-- Items for Order placed in Nov 2025
INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price)
VALUES 
((SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1 OFFSET 4), (SELECT product_id FROM products LIMIT 1), 100, 15.50),
((SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1 OFFSET 4), (SELECT product_id FROM products LIMIT 1 OFFSET 1), 50, 33.00);

-- Items for Order placed in early Jan 2026
INSERT INTO purchase_order_items (purchase_id, product_id, quantity, cost_price)
VALUES 
((SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1 OFFSET 1), (SELECT product_id FROM products LIMIT 1 OFFSET 2), 75, 28.00);

-- 1. Insert 10 Historical Sale Orders (Headers)
INSERT INTO sale_orders (user_id, total_amount, status, payment_method, created_at)
VALUES 
((SELECT user_id FROM users LIMIT 1), 450.00, 'Completed', 'Card', '2025-10-15 10:30:00'),
((SELECT user_id FROM users LIMIT 1 OFFSET 1), 1200.00, 'Completed', 'Bank Transfer', '2025-11-02 14:15:00'),
((SELECT user_id FROM users LIMIT 1), 310.50, 'Completed', 'Cash', '2025-11-18 09:00:00'),
((SELECT user_id FROM users LIMIT 1 OFFSET 2), 890.00, 'Completed', 'Card', '2025-12-05 16:45:00'),
((SELECT user_id FROM users LIMIT 1 OFFSET 1), 2100.00, 'Completed', 'Bank Transfer', '2025-12-12 11:20:00'),
((SELECT user_id FROM users LIMIT 1), 150.00, 'Completed', 'Cash', '2025-12-28 13:00:00'),
((SELECT user_id FROM users LIMIT 1 OFFSET 2), 540.75, 'Completed', 'Card', '2026-01-05 10:00:00'),
((SELECT user_id FROM users LIMIT 1), 720.00, 'Completed', 'Card', '2026-01-12 15:30:00'),
((SELECT user_id FROM users LIMIT 1 OFFSET 1), 95.00, 'Completed', 'Cash', '2026-01-18 10:15:00'),
((SELECT user_id FROM users LIMIT 1), 600.00, 'Pending', 'Card', NOW());

-- 2. Link Products to these Sales (Line Items)
-- This assumes you have at least 3 products in your products table
INSERT INTO sale_order_items (order_id, product_id, quantity, unit_price)
VALUES 
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 9), (SELECT product_id FROM products LIMIT 1), 2, 225.00),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 8), (SELECT product_id FROM products LIMIT 1 OFFSET 1), 5, 240.00),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 7), (SELECT product_id FROM products LIMIT 1 OFFSET 2), 1, 310.50),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 6), (SELECT product_id FROM products LIMIT 1), 4, 222.50),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 5), (SELECT product_id FROM products LIMIT 1 OFFSET 1), 10, 210.00),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 4), (SELECT product_id FROM products LIMIT 1 OFFSET 2), 1, 150.00),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 3), (SELECT product_id FROM products LIMIT 1), 2, 270.37),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 2), (SELECT product_id FROM products LIMIT 1 OFFSET 1), 3, 240.00),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1 OFFSET 1), (SELECT product_id FROM products LIMIT 1 OFFSET 2), 1, 95.00),
((SELECT id FROM sale_orders ORDER BY id DESC LIMIT 1), (SELECT product_id FROM products LIMIT 1), 3, 200.00);

-- Insert Test Customers
INSERT INTO customers (name, email, phone, address)
VALUES 
('Sydney Retail Collective', 'orders@sydneyretail.com.au', '02 9123 4567', '123 George St, Sydney NSW 2000'),
('Parramatta Wholesale Hub', 'contact@parrawholesale.com.au', '02 9876 5432', '45 Church St, Parramatta NSW 2150'),
('North Shore Tech Supplies', 'procurement@nsts.com.au', '02 9411 0000', '88 Pacific Hwy, North Sydney NSW 2060'),
('Bondi Beach Boutique', 'hello@bondiboutique.com.au', '02 9300 1111', '12 Campbell Parade, Bondi Beach NSW 2026'),
('Western Sydney Logistics', 'dispatch@westernlogistics.com.au', '02 8765 4321', '22 Sunnyholt Rd, Blacktown NSW 2148');


INSERT INTO products (product_name, sku, category_id, unit_price, reorder_level, created_at) 
VALUES 
('Sony WH-1000XM5 Headphones', 'AUD-015', 1, 549.00, 8, NOW()),
('Samsung 32-inch 4K Monitor', 'MON-016', 1, 699.00, 5, NOW()),
('Razer DeathAdder V3 Mouse', 'MSE-017', 2, 129.00, 15, NOW()),
('SteelSeries Apex Pro TKL', 'KBD-018', 2, 349.00, 10, NOW()),
('Aeron Task Chair', 'CHR-019', 3, 1899.00, 3, NOW()),
('Sit-Stand Dual Motor Frame', 'DSK-020', 3, 650.00, 5, NOW()),
('Netgear Nighthawk Router', 'WAP-021', 4, 429.00, 12, NOW()),
('Anker 10-in-1 Docking Station', 'HUB-022', 1, 199.00, 20, NOW()),
('WD Black 2TB NVMe SSD', 'DRV-023', 1, 289.00, 25, NOW()),
('Elgato Stream Deck MK.2', 'STR-024', 2, 239.00, 7, NOW());