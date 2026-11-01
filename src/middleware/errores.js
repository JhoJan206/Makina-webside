import { isProduction } from '../config/env.js';

// Errores de Postgres más comunes -> respuesta HTTP entendible
const ERRORES_PG = {
  23505: [409, 'Ya existe un registro con esos datos.'],
  23503: [409, 'El registro está relacionado con otros datos o hace referencia a uno que no existe.'],
  23514: [400, 'Algún valor no cumple las reglas de la base de datos.'],
  23502: [400, 'Falta un campo obligatorio.'],
  '22P02': [400, 'Algún valor tiene un formato inválido.'],
};

export function noEncontrado(req, res) {
  res.status(404).json({ error: 'Ruta de la API no encontrada.' });
}

// eslint-disable-next-line no-unused-vars
export function manejarErrores(error, req, res, next) {
  const pg = ERRORES_PG[error.code];

  if (pg) {
    const [status, mensaje] = pg;
    return res.status(status).json({
      error: mensaje,
      ...(isProduction ? {} : { detalle: error.detail ?? error.message }),
    });
  }

  // JSON mal formado en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.' });
  }

  const status = error.status ?? error.statusCode ?? 500;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error:
      error.expose || status < 500
        ? error.message
        : 'Error interno del servidor.',
    ...(error.detalles ? { detalles: error.detalles } : {}),
  });
}

// Traduce el error de llave foránea de un DELETE a un mensaje propio
export async function conConflicto(promesa, mensaje) {
  try {
    return await promesa;
  } catch (error) {
    if (error.code === '23503') {
      const conflicto = new Error(mensaje);
      conflicto.status = 409;
      conflicto.expose = true;
      throw conflicto;
    }

    throw error;
  }
}
