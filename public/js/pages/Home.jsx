import Chart from '../components/Chart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

const kpis = [
  { etiqueta: 'Ingresos del mes', valor: '$0.0M', tono: 'verde' },
  { etiqueta: 'Egresos del mes', valor: '$0.0M', tono: 'rojo' },
  { etiqueta: 'Ganancia neta', valor: '$0.0', tono: 'ambar' },
];

const maquinas = [
  { id: 1, estado: 'Activa', tono: 'verde' },
  { id: 2, estado: 'En obra', tono: 'ambar' },
  { id: 3, estado: 'Activa', tono: 'verde' },
];

const registros = [
  {
    titulo: 'Obra #1',
    sub: 'Nombre de la obra',
    monto: '+$###K',
    tono: 'verde',
  },
  {
    titulo: 'Repuesto #1',
    sub: 'Nombre del repuesto',
    monto: '-$###K',
    tono: 'rojo',
  },
  {
    titulo: 'Obra #2',
    sub: 'Nombre de la obra',
    monto: '+$###K',
    tono: 'verde',
  },
];

export default function Home() {
  return (
    <div className="dashboard">
      <Sidebar />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'inicio' }]} />

        <main className="dashboard-contenido">
          <section className="kpis" aria-label="Resumen del mes">
            {kpis.map(({ etiqueta, valor, tono }) => (
              <article className={`kpi ${tono}`} key={etiqueta}>
                <p className="kpi-etiqueta">{etiqueta}</p>
                <p className="kpi-valor">{valor}</p>
              </article>
            ))}
          </section>

          <div className="dashboard-grid">
            <div className="columna-izquierda">
              <section className="tarjeta maquinas">
                <header className="tarjeta-cabecera">
                  <h2>Máquinas</h2>
                </header>

                <div className="tarjeta-cuerpo">
                  {maquinas.map(({ id, estado, tono }) => (
                    <div className="fila" key={id}>
                      <div className="miniatura" aria-hidden="true">
                        Ma
                      </div>

                      <div className="fila-info">
                        <p className="fila-titulo">Máquina #{id}</p>
                        <p className="fila-sub">Operador</p>
                      </div>

                      <span className={`pastilla ${tono}`}>{estado}</span>
                    </div>
                  ))}
                </div>
              </section>

              <Chart />
            </div>

            <div className="columna-derecha">
              <section className="tarjeta registros">
                <header className="tarjeta-cabecera">
                  <h2>Últimos registros</h2>
                </header>

                <div className="tarjeta-cuerpo">
                  {registros.map(({ titulo, sub, monto, tono }) => (
                    <div className="fila registro" key={titulo}>
                      <div className="fila-info">
                        <p className="fila-titulo">{titulo}</p>
                        <p className="fila-sub">{sub}</p>
                      </div>

                      <span className={`monto ${tono}`}>{monto}</span>
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
