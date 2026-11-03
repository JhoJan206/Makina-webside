// Rutas amigables -> vista HTML. Si cambias algo aquí, refleja el cambio en
// los "rewrites" de vercel.json (Vercel sirve el frontend sin Express).
export const VISTAS = [
  { rutas: ['/', '/login'], vista: 'login.html' },
  { rutas: ['/home', '/dashboard'], vista: 'home.html' },
  { rutas: ['/maquinaria'], vista: 'maquinaria.html' },
  { rutas: ['/maquinaria/:id'], vista: 'maquina.html' },
  { rutas: ['/operadores'], vista: 'operadores.html' },
  { rutas: ['/operador/:id'], vista: 'operador.html' },
  { rutas: ['/solicitar'], vista: 'solicitar.html' },
  { rutas: ['/solicitudes'], vista: 'solicitudes.html' },
  { rutas: ['/solicitud/:id'], vista: 'solicitud.html' },
  { rutas: ['/movimientos'], vista: 'movimientos.html' },
  { rutas: ['/clientes'], vista: 'clientes.html' },
];

// Rutas de vistas que ya no existen -> su página actual (también en vercel.json)
export const REDIRECCIONES = {
  '/admin': '/maquinaria',
  '/admin/maquinas': '/maquinaria',
  '/admin/operadores': '/operadores',
  '/admin/clientes': '/clientes',
  '/asignaciones': '/maquinaria',
};

export function vistaDeRuta(ruta) {
  for (const { rutas, vista } of VISTAS) {
    for (const patron of rutas) {
      if (patron.endsWith('/:id')) {
        const base = patron.slice(0, -3);
        if (ruta.startsWith(base) && ruta.length > base.length && !ruta.slice(base.length).includes('/')) {
          return vista;
        }
      } else if (ruta === patron) {
        return vista;
      }
    }
  }

  return null;
}
