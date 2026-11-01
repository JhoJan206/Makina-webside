import { Router } from 'express';
import { campo, HttpError, validar, validarId } from '../middleware/validar.js';
import {
  actualizarEstadoSolicitud,
  ESTADOS,
  listarSolicitudes,
  obtenerSolicitud,
} from '../models/solicitudes.js';

const router = Router();

router.get('/', async (req, res) => {
  const filtros = validar(req.query, { estado: campo.opcion(ESTADOS) });
  res.json(await listarSolicitudes(filtros));
});

router.get('/:id', async (req, res) => {
  const solicitud = await obtenerSolicitud(validarId(req.params.id));
  if (!solicitud) throw new HttpError(404, 'Solicitud no encontrada.');
  res.json(solicitud);
});

router.patch('/:id/estado', async (req, res) => {
  const id = validarId(req.params.id);
  const { estado } = validar(req.body, {
    estado: campo.opcion(ESTADOS, { requerido: true }),
  });
  const solicitud = await actualizarEstadoSolicitud(id, estado);
  if (!solicitud) throw new HttpError(404, 'Solicitud no encontrada.');
  res.json(solicitud);
});

export default router;
