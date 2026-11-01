import pg from 'pg';
import { requerirVariable } from './env.js';

// NUMERIC -> number (los montos de la app caben de sobra en un double)
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (valor) =>
  valor === null ? null : Number(valor),
);
// DATE -> 'YYYY-MM-DD' tal cual, sin convertir a Date (evita corrimientos por zona horaria)
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

let pool = null;

// El pool se crea al primer uso para que la app arranque aunque no haya BD
// (por ejemplo, para /api/health). En Vercel cada instancia de la función
// reutiliza su pool entre peticiones.
function obtenerPool() {
  if (pool) return pool;

  const connectionString = requerirVariable('DATABASE_URL');
  const esLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

  pool = new pg.Pool({
    connectionString,
    // Supabase exige SSL; el pooler usa un certificado propio
    ssl: esLocal ? false : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX) || 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (error) => {
    console.error('Error inesperado en el pool de Postgres:', error.message);
  });

  return pool;
}

export function query(texto, valores) {
  return obtenerPool().query(texto, valores);
}

export async function transaccion(fn) {
  const cliente = await obtenerPool().connect();

  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
}

export async function cerrarPool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}
