import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Movimientos from './pages/Movimientos.jsx';
import '../css/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Movimientos />
  </StrictMode>,
);
