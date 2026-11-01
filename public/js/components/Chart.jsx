import { formatearMoneda, serieMensual } from '../data/datos.js';

// idsMaquinas: limita el gráfico a esas máquinas (detalle de máquina/operador)
export default function Chart({ idsMaquinas = null }) {
  const serie = serieMensual(idsMaquinas);
  const maximo = Math.max(
    1,
    ...serie.flatMap(({ ingresos, egresos }) => [ingresos, egresos]),
  );
  const altura = (valor) => Math.round((valor / maximo) * 100);

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
            {serie.map(({ mes, ingresos, egresos }) => (
              <div className="grupo" key={mes}>
                <div className="grupo-barras">
                  <span
                    className="barra verde"
                    style={{ height: `${altura(ingresos)}%` }}
                    title={`Ingresos ${mes}: ${formatearMoneda(ingresos, false)}`}
                  />
                  <span
                    className="barra roja"
                    style={{ height: `${altura(egresos)}%` }}
                    title={`Egresos ${mes}: ${formatearMoneda(egresos, false)}`}
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
