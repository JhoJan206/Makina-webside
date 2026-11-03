import { AccionesCrud, AvisoCrud, useCrud } from '../components/AdminCrud.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  ArrowRightIcon,
  DollarIcon,
  PlusIcon,
  TruckIcon,
  UserIcon,
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
  obtenerAsignacionActualMaquina,
  obtenerOperadorActual,
  promedioValorHora,
  resumenMaquina,
  tipoMaquinaVisible,
} from '../data/datos.js';
import { crudMaquinas } from '../data/gestion.js';

export default function Maquinaria() {
  const crud = useCrud(crudMaquinas);
  const maquinas = crud.filas;
  const sinOperador = maquinas.filter(
    (maquina) => !obtenerOperadorActual(maquina.id_maquina),
  ).length;

  return (
    <div className="dashboard pagina-maquinaria">
      <Sidebar activo="Maquinaria" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'maquinaria' }]} />

        <main className="dashboard-contenido maquinaria-contenido">
          <PageHeader
            eyebrow="Flota"
            titulo="Maquinaria"
            descripcion="Registra, edita y consulta el estado y la operación de cada equipo."
            acciones={
              <button className="btn btn-primario" type="button" onClick={crud.nuevo}>
                <PlusIcon />
                Nueva máquina
              </button>
            }
          />

          <AvisoCrud crud={crud} />

          <section className="stats-grid tres" aria-label="Resumen de maquinaria">
            <StatCard
              etiqueta="Equipos"
              valor={maquinas.length}
              detalle="Máquinas registradas"
              Icono={TruckIcon}
              tono="neutro"
            />
            <StatCard
              etiqueta="Sin operador"
              valor={sinOperador}
              detalle={`${maquinas.length - sinOperador} con asignación activa`}
              Icono={UserIcon}
              tono={sinOperador > 0 ? 'ambar' : 'verde'}
            />
            <StatCard
              etiqueta="Valor/hora promedio"
              valor={`${formatearMoneda(promedioValorHora(), false)}/h`}
              detalle="Tarifa promedio de la flota"
              Icono={DollarIcon}
              tono="azul"
            />
          </section>

          {maquinas.length === 0 ? (
            <EmptyState
              Icono={TruckIcon}
              titulo="Aún no hay máquinas"
              texto="Registra la primera máquina con el botón Nueva máquina."
            />
          ) : (
            <section className="maquinaria-grid" aria-label="Listado de maquinaria">
              {maquinas.map((maquina) => {
                const operador = obtenerOperadorActual(maquina.id_maquina);
                const asignacion = obtenerAsignacionActualMaquina(maquina.id_maquina);
                const resumen = resumenMaquina(maquina.id_maquina);
                const activa = Boolean(operador);

                return (
                  <article className="maquina-card" key={maquina.id_maquina}>
                    <div className="maquina-card-media">
                      <img src={maquina.imagen} alt={maquina.alt} />
                      <span className="maquina-card-placa">Placa {maquina.placa}</span>
                      <span
                        className={`pastilla maquina-card-estado ${activa ? 'verde' : 'gris'}`}
                      >
                        {activa ? 'Activa' : 'Sin operador'}
                      </span>
                    </div>

                    <div className="maquina-card-cuerpo">
                      <div className="maquina-card-cabecera">
                        <div className="maquina-card-titulo">
                          <p className="panel-eyebrow">{tipoMaquinaVisible(maquina.tipo)}</p>
                          <h2>{nombreMaquina(maquina)}</h2>
                        </div>

                        <p className="maquina-card-precio">
                          {formatearMoneda(maquina.valor_hora, false)}
                          <span>/hora</span>
                        </p>
                      </div>

                      <dl className="maquina-card-datos">
                        <div>
                          <dt>Operador</dt>
                          <dd>{operador ? nombreOperador(operador) : 'Sin asignar'}</dd>
                        </div>
                        <div>
                          <dt>Obra actual</dt>
                          <dd>{obraActualMaquina(maquina.id_maquina)}</dd>
                        </div>
                        <div>
                          <dt>Operando desde</dt>
                          <dd>
                            {asignacion ? formatearFecha(asignacion.fecha_ingreso, true) : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Ingresos del mes</dt>
                          <dd>{formatearMoneda(resumen.ingresos)}</dd>
                        </div>
                      </dl>

                      <div className="maquina-card-pie">
                        <span className="operador-mini">
                          <span className="avatar-circulo" aria-hidden="true">
                            {operador ? inicialesOperador(operador) : '—'}
                          </span>
                          <span>{operador ? nombreOperador(operador) : 'Sin asignar'}</span>
                        </span>

                        <span className="tarjeta-acciones">
                          <AccionesCrud
                            crud={crud}
                            fila={maquina}
                            nombre={nombreMaquina(maquina)}
                          />
                          <a
                            className="btn btn-mini"
                            href={`/maquinaria/${encodeURIComponent(maquina.placa)}`}
                          >
                            Ver detalle
                            <ArrowRightIcon />
                          </a>
                        </span>
                      </div>
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
