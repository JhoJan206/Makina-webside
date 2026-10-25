import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  TruckIcon,
} from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  formatearMoneda,
  inicialesOperador,
  maquinas,
  nombreMaquina,
  nombreOperador,
  obraActualMaquina,
  obtenerOperadorActual,
  promedioValorHora,
  resumenMaquina,
  tipoMaquinaVisible,
} from '../data/datos.js';

export default function Maquinaria() {
  const activas = maquinas.filter((maquina) =>
    Boolean(obtenerOperadorActual(maquina.id_maquina)),
  ).length;
  const horas = maquinas.reduce(
    (total, maquina) => total + resumenMaquina(maquina.id_maquina).horas,
    0,
  );
  const ingresos = maquinas.reduce(
    (total, maquina) => total + resumenMaquina(maquina.id_maquina).ingresos,
    0,
  );

  return (
    <div className="dashboard pagina-maquinaria">
      <Sidebar activo="Maquinaria" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'maquinaria' }]} />

        <main className="dashboard-contenido maquinaria-contenido">
          <PageHeader
            eyebrow="Flota"
            titulo="Maquinaria"
            descripcion="Consulta el estado, la operación y el rendimiento de cada equipo."
          />

          <section className="stats-grid" aria-label="Resumen de maquinaria">
            <StatCard
              etiqueta="Equipos en flota"
              valor={maquinas.length}
              detalle="Maquinaria registrada"
              Icono={TruckIcon}
              tono="neutro"
            />
            <StatCard
              etiqueta="Equipos activos"
              valor={activas}
              detalle={`${maquinas.length - activas} sin operador`}
              Icono={CheckIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Valor promedio"
              valor={`${formatearMoneda(promedioValorHora(), false)}/h`}
              detalle="Tarifa promedio por hora"
              Icono={DollarIcon}
              tono="ambar"
            />
            <StatCard
              etiqueta="Horas del mes"
              valor={`${horas} h`}
              detalle={`${formatearMoneda(ingresos)} facturados`}
              Icono={ClockIcon}
              tono="azul"
            />
          </section>

          <section className="maquinaria-grid" aria-label="Listado de maquinaria">
            {maquinas.map((maquina) => {
              const operador = obtenerOperadorActual(maquina.id_maquina);
              const resumen = resumenMaquina(maquina.id_maquina);
              const activa = Boolean(operador);

              return (
                <article className="maquina-card" key={maquina.id_maquina}>
                  <div className="maquina-card-media">
                    <img src={maquina.imagen} alt={maquina.alt} />
                    <span className="maquina-card-placa">
                      Placa {maquina.placa}
                    </span>
                    <span
                      className={`pastilla maquina-card-estado ${
                        activa ? 'verde' : 'gris'
                      }`}
                    >
                      {activa ? 'Activa' : 'Sin operador'}
                    </span>
                  </div>

                  <div className="maquina-card-cuerpo">
                    <div className="maquina-card-cabecera">
                      <div className="maquina-card-titulo">
                        <p className="panel-eyebrow">
                          {tipoMaquinaVisible(maquina.tipo)}
                        </p>
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
                        <dd>
                          {operador ? nombreOperador(operador) : 'Sin asignar'}
                        </dd>
                      </div>
                      <div>
                        <dt>Obra actual</dt>
                        <dd>{obraActualMaquina(maquina.id_maquina)}</dd>
                      </div>
                      <div>
                        <dt>Horas del mes</dt>
                        <dd>{resumen.horas} h</dd>
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
                        <span>
                          {operador ? nombreOperador(operador) : 'Sin asignar'}
                        </span>
                      </span>

                      <a
                        className="btn btn-mini"
                        href={`/maquinaria/${maquina.placa}`}
                      >
                        Ver detalle
                        <ArrowRightIcon />
                      </a>
                    </div>
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
