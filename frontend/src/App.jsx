import { useEffect, useState } from 'react';

const rawApiBase = import.meta.env.VITE_API_URL || '';
const apiBase = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
const API_URL = `${apiBase}/api/health`;

export default function App() {
  const [status, setStatus] = useState('Cargando...');

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setStatus(data.status || 'Sin estado'))
      .catch(() => setStatus('No disponible'));
  }, []);

  return (
    <main className="app">
      <h1>Fullstack Application</h1>
      <p>Backend status: {status}</p>
    </main>
  );
}
