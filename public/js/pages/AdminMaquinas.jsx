import AdminCrud from '../components/AdminCrud.jsx';
import { CheckIcon, DollarIcon, TruckIcon } from '../components/Icons.jsx';
import {
  egresos,
  formatearMoneda,
  ingresos,
  maquinaOperador,
  maquinas,
  nombreMaquina,
  nombreOperador,
  normalizarMaquina,
  obtenerOperadorActual,
  promedioValorHora,
  tipoMaquinaVisible,
} from '../data/datos.js';

const IMAGENES = [
  { valor: '/img/maquinaria/retroexcavadora.jpg', texto: 'Retroexcavadora' },
  { valor: '/img/maquinaria/excavadora.jpg', texto: 'Excavadora' },
  { valor: '/img/maquinaria/cargadora.jpg', texto: 'Cargadora' },
];

const campos = [
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
];

const contarMovimientos = (id) =>
  ingresos.filter((ingreso) => ingreso.id_maquina === id).length +
  egresos.filter((egreso) => egreso.id_maquina === id).length;

export default function AdminMaquinas() {
  return (
    <AdminCrud
      seccion="maquinas"
      entidad={{
        singular: 'máquina',
        articulo: 'la',
        genero: 'f',
        nuevo: 'Nueva máquina',
        crear: 'Registrar máquina',
        columnaPrincipal: 'Máquina',
      }}
      descripcion="Registra, edita o retira equipos de la flota."
      rutaApi="/maquinas"
      clave="id_maquina"
      cache={maquinas}
      normalizar={normalizarMaquina}
      campos={campos}
      titulo={nombreMaquina}
      subtitulo={(maquina) => `Placa ${maquina.placa}`}
      enlace={(maquina) => `/maquinaria/${encodeURIComponent(maquina.placa)}`}
      textoBusqueda={(maquina) =>
        `${maquina.placa} ${maquina.tipo} ${tipoMaquinaVisible(maquina.tipo)}`
      }
      columnas={[
        { etiqueta: 'Tipo', valor: (maquina) => tipoMaquinaVisible(maquina.tipo) },
        {
          etiqueta: 'Valor/hora',
          valor: (maquina) => formatearMoneda(maquina.valor_hora, false),
        },
        {
          etiqueta: 'Operador',
          valor: (maquina) => {
            const operador = obtenerOperadorActual(maquina.id_maquina);
            return operador ? nombreOperador(operador) : 'Sin operador';
          },
        },
      ]}
      estadisticas={(filas) => [
        {
          etiqueta: 'Equipos',
          valor: filas.length,
          detalle: 'Máquinas registradas',
          Icono: TruckIcon,
          tono: 'neutro',
        },
        {
          etiqueta: 'Con operador',
          valor: filas.filter((maquina) => obtenerOperadorActual(maquina.id_maquina))
            .length,
          detalle: 'Asignación activa',
          Icono: CheckIcon,
          tono: 'verde',
        },
        {
          etiqueta: 'Valor promedio',
          valor: `${formatearMoneda(promedioValorHora(), false)}/h`,
          detalle: 'Tarifa promedio por hora',
          Icono: DollarIcon,
          tono: 'ambar',
        },
      ]}
      bloqueoEliminar={(maquina) => {
        const total = contarMovimientos(maquina.id_maquina);
        if (total === 0) return null;

        return `Tiene ${total} ${
          total === 1 ? 'movimiento registrado' : 'movimientos registrados'
        } (ingresos o egresos). Elimínalos primero si de verdad quieres retirarla.`;
      }}
      avisoEliminar={(maquina) => {
        const total = maquinaOperador.filter(
          (asignacion) => asignacion.id_maquina === maquina.id_maquina,
        ).length;
        if (total === 0) return null;

        return `También se borrará su historial de ${total} ${
          total === 1 ? 'asignación' : 'asignaciones'
        } de operadores.`;
      }}
    />
  );
}
