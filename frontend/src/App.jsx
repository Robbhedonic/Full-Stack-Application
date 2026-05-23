import { useEffect, useState } from 'react';

const rawApiBase = import.meta.env.VITE_API_URL || '';
const apiBase = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
const API_URL = `${apiBase}/api/health`;

function formatTimestamp(value) {
  if (!value) return 'Waiting for response';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function App() {
  const [status, setStatus] = useState('checking');
  const [timestamp, setTimestamp] = useState('');
  const [lastCheck, setLastCheck] = useState('');

  async function loadHealth() {
    setStatus('checking');
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setStatus(data.status || 'unknown');
      setTimestamp(data.timestamp || '');
      setLastCheck(new Date().toISOString());
    } catch {
      setStatus('offline');
      setTimestamp('');
      setLastCheck(new Date().toISOString());
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  const statusClass = status === 'ok' ? 'status-ok' : status === 'checking' ? 'status-checking' : 'status-offline';
  const healthLabel = status === 'checking' ? 'Checking...' : `Backend: ${status}`;
  const isHealthy = status === 'ok';

  return (
    <main className="app-shell">
      <section className="orb orb-a" aria-hidden="true" />
      <section className="orb orb-b" aria-hidden="true" />
      <section className="texture" aria-hidden="true" />

      <article className="status-card">
        <section className="hero-copy">
          <p className="kicker">System Monitor</p>
          <h1>Fullstack Control Panel</h1>
          <p className="subtitle">A compact command center for your frontend and backend heartbeat.</p>

          <div className="row">
            <span className={`status-pill ${statusClass}`}>{healthLabel}</span>
            <button type="button" onClick={loadHealth} className="refresh-btn">
              Refresh Health
            </button>
          </div>

          <div className="timeline">
            <div className="dot active" />
            <div className="line" />
            <div className={`dot ${isHealthy ? 'active' : ''}`} />
            <div className="line" />
            <div className={`dot ${status === 'offline' ? 'active' : ''}`} />
          </div>

          <p className="timeline-labels">request initiated • backend responded • app ready</p>
        </section>

        <section className="info-panel" aria-label="Runtime details">
          <dl className="meta-grid">
            <div>
              <dt>Endpoint</dt>
              <dd>{API_URL}</dd>
            </div>
            <div>
              <dt>Backend timestamp</dt>
              <dd>{formatTimestamp(timestamp)}</dd>
            </div>
            <div>
              <dt>Checked at</dt>
              <dd>{formatTimestamp(lastCheck)}</dd>
            </div>
          </dl>

          <div className="metrics-grid">
            <article>
              <p>Service</p>
              <h2>{isHealthy ? 'Online' : status === 'checking' ? 'Pending' : 'Issues'}</h2>
            </article>
            <article>
              <p>Mode</p>
              <h2>{import.meta.env.DEV ? 'Development' : 'Production'}</h2>
            </article>
          </div>
        </section>
      </article>
    </main>
  );
}
