import { AvisoCrud, TablaCrud, useCrud } from '../components/AdminCrud.jsx';
import {
  BuildingIcon,
  ClipboardIcon,
  PlusIcon,
  TrendingUpIcon,
} from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import { formatearMoneda, ingresos } from '../data/datos.js';
import {
  contarIngresosCliente,
  contarSolicitudesCliente,
  crudClientes,
} from '../data/gestion.js';
import { listarSolicitudes } from '../data/solicitudes.js';

const facturadoCliente = (id) =>
  ingresos
    .filter((ingreso) => ingreso.id_cliente === id)
    .reduce((total, ingreso) => total + ingreso.valor_ingreso, 0);

function textoSolicitudes(cliente) {
  const propias = listarSolicitudes().filter(
    (solicitud) => solicitud.id_cliente === cliente.id_cliente,
  );
  if (propias.length === 0) return 'Ninguna';

  const pendientes = propias.filter((solicitud) => solicitud.estado === 'Pendiente').length;
  return `${propias.length}${pendientes ? ` · ${pendientes} pendiente${pendientes === 1 ? '' : 's'}` : ''}`;
}

function textoIngresos(cliente) {
  const total = contarIngresosCliente(cliente.id_cliente);
  if (total === 0) return 'Ninguno';

  return `${total} · ${formatearMoneda(facturadoCliente(cliente.id_cliente))}`;
}

const columnas = [
  { etiqueta: 'Responsable', valor: (cliente) => cliente.nombre_responsable || '—' },
  { etiqueta: 'Teléfono', valor: (cliente) => cliente.telefono || '—' },
  { etiqueta: 'Solicitudes', valor: textoSolicitudes },
  { etiqueta: 'Ingresos', valor: textoIngresos },
];

export default function Clientes() {
  const crud = useCrud(crudClientes);
  const clientes = crud.filas;

  return (
    <div className="dashboard pagina-clientes">
      <Sidebar activo="Clientes" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'clientes' }]} />

        <main className="dashboard-contenido admin-contenido">
          <PageHeader
            eyebrow="Obras"
            titulo="Clientes"
            descripcion="Administra las obras y empresas a las que les trabajas, con sus solicitudes e ingresos."
            acciones={
              <button className="btn btn-primario" type="button" onClick={crud.nuevo}>
                <PlusIcon />
                Nuevo cliente
              </button>
            }
          />

          <AvisoCrud crud={crud} />

          <section className="stats-grid tres" aria-label="Resumen de clientes">
            <StatCard
              etiqueta="Clientes"
              valor={clientes.length}
              detalle="Obras registradas"
              Icono={BuildingIcon}
              tono="neutro"
            />
            <StatCard
              etiqueta="Con solicitudes"
              valor={
                clientes.filter((cliente) => contarSolicitudesCliente(cliente.id_cliente) > 0)
                  .length
              }
              detalle="Han pedido maquinaria"
              Icono={ClipboardIcon}
              tono="azul"
            />
            <StatCard
              etiqueta="Con ingresos"
              valor={
                clientes.filter((cliente) => contarIngresosCliente(cliente.id_cliente) > 0).length
              }
              detalle="Trabajos facturados"
              Icono={TrendingUpIcon}
              tono="verde"
            />
          </section>

          <TablaCrud
            crud={crud}
            plural="Clientes"
            columnaPrincipal="Obra / cliente"
            clave="id_cliente"
            columnas={columnas}
            titulo={crudClientes.titulo}
            subtitulo={(cliente) => cliente.nombre_empresa || 'Sin empresa'}
            textoBusqueda={(cliente) =>
              [
                cliente.nombre_obra,
                cliente.nombre_empresa,
                cliente.nombre_responsable,
                cliente.telefono,
              ].join(' ')
            }
            Icono={BuildingIcon}
            textoVacio="Registra el primer cliente con el botón Nuevo cliente."
          />
        </main>
      </div>

      {crud.dialogos}
    </div>
  );
}
