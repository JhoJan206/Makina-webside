import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    // En desarrollo la raíz es public/ para que /js y /css se sirvan tal cual.
    // En build la raíz es public/views (el HTML de entrada).
    root: isDev ? 'public' : 'public/views',
    publicDir: false,
    plugins: [react()],

    build: {
      outDir: isDev ? 'js/dist' : '../js/dist',
      emptyOutDir: true,
      rollupOptions: {
        input: isDev ? 'views/login.html' : 'login.html',
        output: {
          entryFileNames: 'app.js',
          assetFileNames: 'app.[ext]',
        },
      },
    },

    server: {
      port: 5173,
      open: '/views/index.html',
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  };
});
