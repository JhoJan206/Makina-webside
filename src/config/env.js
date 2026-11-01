// Variables de entorno del backend.
// En local se leen del archivo .env (index.js lo carga); en Vercel se
// configuran en Project Settings -> Environment Variables.

try {
  process.loadEnvFile();
} catch {
  // no hay archivo .env
}

export const isProduction = process.env.NODE_ENV === 'production';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  SESSION_DAYS: Number(process.env.SESSION_DAYS) || 7,
};

export function requerirVariable(nombre) {
  const valor = env[nombre];

  if (!valor) {
    const error = new Error(`Falta la variable de entorno ${nombre}.`);
    error.status = 500;
    error.expose = false;
    throw error;
  }

  return valor;
}
