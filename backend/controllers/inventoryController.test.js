jest.mock('../config/db', () => ({
  execute: jest.fn(),
  getConnection: jest.fn(),
}));

const db = require('../config/db');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllInventory,
} = require('./inventoryController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockConnection() {
  return {
    execute: jest.fn().mockResolvedValue([{ insertId: 1, affectedRows: 1 }]),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

describe('Products CRUD (BE2) - inventoryController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    test('inserts the product and its initial inventory row, then commits and returns 201 with the new productId', async () => {
      const conn = mockConnection();
      conn.execute.mockResolvedValueOnce([{ insertId: 42 }]); // product insert
      conn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // inventory insert
      db.getConnection.mockResolvedValue(conn);

      const req = {
        body: {
          product_name: 'Widget',
          sku: 'WID-1',
          category_id: 1,
          unit_price: 9.99,
          reorder_level: 5,
          initial_stock: 20,
        },
      };
      const res = mockRes();

      await createProduct(req, res);

      expect(conn.beginTransaction).toHaveBeenCalled();
      expect(conn.commit).toHaveBeenCalled();
      expect(conn.rollback).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 42 })
      );
    });

    test('on a database error, rolls back the transaction and returns 500 without committing', async () => {
      const conn = mockConnection();
      conn.execute.mockRejectedValueOnce(new Error('DB failure'));
      db.getConnection.mockResolvedValue(conn);

      const req = { body: { product_name: 'Widget', sku: 'WID-1' } };
      const res = mockRes();

      await createProduct(req, res);

      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.commit).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('always releases the connection, even on failure', async () => {
      const conn = mockConnection();
      conn.execute.mockRejectedValueOnce(new Error('DB failure'));
      db.getConnection.mockResolvedValue(conn);

      await createProduct({ body: {} }, mockRes());

      expect(conn.release).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    test('updates the product row and returns 200', async () => {
      const conn = mockConnection();
      db.getConnection.mockResolvedValue(conn);

      const req = {
        params: { id: '7' },
        body: {
          product_name: 'Updated Widget',
          sku: 'WID-1',
          category_id: 2,
          unit_price: 12.5,
          reorder_level: 3,
        },
      };
      const res = mockRes();

      await updateProduct(req, res);

      expect(conn.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products'),
        expect.arrayContaining(['Updated Widget', 'WID-1', 2, 12.5, 3, '7'])
      );
      expect(conn.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('on a database error, rolls back and returns 500', async () => {
      const conn = mockConnection();
      conn.execute.mockRejectedValueOnce(new Error('DB failure'));
      db.getConnection.mockResolvedValue(conn);

      const req = { params: { id: '7' }, body: { product_name: 'X' } };
      const res = mockRes();

      await updateProduct(req, res);

      expect(conn.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteProduct', () => {
    test('deletes inventory and product rows in a transaction and returns 200', async () => {
      const conn = mockConnection();
      db.getConnection.mockResolvedValue(conn);

      const req = { params: { id: '3' } };
      const res = mockRes();

      await deleteProduct(req, res);

      expect(conn.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM inventory'),
        ['3']
      );
      expect(conn.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM products'),
        ['3']
      );
      expect(conn.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('on a database error, rolls back and returns 500', async () => {
      const conn = mockConnection();
      conn.execute.mockRejectedValueOnce(new Error('DB failure'));
      db.getConnection.mockResolvedValue(conn);

      const req = { params: { id: '3' } };
      const res = mockRes();

      await deleteProduct(req, res);

      expect(conn.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllInventory', () => {
    test('returns paginated product rows with totalItems and currentPage metadata', async () => {
      db.execute
        .mockResolvedValueOnce([[{ total: 2 }]]) // count query
        .mockResolvedValueOnce([
          [
            { product_id: 1, product_name: 'A', quantity_on_hand: 5 },
            { product_id: 2, product_name: 'B', quantity_on_hand: 0 },
          ],
        ]); // data query

      const req = { query: {} };
      const res = mockRes();

      await getAllInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data).toHaveLength(2);
      expect(payload.meta).toEqual({ totalItems: 2, currentPage: 1 });
    });

    test('applies the search term as a wildcarded LIKE filter on both queries', async () => {
      db.execute
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[]]);

      const req = { query: { search: 'widget' } };
      const res = mockRes();

      await getAllInventory(req, res);

      expect(db.execute).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT COUNT'),
        ['%widget%', '%widget%']
      );
    });

    test('on a database error, returns 500', async () => {
      db.execute.mockRejectedValueOnce(new Error('DB failure'));

      const req = { query: {} };
      const res = mockRes();

      await getAllInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
