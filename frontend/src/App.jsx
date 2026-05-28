import { useEffect, useState } from 'react';

const rawApiBase = import.meta.env.VITE_API_URL || '';
const apiBase = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
const HEALTH_URL = `${apiBase}/api/health`;
const SITTERS_URL = `${apiBase}/api/sitters`;
const BOOKINGS_URL = `${apiBase}/api/bookings`;

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

  async function loadSitters() {
    try {
      const res = await fetch(SITTERS_URL);
      const data = await res.json();
      setSitters(data.sitters || []);
      setStatus('ready');
      if (!selectedSitter && data.sitters.length > 0) {
        setSelectedSitter(data.sitters[0].id);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Unable to load sitters.');
    }
  }

  async function loadBookings() {
    try {
      const res = await fetch(BOOKINGS_URL);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      setMessage('Unable to load bookings.');
    }
  }

  async function loadHealth() {
    try {
      const res = await fetch(HEALTH_URL);
      const data = await res.json();
      setStatus(data.status === 'ok' ? 'ready' : 'offline');
    } catch {
      setStatus('offline');
    }
  }

  useEffect(() => {
    loadSitters();
    loadBookings();
    loadHealth();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('Creating booking...');

    try {
      const response = await fetch(BOOKINGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitterId: selectedSitter,
          ownerName,
          serviceType,
          startDate,
          durationHours: Number(durationHours),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Booking failed');
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

  return (
    <main className="app-shell">
      <section className="orb orb-a" aria-hidden="true" />
      <section className="orb orb-b" aria-hidden="true" />
      <section className="texture" aria-hidden="true" />

      <article className="status-card">
        <section className="hero-copy">
          <p className="kicker">PetCare</p>
          <h1>Book trusted pet and plant sitters</h1>
          <p className="subtitle">
            Browse available sitters, book care services, and manage reservations in one place.
          </p>

          <div className="row">
            <span className={`status-pill ${status === 'ready' ? 'status-ok' : status === 'loading' ? 'status-checking' : 'status-offline'}`}>
              {status === 'ready' ? 'Ready' : status === 'loading' ? 'Loading...' : 'Offline'}
            </span>
            <button type="button" onClick={() => { loadSitters(); loadBookings(); loadHealth(); }} className="refresh-btn">
              Refresh List
            </button>
          </div>

          <div className="info-panel" aria-label="Application summary">
            <p>{message || 'Select a sitter and create a booking request.'}</p>
          </div>
        </section>

        <section className="listing-panel">
          <div className="grid-listing">
            <div className="panel">
              <h2>Available Sitters</h2>
              {sitters.length === 0 ? (
                <p>No sitters available yet.</p>
              ) : (
                <ul className="sitter-list">
                  {sitters.map((sitter) => (
                    <li key={sitter.id} className="sitter-card">
                      <h3>{sitter.name}</h3>
                      <p>{sitter.description}</p>
                      <p>
                        <strong>Type:</strong> {sitter.type}
                      </p>
                      <p>
                        <strong>Location:</strong> {sitter.location}
                      </p>
                      <p>
                        <strong>Rate:</strong> ${sitter.pricePerHour}/hr
                      </p>
                      <p>
                        <strong>Rating:</strong> {sitter.rating} / 5
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel">
              <h2>Book a Sitter</h2>
              <form onSubmit={handleSubmit} className="booking-form">
                <label>
                  Your name
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" required />
                </label>

                <label>
                  Service type
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
                  Create Booking
                </button>
              </form>
            </div>
          </div>

          <div className="panel bookings-panel">
            <h2>Recent Bookings</h2>
            {bookings.length === 0 ? (
              <p>No bookings have been created yet.</p>
            ) : (
              <ul className="booking-list">
                {bookings.map((booking) => (
                  <li key={booking.id} className="booking-card">
                    <p>
                      <strong>Owner:</strong> {booking.ownerName}
                    </p>
                    <p>
                      <strong>Service:</strong> {booking.serviceType}
                    </p>
                    <p>
                      <strong>Start:</strong> {formatDate(booking.startDate)}
                    </p>
                    <p>
                      <strong>Hours:</strong> {booking.durationHours}
                    </p>
                    <p>
                      <strong>Status:</strong> {booking.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}
