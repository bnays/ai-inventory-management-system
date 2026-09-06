jest.mock('../config/db', () => ({
  execute: jest.fn(),
}));

const db = require('../config/db');
const { getCategorySalesReport } = require('./categoryController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('getCategorySalesReport (DB3) - categoryController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns 200 with the rows the query produces, forwarded as-is', async () => {
    const rows = [
      { id: 1, name: 'Electronics', total_revenue: 1500.5, total_units_sold: 30 },
      { id: 2, name: 'Furniture', total_revenue: 0, total_units_sold: 0 },
    ];
    db.execute.mockResolvedValueOnce([rows]);

    const req = {};
    const res = mockRes();

    await getCategorySalesReport(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  test('queries with a SUM/GROUP BY aggregation joining categories, products, and sale_order_items', async () => {
    db.execute.mockResolvedValueOnce([[]]);

    await getCategorySalesReport({}, mockRes());

    expect(db.execute).toHaveBeenCalledTimes(1);
    const [sql] = db.execute.mock.calls[0];

    expect(sql).toMatch(/sale_order_items/i);
    expect(sql).toMatch(/\bproducts\b/i);
    expect(sql).toMatch(/\bcategories\b/i);
    expect(sql).toMatch(/SUM\s*\(/i);
    expect(sql).toMatch(/GROUP BY/i);
  });

  test('uses LEFT JOIN so categories with no sales still appear in the results', async () => {
    db.execute.mockResolvedValueOnce([[]]);

    await getCategorySalesReport({}, mockRes());

    const [sql] = db.execute.mock.calls[0];
    expect(sql).toMatch(/LEFT JOIN/i);
  });

  test('on a database error, returns 500 without throwing', async () => {
    db.execute.mockRejectedValueOnce(new Error('DB failure'));

    const res = mockRes();
    await getCategorySalesReport({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
