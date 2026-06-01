const ROUTES = {
  home: '/home',
  about: '/about',
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
    case '/about':
      return 'about';
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
