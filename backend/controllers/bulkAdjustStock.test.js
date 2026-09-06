jest.mock('../config/db', () => ({
  getConnection: jest.fn(),
}));

const db = require('../config/db');
const { bulkAdjustStock } = require('./inventoryController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Simulates a real connection well enough for this function's needs: a SELECT
// touching `inventory` returns the given current stock levels for whichever
// products are asked about; UPDATE/INSERT calls succeed unconditionally, since
// the actual "would this go negative" validation is expected to happen at the
// application level (reading current stock first, matching this codebase's
// existing validate-before-mutate pattern, e.g. deleteCategory's product
// check before deleting) -- not something a mocked connection can enforce.
function mockConnection(currentStock) {
  const conn = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
    execute: jest.fn((sql) => {
      if (/select/i.test(sql) && /inventory/i.test(sql)) {
        const rows = Object.entries(currentStock).map(([product_id, quantity_on_hand]) => ({
          product_id: Number(product_id),
          quantity_on_hand,
        }));
        return Promise.resolve([rows]);
      }
      if (/insert/i.test(sql) && /stock_transactions/i.test(sql)) {
        return Promise.resolve([{ insertId: 1 }]);
      }
      if (/update/i.test(sql) && /inventory/i.test(sql)) {
        return Promise.resolve([{ affectedRows: 1 }]);
      }
      return Promise.resolve([{}]);
    }),
  };
  return conn;
}

describe('bulkAdjustStock (BE2) - inventoryController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('applies every adjustment, logs an audit row per item, commits, and returns 200', async () => {
    const conn = mockConnection({ 1: 50, 2: 5 });
    db.getConnection.mockResolvedValue(conn);

    const req = {
      body: {
        adjustments: [
          { product_id: 1, quantity_change: 10, reason: 'Restock' },
          { product_id: 2, quantity_change: -3, reason: 'Sale correction' },
        ],
      },
    };
    const res = mockRes();

    await bulkAdjustStock(req, res);

    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);

    const auditInserts = conn.execute.mock.calls.filter(
      ([sql]) => /insert/i.test(sql) && /stock_transactions/i.test(sql)
    );
    expect(auditInserts).toHaveLength(2);
  });

  test('rejects the whole batch atomically when one adjustment would drive quantity_on_hand negative -- none of the OTHER adjustments in the batch take effect either', async () => {
    // product 1 alone is a perfectly valid +10 adjustment; product 2's -20
    // against a stock of 5 would go negative. The whole batch must be
    // rejected, not just product 2's line.
    const conn = mockConnection({ 1: 50, 2: 5 });
    db.getConnection.mockResolvedValue(conn);

    const req = {
      body: {
        adjustments: [
          { product_id: 1, quantity_change: 10, reason: 'Restock' },
          { product_id: 2, quantity_change: -20, reason: 'Damage' },
        ],
      },
    };
    const res = mockRes();

    await bulkAdjustStock(req, res);

    // The only way anything in this batch is actually persisted is if the
    // transaction commits. Since real atomicity is enforced by whether
    // commit is ever reached (not by what individual mocked calls return),
    // asserting commit was never called -- regardless of whether the
    // implementation validates everything up front or discovers the problem
    // partway through -- is exactly the property "none of the other
    // adjustments were applied either" reduces to.
    expect(conn.commit).not.toHaveBeenCalled();
    expect(conn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('on an unexpected database error mid-batch, rolls back and returns 500', async () => {
    const conn = mockConnection({ 1: 50 });
    conn.execute.mockImplementationOnce((sql) => {
      if (/select/i.test(sql) && /inventory/i.test(sql)) {
        return Promise.resolve([[{ product_id: 1, quantity_on_hand: 50 }]]);
      }
      return Promise.resolve([{}]);
    });
    conn.execute.mockRejectedValueOnce(new Error('DB failure'));
    db.getConnection.mockResolvedValue(conn);

    const req = { body: { adjustments: [{ product_id: 1, quantity_change: 5, reason: 'Restock' }] } };
    const res = mockRes();

    await bulkAdjustStock(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('always releases the connection, even on failure', async () => {
    const conn = mockConnection({ 1: 50 });
    conn.execute.mockRejectedValueOnce(new Error('DB failure'));
    db.getConnection.mockResolvedValue(conn);

    const req = { body: { adjustments: [{ product_id: 1, quantity_change: 5, reason: 'Restock' }] } };
    await bulkAdjustStock(req, mockRes());

    expect(conn.release).toHaveBeenCalled();
  });
});
