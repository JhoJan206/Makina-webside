import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import EstadoPill from '../components/EstadoPill.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  ArrowRightIcon,
  CheckIcon,
  ClipboardIcon,
  PhoneIcon,
  SearchIcon,
} from '../components/Icons.jsx';
import {
  ESTADOS,
  formatearFechaSolicitud,
  inicialesCliente,
  listarSolicitudes,
  resumenSolicitudes,
} from '../data/solicitudes.js';
import { tipoMaquinaVisible } from '../data/datos.js';

const filtros = ['Todas', ...ESTADOS];

export default function Solicitudes() {
  const [solicitudes] = useState(() => listarSolicitudes());
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const resumen = resumenSolicitudes();

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return solicitudes.filter((solicitud) => {
      if (filtro !== 'Todas' && solicitud.estado !== filtro) return false;
      if (!termino) return true;

      return [
        solicitud.id_solicitud,
        solicitud.cliente?.nombre_obra,
        solicitud.cliente?.nombre_empresa,
        solicitud.cliente?.nombre_responsable,
        solicitud.cliente?.telefono,
        solicitud.tipo_maquina,
      ].some((valor) =>
        String(valor ?? '')
          .toLowerCase()
          .includes(termino),
      );
    });
  }, [busqueda, filtro, solicitudes]);

  return (
    <div className="dashboard pagina-solicitudes">
      <Sidebar activo="Solicitudes" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'solicitudes' }]} />

        <main className="dashboard-contenido solicitudes-contenido">
          <PageHeader
            eyebrow="Trabajo"
            titulo="Solicitudes"
            descripcion="Revisa los requerimientos de tus clientes y dales seguimiento."
          />

          <section className="stats-grid" aria-label="Resumen de solicitudes">
            <StatCard
              etiqueta="Pendientes"
              valor={resumen.pendientes}
              detalle="Por contactar"
              Icono={ClipboardIcon}
              tono="ambar"
            />
            <StatCard
              etiqueta="Contactadas"
              valor={resumen.contactadas}
              detalle="En conversación"
              Icono={PhoneIcon}
              tono="azul"
            />
            <StatCard
              etiqueta="Aprobadas"
              valor={resumen.aprobadas}
              detalle="Listas para programar"
              Icono={CheckIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Completadas"
              valor={resumen.completadas}
              detalle={`${resumen.total} solicitudes en total`}
              Icono={CheckIcon}
              tono="negro"
            />
          </section>

          <section className="tarjeta solicitudes-toolbar">
            <label className="buscador" htmlFor="buscar-solicitud">
              <SearchIcon />
              <input
                id="buscar-solicitud"
                type="search"
                placeholder="Buscar por cliente, obra, teléfono o máquina…"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </label>

            <div className="filtros-estado" role="tablist" aria-label="Filtrar por estado">
              {filtros.map((estado) => (
                <button
                  key={estado}
                  type="button"
                  role="tab"
                  aria-selected={filtro === estado}
                  className={filtro === estado ? 'filtro activo' : 'filtro'}
                  onClick={() => setFiltro(estado)}
                >
                  {estado}
                </button>
              ))}
            </div>

            <span className="solicitudes-conteo">
              {filtradas.length} de {solicitudes.length}
            </span>
          </section>

          <section className="tarjeta solicitudes-panel" aria-label="Listado de solicitudes">
            {filtradas.length > 0 ? (
              <div className="tabla-solicitudes" role="table">
                <div className="solicitud-fila solicitud-encabezado" role="row">
                  <span className="solicitud-col-cliente" role="columnheader">
                    Cliente
                  </span>
                  <span className="solicitud-col-obra" role="columnheader">
                    Obra
                  </span>
                  <span className="solicitud-col-maquina" role="columnheader">
                    Máquina
                  </span>
                  <span className="solicitud-col-fecha" role="columnheader">
                    Fecha requerida
                  </span>
                  <span className="solicitud-col-horas" role="columnheader">
                    Horas
                  </span>
                  <span className="solicitud-col-estado" role="columnheader">
                    Estado
                  </span>
                  <span aria-hidden="true" />
                </div>

                {filtradas.map((solicitud) => (
                  <a
                    className="solicitud-fila"
                    href={`/solicitud/${solicitud.id_solicitud}`}
                    key={solicitud.id_solicitud}
                    role="row"
                  >
                    <span className="solicitud-cliente" role="cell">
                      <span className="avatar-circulo" aria-hidden="true">
                        {inicialesCliente(solicitud.cliente)}
                      </span>
                      <span className="solicitud-cliente-info">
                        <span className="solicitud-cliente-nombre">
                          {solicitud.cliente?.nombre_empresa ||
                            solicitud.cliente?.nombre_obra ||
                            'Cliente'}
                        </span>
                        <span className="solicitud-cliente-sub">
                          {solicitud.cliente?.nombre_responsable ||
                            'Sin responsable'}
                        </span>
                      </span>
                    </span>

                    <span className="solicitud-obra" role="cell" data-label="Obra">
                      {solicitud.cliente?.nombre_obra ?? '—'}
                    </span>

                    <span
                      className="solicitud-maquina"
                      role="cell"
                      data-label="Máquina"
                    >
                      {tipoMaquinaVisible(solicitud.tipo_maquina)}
                    </span>

                    <span
                      className="solicitud-fecha"
                      role="cell"
                      data-label="Requerida"
                    >
                      {formatearFechaSolicitud(solicitud.fecha_requerida)}
                    </span>

                    <span
                      className="solicitud-horas"
                      role="cell"
                      data-label="Horas"
                    >
                      {solicitud.horas_estimadas} h
                    </span>

                    <span className="solicitud-estado" role="cell">
                      <EstadoPill estado={solicitud.estado} compacto />
                    </span>

                    <span className="solicitud-flecha" aria-hidden="true">
                      <ArrowRightIcon />
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                Icono={SearchIcon}
                titulo="No encontramos solicitudes"
                texto="Prueba con otro término de búsqueda o cambia el filtro de estado."
                accion={
                  <button
                    className="btn btn-fantasma"
                    type="button"
                    onClick={() => {
                      setBusqueda('');
                      setFiltro('Todas');
                    }}
                  >
                    Limpiar filtros
                  </button>
                }
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
