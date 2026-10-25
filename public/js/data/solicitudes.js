// Solicitudes de trabajo alineadas con la tabla `solicitudes` de baseDatos.sql.
//
// El proyecto no tiene una conexión activa a PostgreSQL, así que las
// solicitudes y los clientes nuevos se guardan en localStorage. Los campos
// usados son exactamente los del esquema:
//
//   solicitudes -> id_cliente, tipo_maquina, fecha_requerida,
//                  horas_estimadas, descripcion, estado, created_at, updated_at
//   clientes    -> nombre_obra, nombre_empresa, nombre_responsable, telefono

import {
  clientes as clientesBase,
  formatearFecha,
  maquinas,
  promedioValorHora,
} from './datos.js';

const CLAVE_SOLICITUDES = 'makina.solicitudes.v1';
const CLAVE_CLIENTES = 'makina.clientes.v1';

export const ESTADOS = [
  'Pendiente',
  'Contactado',
  'Aprobada',
  'Rechazada',
  'Completada',
];

const TONOS = {
  Pendiente: 'ambar',
  Contactado: 'azul',
  Aprobada: 'verde',
  Rechazada: 'rojo',
  Completada: 'negro',
};

export function tonoEstado(estado) {
  return TONOS[estado] ?? 'gris';
}

export const solicitudesIniciales = [
  {
    id_solicitud: 6,
    id_cliente: 3,
    tipo_maquina: 'Bulldozer',
    fecha_requerida: '2026-11-05',
    horas_estimadas: 48,
    descripcion:
      'Preparación de plataforma para el nuevo frente de explotación. Se requiere nivelar y compactar el terreno.',
    estado: 'Pendiente',
    created_at: '2026-10-24T07:30:00',
    updated_at: '2026-10-24T07:30:00',
  },
  {
    id_solicitud: 5,
    id_cliente: 1,
    tipo_maquina: 'Pajarita',
    fecha_requerida: '2026-10-28',
    horas_estimadas: 24,
    descripcion:
      'Nivelación y excavación para el acceso principal de la obra. El terreno ya está delimitado.',
    estado: 'Pendiente',
    created_at: '2026-10-23T09:15:00',
    updated_at: '2026-10-23T09:15:00',
  },
  {
    id_solicitud: 4,
    id_cliente: 2,
    tipo_maquina: 'Bulldozer',
    fecha_requerida: '2026-10-30',
    horas_estimadas: 40,
    descripcion:
      'Movimiento de tierras para ampliación de la vía. Incluye empuje y conformación del talud.',
    estado: 'Contactado',
    created_at: '2026-10-22T14:40:00',
    updated_at: '2026-10-23T10:05:00',
  },
  {
    id_solicitud: 3,
    id_cliente: 3,
    tipo_maquina: 'Pajarita',
    fecha_requerida: '2026-11-02',
    horas_estimadas: 16,
    descripcion:
      'Apertura de zanja para redes de drenaje en la zona sur de la cantera.',
    estado: 'Aprobada',
    created_at: '2026-10-21T08:05:00',
    updated_at: '2026-10-22T16:20:00',
  },
  {
    id_solicitud: 2,
    id_cliente: 1,
    tipo_maquina: 'Bulldozer',
    fecha_requerida: '2026-10-26',
    horas_estimadas: 32,
    descripcion:
      'Adecuación de la vía interna para el ingreso de volquetas de gran tonelaje.',
    estado: 'Rechazada',
    created_at: '2026-10-20T16:20:00',
    updated_at: '2026-10-21T11:45:00',
  },
  {
    id_solicitud: 1,
    id_cliente: 2,
    tipo_maquina: 'Pajarita',
    fecha_requerida: '2026-10-18',
    horas_estimadas: 20,
    descripcion:
      'Cargue de material granular y limpieza del área de acopio.',
    estado: 'Completada',
    created_at: '2026-10-15T11:10:00',
    updated_at: '2026-10-19T17:30:00',
  },
];

function leerArreglo(clave, respaldo) {
  if (typeof window === 'undefined') return respaldo;

  try {
    const guardado = window.localStorage.getItem(clave);
    if (guardado === null) return respaldo;

    const valor = JSON.parse(guardado);
    return Array.isArray(valor) ? valor : respaldo;
  } catch {
    return respaldo;
  }
}

function guardarArreglo(clave, valor) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Si el navegador bloquea localStorage, la app sigue funcionando
    // con los datos de la sesión actual.
  }
}

function leerSolicitudes() {
  const guardadas = leerArreglo(CLAVE_SOLICITUDES, null);

  if (guardadas === null) {
    guardarArreglo(CLAVE_SOLICITUDES, solicitudesIniciales);
    return solicitudesIniciales;
  }

  return guardadas;
}

function leerClientesNuevos() {
  return leerArreglo(CLAVE_CLIENTES, []);
}

export function listarClientes() {
  const idsBase = new Set(clientesBase.map((cliente) => cliente.id_cliente));
  const nuevos = leerClientesNuevos().filter(
    (cliente) => !idsBase.has(cliente.id_cliente),
  );

  return [...clientesBase, ...nuevos];
}

