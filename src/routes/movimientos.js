import { Router } from 'express';
import { campo, HttpError, validar, validarId } from '../middleware/validar.js';
import {
  crearEgreso,
  crearIngreso,
  eliminarMovimiento,
  listarMovimientos,
} from '../models/movimientos.js';

const router = Router();

router.get('/', async (req, res) => {
  const filtros = validar(req.query, {
    desde: campo.fecha(),
    hasta: campo.fecha(),
    id_maquina: campo.id(),
  });
  res.json(await listarMovimientos(filtros));
});

// Un movimiento es un ingreso (requiere cliente y horas) o un egreso
router.post('/', async (req, res) => {
  const { tipo } = validar(req.body, {
    tipo: campo.opcion(['ingreso', 'egreso'], { requerido: true }),
  });

  const comunes = {
    id_maquina: campo.id({ requerido: true }),
    valor: campo.numero({ requerido: true, min: 0 }),
    descripcion: campo.texto({ max: 500 }),
    fecha: campo.fecha({ requerido: true }),
  };

  if (tipo === 'egreso') {
    const datos = validar(req.body, comunes);
    return res.status(201).json({ tipo, ...(await crearEgreso(datos)) });
  }

  const datos = validar(req.body, {
    ...comunes,
    id_cliente: campo.id({ requerido: true }),
    horas: campo.positivo({ requerido: true }),
  });
  res.status(201).json({ tipo, ...(await crearIngreso(datos)) });
});

router.delete('/:tipo/:id', async (req, res) => {
  const { tipo } = validar(req.params, {
    tipo: campo.opcion(['ingreso', 'egreso'], { requerido: true }),
  });
  const eliminado = await eliminarMovimiento(tipo, validarId(req.params.id));
  if (!eliminado) throw new HttpError(404, 'Movimiento no encontrado.');
  res.status(204).end();
});

export default router;
