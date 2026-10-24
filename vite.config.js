import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    // En desarrollo la raíz es public/ para que /js y /css se sirvan tal cual.
    // En build la raíz es public/views (los HTML de entrada).
    root: isDev ? 'public' : 'public/views',
    publicDir: false,
    plugins: [react()],

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
            ]
          : [
              'login.html',
              'home.html',
              'maquinaria.html',
              'maquina.html',
              'operadores.html',
              'operador.html',
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
