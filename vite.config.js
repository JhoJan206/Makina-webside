import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En el build copia public/img a dist/img: en Vercel solo se publica la carpeta
// del build, y las vistas usan rutas absolutas como /img/logo_fondo_negro.png.
function copiarImagenes() {
  let outDir;

  return {
    name: 'makina-copiar-imagenes',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      fs.cpSync(path.resolve('public/img'), path.join(outDir, 'img'), {
        recursive: true,
      });
    },
  };
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    // En desarrollo la raíz es public/ para que /js y /css se sirvan tal cual.
    // En build la raíz es public/views (los HTML de entrada).
    root: isDev ? 'public' : 'public/views',
    publicDir: false,
    plugins: [react(), copiarImagenes()],

    build: {
      outDir: isDev ? 'js/dist' : '../js/dist',
      emptyOutDir: true,
      rollupOptions: {
        input: isDev
          ? [
              'views/login.html',
              'views/home.html',
              'views/maquinaria.html',
              'views/maquina.html',
              'views/operadores.html',
              'views/operador.html',
              'views/solicitar.html',
              'views/solicitudes.html',
              'views/solicitud.html',
              'views/movimientos.html',
              'views/asignaciones.html',
              'views/admin-maquinas.html',
              'views/admin-operadores.html',
              'views/admin-clientes.html',
            ]
          : [
              'login.html',
              'home.html',
              'maquinaria.html',
              'maquina.html',
              'operadores.html',
              'operador.html',
              'solicitar.html',
              'solicitudes.html',
              'solicitud.html',
              'movimientos.html',
              'asignaciones.html',
              'admin-maquinas.html',
              'admin-operadores.html',
              'admin-clientes.html',
            ],
      },
    },

    server: {
      port: 5173,
      open: false,
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  };
});
