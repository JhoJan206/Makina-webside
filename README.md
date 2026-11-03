# Makina

Sitio web con **Node.js + Express** (backend / API), **React** (frontend, con
Vite como bundler) y **PostgreSQL en Supabase** como base de datos. Preparado
para desplegarse en **Vercel**.

## Estructura

```
makina-webside/
│
├── api/
│   └── index.js          # Entrada de Vercel Functions (exporta la app de Express)
│
├── public/               # Frontend (lo compila Vite)
│   ├── css/              # Hojas de estilo (.css) de cada vista
│   ├── img/              # Imagenes del sitio (se sirven en /img/...)
│   ├── js/
│   │   ├── *.jsx         # Entradas de cada vista (cargan datos y montan React)
│   │   ├── api/
│   │   │   └── cliente.js  # fetch a /api con la cookie de sesión
│   │   ├── components/   # Componentes reutilizables (Sidebar, Topbar, Chart, Dialogo,
│   │   │                 #   AdminCrud = useCrud/TablaCrud, DialogosAsignacion...)
│   │   ├── data/
│   │   │   ├── cargar.jsx      # Carga los datos de la API antes de montar la vista
│   │   │   ├── datos.js        # Caché de máquinas, operadores, clientes, movimientos + helpers
│   │   │   ├── gestion.js      # Campos y reglas del CRUD de máquinas, operadores y clientes
│   │   │   ├── asignaciones.js # Operador ↔ máquina (asignar / cerrar vía API)
│   │   │   ├── solicitudes.js  # Solicitudes (crear / cambiar estado vía API)
│   │   │   └── movimientos.js  # Ingresos y egresos (registrar / eliminar vía API)
│   │   ├── pages/        # Vistas escritas en React
│   │   └── dist/         # Build generado por Vite (ignorado por Git)
│   └── views/            # HTML de entrada de cada vista
│
├── scripts/
│   └── crear-usuario.js  # Crea usuarios de la empresa para el login
│
├── src/                  # Backend
│   ├── app.js            # App de Express (sin listen), compartida por local y Vercel
│   ├── config/           # Variables de entorno, conexión a Postgres, rutas de vistas
│   ├── middleware/       # Sesión (JWT), validación y manejo de errores
│   ├── models/           # Consultas SQL por entidad
│   └── routes/           # Endpoints de la API
│
├── supabase/
│   ├── migrations/001_esquema.sql  # Esquema de la base de datos
│   └── seed.sql                    # Datos de ejemplo (opcional)
│
├── .env.example          # Plantilla de variables de entorno
├── baseDatos.sql         # Copia del esquema (igual a supabase/migrations/001_esquema.sql)
├── index.js              # Servidor local: Express + Vite (dev) o build (producción)
├── vercel.json           # Configuración de despliegue en Vercel
└── vite.config.js        # Configuración del bundler de React
```

## Dependencias

- `express`, `cookie-parser` — servidor web y API
- `pg` — conexión a PostgreSQL (Supabase)
- `bcryptjs`, `jsonwebtoken` — contraseñas cifradas y sesión
- `react`, `react-dom` — interfaz de usuario
- `vite`, `@vitejs/plugin-react` — desarrollo y build (devDependencies)

## Scripts

| Comando                 | Descripción                                                |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | **Desarrollo**: Express + API + React con hot reload en `:3000` |
| `npm start`             | Producción local: sirve el build y la API en `:3000`       |
| `npm run build`         | Compila React a `public/js/dist/` (incluye `img/`)         |
| `npm run dev:web`       | Solo el frontend con Vite (`:5173`), con proxy de `/api` a `:3000` |
| `npm run crear-usuario` | Crea un usuario para iniciar sesión (ver abajo)            |

## Páginas

| Ruta                   | Vista                            | Área    |
| ---------------------- | -------------------------------- | ------- |
| `/` o `/login`         | Login                            | Empresa |
| `/home` o `/dashboard` | Dashboard                        | Empresa |
| `/maquinaria`          | Flota: listado + crear, editar y eliminar máquinas | Empresa |
| `/maquinaria/:id`      | Detalle de una máquina (id o placa): asignar / cambiar / cerrar operador | Empresa |
| `/operadores`          | Equipo: listado + crear, editar y eliminar operadores | Empresa |
| `/operador/:id`        | Detalle de un operador: asignar / cambiar / cerrar máquina | Empresa |
| `/clientes`            | Clientes: crear, editar y eliminar, con sus solicitudes e ingresos | Empresa |
| `/solicitudes`         | Solicitudes recibidas            | Empresa |
| `/solicitud/:id`       | Detalle de una solicitud         | Empresa |
| `/movimientos`         | Registro de ingresos y egresos (y eliminarlos) | Empresa |
| `/solicitar`           | Formulario de solicitud          | Clientes |

