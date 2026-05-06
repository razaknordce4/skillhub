import React from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api')) {
    config.url = config.url.replace('/api', '');
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
