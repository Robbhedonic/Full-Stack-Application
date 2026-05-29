import test from 'node:test';
import assert from 'node:assert/strict';
import { loginAs, resetTestState, startServer, stopServer } from './helpers.js';

test.beforeEach(() => {
  resetTestState();
});

test('GET /api/sitters returns seeded sitters', async () => {
  const { server, baseUrl } = startServer();

  try {
    const response = await fetch(`${baseUrl}/api/sitters`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.sitters));
    assert.ok(data.sitters.length >= 3);
    assert.ok(data.sitters[0].name);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bookings creates a booking when authenticated', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { cookie } = await loginAs(baseUrl);
    const sittersResponse = await fetch(`${baseUrl}/api/sitters`);
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
        petType: 'dog',
        startDate: new Date().toISOString(),
        durationHours: 3,
      }),
    });

    assert.equal(createResponse.status, 201);
    const data = await createResponse.json();
    assert.equal(data.booking.sitterId, sitterId);
    assert.equal(data.booking.ownerName, 'Test Owner');
    assert.equal(data.booking.petType, 'dog');
  } finally {
    await stopServer(server);
  }
});