Rutas antiguas que redirigen (301/308): `/admin` y `/admin/maquinas` → `/maquinaria`,
`/admin/operadores` → `/operadores`, `/admin/clientes` → `/clientes`,
`/asignaciones` → `/maquinaria`. Están en `REDIRECCIONES` de `src/config/vistas.js`
(servidor local) y en `redirects` de `vercel.json`.

## Separación de áreas

- **Empresa** (`/login` en adelante): requiere sesión. Administra maquinaria,
  operadores, movimientos y las solicitudes que llegan de los clientes. Si no hay
  sesión, cualquier vista redirige a `/login`.
- **Gestión**: cualquier persona que haya iniciado sesión puede crear, editar y
  eliminar máquinas, operadores y clientes desde sus propias páginas (botón
  "Nuevo…" y botones de editar / eliminar en cada tarjeta o fila; el formulario
  se abre en un diálogo). Las asignaciones operador ↔ máquina se hacen desde el
  detalle de la máquina o del operador.
- **Clientes** (`/solicitar`): pública. Solo contiene el formulario de solicitud;
  usa los endpoints `/api/publico/*` y no tiene acceso a datos de la empresa.
- Toda solicitud enviada desde `/solicitar` se guarda en la base de datos y
  aparece en `/solicitudes`.

## Backend y API

Todas las rutas están bajo `/api` y responden JSON. Los errores tienen la forma
`{ "error": "mensaje" }` (y `detalles` por campo cuando es un error de validación).

| Método y ruta                                   | Acceso  | Descripción |
| ----------------------------------------------- | ------- | ----------- |
| `GET /api/health`                               | Público | Estado del servidor |
| `POST /api/auth/login`                          | Público | `{ identificador, contrasena }` (usuario **o** correo) |
| `POST /api/auth/logout`                         | Público | Cierra la sesión |
| `GET /api/auth/me`                              | Sesión  | Usuario actual |
| `GET /api/publico/tarifas`                      | Público | Valor/hora promedio por tipo de máquina |
| `POST /api/publico/solicitudes`                 | Público | Crea una solicitud (reutiliza o crea el cliente) |
| `GET /api/maquinas`, `GET /api/maquinas/:id`    | Sesión  | `:id` numérico o placa |
| `POST /api/maquinas`, `PUT, DELETE /api/maquinas/:id` | Sesión | No se puede eliminar si tiene ingresos/egresos (409); su historial de asignaciones se borra |
| `GET /api/operadores`, `GET /api/operadores/:id` | Sesión | |
| `POST /api/operadores`, `PUT, DELETE /api/operadores/:id` | Sesión | Al eliminar se borra su historial de asignaciones |
| `GET /api/clientes`, `GET /api/clientes/:id`    | Sesión  | |
| `POST /api/clientes`, `PUT, DELETE /api/clientes/:id` | Sesión | No se puede eliminar si tiene ingresos o solicitudes (409) |
| `GET, POST /api/asignaciones`                   | Sesión  | Operador ↔ máquina (`?id_maquina=&id_operador=`). Al asignar se cierran la asignación abierta de esa máquina y la del operador en otra máquina, con la fecha de inicio de la nueva |
| `PATCH /api/asignaciones/:id/cerrar`            | Sesión  | `{ fecha_salida? }` (por defecto hoy; no puede ser anterior al inicio) |
| `GET /api/movimientos`                          | Sesión  | `{ ingresos, egresos }` (`?desde=&hasta=&id_maquina=`) |
| `POST /api/movimientos`                         | Sesión  | `{ tipo: 'ingreso' \| 'egreso', id_maquina, valor, fecha, descripcion?, id_cliente*, horas* }` (*solo ingresos) |
| `DELETE /api/movimientos/:tipo/:id`             | Sesión  | Elimina un ingreso o egreso |
| `GET /api/solicitudes`                          | Sesión  | `?estado=` opcional |
| `GET /api/solicitudes/:id`                      | Sesión  | |
| `PATCH /api/solicitudes/:id/estado`             | Sesión  | `{ estado }` |

