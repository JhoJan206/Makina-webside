// Solicitudes de trabajo (tabla `solicitudes`), servidas por la API.
//
//   solicitudes -> id_cliente, tipo_maquina, fecha_requerida,
//                  horas_estimadas, descripcion, estado, created_at, updated_at,
//                  cliente { nombre_obra, nombre_empresa, nombre_responsable, telefono }

import { api } from '../api/cliente.js';
import {
  clientes,
  formatearFecha,
  maquinas,
  promedioValorHora,
} from './datos.js';

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

// Caché de las solicitudes cargadas desde la API (ver cargar.js)
const solicitudes = [];

// Tarifas públicas (valor/hora promedio por tipo) para la web de clientes,
// que no tiene acceso al listado de máquinas.
const tarifasPublicas = { porTipo: new Map(), promedio: 0, equipos: 0 };

export function llenarSolicitudes(filas) {
  solicitudes.splice(0, solicitudes.length, ...(filas ?? []));
}

export function llenarTarifas({ tarifas = [], promedio = 0 } = {}) {
  tarifasPublicas.porTipo = new Map(
    tarifas.map((tarifa) => [tarifa.tipo, tarifa.valor_hora]),
  );
  tarifasPublicas.promedio = promedio;
  tarifasPublicas.equipos = tarifas.reduce(
    (total, tarifa) => total + tarifa.equipos,
    0,
  );
}

export function resumenTarifas() {
  if (maquinas.length > 0) {
    return {
      tipos: [...new Set(maquinas.map((maquina) => maquina.tipo))],
      equipos: maquinas.length,
      promedio: promedioValorHora(),
    };
  }

  return {
    tipos: [...tarifasPublicas.porTipo.keys()],
    equipos: tarifasPublicas.equipos,
    promedio: tarifasPublicas.promedio,
  };
}

export function listarClientes() {
  return clientes;
}

function ordenarPorCreacion(a, b) {
  return String(b.created_at).localeCompare(String(a.created_at));
}

export function listarSolicitudes() {
  return [...solicitudes].sort(ordenarPorCreacion);
}

export function obtenerSolicitud(id) {
  const buscado = String(id ?? '');

  return (
    solicitudes.find(
      (solicitud) => String(solicitud.id_solicitud) === buscado,
    ) ?? null
  );
}

function guardarEnCache(solicitud) {
  const indice = solicitudes.findIndex(
    (item) => item.id_solicitud === solicitud.id_solicitud,
  );

  if (indice === -1) solicitudes.push(solicitud);
  else solicitudes[indice] = solicitud;

  if (
    solicitud.cliente &&
    !clientes.some((cliente) => cliente.id_cliente === solicitud.id_cliente)
  ) {
    clientes.push(solicitud.cliente);
  }

  return solicitud;
}

// Formulario público de /solicitar. El servidor reutiliza el cliente si ya
// existe (mismo teléfono u obra + empresa + responsable) o lo crea.
export async function crearSolicitud(datos) {
  const solicitud = await api('/publico/solicitudes', {
    metodo: 'POST',
    cuerpo: datos,
    redirigirSinSesion: false,
  });

  return guardarEnCache(solicitud);
}

export async function actualizarEstado(id, estado) {
  if (!ESTADOS.includes(estado)) return null;

  const solicitud = await api(`/solicitudes/${id}/estado`, {
    metodo: 'PATCH',
    cuerpo: { estado },
  });

  return guardarEnCache(solicitud);
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
  if (maquinas.length === 0) {
    return tarifasPublicas.porTipo.get(tipo) ?? tarifasPublicas.promedio;
  }

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
