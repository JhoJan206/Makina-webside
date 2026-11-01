import { query } from '../config/db.js';
import { setDinamico } from './sql.js';

const COLUMNAS =
  'id_maquina, tipo, placa, valor_hora, imagen, imagen_alt, created_at, updated_at';

export async function listarMaquinas() {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM maquinas ORDER BY id_maquina`,
  );
  return rows;
}

// Acepta el id numérico o la placa (las URLs del frontend usan la placa)
export async function obtenerMaquina(idOPlaca) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM maquinas
      WHERE id_maquina::text = $1 OR LOWER(placa) = LOWER($1)
      LIMIT 1`,
    [String(idOPlaca)],
  );
  return rows[0] ?? null;
}

export async function crearMaquina({ tipo, placa, valor_hora, imagen, imagen_alt }) {
  const { rows } = await query(
    `INSERT INTO maquinas (tipo, placa, valor_hora, imagen, imagen_alt)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNAS}`,
    [tipo, placa, valor_hora, imagen, imagen_alt],
  );
  return rows[0];
}

export async function actualizarMaquina(id, datos) {
  const { set, valores } = setDinamico(datos, 2);
  const { rows } = await query(
    `UPDATE maquinas SET ${set} WHERE id_maquina = $1 RETURNING ${COLUMNAS}`,
    [id, ...valores],
  );
  return rows[0] ?? null;
}

export async function eliminarMaquina(id) {
  const { rowCount } = await query('DELETE FROM maquinas WHERE id_maquina = $1', [id]);
  return rowCount > 0;
}

// Valor/hora promedio por tipo, para el formulario público de solicitudes
export async function tarifasPorTipo() {
  const { rows } = await query(
    `SELECT tipo, ROUND(AVG(valor_hora))::numeric AS valor_hora, COUNT(*)::int AS equipos
       FROM maquinas
      GROUP BY tipo
      ORDER BY tipo`,
  );
  return rows;
}
