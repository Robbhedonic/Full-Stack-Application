import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchSitters, loginAs, resetTestState, startServer, stopServer } from './helpers.js';

test.beforeEach(async () => {
  await resetTestState();
});

test('GET /api/sitters returns seeded sitters for owners only', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { cookie } = await loginAs(baseUrl);
    const response = await fetch(`${baseUrl}/api/sitters`, {
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
    });
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.sitters));
    assert.ok(data.sitters.length >= 3);
    assert.ok(data.sitters[0].name);
    assert.equal(data.sitters[0].availabilityStart, undefined);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/sitters rejects caregiver-only accounts', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { cookie } = await loginAs(baseUrl, 'luna@petcare.test');
    const response = await fetch(`${baseUrl}/api/sitters`, {
      headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
    });
    assert.equal(response.status, 403);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/health allows CORS from the frontend origin', async () => {
  const { server, baseUrl } = startServer();

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bookings creates a booking when authenticated', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { cookie } = await loginAs(baseUrl);
    const { data: sittersData } = await fetchSitters(baseUrl, cookie);
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
        mealsPerDay: 2,
        careNotes: 'Dry food twice daily',
        startDate: new Date().toISOString(),
        durationHours: 3,
      }),
    });

    assert.equal(createResponse.status, 201);
    const data = await createResponse.json();
    assert.equal(data.booking.sitterId, sitterId);
    assert.equal(data.booking.ownerName, 'Test Owner');
    assert.equal(data.booking.petType, 'dog');
    assert.equal(data.booking.mealsPerDay, 2);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/bookings returns only the signed-in owner bookings', async () => {
  const { server, baseUrl } = startServer();

  try {
    const jane = await loginAs(baseUrl, 'jane@petcare.test');
    const mike = await loginAs(baseUrl, 'mike@petcare.test');

    const { data: janeSitters } = await fetchSitters(baseUrl, jane.cookie);
    const sitterId = janeSitters.sitters[0]?.id;

    await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: jane.cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        sitterId,
        ownerName: 'Jane Doe',
        serviceType: 'pet',
        petType: 'cat',
        mealsPerDay: 2,
        startDate: new Date().toISOString(),
        durationHours: 2,
      }),
    });

    const janeBookings = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Cookie: jane.cookie, Origin: 'http://localhost:5173' },
    });
    const janeData = await janeBookings.json();
    assert.ok(janeData.bookings.some((booking) => booking.petType === 'cat'));
    assert.ok(janeData.bookings.every((booking) => booking.ownerName !== 'Mike Sullivan'));

    const mikeBookings = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Cookie: mike.cookie, Origin: 'http://localhost:5173' },
    });
    const mikeData = await mikeBookings.json();
    assert.ok(mikeData.bookings.every((booking) => booking.ownerName !== 'Jane Doe' || booking.petType !== 'cat'));
    assert.ok(!mikeData.bookings.some((booking) => booking.petType === 'cat' && booking.ownerName === 'Jane Doe'));
  } finally {
    await stopServer(server);
  }
});

test('GET /api/bookings lets caregivers see reservations for their sitter profile', async () => {
  const { server, baseUrl } = startServer();

  try {
    const owner = await loginAs(baseUrl, 'jane@petcare.test');
    const caregiver = await loginAs(baseUrl, 'luna@petcare.test');

    const { data: sittersPayload } = await fetchSitters(baseUrl, owner.cookie);
    const lunaSitter = sittersPayload.sitters.find((sitter) => sitter.name === 'Luna Morales');
    assert.ok(lunaSitter);

    await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: owner.cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        sitterId: lunaSitter.id,
        ownerName: 'Jane Doe',
        serviceType: 'pet',
        petType: 'dog',
        mealsPerDay: 2,
        startDate: new Date().toISOString(),
        durationHours: 4,
      }),
    });

    const caregiverBookings = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Cookie: caregiver.cookie, Origin: 'http://localhost:5173' },
    });

    assert.equal(caregiverBookings.status, 200);
    const data = await caregiverBookings.json();
    assert.ok(data.bookings.some((booking) => booking.ownerName === 'Jane Doe'));
    assert.ok(data.bookings.every((booking) => booking.sitterId === lunaSitter.id));
  } finally {
    await stopServer(server);
  }
});

test('POST /api/bookings rejects caregivers creating bookings', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { cookie } = await loginAs(baseUrl, 'luna@petcare.test');

    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        sitterId: 'invalid-sitter-id',
        ownerName: 'Luna',
        serviceType: 'pet',
        petType: 'dog',
        mealsPerDay: 2,
        startDate: new Date().toISOString(),
        durationHours: 2,
      }),
    });

    assert.equal(response.status, 403);
  } finally {
    await stopServer(server);
  }
});
