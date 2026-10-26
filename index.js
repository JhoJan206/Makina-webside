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

  // Rutas amigables -> vistas HTML
  app.use((req, res, next) => {
    const ruta = req.url.split('?')[0];

    if (ruta === '/' || ruta === '/login') {
      req.url = '/views/login.html';
    } else if (ruta === '/home' || ruta === '/dashboard') {
      req.url = '/views/home.html';
    } else if (ruta === '/maquinaria') {
      req.url = '/views/maquinaria.html';
    } else if (ruta.startsWith('/maquinaria/')) {
      req.url = '/views/maquina.html';
    } else if (ruta === '/operadores') {
      req.url = '/views/operadores.html';
    } else if (ruta.startsWith('/operador/')) {
      req.url = '/views/operador.html';
    } else if (ruta === '/solicitar') {
      req.url = '/views/solicitar.html';
    } else if (ruta === '/solicitudes') {
      req.url = '/views/solicitudes.html';
    } else if (ruta.startsWith('/solicitud/')) {
      req.url = '/views/solicitud.html';
    } else if (ruta === '/movimientos') {
      req.url = '/views/movimientos.html';
    }

    next();
  });

  app.use(vite.middlewares);
} else {
  // Producción: se sirve el build de React (public/js/dist)
  app.use(express.static(DIST_DIR));
  app.use(express.static(PUBLIC_DIR));

  const enviarVista = (archivo, res) => {
    res.sendFile(path.join(DIST_DIR, archivo), (err) => {
      if (err) {
        res.status(404).send('Ejecuta "npm run build" para generar el frontend.');
      }
    });
  };

  app.get(['/', '/login'], (req, res) => enviarVista('login.html', res));
  app.get(['/home', '/dashboard'], (req, res) => enviarVista('home.html', res));
  app.get(['/maquinaria'], (req, res) => enviarVista('maquinaria.html', res));
  app.get(['/maquinaria/:id'], (req, res) => enviarVista('maquina.html', res));
  app.get(['/operadores'], (req, res) => enviarVista('operadores.html', res));
  app.get(['/operador/:id'], (req, res) => enviarVista('operador.html', res));
  app.get(['/solicitar'], (req, res) => enviarVista('solicitar.html', res));
  app.get(['/solicitudes'], (req, res) => enviarVista('solicitudes.html', res));
  app.get(['/solicitud/:id'], (req, res) => enviarVista('solicitud.html', res));
  app.get(['/movimientos'], (req, res) => enviarVista('movimientos.html', res));
}

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
