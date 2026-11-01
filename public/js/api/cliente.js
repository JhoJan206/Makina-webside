// Cliente HTTP de la API (/api). Envía la cookie de sesión y convierte los
// errores del servidor en excepciones con un mensaje listo para mostrar.

export class ErrorApi extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export async function api(ruta, { metodo = 'GET', cuerpo, redirigirSinSesion = true } = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'include',
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (respuesta.status === 401 && redirigirSinSesion) {
    window.location.assign('/login');
    // La página se está yendo: se deja la promesa pendiente
    return new Promise(() => {});
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorApi(
      respuesta.status,
      datos?.error ?? 'Ocurrió un error inesperado.',
      datos?.detalles,
    );
  }

  return datos;
}
