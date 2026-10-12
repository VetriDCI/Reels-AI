import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

// Register service worker for PWA install + offline app shell support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js?v=3')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Cache the files this page already loaded so the app opens offline next time.
        const urls = performance.getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => name.startsWith(window.location.origin) && !name.includes('/api/') && /\.(js|css|woff2?|png|svg|ico)(\?|$)/.test(name));
        registration.active?.postMessage({ type: 'CACHE_URLS', urls: [...new Set(urls)] });
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });
  });
}