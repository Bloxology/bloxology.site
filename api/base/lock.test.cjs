const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('./lock');

const request = async (method) => {
  const headers = {};
  const response = {
    setHeader(name, value) { headers[name] = value; },
    end(body) { this.body = body; },
  };
  await handler({ method, body: {} }, response);
  return { status: response.statusCode, headers, body: response.body };
};

test('lock transaction creation is disabled', async () => {
  const response = await request('POST');
  assert.equal(response.status, 503);
  const body = JSON.parse(response.body);
  assert.equal(body.success, false);
  assert.equal(body.data, null);
});

test('lock handler rejects other methods and supports preflight', async () => {
  assert.equal((await request('GET')).status, 405);
  assert.equal((await request('OPTIONS')).status, 204);
});
