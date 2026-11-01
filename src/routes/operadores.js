import { Router } from 'express';
import { campo, HttpError, validar, validarId } from '../middleware/validar.js';
import {
  actualizarOperador,
  crearOperador,
  eliminarOperador,
  listarOperadores,
  obtenerOperador,
} from '../models/operadores.js';

const router = Router();

const esquema = {
  nombre: campo.texto({ requerido: true, max: 100 }),
  apellido: campo.texto({ requerido: true, max: 100 }),
  cedula: campo.texto({ requerido: true, max: 20 }),
  sueldo: campo.numero({ min: 0 }),
};

router.get('/', async (req, res) => {
  res.json(await listarOperadores());
});

router.get('/:id', async (req, res) => {
  const operador = await obtenerOperador(validarId(req.params.id));
  if (!operador) throw new HttpError(404, 'Operador no encontrado.');
  res.json(operador);
});

router.post('/', async (req, res) => {
  const datos = validar(req.body, esquema);
  res.status(201).json(await crearOperador(datos));
});

router.put('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const datos = validar(req.body, esquema, { parcial: true });
  const operador = await actualizarOperador(id, datos);
  if (!operador) throw new HttpError(404, 'Operador no encontrado.');
  res.json(operador);
});

router.delete('/:id', async (req, res) => {
  const eliminado = await eliminarOperador(validarId(req.params.id));
  if (!eliminado) throw new HttpError(404, 'Operador no encontrado.');
  res.status(204).end();
});

export default router;
