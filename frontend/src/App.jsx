import { useEffect, useState } from 'react';

const API_URL = '/api/health';

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
