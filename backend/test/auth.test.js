import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchSitters, loginAs, resetTestState, startServer, stopServer } from './helpers.js';

test.beforeEach(async () => {
  await resetTestState();
});

test('POST /api/auth/login works with seeded user', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { response, cookie } = await loginAs(baseUrl);
    assert.equal(response.status, 200);
    assert.ok(cookie.includes('petcare_session='));

    const me = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
    });
    assert.equal(me.status, 200);
    const body = await me.json();
    assert.equal(body.user.email, 'jane@petcare.test');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bookings requires authentication', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { cookie } = await loginAs(baseUrl);
    const { data: sittersData } = await fetchSitters(baseUrl, cookie);

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
