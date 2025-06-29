import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Remove StrictMode to prevent double initialization in development
createRoot(document.getElementById('root')!).render(
  <App />
);