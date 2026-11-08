import { Router } from 'express';
import { conConflicto } from '../middleware/errores.js';
import { campo, HttpError, validar } from '../middleware/validar.js';
import {
  actualizarMaquina,
  crearMaquina,
  eliminarMaquina,
  listarMaquinas,
  obtenerMaquina,
} from '../models/maquinas.js';

const router = Router();

// Valores del ENUM tipo_maquina (ver supabase/migrations/002_tipos_maquina_nuevos.sql)
export const TIPOS_MAQUINA = ['Pajarita', 'Bulldozer', 'Excavadora', 'Motoniveladora'];

const esquema = {
  tipo: campo.opcion(TIPOS_MAQUINA, { requerido: true }),
  placa: campo.texto({ requerido: true, max: 20 }),
  valor_hora: campo.numero({ requerido: true, min: 0 }),
  imagen: campo.texto({ max: 500 }),
  imagen_alt: campo.texto({ max: 300 }),
};

async function buscar(idOPlaca) {
  const maquina = await obtenerMaquina(idOPlaca);
  if (!maquina) throw new HttpError(404, 'Máquina no encontrada.');
  return maquina;
}

router.get('/', async (req, res) => {
  res.json(await listarMaquinas());
});

router.get('/:id', async (req, res) => {
  res.json(await buscar(req.params.id));
});

router.post('/', async (req, res) => {
  const datos = validar(req.body, esquema);
  res.status(201).json(await crearMaquina(datos));
});

router.put('/:id', async (req, res) => {
  const { id_maquina } = await buscar(req.params.id);
  const datos = validar(req.body, esquema, { parcial: true });
  res.json(await actualizarMaquina(id_maquina, datos));
});

router.delete('/:id', async (req, res) => {
  const { id_maquina } = await buscar(req.params.id);
  await conConflicto(
    eliminarMaquina(id_maquina),
    'No se puede eliminar la máquina porque tiene ingresos o egresos registrados.',
  );
  res.status(204).end();
});

export default router;
