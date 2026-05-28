import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';

function start() {
  const server = app.listen(0);
  const { port } = server.address();
  return { server, port };
}

test('GET /api/sitters returns available sitters', async () => {
  const { server, port } = start();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/sitters`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.sitters));
    assert.ok(data.sitters.length > 0);
    assert.ok(data.sitters[0].name);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/bookings creates a new booking', async () => {
  const { server, port } = start();

  try {
    const sittersResponse = await fetch(`http://127.0.0.1:${port}/api/sitters`);
    const sittersData = await sittersResponse.json();
    const sitterId = sittersData.sitters[0]?.id;

    const createResponse = await fetch(`http://127.0.0.1:${port}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    await new Promise((resolve) => server.close(resolve));
  }
});
