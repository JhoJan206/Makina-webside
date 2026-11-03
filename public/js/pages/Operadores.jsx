import { AccionesCrud, AvisoCrud, useCrud } from '../components/AdminCrud.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  PlusIcon,
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
  historialMaquinas,
  inicialesOperador,
  nombreMaquina,
  nombreOperador,
  obraActualMaquina,
  obtenerAsignacionActualOperador,
  obtenerMaquina,
  resumenOperador,
} from '../data/datos.js';
import { crudOperadores } from '../data/gestion.js';

export default function Operadores() {
  const crud = useCrud(crudOperadores);
  const operadores = crud.filas;
  const activos = operadores.filter((operador) =>
    Boolean(obtenerAsignacionActualOperador(operador.id_operador)),
  ).length;
  const nomina = operadores.reduce((total, operador) => total + (operador.sueldo ?? 0), 0);

  return (
    <div className="dashboard pagina-operadores">
      <Sidebar activo="Operadores" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'operadores' }]} />

        <main className="dashboard-contenido operadores-contenido">
          <PageHeader
            eyebrow="Equipo"
            titulo="Operadores"
            descripcion="Registra, edita y conoce la asignación y la experiencia de tu equipo."
            acciones={
              <button className="btn btn-primario" type="button" onClick={crud.nuevo}>
                <PlusIcon />
                Nuevo operador
              </button>
            }
          />

          <AvisoCrud crud={crud} />

          <section className="stats-grid tres" aria-label="Resumen de operadores">
            <StatCard
              etiqueta="Operadores"
              valor={operadores.length}
              detalle="Personal registrado"
              Icono={UsersIcon}
              tono="neutro"
            />
            <StatCard
              etiqueta="Asignados"
              valor={activos}
              detalle={`${operadores.length - activos} sin asignación`}
              Icono={CheckIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Nómina mensual"
              valor={formatearMoneda(nomina)}
              detalle="Suma de sueldos"
              Icono={DollarIcon}
              tono="ambar"
            />
          </section>

          {operadores.length === 0 ? (
            <EmptyState
              Icono={UsersIcon}
              titulo="Aún no hay operadores"
              texto="Registra el primer operador con el botón Nuevo operador."
            />
          ) : (
            <section className="operadores-grid" aria-label="Listado de operadores">
              {operadores.map((operador) => {
                const asignacion = obtenerAsignacionActualOperador(operador.id_operador);
                const maquina = asignacion ? obtenerMaquina(asignacion.id_maquina) : null;
                const resumen = resumenOperador(operador.id_operador);
                const trabajos = historialMaquinas(operador.id_operador).length;
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
                        <span className="operador-card-equipo-label">Máquina actual</span>
                        <strong>{maquina ? nombreMaquina(maquina) : 'Sin asignar'}</strong>
                      </div>
                    </div>

                    <dl className="operador-card-datos">
                      <div>
                        <dt>Sueldo</dt>
                        <dd>
                          {operador.sueldo === null
                            ? '—'
                            : formatearMoneda(operador.sueldo, false)}
                        </dd>
                      </div>
                      <div>
                        <dt>Obra actual</dt>
                        <dd>{maquina ? obraActualMaquina(maquina.id_maquina) : '—'}</dd>
                      </div>
                      <div>
                        <dt>Asignaciones</dt>
                        <dd>{trabajos} en su historial</dd>
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

                      <span className="tarjeta-acciones">
                        <AccionesCrud
                          crud={crud}
                          fila={operador}
                          nombre={nombreOperador(operador)}
                        />
                        <a className="btn btn-mini" href={`/operador/${operador.id_operador}`}>
                          Ver perfil
                          <ArrowRightIcon />
                        </a>
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </main>
      </div>

      {crud.dialogos}
    </div>
  );
}
