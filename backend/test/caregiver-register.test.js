import test from 'node:test';
import assert from 'node:assert/strict';
import { cookieHeaderFromResponse, resetTestState, startServer, stopServer } from './helpers.js';

test.beforeEach(() => {
  resetTestState();
});

test('caregiver registers then completes profile on login', async () => {
  const { server, baseUrl } = startServer();
  const email = `caregiver-flow-${Date.now()}@example.com`;
  const password = 'password123';

  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        name: 'Flow Caregiver',
        email,
        password,
        role: 'caregiver',
      }),
    });

    assert.equal(registerResponse.status, 201);
    const registerData = await registerResponse.json();
    assert.equal(registerData.message, 'User created successfully');

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ email, password }),
    });

    assert.equal(loginResponse.status, 200);
    const loginData = await loginResponse.json();
    assert.equal(loginData.user.role, 'caregiver');
    assert.equal(loginData.needsCaregiverProfile, true);
    assert.equal(loginData.sitterProfile, null);

    const cookie = cookieHeaderFromResponse(loginResponse);

    const profileResponse = await fetch(`${baseUrl}/api/auth/caregiver-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        caregiverProfile: {
          careType: 'both',
          petTypes: ['dog', 'cat'],
          availability: 'Mon–Fri 6pm–10pm',
          location: 'Central',
          pricePerHour: 22,
        },
      }),
    });

    assert.equal(profileResponse.status, 201);

    const sittersResponse = await fetch(`${baseUrl}/api/sitters?type=pet`);
    const sittersData = await sittersResponse.json();
    const created = sittersData.sitters.find((sitter) => sitter.name === 'Flow Caregiver');

    assert.ok(created);
    assert.equal(created.type, 'both');
    assert.deepEqual(created.petTypes, ['dog', 'cat']);
    assert.equal(created.availability, 'Mon–Fri 6pm–10pm');
  } finally {
    await stopServer(server);
  }
});

test('POST /api/auth/caregiver-profile rejects invalid payload', async () => {
  const { server, baseUrl } = startServer();
  const email = `caregiver-bad-${Date.now()}@example.com`;

  try {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        name: 'Bad Caregiver',
        email,
        password: 'password123',
        role: 'caregiver',
      }),
    });

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ email, password: 'password123' }),
    });

    const profileResponse = await fetch(`${baseUrl}/api/auth/caregiver-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeaderFromResponse(loginResponse),
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        caregiverProfile: {
          careType: 'pet',
          petTypes: [],
          availability: '   ',
        },
      }),
    });

    assert.equal(profileResponse.status, 400);
  } finally {
    await stopServer(server);
  }
});
