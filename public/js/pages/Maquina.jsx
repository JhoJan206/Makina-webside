import { useState } from 'react';
import Chart from '../components/Chart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  formatearFecha,
  formatearMoneda,
  historialOperadores,
  inicialesMaquina,
  inicialesOperador,
  nombreMaquina,
  nombreOperador,
  obtenerMaquina,
  obtenerOperadorActual,
  registrosMaquina,
  resumenMaquina,
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
          <section className="tarjeta maquina-resumen">
            <div className="maquina-resumen-icono">
              {inicialesMaquina(maquina)}
            </div>

            <div className="maquina-resumen-info">
              <h1>{nombreMaquina(maquina)}</h1>

              <p className="maquina-resumen-meta">
                <span>
                  Placa: <strong>{maquina.placa}</strong>
                </span>
                <span className="separador">|</span>
                <span>
                  Tipo: <strong>{maquina.tipo}</strong>
                </span>
                <span className="maquina-resumen-valor">
                  {formatearMoneda(maquina.valor_hora, false)} / hora
                </span>
              </p>

              <p className="maquina-resumen-operador">
                Operador actual:{' '}
                <strong>
                  {operador ? nombreOperador(operador) : 'Sin asignar'}
                </strong>
              </p>
            </div>

            <span className={`pastilla ${operador ? 'verde' : 'gris'}`}>
              {operador ? 'Activa' : 'Sin operador'}
            </span>
          </section>

          <section className="kpis-detalle" aria-label="Resumen de la máquina">
            <article className="kpi verde">
              <p className="kpi-etiqueta">Ingresos del mes</p>
              <p className="kpi-valor">{formatearMoneda(resumen.ingresos)}</p>
            </article>

            <article className="kpi rojo">
              <p className="kpi-etiqueta">Egresos del mes</p>
              <p className="kpi-valor">{formatearMoneda(resumen.egresos)}</p>
            </article>

            <article className="kpi ambar">
              <p className="kpi-etiqueta">Ganancia neta</p>
              <p className="kpi-valor">{formatearMoneda(resumen.ganancia)}</p>
            </article>

            <article className="kpi">
              <p className="kpi-etiqueta">Horas trabajadas</p>
              <p className="kpi-valor">{resumen.horas} h</p>
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
                  <span className="col-cliente" role="columnheader">
                    Cliente/obra
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
                <h2>Historial de operadores</h2>
              </header>

              <div className="lista-operadores">
                {historial.map(
                  ({
                    id,
                    operador: persona,
                    fecha_ingreso,
                    fecha_salida,
                  }) => {
                    const actual = fecha_salida === null;

                    return (
                      <div className="operador" key={id}>
                        <span className="operador-avatar" aria-hidden="true">
                          {inicialesOperador(persona)}
                        </span>

                        <div className="operador-info">
                          <p className="operador-nombre">
                            {nombreOperador(persona)}
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

          <Chart />
        </main>
      </div>
    </div>
  );
}
