import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Operadores from './pages/Operadores.jsx';
import '../css/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Operadores />
  </StrictMode>,
);
