import { query } from '../config/db.js';
import { setDinamico } from './sql.js';

const COLUMNAS =
  'id_operador, nombre, apellido, cedula, sueldo, created_at, updated_at';

export async function listarOperadores() {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM operadores ORDER BY id_operador`,
  );
  return rows;
}

export async function obtenerOperador(id) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM operadores WHERE id_operador = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function crearOperador({ nombre, apellido, cedula, sueldo }) {
  const { rows } = await query(
    `INSERT INTO operadores (nombre, apellido, cedula, sueldo)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS}`,
    [nombre, apellido, cedula, sueldo],
  );
  return rows[0];
}

export async function actualizarOperador(id, datos) {
  const { set, valores } = setDinamico(datos, 2);
  const { rows } = await query(
    `UPDATE operadores SET ${set} WHERE id_operador = $1 RETURNING ${COLUMNAS}`,
    [id, ...valores],
  );
  return rows[0] ?? null;
}

export async function eliminarOperador(id) {
  const { rowCount } = await query('DELETE FROM operadores WHERE id_operador = $1', [id]);
  return rowCount > 0;
}
