import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Operador from './pages/Operador.jsx';
import '../css/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Operador />
  </StrictMode>,
);
