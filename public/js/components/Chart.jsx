const datos = [
  { mes: 'Abr', ingresos: 58, egresos: 24 },
  { mes: 'May', ingresos: 68, egresos: 33 },
  { mes: 'Jun', ingresos: 48, egresos: 20 },
  { mes: 'Jul', ingresos: 82, egresos: 38 },
  { mes: 'Ago', ingresos: 63, egresos: 28 },
  { mes: 'Sep', ingresos: 92, egresos: 24 },
];

export default function Chart() {
  return (
    <section className="tarjeta grafico">
      <header className="grafico-cabecera">
        <div>
          <p className="panel-eyebrow">Rendimiento</p>
          <h2>Ingresos vs egresos</h2>
          <p className="panel-sub">Comparativo de los últimos 6 meses</p>
        </div>

        <div className="leyenda">
          <span>
            <i className="muestra verde" />
            Ingresos
          </span>
          <span>
            <i className="muestra rojo" />
            Egresos
          </span>
        </div>
      </header>

      <div className="grafico-cuerpo">
        <div className="grafico-area">
          <div className="grafico-lineas" aria-hidden="true" />

          <div className="grafico-grupos">
            {datos.map(({ mes, ingresos, egresos }) => (
              <div className="grupo" key={mes}>
                <div className="grupo-barras">
                  <span
                    className="barra verde"
                    style={{ height: `${ingresos}%` }}
                    title={`Ingresos ${mes}: ${ingresos}`}
                  />
                  <span
                    className="barra roja"
                    style={{ height: `${egresos}%` }}
                    title={`Egresos ${mes}: ${egresos}`}
                  />
                </div>

                <span className="mes">{mes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
