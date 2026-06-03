import { app } from '../src/server.js';
import { clearSessionsForTests } from '../src/lib/sessions.js';

export function startServer() {
  const server = app.listen(0);
  const { port } = server.address();
  return { server, port, baseUrl: `http://127.0.0.1:${port}` };
}

export async function stopServer(server) {
  await new Promise((resolve) => server.close(resolve));
}

export function cookieHeaderFromResponse(response) {
  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) {
    return setCookie.map((value) => value.split(';')[0]).join('; ');
  }
  const raw = response.headers.get('set-cookie');
  return raw ? raw.split(';')[0] : '';
}

export async function loginAs(baseUrl, email = 'jane@petcare.test', password = 'password123') {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
    },
    body: JSON.stringify({ email, password }),
  });

  return { response, cookie: cookieHeaderFromResponse(response) };
}

export async function resetTestState() {
  await clearSessionsForTests();
}
