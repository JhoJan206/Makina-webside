import { Router } from 'express';
import { conConflicto } from '../middleware/errores.js';
import { campo, HttpError, validar, validarId } from '../middleware/validar.js';
import {
  cerrarAsignacion,
  crearAsignacion,
  listarAsignaciones,
} from '../models/asignaciones.js';

const router = Router();

const hoy = () => new Date().toISOString().slice(0, 10);

router.get('/', async (req, res) => {
  const filtros = validar(req.query, {
    id_maquina: campo.id(),
    id_operador: campo.id(),
  });
  res.json(await listarAsignaciones(filtros));
});

router.post('/', async (req, res) => {
  const datos = validar(req.body, {
    id_maquina: campo.id({ requerido: true }),
    id_operador: campo.id({ requerido: true }),
    fecha_ingreso: campo.fecha(),
  });
  res.status(201).json(
    await conConflicto(
      crearAsignacion({ ...datos, fecha_ingreso: datos.fecha_ingreso ?? hoy() }),
      'La máquina o el operador no existe.',
    ),
  );
});

router.patch('/:id/cerrar', async (req, res) => {
  const id = validarId(req.params.id);
  const { fecha_salida } = validar(req.body, { fecha_salida: campo.fecha() });
  const asignacion = await cerrarAsignacion(id, fecha_salida ?? hoy());
  if (!asignacion) throw new HttpError(404, 'Asignación no encontrada o ya cerrada.');
  res.json(asignacion);
});

export default router;
