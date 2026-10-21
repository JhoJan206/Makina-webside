import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carga el .env (si existe) sin dependencias externas
try {
  process.loadEnvFile();
} catch {
  // no hay archivo .env
}

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.argv.includes('--dev');

const PUBLIC_DIR = path.join(__dirname, 'public');
const DIST_DIR = path.join(PUBLIC_DIR, 'js', 'dist');

// Cuerpo de las peticiones (JSON / formularios)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

if (isDev) {
  // Desarrollo: React se sirve con Vite en modo middleware (hot reload, sin build)
  const { createServer } = await import('vite');

  const vite = await createServer({
    server: {
      middlewareMode: { server },
      ws: { server },
      port: PORT,
      open: false,
    },
    appType: 'spa',
  });

  // "/" -> vista de login
  app.use((req, res, next) => {
    if (req.url === '/') req.url = '/views/login.html';
    next();
  });

  app.use(vite.middlewares);
} else {
  // Producción: se sirve el build de React (public/js/dist)
  app.use(express.static(DIST_DIR));
  app.use(express.static(PUBLIC_DIR));

  app.get('/', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'login.html'), (err) => {
      if (err) {
        res.status(404).send('Ejecuta "npm run build" para generar el frontend.');
      }
    });
  });
}

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
