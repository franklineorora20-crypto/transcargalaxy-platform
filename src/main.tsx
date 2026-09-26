import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely register Service Worker for offline asset and data caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('New app version available.');
        },
        onOfflineReady() {
          console.log('App ready to work offline.');
        },
      });
    })
    .catch((err) => {
      console.warn('Service worker registration skipped:', err);
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
