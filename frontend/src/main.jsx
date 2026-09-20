import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Progressive Web App Service Worker (Production Only)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('HospiSynAI PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.error('HospiSynAI PWA Service Worker registration failed:', err);
        });
    });
  } else {
    // In dev mode, unregister any service workers to ensure live Vite HMR works reliably
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  }
}

