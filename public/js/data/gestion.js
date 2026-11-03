// Configuración del CRUD (useCrud en components/AdminCrud.jsx) de máquinas,
// operadores y clientes: campos del formulario, textos y reglas de borrado.

import {
  clientes,
  egresos,
  ingresos,
  maquinaOperador,
  maquinas,
  nombreMaquina,
  nombreOperador,
  normalizarMaquina,
  operadores,
} from './datos.js';
import { listarSolicitudes } from './solicitudes.js';

const IMAGENES = [
  { valor: '/img/maquinaria/retroexcavadora.jpg', texto: 'Retroexcavadora' },
  { valor: '/img/maquinaria/excavadora.jpg', texto: 'Excavadora' },
  { valor: '/img/maquinaria/cargadora.jpg', texto: 'Cargadora' },
];

function textoAsignaciones(total, destino) {
  if (total === 0) return null;

  return `También se borrará su historial de ${total} ${
    total === 1 ? 'asignación' : 'asignaciones'
  } ${destino}.`;
}

// ----- Máquinas -----
const contarMovimientos = (id) =>
  ingresos.filter((ingreso) => ingreso.id_maquina === id).length +
  egresos.filter((egreso) => egreso.id_maquina === id).length;

export const crudMaquinas = {
  entidad: {
    singular: 'máquina',
    genero: 'f',
    nuevo: 'Nueva máquina',
    crear: 'Registrar máquina',
  },
  rutaApi: '/maquinas',
  clave: 'id_maquina',
  cache: maquinas,
  normalizar: normalizarMaquina,
  titulo: nombreMaquina,
  campos: [
    {
      nombre: 'tipo',
      etiqueta: 'Tipo',
      tipo: 'select',
      requerido: true,
      opciones: [
        { valor: 'Pajarita', texto: 'Retroexcavadora (Pajarita)' },
        { valor: 'Bulldozer', texto: 'Bulldozer' },
      ],
    },
    {
      nombre: 'placa',
      etiqueta: 'Placa',
      requerido: true,
      max: 20,
      placeholder: 'Ej. 387J',
      transformar: (valor) => valor.toUpperCase(),
    },
    {
      nombre: 'valor_hora',
      etiqueta: 'Valor por hora (COP)',
      tipo: 'numero',
      requerido: true,
      min: 0,
      paso: 1000,
      placeholder: 'Ej. 85000',
      ancho: true,
    },
    {
      nombre: 'imagen',
      etiqueta: 'Foto',
      tipo: 'imagen',
      opciones: IMAGENES,
      vistaPrevia: (valores) =>
        valores.tipo ? normalizarMaquina({ tipo: valores.tipo }).imagen : null,
    },
    {
      nombre: 'imagen_alt',
      etiqueta: 'Descripción de la foto',
      max: 300,
      placeholder: 'Ej. Retroexcavadora amarilla en una obra',
      ayuda: 'Texto alternativo para lectores de pantalla.',
      ancho: true,
    },
  ],
  bloqueoEliminar: (maquina) => {
    const total = contarMovimientos(maquina.id_maquina);
    if (total === 0) return null;

    return `Tiene ${total} ${
      total === 1 ? 'movimiento registrado' : 'movimientos registrados'
    } (ingresos o egresos). Elimínalos primero si de verdad quieres retirarla.`;
  },
  avisoEliminar: (maquina) =>
    textoAsignaciones(
      maquinaOperador.filter((asignacion) => asignacion.id_maquina === maquina.id_maquina)
        .length,
      'de operadores',
    ),
};

// ----- Operadores -----
export const crudOperadores = {
  entidad: {
    singular: 'operador',
    genero: 'm',
    nuevo: 'Nuevo operador',
    crear: 'Registrar operador',
  },
  rutaApi: '/operadores',
  clave: 'id_operador',
  cache: operadores,
  titulo: nombreOperador,
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, max: 100, placeholder: 'Ej. Carlos' },
    { nombre: 'apellido', etiqueta: 'Apellido', requerido: true, max: 100, placeholder: 'Ej. Pérez' },
    {
      nombre: 'cedula',
      etiqueta: 'Cédula',
      requerido: true,
      max: 20,
      placeholder: 'Ej. 1.020.304.050',
    },
    {
      nombre: 'sueldo',
      etiqueta: 'Sueldo mensual (COP)',
      tipo: 'numero',
      min: 0,
      paso: 1000,
      placeholder: 'Ej. 3200000',
    },
  ],
  avisoEliminar: (operador) =>
    textoAsignaciones(
      maquinaOperador.filter((asignacion) => asignacion.id_operador === operador.id_operador)
        .length,
      'a máquinas',
    ),
};

// ----- Clientes -----
export const contarIngresosCliente = (id) =>
  ingresos.filter((ingreso) => ingreso.id_cliente === id).length;

export const contarSolicitudesCliente = (id) =>
  listarSolicitudes().filter((solicitud) => solicitud.id_cliente === id).length;

export const crudClientes = {
  entidad: {
    singular: 'cliente',
    genero: 'm',
    nuevo: 'Nuevo cliente',
    crear: 'Registrar cliente',
  },
  rutaApi: '/clientes',
  clave: 'id_cliente',
  cache: clientes,
  titulo: (cliente) => cliente.nombre_obra,
  campos: [
    {
      nombre: 'nombre_obra',
      etiqueta: 'Nombre de la obra',
      requerido: true,
      max: 150,
      placeholder: 'Ej. Obra #1',
      ancho: true,
    },
    { nombre: 'nombre_empresa', etiqueta: 'Empresa', max: 150, placeholder: 'Ej. Constructora Andina' },
    {
      nombre: 'nombre_responsable',
      etiqueta: 'Responsable',
      max: 100,
      placeholder: 'Nombre y apellido',
    },
    {
      nombre: 'telefono',
      etiqueta: 'Teléfono',
      tipo: 'tel',
      max: 20,
      placeholder: '300 123 4567',
      ancho: true,
    },
  ],
  bloqueoEliminar: (cliente) => {
    const solicitudes = contarSolicitudesCliente(cliente.id_cliente);
    const trabajos = contarIngresosCliente(cliente.id_cliente);
    if (solicitudes + trabajos === 0) return null;

    const partes = [
      solicitudes > 0 && `${solicitudes} ${solicitudes === 1 ? 'solicitud' : 'solicitudes'}`,
      trabajos > 0 && `${trabajos} ${trabajos === 1 ? 'ingreso' : 'ingresos'}`,
    ].filter(Boolean);

    return `Tiene ${partes.join(' y ')} asociados. Puedes editar sus datos, pero no eliminarlo sin perder ese historial.`;
  },
};
