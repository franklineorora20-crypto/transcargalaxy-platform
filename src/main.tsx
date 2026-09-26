import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
