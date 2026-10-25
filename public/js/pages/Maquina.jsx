import { useState } from 'react';
import Chart from '../components/Chart.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  ArrowLeftIcon,
  ClockIcon,
  DollarIcon,
  MapPinIcon,
  TrendingUpIcon,
  UserIcon,
} from '../components/Icons.jsx';
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
  const operador = obtenerOperadorActual(maquina.id_maquina);
  const resumen = resumenMaquina(maquina.id_maquina);
  const historial = historialOperadores(maquina.id_maquina);
  const registros = registrosMaquina(maquina.id_maquina);
  const [tab, setTab] = useState('todos');

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
                <a className="btn btn-primario" href="/maquinaria">
                  Ver flota
                </a>
              </div>
            </div>
          </section>

          <section className="stats-grid" aria-label="Resumen de la máquina">
            <StatCard
              etiqueta="Ingresos del mes"
              valor={formatearMoneda(resumen.ingresos)}
              detalle="Facturación del equipo"
              Icono={DollarIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Egresos del mes"
              valor={formatearMoneda(resumen.egresos)}
              detalle="Costos del equipo"
              Icono={TrendingUpIcon}
              tono="rojo"
            />
            <StatCard
              etiqueta="Ganancia neta"
              valor={formatearMoneda(resumen.ganancia)}
              detalle="Utilidad del periodo"
              Icono={TrendingUpIcon}
              tono="ambar"
            />
            <StatCard
              etiqueta="Horas trabajadas"
              valor={`${resumen.horas} h`}
              detalle="Acumulado del mes"
              Icono={ClockIcon}
              tono="azul"
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

              <div className="historial-lista">
                {historial.map(
                  ({ id, operador: persona, fecha_ingreso, fecha_salida }) => {
                    const actual = fecha_salida === null;

                    return (
                      <div className="historial-item" key={id}>
                        <span className="avatar-circulo" aria-hidden="true">
                          {inicialesOperador(persona)}
                        </span>

                        <div className="historial-info">
                          <p className="historial-titulo">
                            {nombreOperador(persona)}
                          </p>
                          <p className="historial-sub">
                            {actual
                              ? `Desde ${formatearFecha(fecha_ingreso, true)}`
                              : `${formatearFecha(fecha_ingreso, true)} – ${formatearFecha(fecha_salida, true)}`}
                          </p>
                        </div>

                        {actual && <span className="pastilla verde">Actual</span>}
                      </div>
                    );
                  },
                )}
              </div>
            </aside>
          </div>

          <Chart />
        </main>
      </div>
    </div>
  );
}
