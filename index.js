import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './src/app.js';
import { VISTAS, vistaDeRuta } from './src/config/vistas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const isDev = process.argv.includes('--dev');

const PUBLIC_DIR = path.join(__dirname, 'public');
const DIST_DIR = path.join(PUBLIC_DIR, 'js', 'dist');

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
    const vista = vistaDeRuta(req.url.split('?')[0]);
    if (vista) req.url = `/views/${vista}`;

    next();
  });

  app.use(vite.middlewares);
} else {
  // Producción: se sirve el build de React (public/js/dist)
  app.use(express.static(DIST_DIR, { index: false }));
  app.use(express.static(PUBLIC_DIR, { index: false }));

  const enviarVista = (archivo, res) => {
    res.sendFile(path.join(DIST_DIR, archivo), (err) => {
      if (err) {
        res.status(404).send('Ejecuta "npm run build" para generar el frontend.');
      }
    });
  };

  for (const { rutas, vista } of VISTAS) {
    app.get(rutas, (req, res) => enviarVista(vista, res));
  }
}

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
