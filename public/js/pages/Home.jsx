import Chart from '../components/Chart.jsx';
import EstadoPill from '../components/EstadoPill.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  ArrowRightIcon,
  ClipboardIcon,
  ClockIcon,
  DollarIcon,
  TrendingUpIcon,
} from '../components/Icons.jsx';
import {
  formatearFecha,
  formatearMoneda,
  maquinas,
  nombreMaquina,
  nombreOperador,
  obtenerOperadorActual,
  resumenGeneral,
  tipoMaquinaVisible,
  ultimosRegistros,
} from '../data/datos.js';
import {
  formatearFechaSolicitud,
  inicialesCliente,
  listarSolicitudes,
} from '../data/solicitudes.js';

export default function Home() {
  const resumen = resumenGeneral();
  const solicitudes = listarSolicitudes().slice(0, 4);
  const registros = ultimosRegistros(4);
  const activas = maquinas.filter((maquina) =>
    Boolean(obtenerOperadorActual(maquina.id_maquina)),
  ).length;
  const margen =
    resumen.ingresos > 0
      ? Math.round((resumen.ganancia / resumen.ingresos) * 100)
      : 0;

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'inicio' }]} />

        <main className="dashboard-contenido">
          <PageHeader
            eyebrow="Panel de control"
            titulo="Resumen de operación"
            descripcion="Ingresos, maquinaria y solicitudes de trabajo en un solo lugar."
            acciones={
              <a className="btn btn-primario" href="/solicitudes">
                <ClipboardIcon />
                Ver solicitudes
              </a>
            }
          />

          <section className="stats-grid" aria-label="Resumen del periodo">
            <StatCard
              etiqueta="Ingresos del mes"
              valor={formatearMoneda(resumen.ingresos)}
              detalle="Facturación del periodo"
              Icono={DollarIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Egresos del mes"
              valor={formatearMoneda(resumen.egresos)}
              detalle="Costos operativos"
              Icono={TrendingUpIcon}
              tono="rojo"
            />
            <StatCard
              etiqueta="Ganancia neta"
              valor={formatearMoneda(resumen.ganancia)}
              detalle={`${margen}% de margen`}
              Icono={TrendingUpIcon}
              tono="ambar"
            />
            <StatCard
              etiqueta="Horas trabajadas"
              valor={`${resumen.horas} h`}
              detalle={`${activas} de ${maquinas.length} máquinas activas`}
              Icono={ClockIcon}
              tono="azul"
            />
          </section>

          <div className="panel-grid panel-grid-home">
            <div className="panel-columna">
              <Chart />

              <section className="tarjeta panel-solicitudes">
                <header className="panel-cabecera">
                  <div>
                    <p className="panel-eyebrow">Solicitudes</p>
                    <h2>Últimas solicitudes</h2>
                  </div>
                  <a className="panel-enlace" href="/solicitudes">
                    Ver todas
                    <ArrowRightIcon />
                  </a>
                </header>

                <div className="panel-cuerpo panel-cuerpo-lista">
                  {solicitudes.map((solicitud) => (
                    <a
                      className="solicitud-mini"
                      href={`/solicitud/${solicitud.id_solicitud}`}
                      key={solicitud.id_solicitud}
                    >
                      <span className="avatar-circulo" aria-hidden="true">
                        {inicialesCliente(solicitud.cliente)}
                      </span>

                      <span className="solicitud-mini-info">
                        <span className="solicitud-mini-titulo">
                          {solicitud.cliente?.nombre_obra ?? 'Cliente'}
                        </span>
                        <span className="solicitud-mini-sub">
                          {tipoMaquinaVisible(solicitud.tipo_maquina)} ·{' '}
                          {formatearFechaSolicitud(solicitud.fecha_requerida)}
                        </span>
                      </span>

                      <EstadoPill estado={solicitud.estado} compacto />
                    </a>
                  ))}
                </div>
              </section>
            </div>

            <div className="panel-columna">
              <section className="tarjeta panel-flota">
                <header className="panel-cabecera">
                  <div>
                    <p className="panel-eyebrow">Flota</p>
                    <h2>Estado de la maquinaria</h2>
                  </div>
                  <a className="panel-enlace" href="/maquinaria">
                    Ver flota
                    <ArrowRightIcon />
                  </a>
                </header>

                <div className="panel-cuerpo panel-cuerpo-lista">
                  {maquinas.map((maquina) => {
                    const operador = obtenerOperadorActual(maquina.id_maquina);

                    return (
                      <a
                        className="flota-mini"
                        href={`/maquinaria/${maquina.placa}`}
                        key={maquina.id_maquina}
                      >
                        <span className="flota-mini-foto">
                          <img src={maquina.imagen} alt="" />
                        </span>

                        <span className="flota-mini-info">
                          <span className="flota-mini-titulo">
                            {nombreMaquina(maquina)}
                          </span>
                          <span className="flota-mini-sub">
                            {operador
                              ? nombreOperador(operador)
                              : 'Sin operador asignado'}
                          </span>
                        </span>

                        <span
                          className={`pastilla ${operador ? 'verde' : 'gris'}`}
                        >
                          {operador ? 'Activa' : 'Libre'}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </section>

              <section className="tarjeta panel-movimientos">
                <header className="panel-cabecera">
                  <div>
                    <p className="panel-eyebrow">Movimientos</p>
                    <h2>Últimos registros</h2>
                  </div>
                </header>

                <div className="panel-cuerpo panel-cuerpo-lista">
                  {registros.map((registro) => (
                    <div className="movimiento-mini" key={registro.id}>
                      <span
                        className={`movimiento-icono ${registro.tipo}`}
                        aria-hidden="true"
                      >
                        {registro.tipo === 'ingreso' ? '+' : '−'}
                      </span>

                      <span className="movimiento-info">
                        <span className="movimiento-titulo">
                          {registro.descripcion}
                        </span>
                        <span className="movimiento-sub">
                          {registro.maquina} · {formatearFecha(registro.fecha)}
                        </span>
                      </span>

                      <span className={`monto ${registro.tipo === 'ingreso' ? 'verde' : 'rojo'}`}>
                        {registro.tipo === 'ingreso' ? '+' : '−'}
                        {formatearMoneda(registro.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
