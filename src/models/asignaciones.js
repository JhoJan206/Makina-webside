import { query, transaccion } from '../config/db.js';

const COLUMNAS =
  'id, id_maquina, id_operador, fecha_ingreso, fecha_salida, created_at, updated_at';

export async function listarAsignaciones({ id_maquina, id_operador } = {}) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM maquina_operador
      WHERE ($1::int IS NULL OR id_maquina = $1)
        AND ($2::int IS NULL OR id_operador = $2)
      ORDER BY (fecha_salida IS NULL) DESC, fecha_ingreso DESC, id DESC`,
    [id_maquina ?? null, id_operador ?? null],
  );
  return rows;
}

// Asigna un operador a una máquina. Si la máquina ya tenía un operador
// activo, esa asignación se cierra con la fecha de ingreso del nuevo.
export function crearAsignacion({ id_maquina, id_operador, fecha_ingreso }) {
  return transaccion(async (db) => {
    const cerradas = await db.query(
      `UPDATE maquina_operador
          SET fecha_salida = GREATEST($2::date, fecha_ingreso)
        WHERE id_maquina = $1 AND fecha_salida IS NULL
        RETURNING ${COLUMNAS}`,
      [id_maquina, fecha_ingreso],
    );

    const { rows } = await db.query(
      `INSERT INTO maquina_operador (id_maquina, id_operador, fecha_ingreso)
       VALUES ($1, $2, $3)
       RETURNING ${COLUMNAS}`,
      [id_maquina, id_operador, fecha_ingreso],
    );

    return { asignacion: rows[0], cerradas: cerradas.rows };
  });
}

export async function cerrarAsignacion(id, fecha_salida) {
  const { rows } = await query(
    `UPDATE maquina_operador SET fecha_salida = $2
      WHERE id = $1 AND fecha_salida IS NULL
      RETURNING ${COLUMNAS}`,
    [id, fecha_salida],
  );
  return rows[0] ?? null;
}
