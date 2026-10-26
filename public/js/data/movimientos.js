// Ingresos y egresos alineados con las tablas `ingresos` y `egresos` de
// baseDatos.sql.
//
// El proyecto no tiene una conexión activa a PostgreSQL, así que los
// movimientos nuevos se guardan en localStorage. Los campos usados son
// exactamente los del esquema:
//
//   ingresos -> id_maquina, id_cliente, horas, valor_ingreso,
//               descripcion, fecha, created_at, updated_at
//   egresos  -> id_maquina, valor_egreso, descripcion, fecha,
//               created_at, updated_at

import {
  egresos as egresosBase,
  ingresos as ingresosBase,
  maquinas,
} from './datos.js';
import { listarClientes } from './solicitudes.js';

const CLAVE_INGRESOS = 'makina.ingresos.v1';
const CLAVE_EGRESOS = 'makina.egresos.v1';

function leerArreglo(clave) {
  if (typeof window === 'undefined') return [];

  try {
    const guardado = window.localStorage.getItem(clave);
    if (guardado === null) return [];

    const valor = JSON.parse(guardado);
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function guardarArreglo(clave, valor) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Si el navegador bloquea localStorage, la vista sigue funcionando
    // con los datos de la sesión actual.
  }
}

function buscarMaquina(idMaquina) {
  return (
    maquinas.find(
      (maquina) => maquina.id_maquina === Number(idMaquina),
    ) ?? null
  );
}

function buscarCliente(idCliente) {
  return (
    listarClientes().find(
      (cliente) => cliente.id_cliente === Number(idCliente),
    ) ?? null
  );
}

function enriquecerIngreso(ingreso) {
  return {
    ...ingreso,
    id_registro: `ingreso-${ingreso.id_ingreso}`,
    tipo: 'ingreso',
    valor: ingreso.valor_ingreso,
    maquina: buscarMaquina(ingreso.id_maquina),
    cliente: buscarCliente(ingreso.id_cliente),
  };
}

function enriquecerEgreso(egreso) {
  return {
    ...egreso,
    id_registro: `egreso-${egreso.id_egreso}`,
    tipo: 'egreso',
    valor: egreso.valor_egreso,
    maquina: buscarMaquina(egreso.id_maquina),
    cliente: null,
  };
}

function ordenarMovimientos(a, b) {
  const porFecha = b.fecha.localeCompare(a.fecha);
  if (porFecha !== 0) return porFecha;

  const porCreacion = String(b.created_at ?? '').localeCompare(
    String(a.created_at ?? ''),
  );
  if (porCreacion !== 0) return porCreacion;

  return (
    Number(b.id_ingreso ?? b.id_egreso) -
    Number(a.id_ingreso ?? a.id_egreso)
  );
}

export function listarMovimientos() {
  const ingresos = [
    ...ingresosBase,
    ...leerArreglo(CLAVE_INGRESOS),
  ].map(enriquecerIngreso);
  const egresos = [
    ...egresosBase,
    ...leerArreglo(CLAVE_EGRESOS),
  ].map(enriquecerEgreso);

  return [...ingresos, ...egresos].sort(ordenarMovimientos);
}

export function crearMovimiento(datos) {
  const tipo = datos.tipo === 'egreso' ? 'egreso' : 'ingreso';
  const ahora = new Date().toISOString();
  const descripcion = datos.descripcion?.trim() || null;

  if (tipo === 'egreso') {
    const guardados = leerArreglo(CLAVE_EGRESOS);
    const siguienteId =
      [...egresosBase, ...guardados].reduce(
        (mayor, egreso) => Math.max(mayor, egreso.id_egreso),
        0,
      ) + 1;

    const egreso = {
      id_egreso: siguienteId,
      id_maquina: Number(datos.id_maquina),
      valor_egreso: Number(datos.valor),
      descripcion,
      fecha: datos.fecha,
      created_at: ahora,
      updated_at: ahora,
    };

    guardarArreglo(CLAVE_EGRESOS, [...guardados, egreso]);

    return enriquecerEgreso(egreso);
  }

  const guardados = leerArreglo(CLAVE_INGRESOS);
  const siguienteId =
    [...ingresosBase, ...guardados].reduce(
      (mayor, ingreso) => Math.max(mayor, ingreso.id_ingreso),
      0,
    ) + 1;

  const ingreso = {
    id_ingreso: siguienteId,
    id_maquina: Number(datos.id_maquina),
    id_cliente: Number(datos.id_cliente),
    horas: Number(datos.horas),
    valor_ingreso: Number(datos.valor),
    descripcion,
    fecha: datos.fecha,
    created_at: ahora,
    updated_at: ahora,
  };

  guardarArreglo(CLAVE_INGRESOS, [...guardados, ingreso]);

  return enriquecerIngreso(ingreso);
}

export function resumenMovimientos(movimientos = listarMovimientos()) {
  const ingresos = movimientos.filter(
    (movimiento) => movimiento.tipo === 'ingreso',
  );
  const egresos = movimientos.filter(
    (movimiento) => movimiento.tipo === 'egreso',
  );

  const totalIngresos = ingresos.reduce(
    (total, movimiento) => total + Number(movimiento.valor ?? 0),
    0,
  );
  const totalEgresos = egresos.reduce(
    (total, movimiento) => total + Number(movimiento.valor ?? 0),
    0,
  );

  return {
    total: movimientos.length,
    cantidadIngresos: ingresos.length,
    cantidadEgresos: egresos.length,
    ingresos: totalIngresos,
    egresos: totalEgresos,
    balance: totalIngresos - totalEgresos,
    horas: ingresos.reduce(
      (total, movimiento) => total + Number(movimiento.horas ?? 0),
      0,
    ),
  };
}
