export function startServer(app) {
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

export async function registerAndLogin(baseUrl, user = {}) {
  const payload = {
    name: user.name || 'Test User',
    email: user.email || `user-${Date.now()}@example.com`,
    password: user.password || 'secret12',
    role: user.role || 'owner-pet',
  };

  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
    },
    body: JSON.stringify(payload),
  });

  const cookie = cookieHeaderFromResponse(registerResponse);
  return { cookie, payload, registerResponse };
}
