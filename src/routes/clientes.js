import { Router } from 'express';
import { conConflicto } from '../middleware/errores.js';
import { campo, HttpError, validar, validarId } from '../middleware/validar.js';
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  listarClientes,
  obtenerCliente,
} from '../models/clientes.js';

const router = Router();

export const esquemaCliente = {
  nombre_obra: campo.texto({ requerido: true, max: 150 }),
  nombre_empresa: campo.texto({ max: 150 }),
  nombre_responsable: campo.texto({ max: 100 }),
  telefono: campo.texto({ max: 20 }),
};

router.get('/', async (req, res) => {
  res.json(await listarClientes());
});

router.get('/:id', async (req, res) => {
  const cliente = await obtenerCliente(validarId(req.params.id));
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado.');
  res.json(cliente);
});

router.post('/', async (req, res) => {
  const datos = validar(req.body, esquemaCliente);
  res.status(201).json(await crearCliente(datos));
});

router.put('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  const datos = validar(req.body, esquemaCliente, { parcial: true });
  const cliente = await actualizarCliente(id, datos);
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado.');
  res.json(cliente);
});

router.delete('/:id', async (req, res) => {
  const eliminado = await conConflicto(
    eliminarCliente(validarId(req.params.id)),
    'No se puede eliminar el cliente porque tiene ingresos o solicitudes registradas.',
  );
  if (!eliminado) throw new HttpError(404, 'Cliente no encontrado.');
  res.status(204).end();
});

export default router;