**Sesión**: al iniciar sesión el servidor envía una cookie `makina_sesion`
(`httpOnly`, `SameSite=Lax`, `Secure` en producción) con un JWT firmado con
`JWT_SECRET`, válida por `SESSION_DAYS` días.

**Seguridad en Supabase**: todas las tablas tienen RLS activado y sin políticas,
así la API REST pública de Supabase (anon key) no puede leer ni escribir nada. El
backend se conecta directo a Postgres y no se ve afectado.

## Variables de entorno

Copia `.env.example` como `.env` (ignorado por Git). En Vercel se configuran en
*Project Settings → Environment Variables*.

| Variable       | Descripción                                          | Por defecto |
| -------------- | ---------------------------------------------------- | ----------- |
| `DATABASE_URL` | Cadena de conexión del pooler de Supabase (puerto 6543) | — (obligatoria) |
| `JWT_SECRET`   | Secreto largo y aleatorio para firmar la sesión      | — (obligatoria) |
| `PORT`         | Puerto del servidor local                            | `3000`      |
| `SESSION_DAYS` | Duración de la sesión en días                        | `7`         |
| `DB_POOL_MAX`  | Conexiones máximas por instancia                     | `3`         |

## Puesta en marcha

### 1. Base de datos en Supabase (capa gratuita)

1. Crea un proyecto en [supabase.com](https://supabase.com) y guarda la contraseña
   de la base de datos.
2. En **SQL Editor** ejecuta el contenido de `supabase/migrations/001_esquema.sql`.
3. (Opcional) Ejecuta `supabase/seed.sql` para cargar los datos de ejemplo. Los
   ingresos y egresos quedan en el mes actual para que el dashboard muestre datos.
   También crea un **usuario de prueba**:

   | Usuario (o correo)                  | Contraseña    |
   | ----------------------------------- | ------------- |
   | `admin` (`admin@makina.local`)      | `Makina2026!` |

   No ejecutes el seed en producción, o elimina ese usuario y crea uno propio.
4. En **Project Settings → Database → Connection string** copia la cadena del
   **Transaction pooler** (puerto `6543`), reemplaza `[YOUR-PASSWORD]` y pégala en
   `DATABASE_URL` de tu `.env`.
5. Genera un `JWT_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

### 2. Crear el primer usuario (si no usaste el seed)

```bash
npm install
npm run crear-usuario -- --usuario laura --correo laura@makina.com --nombre "Laura Méndez"
```

El script pide la contraseña por consola (mínimo 8 caracteres) o la toma de la
variable `MAKINA_PASSWORD`. Con ese usuario (o su correo) se inicia sesión en `/login`.

### 3. Desarrollo

```bash
npm run dev
```

Abre **http://localhost:3000**. Express sirve la API en `/api` y las apps de
React a través de Vite (middleware mode), con **hot reload**. El servidor se
reinicia solo (`node --watch`) cuando cambian `index.js` o los archivos de `src/`.

### 4. Producción local

```bash
npm run build
npm start
```

## Despliegue en Vercel

El proyecto ya incluye `vercel.json`:

- **Build**: `npm run build` → el frontend estático queda en `public/js/dist`.
- **API**: `api/index.js` exporta la app de Express como una Vercel Function;
  todas las rutas `/api/*` se redirigen a ella.
- **Rutas amigables** (`/home`, `/maquinaria/:id`, …): se reescriben a su HTML en
  `vercel.json`. Si agregas una vista nueva, añádela en `src/config/vistas.js`
  (servidor local) **y** en los `rewrites` de `vercel.json`.

Pasos:

1. Sube el repositorio a GitHub e impórtalo en Vercel (el *Framework Preset* debe
   quedar en **Other**; `vercel.json` ya define build y salida).
2. En *Environment Variables* agrega `DATABASE_URL`, `JWT_SECRET` y
   `NODE_ENV=production`.
3. Despliega. Comprueba `https://<tu-dominio>/api/health`.

> La capa gratuita de Supabase pausa el proyecto tras una semana sin actividad;
> se reactiva desde el panel de Supabase.
