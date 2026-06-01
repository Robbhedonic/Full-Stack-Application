import { useCallback, useEffect, useState } from 'react';
import { API, apiFetch } from './api.js';
import { pageToPath, pathToPage } from './routes.js';
import AboutPage from './pages/AboutPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import loginImage from './images/cat-black-being-loved.webp';
import registerImage from './images/planst-care.webp';
import homeImagePrimary from './images/Post-safe-houseplants-for-pets.jpg';
import homeImageSecondary from './images/images.jpeg';

const PET_TYPE_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'reptile', label: 'Reptile' },
  { value: 'other', label: 'Other' },
];

function petTypeLabel(value) {
  return PET_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function isOwnerRole(role) {
  return ['owner-pet', 'owner-plant', 'owner-mixed'].includes(role);
}

function seeksCare(accountMode) {
  return accountMode === 'owner' || accountMode === 'both';
}

function offersCare(accountMode) {
  return accountMode === 'caregiver' || accountMode === 'both';
}

function formatDate(value) {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function hoursBetween(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return 0;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
}

function formatBookingRange(startValue, durationHours) {
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return formatDate(startValue);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return `${start.toLocaleString()} - ${end.toLocaleString()}`;
}

export default function App() {
  const [sitters, setSitters] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedSitter, setSelectedSitter] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [serviceType, setServiceType] = useState('pet');
  const [petType, setPetType] = useState('dog');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [status, setStatus] = useState('loading');
  const [currentPage, setCurrentPage] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [authMode, setAuthMode] = useState('register');
  const [userType, setUserType] = useState('owner-pet');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  const [mySitterProfile, setMySitterProfile] = useState(null);
  const [accountMode, setAccountMode] = useState('owner');
  const [registerSuccess, setRegisterSuccess] = useState(false);

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
      if (page === 'login') {
        setRegisterSuccess(false);
      }
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
      setMySitterProfile(response.ok ? data.sitterProfile ?? null : null);
      setAccountMode(response.ok ? data.accountMode ?? 'owner' : 'owner');
    } catch {
      setAuthUser(null);
      setMySitterProfile(null);
      setAccountMode('owner');
    }
  }, []);

  function formatSitterPetTypes(petTypes) {
    if (!petTypes?.length) return null;
    return petTypes.map((value) => petTypeLabel(value)).join(', ');
  }

  function careTypeLabel(type) {
    const labels = { pet: 'Pet care', plant: 'Plant care', both: 'Pet & plant care' };
    return labels[type] ?? type;
  }

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
    if (currentPage === 'profile' && authUser) {
      loadSession();
    }
  }, [currentPage, authUser, loadSession]);

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
      loadBookings();
      if (authUser.name) setOwnerName(authUser.name);
      if (isOwnerRole(authUser.role)) {
        loadSitters();
      }
    }
  }, [authUser, currentPage, navigate, loadSitters, loadBookings, loadAdminStats]);

  const filteredSitters = sitters.filter(
    (sitter) => sitter.type === serviceType || sitter.type === 'both'
  );

  useEffect(() => {
    if (filteredSitters.length === 0) {
      setSelectedSitter('');
      return;
    }
    const stillValid = filteredSitters.some((sitter) => sitter.id === selectedSitter);
    if (!stillValid) {
      setSelectedSitter(filteredSitters[0].id);
    }
  }, [filteredSitters, selectedSitter, serviceType]);

  function handleServiceTypeChange(nextType) {
    setServiceType(nextType);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBookingMessage('Creating booking...');
    setIsSubmittingBooking(true);

    if (!selectedSitter) {
      setBookingMessage('No sitter available for this care type. Try another care type or refresh.');
      setIsSubmittingBooking(false);
      return;
    }

    if (!startDate || !endDate) {
      setBookingMessage('Pick both a start and an end date/time.');
      setIsSubmittingBooking(false);
      return;
    }

    if (serviceType === 'pet' && !petType) {
      setBookingMessage('Select a pet type for pet care bookings.');
      setIsSubmittingBooking(false);
      return;
    }

    const durationHours = hoursBetween(startDate, endDate);
    if (durationHours <= 0) {
      setBookingMessage('End date/time must be after the start date/time.');
      setIsSubmittingBooking(false);
      return;
    }

    try {
      const { response, data } = await apiFetch(API.bookings, {
        method: 'POST',
        body: JSON.stringify({
          sitterId: selectedSitter,
          ownerName: ownerName.trim(),
          serviceType,
          ...(serviceType === 'pet' ? { petType } : {}),
          startDate,
          durationHours,
        }),
      });

      if (response.status === 401) {
        setBookingMessage('Session expired. Please sign in again.');
        setAuthUser(null);
        navigate('login');
        return;
      }

      if (!response.ok) {
        setBookingMessage(data?.error || 'Booking failed. Check all fields and try again.');
        return;
      }

      setBookingMessage('Booking created successfully!');
      setStartDate('');
      setEndDate('');
      loadBookings();
    } catch {
      setBookingMessage('Could not connect to the server. Try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthMessage('');

    if (authMode === 'register') {
      try {
        const { response, data } = await apiFetch(API.register, {
          method: 'POST',
          body: JSON.stringify({
            name: authName,
            email: authEmail,
            password: authPassword,
            role: userType,
          }),
        });

        if (!response.ok) {
          setAuthMessage(data?.error || 'Registration failed');
          return;
        }

        setRegisterSuccess(true);
        setAuthMessage(data.message || 'User created successfully');
        setAuthPassword('');
        setAuthName('');
        return;
      } catch {
        setAuthMessage('Could not connect to the server.');
        return;
      }
    }

    try {
      const { response, data } = await apiFetch(API.login, {
        method: 'POST',
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      if (!response.ok) {
        setAuthMessage(data?.error || 'Authentication failed');
        return;
      }

      setAuthUser(data.user);
      setMySitterProfile(data.sitterProfile ?? null);
      setAccountMode(data.accountMode ?? 'owner');
      setAuthPassword('');
      setAuthMessage(`Welcome back, ${data.user.name}!`);

      if (data.user.role === 'admin') {
        navigate('admin');
      } else {
        navigate('profile');
      }
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
    setMySitterProfile(null);
    setAccountMode('owner');
    setRegisterSuccess(false);
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
              <button type="button" className="tertiary-btn" onClick={() => navigate('about')}>
                About us
              </button>
            </div>
          </section>

          <section className="page-visual home-visual" aria-label="Pet and plant care">
            <figure className="page-image page-image-primary">
              <img src={homeImagePrimary} alt="Safe houseplants alongside pets at home" />
            </figure>
            <figure className="page-image page-image-secondary">
              <img src={homeImageSecondary} alt="Happy pets receiving attentive care" />
            </figure>
          </section>
        </article>
      )}

      {currentPage === 'about' && <AboutPage onBackHome={() => navigate('home')} />}

      {currentPage === 'profile' && (
        <>
          {!authUser ? (
            <article className="status-card profile-page-card">
              <h2>Sign in required</h2>
              <p>Please sign in to view your profile.</p>
              <button type="button" className="action-btn" onClick={() => navigate('login')}>
                Go to login
              </button>
            </article>
          ) : authUser.role === 'admin' ? (
            <article className="status-card profile-page-card">
              <button type="button" className="back-btn" onClick={() => navigate('admin')}>
                Back to admin
              </button>
              <h1>Admin account</h1>
              <p className="hero-note">Use the admin dashboard for platform statistics.</p>
            </article>
          ) : (
            <ProfilePage
              authUser={authUser}
              accountMode={accountMode}
              sitterProfile={mySitterProfile}
              onProfileChange={loadSession}
              onNavigate={navigate}
            />
          )}
        </>
      )}

      {(currentPage === 'login' || currentPage === 'register') && (
        <article
          className={`status-card auth-page-card ${authMode === 'register' ? 'auth-page-register' : 'auth-page-login'}`}
        >
          <button type="button" className="back-btn auth-back-btn" onClick={() => navigate('home')}>
            Back to home
          </button>

          {authMode === 'login' && (
            <section className="page-visual auth-visual" aria-label="Login">
              <figure className="page-image">
                <img src={loginImage} alt="Cat being cared for by a loving sitter" />
              </figure>
            </section>
          )}

          {authMode === 'register' && (
            <section className="page-visual auth-visual" aria-label="Register">
              <figure className="page-image">
                <img src={registerImage} alt="Indoor plants receiving professional plant care" />
              </figure>
            </section>
          )}

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
                  ? 'Sign in to access the platform. Caregivers manage services in Profile.'
                  : 'Create your account, then sign in. Caregivers set up their profile after login.'}
              </p>
              {authMode === 'login' && (
                <p className="hero-note">
                  Demo: jane@petcare.test (owner) · admin@petcare.test (admin) · password123
                </p>
              )}

              {authMode === 'register' && registerSuccess ? (
                <div className="register-success-panel">
                  <p className="auth-feedback register-success-title">User created successfully</p>
                  <p className="hero-note">
                    Your account is ready. Sign in to continue
                    {userType === 'caregiver' ? ' — then open Profile to add your services' : ''}.
                  </p>
                  <button
                    type="button"
                    className="action-btn auth-action"
                    onClick={() => {
                      setRegisterSuccess(false);
                      setAuthMessage('');
                      navigate('login');
                    }}
                  >
                    Go to login
                  </button>
                </div>
              ) : (
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
              )}

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
                  Back to home
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
                            <strong>{booking.ownerName}</strong> with {booking.sitterName || 'sitter'} —{' '}
                            {booking.serviceType} care
                            {booking.petType ? ` (${petTypeLabel(booking.petType)})` : ''}
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
        <article className="status-card dashboard-page">
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
            <p>
              {offersCare(accountMode) && seeksCare(accountMode)
                ? 'Book care for your pets and manage clients who booked you.'
                : offersCare(accountMode)
                  ? 'View owners who booked your care services.'
                  : 'Browse the marketplace and manage your pet care reservations.'}
            </p>
          </section>

          <div className="hero-actions dashboard-actions">
            <button type="button" className="back-btn" onClick={() => navigate('home')}>
              Back to home
            </button>
            <button type="button" className="secondary-btn" onClick={() => navigate('profile')}>
              My profile
            </button>
            <button type="button" className="secondary-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {offersCare(accountMode) && !mySitterProfile && (
            <p className="auth-feedback">
              Complete your caregiver listing in{' '}
              <button type="button" className="link-btn" onClick={() => navigate('profile')}>
                Profile
              </button>
              .
            </p>
          )}

          <div className="dashboard-stack">
            <section className="panel bookings-panel">
              <h3>Your bookings</h3>
              {bookings.length === 0 ? (
                <p>
                  {offersCare(accountMode) && !seeksCare(accountMode)
                    ? 'No one has booked your services yet.'
                    : 'No bookings yet. Create your first care request below.'}
                </p>
              ) : (
                <ul className="booking-list">
                  {bookings.map((booking) => {
                    const isIncoming =
                      offersCare(accountMode) &&
                      mySitterProfile &&
                      booking.sitterId === mySitterProfile.id;

                    return (
                    <li key={booking.id} className="booking-item">
                      <div className="booking-item-main">
                        {isIncoming ? (
                          <>
                            <strong>{booking.ownerName}</strong> booked you for{' '}
                            <strong>{booking.serviceType}</strong> care
                          </>
                        ) : (
                          <>
                            You booked <strong>{booking.sitterName || 'a sitter'}</strong> for{' '}
                            <strong>{booking.serviceType}</strong> care
                          </>
                        )}
                        {booking.petType ? (
                          <span> ({petTypeLabel(booking.petType)})</span>
                        ) : null}
                      </div>
                      <div className="booking-meta">
                        <span>{formatBookingRange(booking.startDate, booking.durationHours)}</span>
                        <span>{booking.durationHours} hrs</span>
                        <span>{booking.status}</span>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {seeksCare(accountMode) && (
              <>
                <section className="panel">
                  <h3>Available sitters ({serviceType} care)</h3>
                  {filteredSitters.length === 0 ? (
                    <p>No sitters available for {serviceType} care yet.</p>
                  ) : (
                    <ul className="sitter-list">
                      {filteredSitters.map((sitter) => (
                        <li key={sitter.id} className="sitter-card">
                          <h4>{sitter.name}</h4>
                          <p>{sitter.description}</p>
                          <div className="sitter-meta">
                            <span>{careTypeLabel(sitter.type)}</span>
                            {formatSitterPetTypes(sitter.petTypes) && (
                              <span>Animals: {formatSitterPetTypes(sitter.petTypes)}</span>
                            )}
                            {sitter.availability && <span>Free time: {sitter.availability}</span>}
                            <span>{sitter.location}</span>
                            <span>${sitter.pricePerHour}/hr</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="panel booking-form-panel">
                  <h3>New booking</h3>
                  <form onSubmit={handleSubmit} className="booking-form">
                    <label>
                      Owner name
                      <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Your full name" required />
                    </label>

                    <label>
                      Care type
                      <select value={serviceType} onChange={(e) => handleServiceTypeChange(e.target.value)}>
                        <option value="pet">Pet care</option>
                        <option value="plant">Plant care</option>
                      </select>
                    </label>

                    {serviceType === 'pet' && (
                      <label>
                        Pet type
                        <select value={petType} onChange={(e) => setPetType(e.target.value)} required>
                          {PET_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      Sitter
                      <select value={selectedSitter} onChange={(e) => setSelectedSitter(e.target.value)} required>
                        {filteredSitters.length === 0 ? (
                          <option value="">No sitters for this care type</option>
                        ) : (
                          filteredSitters.map((sitter) => (
                            <option key={sitter.id} value={sitter.id}>
                              {sitter.name} ({sitter.type})
                            </option>
                          ))
                        )}
                      </select>
                    </label>

                    <div className="calendar-range">
                      <label>
                        Start
                        <input
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                        />
                      </label>

                      <label>
                        End
                        <input
                          type="datetime-local"
                          value={endDate}
                          min={startDate || undefined}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                        />
                      </label>
                    </div>

                    {startDate && endDate && hoursBetween(startDate, endDate) > 0 && (
                      <p className="booking-duration-note">
                        Duration: {hoursBetween(startDate, endDate)} hour(s)
                      </p>
                    )}

                    <button type="submit" className="action-btn" disabled={isSubmittingBooking || !selectedSitter}>
                      {isSubmittingBooking ? 'Submitting...' : 'Request Care'}
                    </button>

                    {bookingMessage && <p className="booking-feedback">{bookingMessage}</p>}
                  </form>
                </section>
              </>
            )}
          </div>
            </>
          )}
        </article>
      )}
    </main>
  );
}
