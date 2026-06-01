import { useCallback, useEffect, useState } from 'react';
import { API, apiFetch } from './api.js';
import { pageToPath, pathToPage } from './routes.js';
import AboutPage from './pages/AboutPage.jsx';
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

function isCaregiverRole(role) {
  return role === 'caregiver';
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
  const [caregiverCareType, setCaregiverCareType] = useState('pet');
  const [caregiverPetTypes, setCaregiverPetTypes] = useState(['dog', 'cat']);
  const [caregiverAvailability, setCaregiverAvailability] = useState('');
  const [caregiverLocation, setCaregiverLocation] = useState('');
  const [caregiverPricePerHour, setCaregiverPricePerHour] = useState('15');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [loginCaregiverSetup, setLoginCaregiverSetup] = useState(false);

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
      } else {
        setLoginCaregiverSetup(false);
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
    } catch {
      setAuthUser(null);
      setMySitterProfile(null);
    }
  }, []);

  function toggleCaregiverPetType(value) {
    setCaregiverPetTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

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

  function buildCaregiverProfilePayload() {
    return {
      careType: caregiverCareType,
      petTypes: caregiverCareType === 'plant' ? [] : caregiverPetTypes,
      availability: caregiverAvailability.trim(),
      location: caregiverLocation.trim(),
      pricePerHour: caregiverPricePerHour,
    };
  }

  function validateCaregiverProfileForm() {
    if (!caregiverAvailability.trim()) {
      setAuthMessage('Enter your hourly availability / free time.');
      return false;
    }
    if (
      (caregiverCareType === 'pet' || caregiverCareType === 'both') &&
      caregiverPetTypes.length === 0
    ) {
      setAuthMessage('Select at least one animal type you care for.');
      return false;
    }
    return true;
  }

  function renderCaregiverProfileFields() {
    return (
      <fieldset className="caregiver-register-fields">
        <legend>What you offer as a caregiver</legend>

        <label>
          Care you provide
          <select value={caregiverCareType} onChange={(e) => setCaregiverCareType(e.target.value)}>
            <option value="pet">Pet care</option>
            <option value="plant">Plant care</option>
            <option value="both">Pet and plant care</option>
          </select>
        </label>

        {(caregiverCareType === 'pet' || caregiverCareType === 'both') && (
          <div className="pet-type-checkboxes">
            <span className="field-label">What you care for (checkboxes)</span>
            <div className="checkbox-row">
              {PET_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={caregiverPetTypes.includes(option.value)}
                    onChange={() => toggleCaregiverPetType(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <label>
          Hourly availability / free time
          <textarea
            value={caregiverAvailability}
            onChange={(e) => setCaregiverAvailability(e.target.value)}
            placeholder="e.g. Mon–Fri 5pm–9pm, Sat 10am–6pm"
            rows={3}
            required
          />
        </label>

        <label>
          Service area
          <input
            value={caregiverLocation}
            onChange={(e) => setCaregiverLocation(e.target.value)}
            placeholder="e.g. Downtown, Northside"
          />
        </label>

        <label>
          Hourly rate (USD)
          <input
            type="number"
            min="0"
            step="1"
            value={caregiverPricePerHour}
            onChange={(e) => setCaregiverPricePerHour(e.target.value)}
          />
        </label>
      </fieldset>
    );
  }

  async function handleCaregiverProfileSubmit(event) {
    event.preventDefault();
    setAuthMessage('');

    if (!validateCaregiverProfileForm()) {
      return;
    }

    try {
      const { response, data } = await apiFetch(API.caregiverProfile, {
        method: 'POST',
        body: JSON.stringify({ caregiverProfile: buildCaregiverProfilePayload() }),
      });

      if (!response.ok) {
        setAuthMessage(data?.error || 'Could not save caregiver profile');
        return;
      }

      setMySitterProfile(data.sitterProfile);
      setLoginCaregiverSetup(false);
      setAuthMessage('Profile saved. Welcome!');
      navigate('dashboard');
    } catch {
      setAuthMessage('Could not connect to the server.');
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
      setAuthPassword('');

      if (data.needsCaregiverProfile) {
        setLoginCaregiverSetup(true);
        setAuthMessage('Signed in. Complete your caregiver profile below.');
        return;
      }

      setMySitterProfile(data.sitterProfile ?? null);
      setAuthMessage(`Welcome back, ${data.user.name}!`);
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
    setMySitterProfile(null);
    setLoginCaregiverSetup(false);
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
                  ? loginCaregiverSetup
                    ? 'Tell owners what you care for and when you are available.'
                    : 'Sign in to access the platform. Caregivers complete their service profile after login.'
                  : 'Create your account. Caregivers set up services when they sign in.'}
              </p>
              {authMode === 'login' && !loginCaregiverSetup && (
                <p className="hero-note">
                  Demo: jane@petcare.test (owner) · admin@petcare.test (admin) · password123
                </p>
              )}

              {authMode === 'register' && registerSuccess ? (
                <div className="register-success-panel">
                  <p className="auth-feedback register-success-title">User created successfully</p>
                  <p className="hero-note">
                    Your account is ready. Sign in to continue
                    {userType === 'caregiver' ? ' and set up your caregiver profile' : ''}.
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
              ) : authMode === 'login' && loginCaregiverSetup ? (
                <form onSubmit={handleCaregiverProfileSubmit} className="auth-form">
                  {renderCaregiverProfileFields()}
                  <button type="submit" className="action-btn auth-action">
                    Save profile and continue
                  </button>
                </form>
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
              {isCaregiverRole(authUser.role)
                ? 'View owners who booked your care services.'
                : 'Browse the marketplace and manage your pet or plant care reservations.'}
            </p>
          </section>

          <div className="hero-actions dashboard-actions">
            <button type="button" className="back-btn" onClick={() => navigate('home')}>
              Back to home
            </button>
            <button type="button" className="secondary-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="dashboard-stack">
            {isCaregiverRole(authUser.role) && mySitterProfile && (
              <section className="panel caregiver-profile-panel">
                <h3>Your public sitter listing</h3>
                <p className="hero-note">Owners see this profile when booking care.</p>
                <ul className="caregiver-profile-details">
                  <li>
                    <strong>Services:</strong> {careTypeLabel(mySitterProfile.type)}
                  </li>
                  {mySitterProfile.petTypes?.length > 0 && (
                    <li>
                      <strong>Animals:</strong> {formatSitterPetTypes(mySitterProfile.petTypes)}
                    </li>
                  )}
                  {mySitterProfile.availability && (
                    <li>
                      <strong>Availability:</strong> {mySitterProfile.availability}
                    </li>
                  )}
                  <li>
                    <strong>Area:</strong> {mySitterProfile.location}
                  </li>
                  <li>
                    <strong>Rate:</strong> ${mySitterProfile.pricePerHour}/hr
                  </li>
                </ul>
                <p>{mySitterProfile.description}</p>
              </section>
            )}

            <section className="panel bookings-panel">
              <h3>{isCaregiverRole(authUser.role) ? 'Clients who booked you' : 'Your reservations'}</h3>
              {bookings.length === 0 ? (
                <p>
                  {isCaregiverRole(authUser.role)
                    ? 'No one has booked your services yet.'
                    : 'No bookings yet. Create your first care request below.'}
                </p>
              ) : (
                <ul className="booking-list">
                  {bookings.map((booking) => (
                    <li key={booking.id} className="booking-item">
                      <div className="booking-item-main">
                        {isCaregiverRole(authUser.role) ? (
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
                  ))}
                </ul>
              )}
            </section>

            {isOwnerRole(authUser.role) && (
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
