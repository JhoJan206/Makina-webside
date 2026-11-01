// Rutas sin sesión: las usa la web de clientes (/solicitar).
import { Router } from 'express';
import { campo, HttpError, validar } from '../middleware/validar.js';
import { tarifasPorTipo } from '../models/maquinas.js';
import { crearSolicitud } from '../models/solicitudes.js';
import { esquemaCliente } from './clientes.js';

const router = Router();

router.get('/tarifas', async (req, res) => {
  const tarifas = await tarifasPorTipo();
  const equipos = tarifas.reduce((total, t) => total + t.equipos, 0);
  const promedio = equipos
    ? Math.round(tarifas.reduce((total, t) => total + t.valor_hora * t.equipos, 0) / equipos)
    : 0;

  res.json({ tarifas, promedio });
});

router.post('/solicitudes', async (req, res) => {
  // Campo trampa: los humanos no lo ven, los bots suelen llenarlo
  if (req.body?.sitio_web) {
    throw new HttpError(400, 'No se pudo enviar la solicitud.');
  }

  const datos = validar(req.body, {
    ...esquemaCliente,
    telefono: campo.texto({ requerido: true, max: 20 }),
    tipo_maquina: campo.opcion(['Pajarita', 'Bulldozer'], { requerido: true }),
    fecha_requerida: campo.fecha({ requerido: true }),
    horas_estimadas: campo.positivo({ requerido: true }),
    descripcion: campo.texto({ max: 2000 }),
  });

  if (datos.horas_estimadas > 10000) {
    throw new HttpError(400, 'La cantidad de horas no es válida.');
  }

  res.status(201).json(await crearSolicitud(datos));
});

export default router;
