import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyCssVars } from './theme.js';
import './styles.css';

applyCssVars();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
