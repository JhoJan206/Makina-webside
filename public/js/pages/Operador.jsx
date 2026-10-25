import { useState } from 'react';
import Chart from '../components/Chart.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  DollarIcon,
  MapPinIcon,
  TruckIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import {
  formatearFecha,
  formatearMoneda,
  historialMaquinas,
  inicialesMaquina,
  inicialesOperador,
  nombreMaquina,
  nombreOperador,
  obraActualMaquina,
  obtenerAsignacionActualOperador,
  obtenerMaquina,
  obtenerOperador,
  registrosOperador,
  resumenOperador,
} from '../data/datos.js';

const tabs = [
  { id: 'todos', texto: 'Todos' },
  { id: 'ingreso', texto: 'Ingresos' },
  { id: 'egreso', texto: 'Egresos' },
];

export default function Operador() {
  const idRuta = window.location.pathname.split('/').filter(Boolean).pop();
  const operador = obtenerOperador(idRuta);
  const asignacion = obtenerAsignacionActualOperador(operador.id_operador);
  const maquina = asignacion ? obtenerMaquina(asignacion.id_maquina) : null;
  const resumen = resumenOperador(operador.id_operador);
  const historial = historialMaquinas(operador.id_operador);
  const registros = registrosOperador(operador.id_operador);
  const [tab, setTab] = useState('todos');

  const visibles =
    tab === 'todos'
      ? registros.slice(0, 4)
      : registros.filter((registro) => registro.tipo === tab);

  return (
    <div className="dashboard pagina-operador">
      <Sidebar activo="Operadores" />

      <div className="dashboard-principal">
        <Topbar
          migas={[
            { texto: 'operadores', href: '/operadores' },
            { texto: nombreOperador(operador) },
          ]}
        />

        <main className="dashboard-contenido operador-contenido">
          <a className="volver" href="/operadores">
            <ArrowLeftIcon />
            Volver a operadores
          </a>

          <section className="tarjeta detalle-hero detalle-hero-operador">
            <div className="detalle-hero-avatar" aria-hidden="true">
              {inicialesOperador(operador)}
            </div>

            <div className="detalle-hero-info">
              <div className="detalle-hero-cabecera">
                <div>
                  <p className="page-eyebrow">Equipo · Operador</p>
                  <h1>{nombreOperador(operador)}</h1>
                  <p className="detalle-hero-sub">
                    C.C. <strong>{operador.cedula}</strong> · Sueldo{' '}
                    <strong>{formatearMoneda(operador.sueldo, false)}</strong>
                  </p>
                </div>

                <span className={`pastilla ${maquina ? 'verde' : 'gris'}`}>
                  {maquina ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="detalle-hero-chips">
                <span className="chip">
                  <TruckIcon />
                  {maquina ? nombreMaquina(maquina) : 'Sin asignar'}
                </span>
                <span className="chip">
                  <MapPinIcon />
                  {maquina ? obraActualMaquina(maquina.id_maquina) : 'Sin obra'}
                </span>
                <span className="chip">
                  <ClockIcon />
                  {asignacion
                    ? `Desde ${formatearFecha(asignacion.fecha_ingreso, true)}`
                    : 'Sin asignación activa'}
                </span>
              </div>

              <div className="detalle-hero-acciones">
                <a className="btn btn-primario" href="/maquinaria">
                  Ver maquinaria
                  <ArrowRightIcon />
                </a>
                <a className="btn btn-fantasma" href="/operadores">
                  Ver equipo
                </a>
              </div>
            </div>
          </section>

          <section className="stats-grid" aria-label="Resumen del operador">
            <StatCard
              etiqueta="Máquinas asignadas"
              valor={resumen.maquinas}
              detalle="Asignaciones activas"
              Icono={UsersIcon}
              tono="neutro"
            />
            <StatCard
              etiqueta="Horas trabajadas"
              valor={`${resumen.horas} h`}
              detalle="Acumulado del periodo"
              Icono={ClockIcon}
              tono="azul"
            />
            <StatCard
              etiqueta="Ingresos generados"
              valor={formatearMoneda(resumen.ingresos)}
              detalle="Facturación asociada"
              Icono={DollarIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Sueldo"
              valor={formatearMoneda(operador.sueldo, false)}
              detalle="Pago mensual"
              Icono={DollarIcon}
              tono="ambar"
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
                    <span className="col-maquina" role="columnheader">
                      Máquina
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
                      <span className="tabla-maquina col-maquina" role="cell">
                        {registro.maquina}
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
                  <p className="panel-eyebrow">Trayectoria</p>
                  <h2>Historial de máquinas</h2>
                </div>
              </header>

              <div className="historial-lista">
                {historial.map(
                  ({ id, maquina: equipo, fecha_ingreso, fecha_salida }) => {
                    const actual = fecha_salida === null;

                    return (
                      <div className="historial-item" key={id}>
                        <span className="avatar-circulo" aria-hidden="true">
                          {inicialesMaquina(equipo)}
                        </span>

                        <div className="historial-info">
                          <p className="historial-titulo">
                            {nombreMaquina(equipo)}
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

          {resumen.horas > 0 && <Chart />}
        </main>
      </div>
    </div>
  );
}
