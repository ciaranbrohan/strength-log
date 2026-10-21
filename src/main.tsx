import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { seedIfEmpty } from './db/db';
import './styles.css';

registerSW({ immediate: true });
navigator.storage?.persist?.().catch(() => {});
seedIfEmpty().catch((err) => console.error('Seeding failed', err));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
