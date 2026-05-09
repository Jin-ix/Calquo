/**
 * CALICO - Main Entry Point
 * Renders the React app into #root
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import '../styles/globals.css';
import '../components/utils/offline-mode-initializer'; // Initialize error suppression

// Error handling for missing root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element. Make sure index.html contains <div id="root"></div>');
}

// Create and render React root
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide initial loader when app is mounted
if (typeof window !== 'undefined') {
  // Remove initial loader
  const loader = document.getElementById('initialLoader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.remove();
      }, 500);
    }, 500);
  }
  
  // Mark app as loaded
  document.body.classList.add('app-loaded');
}

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept();
}
