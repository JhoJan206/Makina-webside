import { query } from '../config/db.js';
import { setDinamico } from './sql.js';

const COLUMNAS =
  'id_cliente, nombre_obra, nombre_empresa, nombre_responsable, telefono, created_at, updated_at';

export async function listarClientes() {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM clientes ORDER BY id_cliente`,
  );
  return rows;
}

export async function obtenerCliente(id) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM clientes WHERE id_cliente = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function crearCliente(datos, db = { query }) {
  const { rows } = await db.query(
    `INSERT INTO clientes (nombre_obra, nombre_empresa, nombre_responsable, telefono)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS}`,
    [datos.nombre_obra, datos.nombre_empresa, datos.nombre_responsable, datos.telefono],
  );
  return rows[0];
}

export async function actualizarCliente(id, datos) {
  const { set, valores } = setDinamico(datos, 2);
  const { rows } = await query(
    `UPDATE clientes SET ${set} WHERE id_cliente = $1 RETURNING ${COLUMNAS}`,
    [id, ...valores],
  );
  return rows[0] ?? null;
}

// Busca un cliente existente por teléfono (solo dígitos) o por la combinación
// obra + empresa + responsable; si no existe, lo crea. Debe correr dentro de
// una transacción (recibe el cliente de pg).
export async function buscarOCrearCliente(db, datos) {
  const telefono = String(datos.telefono ?? '').replace(/\D/g, '');

  const { rows } = await db.query(
    `SELECT ${COLUMNAS} FROM clientes
      WHERE ($1 <> '' AND regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') = $1)
         OR (LOWER(TRIM(nombre_obra)) = LOWER($2)
             AND LOWER(TRIM(COALESCE(nombre_empresa, ''))) = LOWER($3)
             AND LOWER(TRIM(COALESCE(nombre_responsable, ''))) = LOWER($4))
      ORDER BY id_cliente
      LIMIT 1`,
    [
      telefono,
      datos.nombre_obra,
      datos.nombre_empresa ?? '',
      datos.nombre_responsable ?? '',
    ],
  );

  return rows[0] ?? crearCliente(datos, db);
}

export async function eliminarCliente(id) {
  const { rowCount } = await query('DELETE FROM clientes WHERE id_cliente = $1', [id]);
  return rowCount > 0;
}
