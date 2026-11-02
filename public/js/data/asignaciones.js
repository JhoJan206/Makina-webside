// Asignaciones operador ↔ máquina (tabla `maquina_operador`), servidas por la API.
//
//   maquina_operador -> id_maquina, id_operador, fecha_ingreso, fecha_salida
//
// Cada asignación es un trabajo: qué máquina, quién la operó, desde cuándo y
// hasta cuándo. Mientras `fecha_salida` es null la asignación está activa.

import { api } from '../api/cliente.js';
import { ingresos, maquinaOperador, maquinas, operadores } from './datos.js';

export function fechaDeHoy() {
  const fecha = new Date();
  const desplazamiento = fecha.getTimezoneOffset() * 60000;

  return new Date(fecha.getTime() - desplazamiento).toISOString().slice(0, 10);
}

const DIA = 24 * 60 * 60 * 1000;

// Días calendario entre dos fechas AAAA-MM-DD, contando ambos extremos
export function diasEntre(desde, hasta) {
  const inicio = Date.parse(`${desde}T00:00:00Z`);
  const fin = Date.parse(`${hasta}T00:00:00Z`);

  return Math.max(1, Math.round((fin - inicio) / DIA) + 1);
}

function detallar(asignacion) {
  const fin = asignacion.fecha_salida ?? fechaDeHoy();
  const trabajos = ingresos.filter(
    (ingreso) =>
      ingreso.id_maquina === asignacion.id_maquina &&
      ingreso.fecha >= asignacion.fecha_ingreso &&
      ingreso.fecha <= fin,
  );

  return {
    ...asignacion,
    activa: asignacion.fecha_salida === null,
    maquina:
      maquinas.find((maquina) => maquina.id_maquina === asignacion.id_maquina) ?? null,
    operador:
      operadores.find((operador) => operador.id_operador === asignacion.id_operador) ??
      null,
    dias: diasEntre(asignacion.fecha_ingreso, fin),
    horas: trabajos.reduce((total, ingreso) => total + ingreso.horas, 0),
    ingresos: trabajos.reduce((total, ingreso) => total + ingreso.valor_ingreso, 0),
  };
}

function ordenar(a, b) {
  if (a.activa !== b.activa) return a.activa ? -1 : 1;

  const porFecha = b.fecha_ingreso.localeCompare(a.fecha_ingreso);
  return porFecha !== 0 ? porFecha : b.id - a.id;
}

export function listarAsignaciones() {
  return maquinaOperador.map(detallar).sort(ordenar);
}

function reemplazarEnCache(asignacion) {
  const indice = maquinaOperador.findIndex((fila) => fila.id === asignacion.id);

  if (indice === -1) maquinaOperador.push(asignacion);
  else maquinaOperador[indice] = asignacion;
}

// Devuelve la nueva asignación y las que se cerraron por ella
export async function crearAsignacion({ id_maquina, id_operador, fecha_ingreso }) {
  const { asignacion, cerradas } = await api('/asignaciones', {
    metodo: 'POST',
    cuerpo: {
      id_maquina: Number(id_maquina),
      id_operador: Number(id_operador),
      fecha_ingreso,
    },
  });

  cerradas.forEach(reemplazarEnCache);
  reemplazarEnCache(asignacion);

  return { asignacion: detallar(asignacion), cerradas: cerradas.map(detallar) };
}

export async function cerrarAsignacion(id, fecha_salida) {
  const asignacion = await api(`/asignaciones/${id}/cerrar`, {
    metodo: 'PATCH',
    cuerpo: { fecha_salida },
  });

  reemplazarEnCache(asignacion);
  return detallar(asignacion);
}
