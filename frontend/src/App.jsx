import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API, apiFetch } from './api.js';
import { pageToPath, pathToPage } from './routes.js';
import AboutPage from './pages/AboutPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import loginImage from './images/cat-black-being-loved.webp';
import registerImage from './images/planst-care.webp';
import homeImagePrimary from './images/Post-safe-houseplants-for-pets.jpg';
import homeImageSecondary from './images/images.jpeg';
import {
  PET_TYPE_OPTIONS,
  PLANT_TYPE_OPTIONS,
  formatBookingCareSummary,
  petTypeLabel,
  plantTypeLabel,
} from './careOptions.js';

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
  const [plantType, setPlantType] = useState('succulent');
  const [mealsPerDay, setMealsPerDay] = useState('2');
  const [wateringSchedule, setWateringSchedule] = useState('');
  const [wateringAmount, setWateringAmount] = useState('');
  const [careNotes, setCareNotes] = useState('');
  const [ownerCare, setOwnerCare] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [status, setStatus] = useState('loading');
  const [currentPage, setCurrentPage] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [authMode, setAuthMode] = useState('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  const [mySitterProfile, setMySitterProfile] = useState(null);
  const [accountMode, setAccountMode] = useState('owner');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [messageThreads, setMessageThreads] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [messageFeedback, setMessageFeedback] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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

  const applyOwnerCareDefaults = useCallback((care, nextServiceType = serviceType) => {
    if (!care) return;
    if (nextServiceType === 'pet' && care.petType) {
      setPetType(care.petType);
      if (care.mealsPerDay != null) setMealsPerDay(String(care.mealsPerDay));
    }
    if (nextServiceType === 'plant' && care.plantType) {
      setPlantType(care.plantType);
      if (care.wateringSchedule) setWateringSchedule(care.wateringSchedule);
      if (care.wateringAmount) setWateringAmount(care.wateringAmount);
    }
    if (care.careNotes) setCareNotes(care.careNotes);
  }, [serviceType]);

  const dataLoadKeyRef = useRef('');

  const applySessionData = useCallback(
    (payload) => {
      if (!payload?.user) return;

      setAuthUser(payload.user);
      setMySitterProfile(payload.sitterProfile ?? null);
      setOwnerCare(payload.ownerCare ?? null);
      const nextMode = payload.accountMode ?? 'owner';
      setAccountMode((prev) => {
        if (prev !== nextMode) {
          dataLoadKeyRef.current = '';
        }
        return nextMode;
      });
      if (payload.ownerCare) {
        applyOwnerCareDefaults(payload.ownerCare);
      }
      if (payload.user.name) {
        setOwnerName((current) => current || payload.user.name);
      }
    },
    [applyOwnerCareDefaults]
  );

  const loadSession = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.me);
      if (response.ok) {
        applySessionData(data);
      } else {
        setAuthUser(null);
        setMySitterProfile(null);
        setOwnerCare(null);
        setAccountMode('owner');
      }
    } catch {
      setAuthUser(null);
      setMySitterProfile(null);
      setOwnerCare(null);
      setAccountMode('owner');
    }
  }, [applySessionData]);

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

  const loadMessageThreads = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.messageThreads);
      if (response.status === 401) {
        setMessageThreads([]);
        return;
      }
      if (!response.ok) throw new Error();
      setMessageThreads(data.threads || []);
    } catch {
      setMessage('Unable to load messages.');
    }
  }, []);

  const loadChatMessages = useCallback(async (sitterId, ownerId) => {
    try {
      const params = new URLSearchParams({ sitterId, ownerId });
      const { response, data } = await apiFetch(`${API.messages}?${params}`);
      if (!response.ok) throw new Error();
      setChatMessages(data.messages || []);
    } catch {
      setMessageFeedback('Could not load conversation.');
      setChatMessages([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const loadAdminStats = useCallback(async () => {
    try {
      const { response, data } = await apiFetch(API.adminStats);
      if (!response.ok) throw new Error();
      setAdminStats(data);
    } catch {
      setMessage('Unable to load admin statistics.');
    }
  }, []);

  const authUserId = authUser?.id ?? null;

  const filteredSitters = useMemo(
    () => sitters.filter((sitter) => sitter.type === serviceType || sitter.type === 'both'),
    [sitters, serviceType]
  );

  const sortedSitters = useMemo(
    () =>
      [...filteredSitters].sort((a, b) => {
        if (a.isAvailable === b.isAvailable) {
          return a.name.localeCompare(b.name);
        }
        return a.isAvailable ? -1 : 1;
      }),
    [filteredSitters]
  );

  const availableSittersCount = useMemo(
    () => sortedSitters.filter((sitter) => sitter.isAvailable).length,
    [sortedSitters]
  );

  useEffect(() => {
    if (!authUserId || currentPage === 'profile') {
      if (!authUserId) {
        dataLoadKeyRef.current = '';
      }
      return;
    }

    const loadKey = `${authUserId}:${currentPage}:${accountMode}`;
    if (dataLoadKeyRef.current === loadKey) {
      return;
    }
    dataLoadKeyRef.current = loadKey;

    if (authUser?.role === 'admin') {
      if (currentPage === 'dashboard') {
        navigate('admin');
      }
      if (currentPage === 'admin') {
        loadAdminStats();
      }
      return;
    }

    loadBookings();
    if (authUser.name) {
      setOwnerName((current) => current || authUser.name);
    }
    if (seeksCare(accountMode)) {
      loadSitters();
    }
    if (seeksCare(accountMode) || offersCare(accountMode)) {
      loadMessageThreads();
    }
  }, [
    authUserId,
    authUser?.role,
    accountMode,
    currentPage,
    navigate,
    loadSitters,
    loadBookings,
    loadAdminStats,
    loadMessageThreads,
  ]);

  useEffect(() => {
    if (filteredSitters.length === 0) {
      setSelectedSitter('');
      return;
    }
    const stillValid = filteredSitters.some((sitter) => sitter.id === selectedSitter);
    if (!stillValid) {
      setSelectedSitter(filteredSitters[0].id);
    }
  }, [filteredSitters, selectedSitter]);

  function handleServiceTypeChange(nextType) {
    setServiceType(nextType);
    applyOwnerCareDefaults(ownerCare, nextType);
  }

  function openChatWithSitter(sitter) {
    if (!authUser) return;
    const chat = {
      sitterId: sitter.id,
      ownerId: authUser.id,
      sitterName: sitter.name,
      ownerName: authUser.name,
    };
    setActiveChat(chat);
    setMessageDraft('');
    setMessageFeedback('');
    loadChatMessages(chat.sitterId, chat.ownerId);
  }

  function openMessageThread(thread) {
    const chat = {
      sitterId: thread.sitterId,
      ownerId: thread.ownerId,
      sitterName: thread.sitterName,
      ownerName: thread.ownerName,
    };
    setActiveChat(chat);
    setMessageDraft('');
    setMessageFeedback('');
    loadChatMessages(chat.sitterId, chat.ownerId);
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!activeChat || !messageDraft.trim()) {
      setMessageFeedback('Write a message before sending.');
      return;
    }

    setIsSendingMessage(true);
    setMessageFeedback('');

    try {
      const { response, data } = await apiFetch(API.messages, {
        method: 'POST',
        body: JSON.stringify({
          sitterId: activeChat.sitterId,
          ownerId: activeChat.ownerId,
          body: messageDraft.trim(),
        }),
      });

      if (!response.ok) {
        setMessageFeedback(data?.error || 'Could not send message.');
        return;
      }

      setChatMessages((current) => [...current, data.message]);
      setMessageDraft('');
      setMessageFeedback('Message sent.');
      loadMessageThreads();
    } catch {
      setMessageFeedback('Could not connect to the server.');
    } finally {
      setIsSendingMessage(false);
    }
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

    if (serviceType === 'pet') {
      if (!petType) {
        setBookingMessage('Select a pet type for pet care bookings.');
        setIsSubmittingBooking(false);
        return;
      }
      const meals = Number.parseInt(mealsPerDay, 10);
      if (!Number.isFinite(meals) || meals < 1 || meals > 12) {
        setBookingMessage('Enter meals per day (1–12).');
        setIsSubmittingBooking(false);
        return;
      }
    }

    if (serviceType === 'plant') {
      if (!plantType) {
        setBookingMessage('Select a plant type for plant care bookings.');
        setIsSubmittingBooking(false);
        return;
      }
      if (!wateringSchedule.trim()) {
        setBookingMessage('Describe when to water the plants.');
        setIsSubmittingBooking(false);
        return;
      }
      if (!wateringAmount.trim()) {
        setBookingMessage('Describe how much water to use.');
        setIsSubmittingBooking(false);
        return;
      }
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
          ...(serviceType === 'pet'
            ? { petType, mealsPerDay: Number.parseInt(mealsPerDay, 10), careNotes: careNotes.trim() || undefined }
            : {
                plantType,
                wateringSchedule: wateringSchedule.trim(),
                wateringAmount: wateringAmount.trim(),
                careNotes: careNotes.trim() || undefined,
              }),
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
            role: 'owner-pet',
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

      applySessionData(data);
      setAuthPassword('');
      setAuthMessage(`Welcome back, ${data.user.name}!`);

      if (data.user.role === 'admin') {
        navigate('admin');
      } else {
        navigate('dashboard');
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
              ownerCare={ownerCare}
              onProfileChange={applySessionData}
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
                  ? 'Sign in to open your dashboard. Account details are in Profile when you need them.'
                  : 'Create your account, then sign in. You will land on the dashboard; configure your account in Profile.'}
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
                    Your account is ready. Sign in to continue, then configure your account type and services in Profile.
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
                        {booking.plantType ? (
                          <span> ({plantTypeLabel(booking.plantType)})</span>
                        ) : null}
                      </div>
                      {formatBookingCareSummary(booking) && (
                        <p className="booking-care-detail">{formatBookingCareSummary(booking)}</p>
                      )}
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

            {(seeksCare(accountMode) || offersCare(accountMode)) && (
              <section className="panel messages-panel">
                <h3>Messages</h3>
                <p className="hero-note">
                  {seeksCare(accountMode)
                    ? 'Contact caregivers to ask about availability before booking.'
                    : 'Replies from pet and plant owners appear here.'}
                </p>

                {messageThreads.length > 0 ? (
                  <ul className="message-thread-list">
                    {messageThreads.map((thread) => (
                      <li key={`${thread.sitterId}-${thread.ownerId}`}>
                        <button
                          type="button"
                          className={
                            activeChat?.sitterId === thread.sitterId &&
                            activeChat?.ownerId === thread.ownerId
                              ? 'thread-btn active'
                              : 'thread-btn'
                          }
                          onClick={() => openMessageThread(thread)}
                        >
                          <strong>{thread.otherPartyName || 'Conversation'}</strong>
                          {thread.isAvailable && <span className="availability-badge">Available</span>}
                          <span className="thread-preview">{thread.lastMessage}</span>
                          {thread.sitterAvailability && (
                            <span className="thread-availability">Schedule: {thread.sitterAvailability}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="hero-note">No conversations yet. Message a caregiver below.</p>
                )}

                {activeChat && (
                  <div className="message-chat">
                    <p className="message-chat-title">
                      Chat with{' '}
                      <strong>
                        {activeChat.ownerId === authUser?.id
                          ? activeChat.sitterName
                          : activeChat.ownerName}
                      </strong>
                    </p>
                    <ul className="message-list">
                      {chatMessages.length === 0 ? (
                        <li className="message-empty">No messages yet. Say hello!</li>
                      ) : (
                        chatMessages.map((entry) => (
                          <li
                            key={entry.id}
                            className={entry.isMine ? 'message-bubble message-mine' : 'message-bubble message-theirs'}
                          >
                            <span className="message-sender">{entry.senderName}</span>
                            <p>{entry.body}</p>
                            <time>{new Date(entry.createdAt).toLocaleString()}</time>
                          </li>
                        ))
                      )}
                    </ul>
                    <form onSubmit={handleSendMessage} className="message-compose">
                      <label>
                        Your message
                        <textarea
                          rows={3}
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          placeholder="Ask about dates, pets, plants, or special care..."
                          required
                        />
                      </label>
                      <button type="submit" className="secondary-btn" disabled={isSendingMessage}>
                        {isSendingMessage ? 'Sending...' : 'Send message'}
                      </button>
                      {messageFeedback && <p className="message-feedback">{messageFeedback}</p>}
                    </form>
                  </div>
                )}
              </section>
            )}

            {seeksCare(accountMode) && (
              <>
                <section className="panel">
                  <h3>Available caregivers ({serviceType} care)</h3>
                  <p className="hero-note">
                    {availableSittersCount > 0
                      ? `${availableSittersCount} caregiver(s) listed their availability.`
                      : 'No one has posted availability yet — you can still message them.'}
                  </p>
                  {sortedSitters.length === 0 ? (
                    <p>No sitters available for {serviceType} care yet.</p>
                  ) : (
                    <ul className="sitter-list">
                      {sortedSitters.map((sitter) => (
                        <li key={sitter.id} className="sitter-card">
                          <div className="sitter-card-header">
                            <h4>{sitter.name}</h4>
                            {sitter.isAvailable ? (
                              <span className="availability-badge">Available</span>
                            ) : (
                              <span className="availability-badge availability-unknown">Ask for availability</span>
                            )}
                          </div>
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
                          <div className="sitter-card-actions">
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => openChatWithSitter(sitter)}
                            >
                              Message
                            </button>
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => setSelectedSitter(sitter.id)}
                            >
                              Use for booking
                            </button>
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
                      <>
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
                        <label>
                          Meals per day
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={mealsPerDay}
                            onChange={(e) => setMealsPerDay(e.target.value)}
                            required
                          />
                        </label>
                      </>
                    )}

                    {serviceType === 'plant' && (
                      <>
                        <label>
                          Plant type
                          <select value={plantType} onChange={(e) => setPlantType(e.target.value)} required>
                            {PLANT_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          When to water
                          <input
                            value={wateringSchedule}
                            onChange={(e) => setWateringSchedule(e.target.value)}
                            placeholder="e.g. Every 3 days, mornings only"
                            required
                          />
                        </label>
                        <label>
                          How much water
                          <input
                            value={wateringAmount}
                            onChange={(e) => setWateringAmount(e.target.value)}
                            placeholder="e.g. 200 ml per pot"
                            required
                          />
                        </label>
                      </>
                    )}

                    <label>
                      Extra care notes (optional)
                      <textarea
                        rows={2}
                        value={careNotes}
                        onChange={(e) => setCareNotes(e.target.value)}
                        placeholder="Food brand, plant locations, special instructions"
                      />
                    </label>

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
