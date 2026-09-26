import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && (import.meta as any).env?.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: (import.meta as any).env.VITE_SENTRY_DSN,
    environment: (import.meta as any).env.MODE || 'production',
  });
}

// Safely register Service Worker for offline asset and data caching
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.location.protocol.startsWith('http')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('TransCar offline service worker active:', reg.scope);
      })
      .catch((err) => {
        console.info('Service worker registration in current mode:', err?.message || err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
