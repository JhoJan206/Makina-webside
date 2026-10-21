# Makina

Sitio web con **Node.js + Express** (backend) y **React** (frontend), con Vite como bundler.

## Estructura

```
makina-webside/
│
├── node_modules/         # Dependencias instaladas
│
├── public/               # Archivos estáticos accesibles por el navegador
│   ├── css/              # Hojas de estilo (.css)
│   ├── js/               # Scripts de JavaScript para el cliente/navegador
│   │   ├── main.jsx      # Punto de entrada de React
│   │   └── dist/         # Build generado por Vite (app.js, app.css, index.html)
│   └── views/            # Vistas/Plantillas HTML
│       └── index.html
│
├── src/                  # Código fuente del servidor (Backend)
│   ├── config/           # Configuración de base de datos o variables
│   ├── middleware/       # Funciones intermedias (auth, validaciones)
│   ├── models/           # Definición de tablas o esquemas de datos
│   └── routes/           # Rutas y endpoints del servidor
│
├── .env                  # Variables de entorno privadas
├── .gitignore            # Archivos ignorados por Git
├── index.js              # Punto de entrada principal de la aplicación
├── package-lock.json
├── package.json          # Configuración del proyecto y scripts
├── README.md             # Documentación del proyecto
└── vite.config.js        # Configuración del bundler de React
```

## Dependencias

- `express` — servidor web
- `react`, `react-dom` — interfaz de usuario
- `vite`, `@vitejs/plugin-react` — desarrollo (devDependencies)

## Scripts

| Comando           | Descripción                                                |
| ----------------- | ---------------------------------------------------------- |
| `npm run dev`     | **Desarrollo**: Express + React con hot reload en `:3000`  |
| `npm start`       | Producción: sirve el build de `public/js/dist` en `:3000`   |
| `npm run build`   | Compila React a `public/js/dist/`                          |
| `npm run dev:web` | Solo el frontend con Vite (`:5173`), sin backend           |

## Puesta en marcha

### Desarrollo (sin builds)

```bash
npm install
npm run dev
```

Abre **http://localhost:3000**. Express sirve la app de React a través de Vite
(middleware mode), con **hot reload**: cada cambio en `public/js/main.jsx` o
`public/css/main.css` se refleja al instante, sin reiniciar el servidor y sin
compilar nada. El frontend y la API comparten el mismo origen y puerto.

El servidor se reinicia solo (`node --watch`) cuando cambian `index.js` o los
archivos de `src/`.

### Producción

```bash
npm run build
npm start
```

## Variables de entorno

Las variables se definen en `.env` (ignorado por Git).

| Variable | Descripción                    | Por defecto |
| -------- | ------------------------------ | ----------- |
| `PORT`   | Puerto del servidor Express   | `3000`      |
| `DB_*`   | Datos de conexión (opcional)   | —           |
