import { query, transaccion } from '../config/db.js';
import { buscarOCrearCliente } from './clientes.js';

export const ESTADOS = [
  'Pendiente',
  'Contactado',
  'Aprobada',
  'Rechazada',
  'Completada',
];

// Cada solicitud viaja con su cliente anidado, como la usa el frontend
const SELECT_SOLICITUD = `
  SELECT s.id_solicitud, s.id_cliente, s.tipo_maquina, s.fecha_requerida,
         s.horas_estimadas, s.descripcion, s.estado, s.created_at, s.updated_at,
         json_build_object(
           'id_cliente', c.id_cliente,
           'nombre_obra', c.nombre_obra,
           'nombre_empresa', c.nombre_empresa,
           'nombre_responsable', c.nombre_responsable,
           'telefono', c.telefono
         ) AS cliente
    FROM solicitudes s
    JOIN clientes c ON c.id_cliente = s.id_cliente`;

export async function listarSolicitudes({ estado } = {}) {
  const { rows } = await query(
    `${SELECT_SOLICITUD}
      WHERE ($1::estado_solicitud IS NULL OR s.estado = $1)
      ORDER BY s.created_at DESC, s.id_solicitud DESC`,
    [estado ?? null],
  );
  return rows;
}

export async function obtenerSolicitud(id, db = { query }) {
  const { rows } = await db.query(
    `${SELECT_SOLICITUD} WHERE s.id_solicitud = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export function crearSolicitud(datos) {
  return transaccion(async (db) => {
    const cliente = await buscarOCrearCliente(db, datos);

    const { rows } = await db.query(
      `INSERT INTO solicitudes (id_cliente, tipo_maquina, fecha_requerida, horas_estimadas, descripcion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_solicitud`,
      [
        cliente.id_cliente,
        datos.tipo_maquina,
        datos.fecha_requerida,
        datos.horas_estimadas,
        datos.descripcion,
      ],
    );

    return obtenerSolicitud(rows[0].id_solicitud, db);
  });
}

export async function actualizarEstadoSolicitud(id, estado) {
  const { rowCount } = await query(
    'UPDATE solicitudes SET estado = $2 WHERE id_solicitud = $1',
    [id, estado],
  );
  return rowCount > 0 ? obtenerSolicitud(id) : null;
}
