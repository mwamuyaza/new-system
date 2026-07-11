import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeMockApi } from './lib/mockApi';

// To switch entirely to fullstack MERN, we comment out the in-browser mock simulator.
// The frontend will now make real HTTP requests directly to the Node/Express backend.
// initializeMockApi();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

