import { cargarTarifas, montar } from './data/cargar.jsx';
import Solicitar from './pages/Solicitar.jsx';
import '../css/main.css';

montar(Solicitar, { cargar: cargarTarifas });
