import { Router } from 'express';
import { requiereSesion } from '../middleware/auth.js';
import { noEncontrado } from '../middleware/errores.js';
import asignaciones from './asignaciones.js';
import auth from './auth.js';
import clientes from './clientes.js';
import maquinas from './maquinas.js';
import movimientos from './movimientos.js';
import operadores from './operadores.js';
import publico from './publico.js';
import solicitudes from './solicitudes.js';

const api = Router();

// Públicas
api.get('/health', (req, res) => res.json({ ok: true }));
api.use('/auth', auth);
api.use('/publico', publico);

// Área de la empresa (requieren sesión)
api.use('/maquinas', requiereSesion, maquinas);
api.use('/operadores', requiereSesion, operadores);
api.use('/clientes', requiereSesion, clientes);
api.use('/asignaciones', requiereSesion, asignaciones);
api.use('/movimientos', requiereSesion, movimientos);
api.use('/solicitudes', requiereSesion, solicitudes);

api.use(noEncontrado);

export default api;
