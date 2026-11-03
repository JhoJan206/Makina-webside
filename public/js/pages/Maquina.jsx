import { useState } from 'react';
import Chart from '../components/Chart.jsx';
import {
  DialogoAsignar,
  DialogoCerrarAsignacion,
  textoDias,
} from '../components/DialogosAsignacion.jsx';
import EmptyState from '../components/EmptyState.jsx';
import NoEncontrado from '../components/NoEncontrado.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  LinkIcon,
  MapPinIcon,
  StopIcon,
  TrendingUpIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import { diasEntre, fechaDeHoy, listarAsignaciones } from '../data/asignaciones.js';
import {
  formatearFecha,
  formatearMoneda,
  historialOperadores,
  inicialesOperador,
  nombreMaquina,
  nombreOperador,
  obraActualMaquina,
  obtenerMaquina,
  obtenerOperadorActual,
  registrosMaquina,
  resumenMaquina,
  tipoMaquinaVisible,
} from '../data/datos.js';

const tabs = [
  { id: 'todos', texto: 'Todos' },
  { id: 'ingreso', texto: 'Ingresos' },
  { id: 'egreso', texto: 'Egresos' },
];

export default function Maquina() {
  const idRuta = window.location.pathname.split('/').filter(Boolean).pop();
  const maquina = obtenerMaquina(idRuta);
  const [tab, setTab] = useState('todos');
  // 'asignar' | 'cerrar' | null
  const [dialogo, setDialogo] = useState(null);
  const [aviso, setAviso] = useState('');

  function terminarDialogo(mensaje) {
    setDialogo(null);
    setAviso(mensaje);
  }

  if (!maquina) {
    return (
      <NoEncontrado
        activo="Maquinaria"
        clase="pagina-maquina"
        migas={[{ texto: 'maquinaria', href: '/maquinaria' }]}
        Icono={TruckIcon}
        titulo="Máquina no encontrada"
        volver={{ href: '/maquinaria', texto: 'Volver a maquinaria' }}
      />
    );
  }

  const operador = obtenerOperadorActual(maquina.id_maquina);
  const resumen = resumenMaquina(maquina.id_maquina);
  const historial = historialOperadores(maquina.id_maquina);
  const registros = registrosMaquina(maquina.id_maquina);
  const asignacionActual =
    listarAsignaciones().find(
      (asignacion) => asignacion.activa && asignacion.id_maquina === maquina.id_maquina,
    ) ?? null;

  const visibles =
    tab === 'todos'
      ? registros.slice(0, 4)
      : registros.filter((registro) => registro.tipo === tab);

  return (
    <div className="dashboard pagina-maquina">
      <Sidebar activo="Maquinaria" />

      <div className="dashboard-principal">
        <Topbar
          migas={[
            { texto: 'maquinaria', href: '/maquinaria' },
            { texto: nombreMaquina(maquina) },
          ]}
        />

        <main className="dashboard-contenido maquina-contenido">
          <a className="volver" href="/maquinaria">
            <ArrowLeftIcon />
            Volver a maquinaria
          </a>

          <section className="tarjeta detalle-hero detalle-hero-maquina">
            <div className="detalle-hero-media">
              <img src={maquina.imagen} alt={maquina.alt} />
              <span className="detalle-hero-media-placa">
                {maquina.placa}
              </span>
            </div>

            <div className="detalle-hero-info">
              <div className="detalle-hero-cabecera">
                <div>
                  <p className="page-eyebrow">
                    Maquinaria · {tipoMaquinaVisible(maquina.tipo)}
                  </p>
                  <h1>{nombreMaquina(maquina)}</h1>
                  <p className="detalle-hero-sub">
                    Placa <strong>{maquina.placa}</strong> · Tipo{' '}
                    <strong>{maquina.tipo}</strong>
                  </p>
                </div>

                <span className={`pastilla ${operador ? 'verde' : 'gris'}`}>
                  {operador ? 'Activa' : 'Sin operador'}
                </span>
              </div>

              <div className="detalle-hero-chips">
                <span className="chip">
                  <DollarIcon />
                  {formatearMoneda(maquina.valor_hora, false)} / hora
                </span>
                <span className="chip">
                  <UserIcon />
                  {operador ? nombreOperador(operador) : 'Sin asignar'}
                </span>
                <span className="chip">
                  <MapPinIcon />
                  {obraActualMaquina(maquina.id_maquina)}
                </span>
              </div>

              <div className="detalle-hero-acciones">
                <button
                  className="btn btn-primario"
                  type="button"
                  onClick={() => setDialogo('asignar')}
                >
                  <LinkIcon />
                  {operador ? 'Cambiar operador' : 'Asignar operador'}
                </button>
                {asignacionActual && (
                  <button
                    className="btn btn-fantasma"
                    type="button"
                    onClick={() => setDialogo('cerrar')}
                  >
                    <StopIcon />
                    Cerrar asignación
                  </button>
                )}
              </div>
            </div>
          </section>

          {aviso && (
            <p className="admin-aviso" role="status">
              <CheckIcon />
              {aviso}
            </p>
          )}

          <section className="stats-grid tres" aria-label="Resumen de la máquina">
            <StatCard
              etiqueta="Horas trabajadas"
              valor={`${resumen.horas} h`}
              detalle="Acumulado del mes"
              Icono={ClockIcon}
              tono="azul"
            />
            <StatCard
              etiqueta="Ganancia del equipo"
              valor={formatearMoneda(resumen.ganancia)}
              detalle={`${formatearMoneda(resumen.ingresos)} ingresos − ${formatearMoneda(
                resumen.egresos,
              )} egresos este mes`}
              Icono={TrendingUpIcon}
              tono={resumen.ganancia < 0 ? 'rojo' : 'verde'}
            />
            <StatCard
              etiqueta="Operador actual"
              valor={asignacionActual ? textoDias(asignacionActual.dias) : '—'}
              detalle={
                operador
                  ? `${nombreOperador(operador)} a cargo`
                  : `${historial.length} ${
                      historial.length === 1 ? 'asignación' : 'asignaciones'
                    } en el historial`
              }
              Icono={UsersIcon}
              tono="neutro"
            />
          </section>

          <div className="detalle-grid">
            <section className="tarjeta panel-registros">
              <header className="panel-cabecera panel-cabecera-registros">
                <div>
                  <p className="panel-eyebrow">Movimientos</p>
                  <h2>Registros del mes</h2>
                </div>

                <div className="tabs" role="tablist" aria-label="Filtrar registros">
                  {tabs.map(({ id, texto }) => (
                    <button
                      key={id}
                      className={tab === id ? 'tab activo' : 'tab'}
                      type="button"
                      role="tab"
                      aria-selected={tab === id}
                      onClick={() => setTab(id)}
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </header>

              {visibles.length > 0 ? (
                <div className="tabla-registros" role="table" aria-label="Registros del mes">
                  <div className="tabla-fila tabla-encabezado" role="row">
                    <span role="columnheader">Descripción</span>
                    <span className="col-cliente" role="columnheader">
                      Cliente / obra
                    </span>
                    <span role="columnheader">Fecha</span>
                    <span className="tabla-valor" role="columnheader">
                      Valor
                    </span>
                  </div>

                  {visibles.map((registro) => (
                    <div className="tabla-fila" role="row" key={registro.id}>
                      <span className="tabla-descripcion" role="cell">
                        {registro.descripcion}
                      </span>
                      <span className="tabla-cliente col-cliente" role="cell">
                        {registro.cliente}
                      </span>
                      <span className="tabla-fecha" role="cell">
                        {formatearFecha(registro.fecha)}
                      </span>
                      <span
                        className={`tabla-valor ${
                          registro.tipo === 'ingreso' ? 'verde' : 'rojo'
                        }`}
                        role="cell"
                      >
                        {registro.tipo === 'ingreso' ? '+' : '−'}
                        {formatearMoneda(registro.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  Icono={ClockIcon}
                  titulo="Sin registros"
                  texto="No hay movimientos para el filtro seleccionado."
                />
              )}
            </section>

            <aside className="tarjeta panel-historial">
              <header className="panel-cabecera">
                <div>
                  <p className="panel-eyebrow">Equipo</p>
                  <h2>Historial de operadores</h2>
                </div>
              </header>

              {historial.length > 0 ? (
                <div className="historial-lista">
                  {historial.map(
                    ({ id, operador: persona, fecha_ingreso, fecha_salida }) => {
                      const actual = fecha_salida === null;
                      const dias = diasEntre(fecha_ingreso, fecha_salida ?? fechaDeHoy());

                      return (
                        <div className="historial-item" key={id}>
                          <span className="avatar-circulo" aria-hidden="true">
                            {inicialesOperador(persona)}
                          </span>

                          <div className="historial-info">
                            <a
                              className="historial-titulo"
                              href={`/operador/${persona.id_operador}`}
                            >
                              {nombreOperador(persona)}
                            </a>
                            <p className="historial-sub">
                              {actual
                                ? `Desde ${formatearFecha(fecha_ingreso, true)}`
                                : `${formatearFecha(fecha_ingreso, true)} – ${formatearFecha(fecha_salida, true)}`}
                              {` · ${textoDias(dias)}`}
                            </p>
                          </div>

                          {actual && <span className="pastilla verde">Actual</span>}
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <EmptyState
                  Icono={UsersIcon}
                  titulo="Sin asignaciones"
                  texto="Esta máquina todavía no ha tenido operadores."
                />
              )}
            </aside>
          </div>

          <Chart idsMaquinas={[maquina.id_maquina]} />
        </main>
      </div>

      {dialogo === 'asignar' && (
        <DialogoAsignar
          maquina={maquina}
          onCerrar={() => setDialogo(null)}
          onAsignado={terminarDialogo}
        />
      )}
      {dialogo === 'cerrar' && asignacionActual && (
        <DialogoCerrarAsignacion
          asignacion={asignacionActual}
          onCerrar={() => setDialogo(null)}
          onCerrada={terminarDialogo}
        />
      )}
    </div>
  );
}
