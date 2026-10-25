import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Solicitar from './pages/Solicitar.jsx';
import '../css/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Solicitar />
  </StrictMode>,
);
