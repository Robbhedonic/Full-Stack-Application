import test from 'node:test';
import assert from 'node:assert/strict';

import { app } from '../src/server.js';

test('GET /api/health returns ok status', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/health returns production-style JSON and restricted CORS headers', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const allowedOrigin = 'http://localhost:5173';
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: { Origin: allowedOrigin },
    });

    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
