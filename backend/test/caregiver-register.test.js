import test from 'node:test';
import assert from 'node:assert/strict';
import { loginAs, resetTestState, startServer, stopServer } from './helpers.js';

test.beforeEach(() => {
  resetTestState();
});

test('POST /api/auth/register creates sitter profile for caregivers', async () => {
  const { server, baseUrl } = startServer();
  const email = `caregiver-${Date.now()}@example.com`;

  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        name: 'New Caregiver',
        email,
        password: 'password123',
        role: 'caregiver',
        caregiverProfile: {
          careType: 'pet',
          petTypes: ['dog', 'rabbit'],
          availability: 'Weekends 10am-6pm',
          location: 'Riverside',
          pricePerHour: 19,
        },
      }),
    });

    assert.equal(registerResponse.status, 201);
    const registerData = await registerResponse.json();
    assert.equal(registerData.user.role, 'caregiver');

    const sittersResponse = await fetch(`${baseUrl}/api/sitters?type=pet`);
    const sittersData = await sittersResponse.json();
    const created = sittersData.sitters.find((sitter) => sitter.name === 'New Caregiver');

    assert.ok(created);
    assert.equal(created.type, 'pet');
    assert.deepEqual(created.petTypes, ['dog', 'rabbit']);
    assert.equal(created.availability, 'Weekends 10am-6pm');
    assert.equal(created.location, 'Riverside');
    assert.equal(created.pricePerHour, 19);

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: registerResponse.headers.get('set-cookie')?.split(';')[0] ?? '',
        Origin: 'http://localhost:5173',
      },
    });
    assert.equal(meResponse.status, 200);
    const meData = await meResponse.json();
    assert.equal(meData.sitterProfile?.name, 'New Caregiver');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/auth/register rejects caregivers without availability', async () => {
  const { server, baseUrl } = startServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        name: 'Incomplete Caregiver',
        email: `incomplete-${Date.now()}@example.com`,
        password: 'password123',
        role: 'caregiver',
        caregiverProfile: {
          careType: 'plant',
          petTypes: [],
          availability: '   ',
        },
      }),
    });

    assert.equal(response.status, 400);
  } finally {
    await stopServer(server);
  }
});
