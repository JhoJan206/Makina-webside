import { useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import EstadoPill from '../components/EstadoPill.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  DollarIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from '../components/Icons.jsx';
import {
  formatearMoneda,
  telefonoEnlace,
  tipoMaquinaVisible,
} from '../data/datos.js';
import {
  actualizarEstado,
  formatearFechaHora,
  formatearFechaSolicitud,
  inicialesCliente,
  obtenerSolicitud,
  tarifaTipo,
  valorEstimadoSolicitud,
} from '../data/solicitudes.js';

const acciones = [
  { estado: 'Contactado', Icono: PhoneIcon, clase: 'btn-fantasma' },
  { estado: 'Aprobada', Icono: CheckIcon, clase: 'btn-exito' },
  { estado: 'Rechazada', Icono: XIcon, clase: 'btn-peligro' },
  { estado: 'Completada', Icono: ClipboardIcon, clase: 'btn-primario' },
];

export default function Solicitud() {
  const idRuta = window.location.pathname.split('/').filter(Boolean).pop();
  const [solicitud, setSolicitud] = useState(() => obtenerSolicitud(idRuta));
  const [aviso, setAviso] = useState('');

  if (!solicitud) {
    return (
      <div className="dashboard pagina-solicitud">
        <Sidebar activo="Solicitudes" />

        <div className="dashboard-principal">
          <Topbar migas={[{ texto: 'solicitudes', href: '/solicitudes' }]} />

          <main className="dashboard-contenido solicitud-contenido">
            <EmptyState
              Icono={ClipboardIcon}
              titulo="Solicitud no encontrada"
              texto="Es posible que el enlace esté incompleto o que la solicitud ya no exista."
              accion={
                <a className="btn btn-primario" href="/solicitudes">
                  Volver a solicitudes
                </a>
              }
            />
          </main>
        </div>
      </div>
    );
  }

  const cliente = solicitud.cliente;
  const tipoVisible = tipoMaquinaVisible(solicitud.tipo_maquina);
  const tarifa = tarifaTipo(solicitud.tipo_maquina);
  const estimado = valorEstimadoSolicitud(solicitud);
  const telefonoDigitos = String(cliente?.telefono ?? '').replace(/\D/g, '');
  const mensajeWhatsApp = encodeURIComponent(
    `Hola ${cliente?.nombre_responsable || ''}, te contactamos de Makina por la solicitud #${solicitud.id_solicitud}.`,
  );

  function cambiarEstado(estado) {
    const actualizada = actualizarEstado(solicitud.id_solicitud, estado);

    if (!actualizada) return;

    setSolicitud(actualizada);
    setAviso(`La solicitud quedó marcada como "${estado}".`);
  }

  return (
    <div className="dashboard pagina-solicitud">
      <Sidebar activo="Solicitudes" />

      <div className="dashboard-principal">
        <Topbar
          migas={[
            { texto: 'solicitudes', href: '/solicitudes' },
            { texto: `#${solicitud.id_solicitud}` },
          ]}
        />

        <main className="dashboard-contenido solicitud-contenido">
          <a className="volver" href="/solicitudes">
            <ArrowLeftIcon />
            Volver a solicitudes
          </a>

          <PageHeader
            eyebrow="Solicitud de trabajo"
            titulo={`${tipoVisible} · ${cliente?.nombre_obra ?? 'Cliente'}`}
            descripcion={`Recibida el ${formatearFechaHora(solicitud.created_at)}`}
            acciones={<EstadoPill estado={solicitud.estado} />}
          />

          {aviso && (
            <div className="aviso-exito" role="status">
              <CheckIcon />
              {aviso}
            </div>
          )}

          <div className="solicitud-grid">
            <div className="solicitud-columna">
              <section className="tarjeta detalle-panel">
                <header className="panel-cabecera">
                  <div>
                    <p className="panel-eyebrow">Trabajo</p>
                    <h2>Detalle del requerimiento</h2>
                  </div>
                  <span className="solicitud-id">#{solicitud.id_solicitud}</span>
                </header>

                <div className="detalle-lista">
                  <div className="detalle-item">
                    <span className="detalle-item-icono" aria-hidden="true">
                      <TruckIcon />
                    </span>
                    <div>
                      <span className="detalle-item-etiqueta">
                        Tipo de máquina
                      </span>
                      <strong>{tipoVisible}</strong>
                    </div>
                  </div>

                  <div className="detalle-item">
                    <span className="detalle-item-icono" aria-hidden="true">
                      <CalendarIcon />
                    </span>
                    <div>
                      <span className="detalle-item-etiqueta">
                        Fecha requerida
                      </span>
                      <strong>
                        {formatearFechaSolicitud(solicitud.fecha_requerida)}
                      </strong>
                    </div>
                  </div>

                  <div className="detalle-item">
                    <span className="detalle-item-icono" aria-hidden="true">
                      <ClockIcon />
                    </span>
                    <div>
                      <span className="detalle-item-etiqueta">
                        Horas estimadas
                      </span>
                      <strong>{solicitud.horas_estimadas} horas</strong>
                    </div>
                  </div>

                  <div className="detalle-item">
                    <span className="detalle-item-icono" aria-hidden="true">
                      <DollarIcon />
                    </span>
                    <div>
                      <span className="detalle-item-etiqueta">
                        Valor estimado
                      </span>
                      <strong>{formatearMoneda(estimado, false)}</strong>
                      <span className="detalle-item-nota">
                        Tarifa {formatearMoneda(tarifa, false)} / hora
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detalle-descripcion">
                  <h3>Descripción del trabajo</h3>
                  <p>
                    {solicitud.descripcion ||
                      'El cliente no agregó una descripción adicional.'}
                  </p>
                </div>
              </section>

              <section className="tarjeta detalle-panel">
                <header className="panel-cabecera">
                  <div>
                    <p className="panel-eyebrow">Seguimiento</p>
                    <h2>Actualizar estado</h2>
                  </div>
                </header>

                <div className="detalle-panel-cuerpo">
                  <p className="detalle-ayuda">
                    Cambia el estado a medida que avanzas con el cliente. El
                    cambio se guarda en este navegador.
                  </p>

                  <div className="acciones-estado">
                    {acciones
                      .filter(({ estado }) => estado !== solicitud.estado)
                      .map(({ estado, Icono, clase }) => (
                        <button
                          key={estado}
                          className={`btn ${clase}`}
                          type="button"
                          onClick={() => cambiarEstado(estado)}
                        >
                          <Icono />
                          {estado}
                        </button>
                      ))}

                    {solicitud.estado !== 'Pendiente' && (
                      <button
                        className="btn btn-fantasma"
                        type="button"
                        onClick={() => cambiarEstado('Pendiente')}
                      >
                        <ClockIcon />
                        Volver a pendiente
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="solicitud-columna solicitud-columna-lateral">
              <section className="tarjeta contacto-card">
                <header className="panel-cabecera">
                  <div>
                    <p className="panel-eyebrow">Cliente</p>
                    <h2>Información de contacto</h2>
                  </div>
                </header>

                <div className="contacto-card-cuerpo">
                  <div className="contacto-cabecera">
                    <span className="contacto-avatar" aria-hidden="true">
                      {inicialesCliente(cliente)}
                    </span>
                    <div>
                      <h3>
                        {cliente?.nombre_empresa ||
                          cliente?.nombre_obra ||
                          'Cliente'}
                      </h3>
                      <p>
                        {cliente?.nombre_responsable || 'Sin responsable'}
                      </p>
                    </div>
                  </div>

                  <dl className="contacto-datos">
                    <div>
                      <dt>
                        <BuildingIcon />
                        Empresa
                      </dt>
                      <dd>{cliente?.nombre_empresa || '—'}</dd>
                    </div>
                    <div>
                      <dt>
                        <MapPinIcon />
                        Obra
                      </dt>
                      <dd>{cliente?.nombre_obra || '—'}</dd>
                    </div>
                    <div>
                      <dt>
                        <UserIcon />
                        Responsable
                      </dt>
                      <dd>{cliente?.nombre_responsable || '—'}</dd>
                    </div>
                    <div>
                      <dt>
                        <PhoneIcon />
                        Teléfono
                      </dt>
                      <dd>
                        {cliente?.telefono ? (
                          <a href={telefonoEnlace(cliente.telefono)}>
                            {cliente.telefono}
                          </a>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="contacto-acciones">
                    {cliente?.telefono && (
                      <a
                        className="btn btn-primario"
                        href={telefonoEnlace(cliente.telefono)}
                      >
                        <PhoneIcon />
                        Llamar
                      </a>
                    )}

                    {telefonoDigitos && (
                      <a
                        className="btn btn-fantasma"
                        href={`https://wa.me/57${telefonoDigitos}?text=${mensajeWhatsApp}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </section>

              <section className="tarjeta resumen-card">
                <header className="panel-cabecera">
                  <div>
                    <p className="panel-eyebrow">Registro</p>
                    <h2>Resumen</h2>
                  </div>
                </header>

                <dl className="resumen-lista">
                  <div>
                    <dt>ID de solicitud</dt>
                    <dd>#{solicitud.id_solicitud}</dd>
                  </div>
                  <div>
                    <dt>Estado actual</dt>
                    <dd>
                      <EstadoPill estado={solicitud.estado} compacto />
                    </dd>
                  </div>
                  <div>
                    <dt>Creada</dt>
                    <dd>{formatearFechaHora(solicitud.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Última actualización</dt>
                    <dd>{formatearFechaHora(solicitud.updated_at)}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
