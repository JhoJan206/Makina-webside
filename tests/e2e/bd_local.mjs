// Levanta un PostgreSQL LOCAL y desechable para las pruebas de Selenium, sin
// instalar Postgres ni Docker (usa el paquete embedded-postgres).
//
//   node tests/e2e/bd_local.mjs          # puerto 5544, Ctrl+C para detenerlo
//
// Cada arranque borra los datos anteriores y vuelve a cargar el esquema y el
// seed, así todas las corridas parten de los mismos datos.
// URL resultante: postgres://postgres:postgres@localhost:5544/postgres
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const puerto = Number(process.env.PUERTO_BD) || 5544;
const directorio = path.join(raiz, 'tests', 'e2e', '.bd');

fs.rmSync(directorio, { recursive: true, force: true });

const pg = new EmbeddedPostgres({
  databaseDir: directorio,
  user: 'postgres',
  password: 'postgres',
  port: puerto,
  persistent: false,
  onLog: () => {},
});

await pg.initialise();
await pg.start();

const cliente = pg.getPgClient();
await cliente.connect();
for (const archivo of ['supabase/migrations/001_esquema.sql', 'supabase/seed.sql']) {
  await cliente.query(fs.readFileSync(path.join(raiz, archivo), 'utf8'));
}
await cliente.end();

console.log(`Base de pruebas lista en postgres://postgres:postgres@localhost:${puerto}/postgres`);

async function detener() {
  await pg.stop();
  process.exit(0);
}
process.on('SIGINT', detener);
process.on('SIGTERM', detener);
