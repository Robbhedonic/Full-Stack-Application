import { useCallback, useEffect, useState } from 'react';
import { API, apiFetch } from './api.js';
import { pageToPath, pathToPage } from './routes.js';

function formatDate(value) {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function App() {
  const [sitters, setSitters] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedSitter, setSelectedSitter] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [serviceType, setServiceType] = useState('pet');
  const [startDate, setStartDate] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('loading');
  const [currentPage, setCurrentPage] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [authMode, setAuthMode] = useState('register');
  const [userType, setUserType] = useState('owner-pet');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);

  function roleLabel(role) {
    const labels = {
      'owner-pet': 'Pet owner',
      'owner-plant': 'Plant owner',
      'owner-mixed': 'Mixed owner',
      caregiver: 'Caregiver',
      admin: 'Admin',
    };
    return labels[role] ?? role;
  }

  const navigate = useCallback((page) => {
    const path = pageToPath(page);
    window.history.pushState({ page }, '', path);
    setCurrentPage(page);
    if (page === 'login' || page === 'register') {
      setAuthMode(page);
    }
  }, []);

  useEffect(() => {
    function syncFromUrl() {
      const { pathname } = window.location;

      if (pathname === '/' || pathname === '') {
        window.history.replaceState({ page: 'home' }, '', '/home');
        setCurrentPage('home');
        return;
      }

      const page = pathToPage(pathname);
      setCurrentPage(page);
      if (page === 'login' || page === 'register') {
        setAuthMode(page);
      }
    }

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.me);
      setAuthUser(response.ok ? data.user : null);
    } catch {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loadSitters = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.sitters);
      if (!response.ok) throw new Error();
      setSitters(data.sitters || []);
      if (data.sitters?.length > 0) {
        setSelectedSitter((previous) => previous || data.sitters[0].id);
      }
    } catch {
      setMessage('Unable to load sitters.');
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.bookings);
      if (response.status === 401) {
        setBookings([]);
        return;
      }
      if (!response.ok) throw new Error();
      setBookings(data.bookings || []);
    } catch {
      setMessage('Unable to load bookings.');
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.health);
      setStatus(response.ok && data?.status === 'ok' ? 'ready' : 'offline');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    loadHealth();
    loadSession();
  }, [loadHealth, loadSession]);

  const loadAdminStats = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.adminStats);
      if (!response.ok) throw new Error();
      setAdminStats(data);
    } catch {
      setMessage('Unable to load admin statistics.');
    }
  }, []);

  useEffect(() => {
    if (authUser?.role === 'admin') {
      if (currentPage === 'dashboard') {
        navigate('admin');
      }
      if (currentPage === 'admin') {
        loadAdminStats();
      }
      return;
    }

    if (authUser) {
      loadSitters();
      loadBookings();
      if (authUser.name) setOwnerName(authUser.name);
    }
  }, [authUser, currentPage, navigate, loadSitters, loadBookings, loadAdminStats]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('Creating booking...');

    try {
      const { response, data } = await apiFetch(API.bookings, {
        method: 'POST',
        body: JSON.stringify({
          sitterId: selectedSitter,
          ownerName,
          serviceType,
          startDate,
          durationHours: Number(durationHours),
        }),
      });

      if (!response.ok) {
        setMessage(data?.error || 'Booking failed');
        return;
      }

      setMessage('Booking created successfully!');
      setOwnerName('');
      setStartDate('');
      setDurationHours(2);
      loadBookings();
    } catch {
      setMessage('Could not create booking.');
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthMessage('');

    const path = authMode === 'login' ? API.login : API.register;
    const body =
      authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword, role: userType };

    try {
      const { response, data } = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setAuthMessage(data?.error || 'Authentication failed');
        return;
      }

      setAuthUser(data.user);
      setAuthMessage(
        authMode === 'login'
          ? `Welcome back, ${data.user.name}!`
          : `Account created for ${data.user.name}`
      );
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
      navigate(data.user.role === 'admin' ? 'admin' : 'dashboard');
    } catch {
      setAuthMessage('Could not connect to the server.');
    }
  }

  async function handleLogout() {
    try {
      await apiFetch(API.logout, { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthUser(null);
    setAdminStats(null);
    setBookings([]);
    setSitters([]);
    setCurrentPage('home');
    setAuthMessage('');
    setMessage('');
  }

  return (
    <main className="app-shell">
      <section className="orb orb-a" aria-hidden="true" />
      <section className="orb orb-b" aria-hidden="true" />
      <section className="texture" aria-hidden="true" />

      {currentPage === 'home' && (
        <article className="status-card home-card">
          <section className="hero-copy hero-segment">
            <p className="kicker">PetCare</p>
            <h1>Trustworthy care for pets, plants and busy owners</h1>
            <p className="subtitle">
              PetCare connects owners with trusted sitters for dogs, cats, succulents and houseplants. Create bookings,
              manage reservations, and grow a care community in one polished platform.
            </p>

            <div className="row status-row">
              <span className={`status-pill ${status === 'ready' ? 'status-ok' : status === 'loading' ? 'status-checking' : 'status-offline'}`}>
                {status === 'ready' ? 'Service ready' : status === 'loading' ? 'Checking service' : 'Offline'}
              </span>
              <p className="hero-note">{message || 'Register or sign in to view sitters and manage bookings.'}</p>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <h3>Owner booking</h3>
                <p>Schedule pet or plant care at flexible hours with the right sitter for your needs.</p>
              </div>
              <div className="feature-card">
                <h3>Caregiver options</h3>
                <p>Become a sitter, set your service type, and get matched with owners in your area.</p>
              </div>
              <div className="feature-card">
                <h3>Secure requests</h3>
                <p>Reserve services seamlessly while tracking your upcoming bookings.</p>
              </div>
            </div>

            <div className="hero-actions">
              <button type="button" className="action-btn" onClick={() => navigate('register')}>
                Register now
              </button>
              <button type="button" className="secondary-btn" onClick={() => navigate('login')}>
                Login
              </button>
            </div>
          </section>
        </article>
      )}

      {(currentPage === 'login' || currentPage === 'register') && (
        <article className="status-card auth-page-card">
          <button type="button" className="back-btn" onClick={() => navigate('home')}>
            ← Back to home
          </button>

          <section className="auth-panel">
            <div className="auth-header">
              <button className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => navigate('login')}>
                Login
              </button>
              <button className={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => navigate('register')}>
                Register
              </button>
            </div>

            <div className="auth-body">
              <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
              <p className="hero-note">
                {authMode === 'login'
                  ? 'Sign in to access the platform and view sitters and bookings.'
                  : 'Create your account, choose your role, and start managing reservations.'}
              </p>
              {authMode === 'login' && (
                <p className="hero-note">
                  Demo: jane@petcare.test (owner) · admin@petcare.test (admin) · password123
                </p>
              )}
              <form onSubmit={handleAuthSubmit} className="auth-form">
                {authMode === 'register' && (
                  <label>
                    Full name
                    <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Jane Doe" required />
                  </label>
                )}

                <label>
                  Email address
                  <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="jane@example.com" required />
                </label>

                <label>
                  Password
                  <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Enter password" required />
                </label>

                {authMode === 'register' && (
                  <div className="role-grid">
                    <label className={userType === 'owner-pet' ? 'role-option active' : 'role-option'}>
                      <input type="radio" name="userType" value="owner-pet" checked={userType === 'owner-pet'} onChange={() => setUserType('owner-pet')} />
                      Pet Owner
                    </label>
                    <label className={userType === 'owner-plant' ? 'role-option active' : 'role-option'}>
                      <input type="radio" name="userType" value="owner-plant" checked={userType === 'owner-plant'} onChange={() => setUserType('owner-plant')} />
                      Plant Owner
                    </label>
                    <label className={userType === 'owner-mixed' ? 'role-option active' : 'role-option'}>
                      <input type="radio" name="userType" value="owner-mixed" checked={userType === 'owner-mixed'} onChange={() => setUserType('owner-mixed')} />
                      Mixed Owner
                    </label>
                    <label className={userType === 'caregiver' ? 'role-option active' : 'role-option'}>
                      <input type="radio" name="userType" value="caregiver" checked={userType === 'caregiver'} onChange={() => setUserType('caregiver')} />
                      Caregiver
                    </label>
                  </div>
                )}

                <button type="submit" className="action-btn auth-action">
                  {authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              {authMessage && <p className="auth-feedback">{authMessage}</p>}
            </div>
          </section>
        </article>
      )}

      {currentPage === 'admin' && (
        <article className="status-card booking-card admin-card">
          {!authUser || authUser.role !== 'admin' ? (
            <>
              <h2>Admin access required</h2>
              <p>Sign in with an administrator account to view platform statistics.</p>
              <button type="button" className="action-btn" onClick={() => navigate('login')}>
                Go to login
              </button>
            </>
          ) : (
            <>
              <section className="section-header">
                <p className="kicker">Admin dashboard</p>
                <h2>Platform overview</h2>
                <p>Logged in as {authUser.name}</p>
              </section>

              <div className="hero-actions">
                <button type="button" className="back-btn" onClick={() => navigate('home')}>
                  ← Back to home
                </button>
                <button type="button" className="secondary-btn" onClick={loadAdminStats}>
                  Refresh stats
                </button>
                <button type="button" className="secondary-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>

              {adminStats ? (
                <>
                  <section className="admin-stats-grid">
                    <article className="admin-stat">
                      <p>Pet owners</p>
                      <h3>{adminStats.stats.petOwners}</h3>
                    </article>
                    <article className="admin-stat">
                      <p>Plant owners</p>
                      <h3>{adminStats.stats.plantOwners}</h3>
                    </article>
                    <article className="admin-stat">
                      <p>Mixed owners</p>
                      <h3>{adminStats.stats.mixedOwners}</h3>
                    </article>
                    <article className="admin-stat">
                      <p>Total owners</p>
                      <h3>{adminStats.stats.totalOwners}</h3>
                    </article>
                    <article className="admin-stat">
                      <p>Caregivers</p>
                      <h3>{adminStats.stats.caregivers}</h3>
                    </article>
                    <article className="admin-stat">
                      <p>Sitters listed</p>
                      <h3>{adminStats.stats.sittersListed}</h3>
                    </article>
                    <article className="admin-stat">
                      <p>Total bookings</p>
                      <h3>{adminStats.stats.totalBookings}</h3>
                    </article>
                    <article className="admin-stat">
                      <p>Pending bookings</p>
                      <h3>{adminStats.stats.pendingBookings}</h3>
                    </article>
                  </section>

                  <section className="panel">
                    <h3>Recent users</h3>
                    <ul className="admin-list">
                      {adminStats.recentUsers.map((user) => (
                        <li key={user.id}>
                          <strong>{user.name}</strong> — {user.email}
                          <span>{roleLabel(user.role)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="panel">
                    <h3>Recent bookings</h3>
                    {adminStats.recentBookings.length === 0 ? (
                      <p>No bookings yet.</p>
                    ) : (
                      <ul className="admin-list">
                        {adminStats.recentBookings.map((booking) => (
                          <li key={booking.id}>
                            <strong>{booking.ownerName}</strong> — {booking.serviceType} care
                            <span>{booking.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : (
                <p className="hero-note">Loading statistics...</p>
              )}
            </>
          )}
        </article>
      )}

      {currentPage === 'dashboard' && (
        <article className="status-card booking-card">
          {!authUser ? (
            <>
              <h2>Sign in required</h2>
              <p>Please sign in to view sitters and manage bookings.</p>
              <button type="button" className="action-btn" onClick={() => navigate('login')}>
                Go to login
              </button>
            </>
          ) : (
            <>
          <section className="section-header">
            <h2>Welcome, {authUser.name}</h2>
            <p>Browse the marketplace and manage your pet or plant care reservations.</p>
          </section>

          <div className="hero-actions">
            <button type="button" className="back-btn" onClick={() => navigate('home')}>
              ← Back to home
            </button>
            <button type="button" className="secondary-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <section className="grid-listing">
            <div className="panel">
              <h3>Available Sitters</h3>
              {sitters.length === 0 ? (
                <p>No sitters available yet.</p>
              ) : (
                <ul className="sitter-list">
                  {sitters.map((sitter) => (
                    <li key={sitter.id} className="sitter-card">
                      <h4>{sitter.name}</h4>
                      <p>{sitter.description}</p>
                      <div className="sitter-meta">
                        <span>{sitter.type} care</span>
                        <span>{sitter.location}</span>
                        <span>${sitter.pricePerHour}/hr</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel">
              <h3>Book a sitter</h3>
              <form onSubmit={handleSubmit} className="booking-form">
                <label>
                  Owner name
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Your full name" required />
                </label>

                <label>
                  Care type
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    <option value="pet">Pet care</option>
                    <option value="plant">Plant care</option>
                  </select>
                </label>

                <label>
                  Sitter
                  <select value={selectedSitter} onChange={(e) => setSelectedSitter(e.target.value)}>
                    {sitters.map((sitter) => (
                      <option key={sitter.id} value={sitter.id}>
                        {sitter.name} ({sitter.type})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Start date
                  <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </label>

                <label>
                  Duration (hours)
                  <input type="number" min="1" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} required />
                </label>

                <button type="submit" className="action-btn">
                  Request Care
                </button>
              </form>
            </div>
          </section>

          <section className="panel bookings-panel">
            <h3>Your reservations</h3>
            {bookings.length === 0 ? (
              <p>No bookings yet. Create your first care request.</p>
            ) : (
              <ul className="booking-list">
                {bookings.map((booking) => (
                  <li key={booking.id} className="booking-card">
                    <div>
                      <strong>{booking.ownerName}</strong> booked <strong>{booking.serviceType}</strong>
                    </div>
                    <div className="booking-meta">
                      <span>{formatDate(booking.startDate)}</span>
                      <span>{booking.durationHours} hrs</span>
                      <span>{booking.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
            </>
          )}
        </article>
      )}
    </main>
  );
}
