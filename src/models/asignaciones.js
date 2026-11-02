import { query, transaccion } from '../config/db.js';
import { HttpError } from '../middleware/validar.js';

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

// Asigna un operador a una máquina. Una máquina tiene un solo operador activo
// y un operador maneja una sola máquina a la vez: si la máquina tenía otro
// operador, o el operador estaba en otra máquina, esas asignaciones se cierran
// con la fecha de inicio de la nueva.
export function crearAsignacion({ id_maquina, id_operador, fecha_ingreso }) {
  return transaccion(async (db) => {
    const { rows: abiertas } = await db.query(
      `SELECT ${COLUMNAS} FROM maquina_operador
        WHERE fecha_salida IS NULL AND (id_maquina = $1 OR id_operador = $2)
        FOR UPDATE`,
      [id_maquina, id_operador],
    );

    if (abiertas.some((a) => a.id_maquina === id_maquina && a.id_operador === id_operador)) {
      throw new HttpError(409, 'Ese operador ya está asignado a esta máquina.');
    }

    const posterior = abiertas.find((a) => a.fecha_ingreso > fecha_ingreso);
    if (posterior) {
      throw new HttpError(
        400,
        `La fecha de inicio no puede ser anterior al ${posterior.fecha_ingreso}, ` +
          'cuando empezó la asignación activa que se va a cerrar.',
      );
    }

    const { rows: cerradas } = await db.query(
      `UPDATE maquina_operador SET fecha_salida = $2
        WHERE id = ANY($1::int[])
        RETURNING ${COLUMNAS}`,
      [abiertas.map((a) => a.id), fecha_ingreso],
    );

    const { rows } = await db.query(
      `INSERT INTO maquina_operador (id_maquina, id_operador, fecha_ingreso)
       VALUES ($1, $2, $3)
       RETURNING ${COLUMNAS}`,
      [id_maquina, id_operador, fecha_ingreso],
    );

    return { asignacion: rows[0], cerradas };
  });
}

export async function cerrarAsignacion(id, fecha_salida) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM maquina_operador WHERE id = $1 AND fecha_salida IS NULL`,
    [id],
  );
  const abierta = rows[0];
  if (!abierta) return null;

  if (fecha_salida < abierta.fecha_ingreso) {
    throw new HttpError(
      400,
      `La fecha de cierre no puede ser anterior al inicio (${abierta.fecha_ingreso}).`,
    );
  }

  const { rows: cerradas } = await query(
    `UPDATE maquina_operador SET fecha_salida = $2
      WHERE id = $1 AND fecha_salida IS NULL
      RETURNING ${COLUMNAS}`,
    [id, fecha_salida],
  );
  return cerradas[0] ?? null;
}
