jest.mock('../config/db', () => ({
  execute: jest.fn(),
}));

const db = require('../config/db');
const { getProductsByFilter } = require('./inventoryController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockCountAndData(total = 0, rows = []) {
  db.execute
    .mockResolvedValueOnce([[{ total }]])
    .mockResolvedValueOnce([rows]);
}

describe('getProductsByFilter (DB1) - products category/price-range search query', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('with no filters, returns paginated results using only LIMIT/OFFSET', async () => {
    mockCountAndData(0, []);
    const req = { query: {} };
    const res = mockRes();

    await getProductsByFilter(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const [, countParams] = db.execute.mock.calls[0];
    expect(countParams).toEqual([]);
    const [, dataParams] = db.execute.mock.calls[1];
    expect(dataParams).toEqual(['10', '0']);
  });

  test('filters by category_id alone', async () => {
    mockCountAndData(1, [{ product_id: 1, category_id: 3 }]);
    const req = { query: { category_id: '3' } };
    const res = mockRes();

    await getProductsByFilter(req, res);

    const [, countParams] = db.execute.mock.calls[0];
    expect(countParams).toEqual(['3']);
  });

  test('filters by min_price and max_price together', async () => {
    mockCountAndData(0, []);
    const req = { query: { min_price: '10', max_price: '50' } };
    const res = mockRes();

    await getProductsByFilter(req, res);

    // Which filter's `?` comes first in the WHERE clause is an implementation
    // choice; only the presence of both bound values is part of the contract.
    const [, countParams] = db.execute.mock.calls[0];
    expect(countParams.slice().sort()).toEqual(['10', '50'].sort());
  });

  test('filters by search term using a wildcarded LIKE parameter', async () => {
    mockCountAndData(0, []);
    const req = { query: { search: 'widget' } };
    const res = mockRes();

    await getProductsByFilter(req, res);

    const [, countParams] = db.execute.mock.calls[0];
    expect(countParams).toEqual(['%widget%', '%widget%']);
  });

  test('combines category, price range, and search filters together with correct pagination', async () => {
    mockCountAndData(0, []);
    const req = {
      query: {
        category_id: '3',
        min_price: '10',
        max_price: '50',
        search: 'widget',
        page: '2',
        limit: '5',
      },
    };
    const res = mockRes();

    await getProductsByFilter(req, res);

    // Relative order between different filter types is an implementation
    // choice; what matters is that every filter's value is bound, and that
    // LIMIT/OFFSET are the final two positional params (SQL syntax requires
    // them last), in that order.
    const expectedFilterParams = ['3', '10', '50', '%widget%', '%widget%'];

    const [, countParams] = db.execute.mock.calls[0];
    expect(countParams.slice().sort()).toEqual(expectedFilterParams.slice().sort());

    const [, dataParams] = db.execute.mock.calls[1];
    const dataFilterParams = dataParams.slice(0, -2);
    const paginationParams = dataParams.slice(-2);
    expect(dataFilterParams.slice().sort()).toEqual(expectedFilterParams.slice().sort());
    expect(paginationParams).toEqual(['5', '5']);
  });

  describe('SQL injection safety', () => {
    const payload = "'; DROP TABLE products; --";

    test.each([
      ['category_id', { category_id: payload }],
      ['min_price', { min_price: payload }],
      ['max_price', { max_price: payload }],
      ['search', { search: payload }],
    ])(
      'a malicious %s value is bound as a query parameter, never embedded in the SQL text',
      async (_name, queryOverrides) => {
        mockCountAndData(0, []);
        const req = { query: queryOverrides };
        const res = mockRes();

        await getProductsByFilter(req, res);

        expect(db.execute.mock.calls.length).toBeGreaterThan(0);
        for (const [sql, params] of db.execute.mock.calls) {
          expect(sql).not.toContain(payload);
          expect(params.some((p) => String(p).includes(payload))).toBe(true);
        }
      }
    );
  });
});
