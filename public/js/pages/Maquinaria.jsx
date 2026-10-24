import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  formatearMoneda,
  maquinas,
  nombreOperador,
  obraActualMaquina,
  obtenerOperadorActual,
  resumenMaquina,
} from '../data/datos.js';

export default function Maquinaria() {
  return (
    <div className="dashboard pagina-maquinaria">
      <Sidebar activo="Maquinaria" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'maquinaria' }]} />

        <main className="dashboard-contenido maquinaria-contenido">
          <section className="lista-maquinas" aria-label="Listado de maquinaria">
            {maquinas.map((maquina) => {
              const operador = obtenerOperadorActual(maquina.id_maquina);
              const resumen = resumenMaquina(maquina.id_maquina);
              const activa = Boolean(operador);

              return (
                <article className="tarjeta-maquina" key={maquina.id_maquina}>
                  <div className="maquina-foto">
                    <img src={maquina.imagen} alt={maquina.alt} />
                  </div>

                  <div className="maquina-cuerpo">
                    <div className="maquina-cabecera">
                      <div className="maquina-titulo">
                        <h2 className="maquina-id">#{maquina.placa}</h2>
                        <span className="maquina-tipo">
                          {maquina.tipo === 'Pajarita'
                            ? 'Retroexcavadora'
                            : maquina.tipo}
                        </span>
                        <span className={`pastilla ${activa ? 'verde' : 'gris'}`}>
                          {activa ? 'Activa' : 'Sin operador'}
                        </span>
                      </div>

                      <a
                        className="boton-mas"
                        href={`/maquinaria/${maquina.placa}`}
                      >
                        Más
                      </a>
                    </div>

                    <dl className="maquina-datos">
                      <div className="dato">
                        <dt>Placa</dt>
                        <dd>{maquina.placa}</dd>
                      </div>
                      <div className="dato">
                        <dt>Valor / hora</dt>
                        <dd>{formatearMoneda(maquina.valor_hora, false)}</dd>
                      </div>
                      <div className="dato">
                        <dt>Operador</dt>
                        <dd>{operador ? nombreOperador(operador) : 'Sin asignar'}</dd>
                      </div>
                      <div className="dato">
                        <dt>Obra actual</dt>
                        <dd>{obraActualMaquina(maquina.id_maquina)}</dd>
                      </div>
                      <div className="dato">
                        <dt>Horas del mes</dt>
                        <dd>{resumen.horas} h</dd>
                      </div>
                      <div className="dato">
                        <dt>Ingresos del mes</dt>
                        <dd>{formatearMoneda(resumen.ingresos)}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
