const ROUTES = {
  home: '/home',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  admin: '/admin',
};

export function pageToPath(page) {
  return ROUTES[page] ?? ROUTES.home;
}

export function pathToPage(pathname) {
  const path = pathname.replace(/\/$/, '') || '/';

  switch (path) {
    case '/':
    case '/home':
      return 'home';
    case '/login':
      return 'login';
    case '/register':
      return 'register';
    case '/dashboard':
      return 'dashboard';
    case '/admin':
      return 'admin';
    default:
      return 'home';
  }
}
