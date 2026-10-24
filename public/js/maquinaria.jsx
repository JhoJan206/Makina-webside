import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Maquinaria from './pages/Maquinaria.jsx';
import '../css/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Maquinaria />
  </StrictMode>,
);
