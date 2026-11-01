import { query } from '../config/db.js';

const COLUMNAS_INGRESO =
  'id_ingreso, id_maquina, id_cliente, horas, valor_ingreso, descripcion, fecha, created_at, updated_at';
const COLUMNAS_EGRESO =
  'id_egreso, id_maquina, valor_egreso, descripcion, fecha, created_at, updated_at';

const FILTROS = `($1::date IS NULL OR fecha >= $1)
             AND ($2::date IS NULL OR fecha <= $2)
             AND ($3::int IS NULL OR id_maquina = $3)`;

export async function listarMovimientos({ desde, hasta, id_maquina } = {}) {
  const valores = [desde ?? null, hasta ?? null, id_maquina ?? null];

  const [ingresos, egresos] = await Promise.all([
    query(
      `SELECT ${COLUMNAS_INGRESO} FROM ingresos WHERE ${FILTROS}
        ORDER BY fecha DESC, id_ingreso DESC`,
      valores,
    ),
    query(
      `SELECT ${COLUMNAS_EGRESO} FROM egresos WHERE ${FILTROS}
        ORDER BY fecha DESC, id_egreso DESC`,
      valores,
    ),
  ]);

  return { ingresos: ingresos.rows, egresos: egresos.rows };
}

export async function crearIngreso({ id_maquina, id_cliente, horas, valor, descripcion, fecha }) {
  const { rows } = await query(
    `INSERT INTO ingresos (id_maquina, id_cliente, horas, valor_ingreso, descripcion, fecha)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNAS_INGRESO}`,
    [id_maquina, id_cliente, horas, valor, descripcion, fecha],
  );
  return rows[0];
}

export async function crearEgreso({ id_maquina, valor, descripcion, fecha }) {
  const { rows } = await query(
    `INSERT INTO egresos (id_maquina, valor_egreso, descripcion, fecha)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS_EGRESO}`,
    [id_maquina, valor, descripcion, fecha],
  );
  return rows[0];
}

export async function eliminarMovimiento(tipo, id) {
  const sql =
    tipo === 'egreso'
      ? 'DELETE FROM egresos WHERE id_egreso = $1'
      : 'DELETE FROM ingresos WHERE id_ingreso = $1';

  const { rowCount } = await query(sql, [id]);
  return rowCount > 0;
}