function buscarCliente({ nombre_obra, nombre_empresa, nombre_responsable, telefono }) {
  const normalizar = (valor) => String(valor ?? '').trim().toLowerCase();
  const digitos = (valor) => String(valor ?? '').replace(/\D/g, '');
  const telefonoBuscado = digitos(telefono);

  return listarClientes().find((cliente) => {
    if (telefonoBuscado && digitos(cliente.telefono) === telefonoBuscado) {
      return true;
    }

    return (
      normalizar(cliente.nombre_obra) === normalizar(nombre_obra) &&
      normalizar(cliente.nombre_empresa) === normalizar(nombre_empresa) &&
      normalizar(cliente.nombre_responsable) === normalizar(nombre_responsable)
    );
  });
}

function crearCliente(datos) {
  const clientes = listarClientes();
  const siguienteId =
    clientes.reduce(
      (mayor, cliente) => Math.max(mayor, cliente.id_cliente),
      0,
    ) + 1;

  const cliente = {
    id_cliente: siguienteId,
    nombre_obra: datos.nombre_obra.trim(),
    nombre_empresa: datos.nombre_empresa?.trim() || null,
    nombre_responsable: datos.nombre_responsable?.trim() || null,
    telefono: datos.telefono?.trim() || null,
  };

  const nuevos = leerClientesNuevos();
  guardarArreglo(CLAVE_CLIENTES, [...nuevos, cliente]);

  return cliente;
}

function unirConCliente(solicitud) {
  const cliente = listarClientes().find(
    (item) => item.id_cliente === solicitud.id_cliente,
  );

  return {
    ...solicitud,
    cliente: cliente ?? null,
  };
}

export function listarSolicitudes() {
  return leerSolicitudes()
    .map(unirConCliente)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function obtenerSolicitud(id) {
  const buscado = String(id ?? '');

  return (
    listarSolicitudes().find(
      (solicitud) => String(solicitud.id_solicitud) === buscado,
    ) ?? null
  );
}

export function crearSolicitud(datos) {
  const cliente =
    buscarCliente(datos) ??
    crearCliente(datos);

  const solicitudes = leerSolicitudes();
  const siguienteId =
    solicitudes.reduce(
      (mayor, solicitud) => Math.max(mayor, solicitud.id_solicitud),
      0,
    ) + 1;
  const ahora = new Date().toISOString();

  const solicitud = {
    id_solicitud: siguienteId,
    id_cliente: cliente.id_cliente,
    tipo_maquina: datos.tipo_maquina,
    fecha_requerida: datos.fecha_requerida,
    horas_estimadas: Number(datos.horas_estimadas),
    descripcion: datos.descripcion?.trim() || null,
    estado: 'Pendiente',
    created_at: ahora,
    updated_at: ahora,
  };

  guardarArreglo(CLAVE_SOLICITUDES, [...solicitudes, solicitud]);

  return unirConCliente(solicitud);
}

export function actualizarEstado(id, estado) {
  if (!ESTADOS.includes(estado)) return null;

  const solicitudes = leerSolicitudes();
  let actualizada = null;

  const nuevas = solicitudes.map((solicitud) => {
    if (String(solicitud.id_solicitud) !== String(id)) return solicitud;

    actualizada = {
      ...solicitud,
      estado,
      updated_at: new Date().toISOString(),
    };

    return actualizada;
  });

  if (!actualizada) return null;

  guardarArreglo(CLAVE_SOLICITUDES, nuevas);

  return unirConCliente(actualizada);
}

export function resumenSolicitudes() {
  const solicitudes = listarSolicitudes();
  const porEstado = Object.fromEntries(
    ESTADOS.map((estado) => [
      estado,
      solicitudes.filter((solicitud) => solicitud.estado === estado).length,
    ]),
  );

  return {
    total: solicitudes.length,
    porEstado,
    pendientes: porEstado.Pendiente,
    contactadas: porEstado.Contactado,
    aprobadas: porEstado.Aprobada,
    rechazadas: porEstado.Rechazada,
    completadas: porEstado.Completada,
  };
}

export function tarifaTipo(tipo) {
  const equipos = maquinas.filter((maquina) => maquina.tipo === tipo);

  if (equipos.length === 0) return promedioValorHora();

  return Math.round(
    equipos.reduce((total, maquina) => total + maquina.valor_hora, 0) /
      equipos.length,
  );
}

export function valorEstimadoSolicitud(solicitud) {
  if (!solicitud) return 0;

  return tarifaTipo(solicitud.tipo_maquina) * solicitud.horas_estimadas;
}

export function formatearFechaHora(valor) {
  if (!valor) return '—';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(fecha);
}

export function formatearFechaSolicitud(fecha) {
  return formatearFecha(fecha, true);
}

export function inicialesCliente(cliente) {
  const base = cliente?.nombre_empresa || cliente?.nombre_obra || 'Cliente';
  const palabras = base.trim().split(/\s+/).filter(Boolean);

  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();

  return `${palabras[0][0]}${palabras[1][0]}`.toUpperCase();
}
