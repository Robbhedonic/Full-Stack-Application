import test from 'node:test';
import assert from 'node:assert/strict';
import { cookieHeaderFromResponse, resetTestState, startServer, stopServer } from './helpers.js';

test.beforeEach(() => {
  resetTestState();
});

test('user can register, set both mode, and create caregiver listing', async () => {
  const { server, baseUrl } = startServer();
  const email = `both-mode-${Date.now()}@example.com`;
  const password = 'password123';

  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        name: 'Both Mode User',
        email,
        password,
        role: 'caregiver',
      }),
    });

    assert.equal(registerResponse.status, 201);

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();
    const cookie = cookieHeaderFromResponse(loginResponse);

    const modeResponse = await fetch(`${baseUrl}/api/auth/account-mode`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ mode: 'both' }),
    });

    assert.equal(modeResponse.status, 200);
    const modeData = await modeResponse.json();
    assert.equal(modeData.accountMode, 'both');

    const profileResponse = await fetch(`${baseUrl}/api/auth/caregiver-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        caregiverProfile: {
          careType: 'pet',
          petTypes: ['dog'],
          availability: 'Evenings',
          location: 'West',
          pricePerHour: 20,
        },
      }),
    });

    assert.equal(profileResponse.status, 201);

    const sittersResponse = await fetch(`${baseUrl}/api/sitters?type=pet`);
    const sitters = (await sittersResponse.json()).sitters;
    assert.ok(sitters.some((sitter) => sitter.name === 'Both Mode User'));

    const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        sitterId: sitters.find((sitter) => sitter.name === 'Luna Morales').id,
        ownerName: 'Both Mode User',
        serviceType: 'pet',
        petType: 'dog',
        mealsPerDay: 2,
        startDate: new Date().toISOString(),
        durationHours: 2,
      }),
    });

    assert.equal(bookingResponse.status, 201);
    assert.equal(loginData.user.role, 'caregiver');
  } finally {
    await stopServer(server);
  }
});
