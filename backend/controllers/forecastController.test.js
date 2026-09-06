jest.mock('child_process', () => ({ spawn: jest.fn() }));
jest.mock('../config/db', () => ({ execute: jest.fn() }));

const { spawn } = require('child_process');
const db = require('../config/db');
const { getCategoryForecast } = require('./forecastController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Fake python child process: captures the stdout/stderr/close handlers the
// controller registers, and exposes emitClose() so the test can drive them.
function createFakeProcess() {
  const proc = {};
  proc.stdout = { on: jest.fn((event, cb) => { if (event === 'data') proc._stdoutCb = cb; }) };
  proc.stderr = { on: jest.fn((event, cb) => { if (event === 'data') proc._stderrCb = cb; }) };
  proc.on = jest.fn((event, cb) => { if (event === 'close') proc._closeCb = cb; });
  proc.emitClose = (code, stdoutJson) => {
    if (stdoutJson !== undefined) proc._stdoutCb(Buffer.from(stdoutJson));
    proc._closeCb(code);
  };
  proc.emitStderrClose = (code, stderrText) => {
    if (stderrText !== undefined) proc._stderrCb(Buffer.from(stderrText));
    proc._closeCb(code);
  };
  return proc;
}

async function flushMicrotasks() {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('getCategoryForecast (INT1) - category filter + demand forecast integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('forecasts every product in the category and returns a combined result', async () => {
    db.execute.mockResolvedValueOnce([
      [
        { sku: 'SKU-A', product_name: 'Widget A' },
        { sku: 'SKU-B', product_name: 'Widget B' },
      ],
    ]);

    const fakeProcs = [];
    spawn.mockImplementation(() => {
      const p = createFakeProcess();
      fakeProcs.push(p);
      return p;
    });

    const req = { params: { category_id: '3' } };
    const res = mockRes();

    const pending = getCategoryForecast(req, res);
    await flushMicrotasks();

    expect(spawn).toHaveBeenCalledTimes(2);
    fakeProcs[0].emitClose(0, JSON.stringify({ sku: 'SKU-A', accuracy: 91.2 }));
    fakeProcs[1].emitClose(0, JSON.stringify({ sku: 'SKU-B', accuracy: 88.4 }));

    await pending;

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toHaveLength(2);
    expect(payload.data.find((d) => d.sku === 'SKU-A').forecast).toEqual(
      expect.objectContaining({ accuracy: 91.2 })
    );
    expect(payload.data.find((d) => d.sku === 'SKU-B').forecast).toEqual(
      expect.objectContaining({ accuracy: 88.4 })
    );
  });

  test('an empty category returns an empty result without spawning any forecast process', async () => {
    db.execute.mockResolvedValueOnce([[]]);
    const req = { params: { category_id: '999' } };
    const res = mockRes();

    await getCategoryForecast(req, res);

    expect(spawn).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toEqual([]);
  });

  test('one product failing to forecast does not prevent the others from succeeding', async () => {
    db.execute.mockResolvedValueOnce([
      [
        { sku: 'SKU-A', product_name: 'Widget A' },
        { sku: 'SKU-NO-DATA', product_name: 'Widget No History' },
      ],
    ]);

    const fakeProcs = [];
    spawn.mockImplementation(() => {
      const p = createFakeProcess();
      fakeProcs.push(p);
      return p;
    });

    const req = { params: { category_id: '3' } };
    const res = mockRes();

    const pending = getCategoryForecast(req, res);
    await flushMicrotasks();

    fakeProcs[0].emitClose(0, JSON.stringify({ sku: 'SKU-A', accuracy: 91.2 }));
    fakeProcs[1].emitClose(0, JSON.stringify({ error: 'No historical data found for SKU: SKU-NO-DATA' }));

    await pending;

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toHaveLength(2);

    const ok = payload.data.find((d) => d.sku === 'SKU-A');
    const failed = payload.data.find((d) => d.sku === 'SKU-NO-DATA');
    expect(ok.forecast).toBeTruthy();
    expect(ok.error).toBeUndefined();
    expect(failed.error).toMatch(/No historical data/);
  });

  test('a database error while looking up the category returns 500', async () => {
    db.execute.mockRejectedValueOnce(new Error('DB failure'));
    const req = { params: { category_id: '3' } };
    const res = mockRes();

    await getCategoryForecast(req, res);

    expect(spawn).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('a malicious category_id is bound as a query parameter, never embedded in the SQL text', async () => {
    const payload = "'; DROP TABLE products; --";
    db.execute.mockResolvedValueOnce([[]]);
    const req = { params: { category_id: payload } };
    const res = mockRes();

    await getCategoryForecast(req, res);

    const [sql, params] = db.execute.mock.calls[0];
    expect(sql).not.toContain(payload);
    expect(params).toContain(payload);
  });
});
