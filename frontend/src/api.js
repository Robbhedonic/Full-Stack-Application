const rawApiBase = import.meta.env.VITE_API_URL || '';
const apiBase = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

function buildUrl(path) {
  return `${apiBase}${path}`;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    credentials: 'include',
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  return { response, data };
}

export const API = {
  health: '/api/health',
  me: '/api/auth/me',
  login: '/api/auth/login',
  register: '/api/auth/register',
  caregiverProfile: '/api/auth/caregiver-profile',
  accountMode: '/api/auth/account-mode',
  ownerCare: '/api/auth/owner-care',
  logout: '/api/auth/logout',
  sitters: '/api/sitters',
  bookings: '/api/bookings',
  messageThreads: '/api/messages/threads',
  messages: '/api/messages',
  adminStats: '/api/admin/stats',
};
