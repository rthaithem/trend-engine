import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Shim global objects to prevent some libraries from trying to redefine fetch
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
}

import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
