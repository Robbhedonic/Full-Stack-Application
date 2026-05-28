import test from 'node:test';
import assert from 'node:assert/strict';

import { app } from '../src/server.js';
import { clearSessionsForTests } from '../src/users.js';
import { cookieHeaderFromResponse, registerAndLogin, startServer, stopServer } from '../test-utils/helpers.js';

test.beforeEach(() => {
  clearSessionsForTests();
});

test('POST /api/auth/register and /api/auth/login set httpOnly session cookie', async () => {
  const { server, baseUrl } = startServer(app);

  try {
    const { registerResponse, cookie, payload } = await registerAndLogin(baseUrl);
    assert.equal(registerResponse.status, 201);
    assert.ok(cookie.includes('petcare_session='));

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
    });
    assert.equal(meResponse.status, 200);
    const meBody = await meResponse.json();
    assert.equal(meBody.user.email, payload.email);

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
    });
    assert.equal(logoutResponse.status, 200);

    const afterLogout = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
    });
    assert.equal(afterLogout.status, 401);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/auth/protected requires authentication', async () => {
  const { server, baseUrl } = startServer(app);

  try {
    const blocked = await fetch(`${baseUrl}/api/auth/protected`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(blocked.status, 401);

    const { cookie } = await registerAndLogin(baseUrl);
    const allowed = await fetch(`${baseUrl}/api/auth/protected`, {
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
    });
    assert.equal(allowed.status, 200);
    const body = await allowed.json();
    assert.equal(body.message, 'Protected content available');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bookings returns 401 without session cookie', async () => {
  const { server, baseUrl } = startServer(app);

  try {
    const sittersResponse = await fetch(`${baseUrl}/api/sitters`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    const sittersData = await sittersResponse.json();

    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        sitterId: sittersData.sitters[0].id,
        ownerName: 'Guest',
        serviceType: 'pet',
        startDate: new Date().toISOString(),
        durationHours: 2,
      }),
    });

    assert.equal(response.status, 401);
  } finally {
    await stopServer(server);
  }
});

test('login returns session cookie without using localStorage contract', async () => {
  const { server, baseUrl } = startServer(app);

  try {
    const email = `login-${Date.now()}@example.com`;
    await registerAndLogin(baseUrl, { email, password: 'secret12' });

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ email, password: 'secret12' }),
    });

    assert.equal(loginResponse.status, 200);
    const cookie = cookieHeaderFromResponse(loginResponse);
    assert.match(cookie, /petcare_session=/);
    assert.doesNotMatch(cookie, /localStorage/i);
  } finally {
    await stopServer(server);
  }
});
