import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  formatearFecha,
  formatearMoneda,
  inicialesOperador,
  nombreMaquina,
  nombreOperador,
  obraActualMaquina,
  obtenerAsignacionActualOperador,
  obtenerMaquina,
  operadores,
  resumenMaquina,
} from '../data/datos.js';

export default function Operadores() {
  return (
    <div className="dashboard pagina-operadores">
      <Sidebar activo="Operadores" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'operadores' }]} />

        <main className="dashboard-contenido operadores-contenido">
          <section className="lista-operadores" aria-label="Listado de operadores">
            {operadores.map((operador) => {
              const asignacion = obtenerAsignacionActualOperador(
                operador.id_operador,
              );
              const maquina = asignacion
                ? obtenerMaquina(asignacion.id_maquina)
                : null;
              const resumen = maquina ? resumenMaquina(maquina.id_maquina) : null;
              const activo = Boolean(maquina);

              return (
                <article className="tarjeta-operador" key={operador.id_operador}>
                  <div className="operador-foto" aria-hidden="true">
                    {inicialesOperador(operador)}
                  </div>

                  <div className="operador-cuerpo">
                    <div className="operador-cabecera">
                      <div className="operador-titulo">
                        <h2 className="operador-nombre">
                          {nombreOperador(operador)}
                        </h2>
                        <span className="operador-cedula">
                          C.C. {operador.cedula}
                        </span>
                        <span
                          className={`pastilla ${activo ? 'verde' : 'gris'}`}
                        >
                          {activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <a
                        className="boton-mas"
                        href={`/operador/${operador.id_operador}`}
                      >
                        Más
                      </a>
                    </div>

                    <dl className="operador-datos">
                      <div className="dato">
                        <dt>Sueldo</dt>
                        <dd>{formatearMoneda(operador.sueldo, false)}</dd>
                      </div>
                      <div className="dato">
                        <dt>Máquina actual</dt>
                        <dd>
                          {maquina ? nombreMaquina(maquina) : 'Sin asignar'}
                        </dd>
                      </div>
                      <div className="dato">
                        <dt>Obra actual</dt>
                        <dd>
                          {maquina ? obraActualMaquina(maquina.id_maquina) : '—'}
                        </dd>
                      </div>
                      <div className="dato">
                        <dt>Fecha de ingreso</dt>
                        <dd>
                          {asignacion
                            ? formatearFecha(asignacion.fecha_ingreso, true)
                            : '—'}
                        </dd>
                      </div>
                      <div className="dato">
                        <dt>Horas del mes</dt>
                        <dd>{resumen ? `${resumen.horas} h` : '0 h'}</dd>
                      </div>
                      <div className="dato">
                        <dt>Ingresos generados</dt>
                        <dd>{resumen ? formatearMoneda(resumen.ingresos) : '$0'}</dd>
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
