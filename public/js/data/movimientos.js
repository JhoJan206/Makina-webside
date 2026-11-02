// Ingresos y egresos (tablas `ingresos` y `egresos`), servidos por la API.
//
//   ingresos -> id_maquina, id_cliente, horas, valor_ingreso,
//               descripcion, fecha, created_at, updated_at
//   egresos  -> id_maquina, valor_egreso, descripcion, fecha,
//               created_at, updated_at

import { api } from '../api/cliente.js';
import { egresos, ingresos, maquinas } from './datos.js';
import { listarClientes } from './solicitudes.js';

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
  return [
    ...ingresos.map(enriquecerIngreso),
    ...egresos.map(enriquecerEgreso),
  ].sort(ordenarMovimientos);
}

export async function crearMovimiento(datos) {
  const tipo = datos.tipo === 'egreso' ? 'egreso' : 'ingreso';

  const { tipo: _tipo, ...movimiento } = await api('/movimientos', {
    metodo: 'POST',
    cuerpo: {
      tipo,
      id_maquina: Number(datos.id_maquina),
      valor: Number(datos.valor),
      descripcion: datos.descripcion?.trim() || null,
      fecha: datos.fecha,
      ...(tipo === 'ingreso'
        ? { id_cliente: Number(datos.id_cliente), horas: Number(datos.horas) }
        : {}),
    },
  });

  if (tipo === 'egreso') {
    egresos.push(movimiento);
    return enriquecerEgreso(movimiento);
  }

  ingresos.push(movimiento);
  return enriquecerIngreso(movimiento);
}

export async function eliminarMovimiento(movimiento) {
  const esEgreso = movimiento.tipo === 'egreso';
  const id = esEgreso ? movimiento.id_egreso : movimiento.id_ingreso;

  await api(`/movimientos/${movimiento.tipo}/${id}`, { metodo: 'DELETE' });

  const lista = esEgreso ? egresos : ingresos;
  const clave = esEgreso ? 'id_egreso' : 'id_ingreso';
  const indice = lista.findIndex((fila) => fila[clave] === id);
  if (indice !== -1) lista.splice(indice, 1);
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
