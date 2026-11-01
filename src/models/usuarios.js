import { query } from '../config/db.js';

const COLUMNAS = 'id_usuario, usuario, correo, nombre, created_at, updated_at';

export async function buscarPorIdentificador(identificador) {
  const { rows } = await query(
    `SELECT ${COLUMNAS}, password_hash
       FROM usuarios
      WHERE LOWER(usuario) = LOWER($1) OR LOWER(correo) = LOWER($1)
      LIMIT 1`,
    [identificador],
  );

  return rows[0] ?? null;
}

export async function obtenerUsuario(id) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM usuarios WHERE id_usuario = $1`,
    [id],
  );

  return rows[0] ?? null;
}

export async function crearUsuario({ usuario, correo, nombre, password_hash }) {
  const { rows } = await query(
    `INSERT INTO usuarios (usuario, correo, nombre, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS}`,
    [usuario, correo, nombre, password_hash],
  );

  return rows[0];
}
