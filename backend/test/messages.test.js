import test from 'node:test';
import assert from 'node:assert/strict';
import { loginAs, resetTestState, startServer, stopServer } from './helpers.js';

test.beforeEach(async () => {
  await resetTestState();
});

test('owner can message a caregiver and read the thread', async () => {
  const { server, baseUrl } = startServer();

  try {
    const { cookie } = await loginAs(baseUrl);
    const sittersResponse = await fetch(`${baseUrl}/api/sitters`);
    const sittersData = await sittersResponse.json();
    const sitterId = sittersData.sitters[0]?.id;
    assert.ok(sitterId);

    const sendResponse = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        sitterId,
        body: 'Hi, are you free next weekend for cat care?',
      }),
    });

    assert.equal(sendResponse.status, 201);
    const sent = await sendResponse.json();
    assert.equal(sent.message.body.includes('weekend'), true);

    const threadResponse = await fetch(
      `${baseUrl}/api/messages?sitterId=${sitterId}`,
      {
        headers: { Cookie: cookie, Origin: 'http://localhost:5173' },
      }
    );
    assert.equal(threadResponse.status, 200);
    const threadData = await threadResponse.json();
    assert.ok(
      threadData.messages.some((entry) => entry.body.includes('weekend')),
      'expected sent message in thread'
    );
  } finally {
    await stopServer(server);
  }
});
