import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Solicitudes from './pages/Solicitudes.jsx';
import '../css/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Solicitudes />
  </StrictMode>,
);
