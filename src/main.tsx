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

// Evict stale Service Worker caches (e.g. transcar-v3) that may have cached HTML for API routes or stale JS bundles
if (typeof window !== 'undefined') {
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => {
        keys.forEach((key) => {
          if (key !== 'transcar-v9-network-first') {
            caches.delete(key).catch(() => {});
          }
        });
      })
      .catch(() => {});
  }

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    const swResetKey = 'transcar_sw_reset_v9';
    const needsForceUnregister = localStorage.getItem(swResetKey) !== '1';

    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        for (const reg of registrations) {
          const scriptUrl =
            reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
          if (needsForceUnregister || (scriptUrl && !scriptUrl.endsWith('/sw.js'))) {
            await reg.unregister().catch(() => {});
          } else {
            await reg.update().catch(() => {});
          }
        }
        if (needsForceUnregister) {
          localStorage.setItem(swResetKey, '1');
        }
      })
      .catch(() => {});

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
