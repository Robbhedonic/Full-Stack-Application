import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';
import { clearSessionsForTests } from '../src/users.js';
import { registerAndLogin, startServer, stopServer } from '../test-utils/helpers.js';

test.beforeEach(() => {
  clearSessionsForTests();
});

test('GET /api/sitters returns available sitters', async () => {
  const { server, baseUrl } = startServer(app);

  try {
    const response = await fetch(`${baseUrl}/api/sitters`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.sitters));
    assert.ok(data.sitters.length > 0);
    assert.ok(data.sitters[0].name);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bookings creates a new booking when authenticated', async () => {
  const { server, baseUrl } = startServer(app);

  try {
    const { cookie } = await registerAndLogin(baseUrl);
    const sittersResponse = await fetch(`${baseUrl}/api/sitters`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    const sittersData = await sittersResponse.json();
    const sitterId = sittersData.sitters[0]?.id;

    const createResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        sitterId,
        ownerName: 'Test Owner',
        serviceType: 'pet',
        startDate: new Date().toISOString(),
        durationHours: 3,
      }),
    });

    assert.equal(createResponse.status, 201);
    const data = await createResponse.json();
    assert.equal(data.booking.sitterId, sitterId);
    assert.equal(data.booking.ownerName, 'Test Owner');
    assert.equal(data.booking.serviceType, 'pet');
  } finally {
    await stopServer(server);
  }
});
