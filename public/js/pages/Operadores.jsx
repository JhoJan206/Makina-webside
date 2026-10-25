import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  TruckIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
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
  resumenOperador,
} from '../data/datos.js';

export default function Operadores() {
  const activos = operadores.filter((operador) =>
    Boolean(obtenerAsignacionActualOperador(operador.id_operador)),
  ).length;
  const nomina = operadores.reduce(
    (total, operador) => total + (operador.sueldo ?? 0),
    0,
  );
  const horas = operadores.reduce(
    (total, operador) => total + resumenOperador(operador.id_operador).horas,
    0,
  );

  return (
    <div className="dashboard pagina-operadores">
      <Sidebar activo="Operadores" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'operadores' }]} />

        <main className="dashboard-contenido operadores-contenido">
          <PageHeader
            eyebrow="Equipo"
            titulo="Operadores"
            descripcion="Conoce la asignación, la experiencia y el rendimiento de tu equipo."
            acciones={
              <a className="btn btn-fantasma" href="/maquinaria">
                <TruckIcon />
                Ver maquinaria
              </a>
            }
          />

          <section className="stats-grid" aria-label="Resumen de operadores">
            <StatCard
              etiqueta="Operadores"
              valor={operadores.length}
              detalle="Personal registrado"
              Icono={UsersIcon}
              tono="neutro"
            />
            <StatCard
              etiqueta="Operadores activos"
              valor={activos}
              detalle={`${operadores.length - activos} sin asignación`}
              Icono={CheckIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Nómina mensual"
              valor={formatearMoneda(nomina)}
              detalle="Sueldos del equipo"
              Icono={DollarIcon}
              tono="ambar"
            />
            <StatCard
              etiqueta="Horas trabajadas"
              valor={`${horas} h`}
              detalle="Acumulado del periodo"
              Icono={ClockIcon}
              tono="azul"
            />
          </section>

          <section className="operadores-grid" aria-label="Listado de operadores">
            {operadores.map((operador) => {
              const asignacion = obtenerAsignacionActualOperador(
                operador.id_operador,
              );
              const maquina = asignacion
                ? obtenerMaquina(asignacion.id_maquina)
                : null;
              const resumen = resumenOperador(operador.id_operador);
              const activo = Boolean(maquina);

              return (
                <article className="operador-card" key={operador.id_operador}>
                  <div className="operador-card-cabecera">
                    <span className="operador-card-avatar" aria-hidden="true">
                      {inicialesOperador(operador)}
                    </span>

                    <div className="operador-card-identidad">
                      <h2>{nombreOperador(operador)}</h2>
                      <p>C.C. {operador.cedula}</p>
                    </div>

                    <span className={`pastilla ${activo ? 'verde' : 'gris'}`}>
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="operador-card-equipo">
                    <span className="operador-card-equipo-icono" aria-hidden="true">
                      <TruckIcon />
                    </span>
                    <div>
                      <span className="operador-card-equipo-label">
                        Máquina actual
                      </span>
                      <strong>
                        {maquina ? nombreMaquina(maquina) : 'Sin asignar'}
                      </strong>
                    </div>
                  </div>

                  <dl className="operador-card-datos">
                    <div>
                      <dt>Sueldo</dt>
                      <dd>{formatearMoneda(operador.sueldo, false)}</dd>
                    </div>
                    <div>
                      <dt>Obra actual</dt>
                      <dd>
                        {maquina ? obraActualMaquina(maquina.id_maquina) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt>Horas del mes</dt>
                      <dd>{resumen.horas} h</dd>
                    </div>
                    <div>
                      <dt>Ingresos generados</dt>
                      <dd>{formatearMoneda(resumen.ingresos)}</dd>
                    </div>
                  </dl>

                  <div className="operador-card-pie">
                    <span className="operador-card-fecha">
                      <ClockIcon />
                      {asignacion
                        ? `Desde ${formatearFecha(asignacion.fecha_ingreso, true)}`
                        : 'Sin asignación activa'}
                    </span>

                    <a
                      className="btn btn-mini"
                      href={`/operador/${operador.id_operador}`}
                    >
                      Ver perfil
                      <ArrowRightIcon />
                    </a>
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
