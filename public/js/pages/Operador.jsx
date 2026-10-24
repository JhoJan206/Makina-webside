import { useState } from 'react';
import Chart from '../components/Chart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  formatearFecha,
  formatearMoneda,
  historialMaquinas,
  inicialesMaquina,
  inicialesOperador,
  nombreMaquina,
  nombreOperador,
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
          <section className="tarjeta operador-resumen">
            <div className="operador-resumen-avatar" aria-hidden="true">
              {inicialesOperador(operador)}
            </div>

            <div className="operador-resumen-info">
              <h1>{nombreOperador(operador)}</h1>

              <p className="operador-resumen-meta">
                <span>
                  C.C. <strong>{operador.cedula}</strong>
                </span>
                <span className="separador">|</span>
                <span>
                  Sueldo:{' '}
                  <strong>{formatearMoneda(operador.sueldo, false)}</strong>
                </span>
              </p>

              <p className="operador-resumen-maquina">
                Máquina actual:{' '}
                <strong>
                  {maquina ? nombreMaquina(maquina) : 'Sin asignar'}
                </strong>
              </p>
            </div>

            <span className={`pastilla ${maquina ? 'verde' : 'gris'}`}>
              {maquina ? 'Activo' : 'Inactivo'}
            </span>
          </section>

          <section className="kpis-detalle" aria-label="Resumen del operador">
            <article className="kpi">
              <p className="kpi-etiqueta">Máquinas asignadas</p>
              <p className="kpi-valor">{resumen.maquinas}</p>
            </article>

            <article className="kpi verde">
              <p className="kpi-etiqueta">Horas trabajadas</p>
              <p className="kpi-valor">{resumen.horas} h</p>
            </article>

            <article className="kpi ambar">
              <p className="kpi-etiqueta">Ingresos generados</p>
              <p className="kpi-valor">{formatearMoneda(resumen.ingresos)}</p>
            </article>

            <article className="kpi">
              <p className="kpi-etiqueta">Sueldo</p>
              <p className="kpi-valor">
                {formatearMoneda(operador.sueldo, false)}
              </p>
            </article>
          </section>

          <div className="detalle-grid">
            <section className="tarjeta panel-registros">
              <header className="panel-cabecera panel-cabecera-registros">
                <h2>Registros del mes</h2>

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
                      {registro.tipo === 'ingreso' ? '+' : '-'}
                      {formatearMoneda(registro.valor)}
                    </span>
                  </div>
                ))}

                {visibles.length === 0 && (
                  <p className="tabla-vacia">Sin registros para este filtro.</p>
                )}
              </div>
            </section>

            <aside className="tarjeta panel-operadores">
              <header className="panel-cabecera">
                <h2>Historial de máquinas</h2>
              </header>

              <div className="lista-operadores">
                {historial.map(
                  ({ id, maquina: equipo, fecha_ingreso, fecha_salida }) => {
                    const actual = fecha_salida === null;

                    return (
                      <div className="operador" key={id}>
                        <span className="operador-avatar" aria-hidden="true">
                          {inicialesMaquina(equipo)}
                        </span>

                        <div className="operador-info">
                          <p className="operador-nombre">
                            {nombreMaquina(equipo)}
                          </p>
                          <p className="operador-fecha">
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
