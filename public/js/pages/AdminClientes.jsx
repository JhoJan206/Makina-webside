import AdminCrud from '../components/AdminCrud.jsx';
import {
  BuildingIcon,
  ClipboardIcon,
  TrendingUpIcon,
} from '../components/Icons.jsx';
import { clientes, ingresos } from '../data/datos.js';
import { listarSolicitudes } from '../data/solicitudes.js';

const campos = [
  {
    nombre: 'nombre_obra',
    etiqueta: 'Nombre de la obra',
    requerido: true,
    max: 150,
    placeholder: 'Ej. Obra #1',
    ancho: true,
  },
  {
    nombre: 'nombre_empresa',
    etiqueta: 'Empresa',
    max: 150,
    placeholder: 'Ej. Constructora Andina',
  },
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
];

const contarIngresos = (id) =>
  ingresos.filter((ingreso) => ingreso.id_cliente === id).length;

const contarSolicitudes = (id) =>
  listarSolicitudes().filter((solicitud) => solicitud.id_cliente === id).length;

export default function AdminClientes() {
  return (
    <AdminCrud
      seccion="clientes"
      entidad={{
        singular: 'cliente',
        articulo: 'el',
        genero: 'm',
        nuevo: 'Nuevo cliente',
        crear: 'Registrar cliente',
        columnaPrincipal: 'Obra / cliente',
      }}
      descripcion="Administra las obras y empresas a las que les trabajas."
      rutaApi="/clientes"
      clave="id_cliente"
      cache={clientes}
      campos={campos}
      titulo={(cliente) => cliente.nombre_obra}
      subtitulo={(cliente) => cliente.nombre_empresa || 'Sin empresa'}
      textoBusqueda={(cliente) =>
        [
          cliente.nombre_obra,
          cliente.nombre_empresa,
          cliente.nombre_responsable,
          cliente.telefono,
        ].join(' ')
      }
      columnas={[
        {
          etiqueta: 'Responsable',
          valor: (cliente) => cliente.nombre_responsable || '—',
        },
        { etiqueta: 'Teléfono', valor: (cliente) => cliente.telefono || '—' },
        {
          etiqueta: 'Actividad',
          valor: (cliente) =>
            `${contarSolicitudes(cliente.id_cliente)} sol. · ${contarIngresos(
              cliente.id_cliente,
            )} ing.`,
        },
      ]}
      estadisticas={(filas) => [
        {
          etiqueta: 'Clientes',
          valor: filas.length,
          detalle: 'Obras registradas',
          Icono: BuildingIcon,
          tono: 'neutro',
        },
        {
          etiqueta: 'Con solicitudes',
          valor: filas.filter(
            (cliente) => contarSolicitudes(cliente.id_cliente) > 0,
          ).length,
          detalle: 'Han pedido maquinaria',
          Icono: ClipboardIcon,
          tono: 'azul',
        },
        {
          etiqueta: 'Con ingresos',
          valor: filas.filter((cliente) => contarIngresos(cliente.id_cliente) > 0)
            .length,
          detalle: 'Trabajos facturados',
          Icono: TrendingUpIcon,
          tono: 'verde',
        },
      ]}
      bloqueoEliminar={(cliente) => {
        const solicitudes = contarSolicitudes(cliente.id_cliente);
        const trabajos = contarIngresos(cliente.id_cliente);
        if (solicitudes + trabajos === 0) return null;

        const partes = [
          solicitudes > 0 &&
            `${solicitudes} ${solicitudes === 1 ? 'solicitud' : 'solicitudes'}`,
          trabajos > 0 && `${trabajos} ${trabajos === 1 ? 'ingreso' : 'ingresos'}`,
        ].filter(Boolean);

        return `Tiene ${partes.join(' y ')} asociados. Puedes editar sus datos, pero no eliminarlo sin perder ese historial.`;
      }}
    />
  );
}
