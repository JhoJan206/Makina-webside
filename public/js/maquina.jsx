import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Maquina from './pages/Maquina.jsx';
import '../css/main.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Maquina />
  </StrictMode>,
);
