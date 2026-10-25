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
│   │   ├── login.css     # Estilos de la vista de login
│   │   ├── home.css      # Estilos del dashboard (inicio)
│   │   ├── maquinaria.css # Estilos de la vista de maquinaria
│   │   ├── maquina.css   # Estilos del detalle de máquina
│   │   ├── operadores.css # Estilos de la vista de operadores
│   │   ├── operador.css  # Estilos del detalle de operador
│   │   └── main.css      # Estilos base (React)
│   ├── img/              # Imagenes del sitio (se sirven en /img/...)
│   │   ├── maquinaria/   # Fotos del listado de maquinaria
│   │   ├── logo_fondo_amarillo.png
│   │   └── logo_fondo_negro.png
│   ├── js/               # Scripts de JavaScript para el cliente/navegador
│   │   ├── main.jsx      # Entrada de React para el login (monta en #root)
│   │   ├── home.jsx      # Entrada de React para el dashboard
│   │   ├── maquinaria.jsx # Entrada de React para maquinaria
│   │   ├── maquina.jsx   # Entrada de React para el detalle de máquina
│   │   ├── operadores.jsx # Entrada de React para operadores
│   │   ├── operador.jsx  # Entrada de React para el detalle de operador
│   │   ├── App.jsx       # Componente raíz del login
│   │   ├── components/   # Componentes reutilizables
│   │   │   ├── Icons.jsx # Iconos SVG
│   │   │   ├── Sidebar.jsx # Menu lateral del dashboard
│   │   │   ├── Topbar.jsx  # Barra superior del dashboard
│   │   │   └── Chart.jsx   # Grafico de ingresos vs egresos
│   │   ├── data/         # Datos de ejemplo compartidos
│   │   │   └── datos.js  # Filas y helpers basados en baseDatos.sql
│   │   ├── pages/        # Vistas escritas en React
│   │   │   ├── Login.jsx # Vista de login
│   │   │   ├── Home.jsx  # Vista del dashboard
│   │   │   ├── Maquinaria.jsx # Vista del listado de maquinaria
│   │   │   ├── Maquina.jsx # Vista del detalle de máquina
│   │   │   ├── Operadores.jsx # Vista del listado de operadores
│   │   │   └── Operador.jsx # Vista del detalle de operador
│   │   └── dist/         # Build generado por Vite (login.html, home.html, maquinaria.html, maquina.html, operadores.html, operador.html, assets/)
│   └── views/            # Vistas/Plantillas HTML
│       ├── login.html
│       ├── home.html
│       ├── maquinaria.html
│       ├── maquina.html
│       ├── operadores.html
│       └── operador.html
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

## Páginas

| Ruta                   | Vista                            | Área    |
| ---------------------- | -------------------------------- | ------- |
| `/` o `/login`         | Login                            | Empresa |
| `/home` o `/dashboard` | Dashboard (solo interfaz visual) | Empresa |
| `/maquinaria`          | Listado de maquinaria            | Empresa |
| `/maquinaria/:id`      | Detalle de una máquina           | Empresa |
| `/operadores`          | Listado de operadores            | Empresa |
| `/operador/:id`        | Detalle de un operador           | Empresa |
| `/solicitudes`         | Solicitudes recibidas            | Empresa |
| `/solicitud/:id`       | Detalle de una solicitud         | Empresa |
| `/solicitar`           | Formulario de solicitud          | Clientes |

## Separación de áreas

- **Empresa** (`/login` en adelante): administra maquinaria, operadores y las
  solicitudes que llegan de los clientes. No incluye botones ni enlaces para
  solicitar maquinaria.
- **Clientes** (`/solicitar`): única web pública del cliente. Solo contiene el
  formulario de solicitud y no tiene accesos al área de la empresa.
- Toda solicitud enviada desde `/solicitar` se refleja automáticamente en
  `/solicitudes` de la empresa.

### Datos de ejemplo

El proyecto no tiene una conexión activa a PostgreSQL. Las pantallas usan las
filas de ejemplo de `public/js/data/datos.js`, construidas con los mismos campos
de `baseDatos.sql` (`clientes`, `operadores`, `maquinas`, `maquina_operador`,
`ingresos` y `egresos`). Las solicitudes y los clientes nuevos se guardan en
`localStorage` (`public/js/data/solicitudes.js`).

## Puesta en marcha

### Desarrollo (sin builds)

```bash
npm install
npm run dev
```

Abre **http://localhost:3000**. Express sirve las apps de React a través de Vite
(middleware mode), con **hot reload**: cada cambio en `public/js/` o `public/css/`
se refleja al instante, sin reiniciar el servidor y sin compilar nada. El
frontend y la API comparten el mismo origen y puerto. El dashboard está en
**http://localhost:3000/home**, el listado de maquinaria en
**http://localhost:3000/maquinaria**, el detalle de cada máquina en
**http://localhost:3000/maquinaria/:id** (por ejemplo, `/maquinaria/387J`),
el listado de operadores en **http://localhost:3000/operadores** y el detalle
de cada operador en **http://localhost:3000/operador/:id** (por ejemplo,
`/operador/1`).

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
