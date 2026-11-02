import { useMemo, useState } from 'react';
import Dialogo from '../components/Dialogo.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  CheckIcon,
  ClockIcon,
  LinkIcon,
  SearchIcon,
  StopIcon,
  TruckIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import {
  formatearFecha,
  formatearMoneda,
  maquinas,
  nombreMaquina,
  nombreOperador,
  obtenerMaquinaActual,
  obtenerOperadorActual,
  operadores,
} from '../data/datos.js';
import {
  cerrarAsignacion,
  crearAsignacion,
  fechaDeHoy,
  listarAsignaciones,
} from '../data/asignaciones.js';

const FILTROS = [
  { id: 'activas', texto: 'Activas' },
  { id: 'cerradas', texto: 'Cerradas' },
  { id: 'todas', texto: 'Todas' },
];

const COLUMNAS =
  'minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1.35fr) minmax(0, 0.8fr) 92px';

function formularioInicial() {
  return { id_maquina: '', id_operador: '', fecha_ingreso: fechaDeHoy() };
}

function textoDias(dias) {
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

function periodo(asignacion) {
  const desde = formatearFecha(asignacion.fecha_ingreso, true);
  return asignacion.activa
    ? `Desde ${desde}`
    : `${desde} → ${formatearFecha(asignacion.fecha_salida, true)}`;
}

export default function Asignaciones() {
  const [asignaciones, setAsignaciones] = useState(() => listarAsignaciones());
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtro, setFiltro] = useState('activas');
  const [busqueda, setBusqueda] = useState('');
  const [porCerrar, setPorCerrar] = useState(null);
  const [fechaCierre, setFechaCierre] = useState(fechaDeHoy);
  const [cerrando, setCerrando] = useState(false);
  const [errorCerrar, setErrorCerrar] = useState('');

  const activas = asignaciones.filter((asignacion) => asignacion.activa);
  const maquinasLibres = maquinas.length - activas.length;
  const operadoresLibres = operadores.filter(
    (operador) => !obtenerMaquinaActual(operador.id_operador),
  ).length;
  const horasActivas = activas.reduce((total, asignacion) => total + asignacion.horas, 0);

  const idMaquina = Number(formulario.id_maquina);
  const idOperador = Number(formulario.id_operador);
  const operadorDeLaMaquina = idMaquina ? obtenerOperadorActual(idMaquina) : null;
  const maquinaDelOperador = idOperador ? obtenerMaquinaActual(idOperador) : null;
  const yaAsignado =
    operadorDeLaMaquina && operadorDeLaMaquina.id_operador === idOperador;

  const cambios = [];
  if (operadorDeLaMaquina && !yaAsignado) {
    cambios.push(
      `${nombreOperador(operadorDeLaMaquina)} dejará la ${nombreMaquina(
        maquinas.find((maquina) => maquina.id_maquina === idMaquina),
      )}.`,
    );
  }
  if (maquinaDelOperador && maquinaDelOperador.id_maquina !== idMaquina) {
    cambios.push(
      `El operador dejará la ${nombreMaquina(maquinaDelOperador)}, que quedará sin operador.`,
    );
  }

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return asignaciones.filter((asignacion) => {
      if (filtro === 'activas' && !asignacion.activa) return false;
      if (filtro === 'cerradas' && asignacion.activa) return false;
      if (!termino) return true;

      return [
        asignacion.maquina && nombreMaquina(asignacion.maquina),
        asignacion.operador && nombreOperador(asignacion.operador),
        asignacion.operador?.cedula,
        asignacion.fecha_ingreso,
        asignacion.fecha_salida,
      ].some((valor) => String(valor ?? '').toLowerCase().includes(termino));
    });
  }, [asignaciones, busqueda, filtro]);

  function actualizar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    if (error) setError('');
    if (aviso) setAviso('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (guardando) return;

    if (!idMaquina) return setError('Selecciona la máquina.');
    if (!idOperador) return setError('Selecciona el operador.');
    if (!formulario.fecha_ingreso) return setError('Indica la fecha de inicio.');
    if (yaAsignado) return setError('Ese operador ya está asignado a esta máquina.');

    setGuardando(true);
    setError('');

    let resultado;

    try {
      resultado = await crearAsignacion(formulario);
    } catch (errorApi) {
      setError(errorApi.message);
      return;
    } finally {
      setGuardando(false);
    }

    const { asignacion, cerradas } = resultado;
    setAsignaciones(listarAsignaciones());
    setFormulario(formularioInicial());
    setAviso(
      `${nombreOperador(asignacion.operador)} quedó a cargo de la ${nombreMaquina(
        asignacion.maquina,
      )}.${
        cerradas.length
          ? ` Se ${cerradas.length === 1 ? 'cerró 1 asignación anterior' : `cerraron ${cerradas.length} asignaciones anteriores`}.`
          : ''
      }`,
    );
  }

  function pedirCierre(asignacion) {
    setErrorCerrar('');
    setFechaCierre(fechaDeHoy() < asignacion.fecha_ingreso ? asignacion.fecha_ingreso : fechaDeHoy());
    setPorCerrar(asignacion);
  }

  async function confirmarCierre() {
    if (!porCerrar || cerrando) return;

    if (!fechaCierre) return setErrorCerrar('Indica la fecha de cierre.');
    if (fechaCierre < porCerrar.fecha_ingreso) {
      return setErrorCerrar('La fecha de cierre no puede ser anterior al inicio.');
    }

    setCerrando(true);
    setErrorCerrar('');

    let cerrada;

    try {
      cerrada = await cerrarAsignacion(porCerrar.id, fechaCierre);
    } catch (errorApi) {
      setErrorCerrar(errorApi.message);
      return;
    } finally {
      setCerrando(false);
    }

    setAsignaciones(listarAsignaciones());
    setPorCerrar(null);
    setError('');
    setAviso(
      `Asignación cerrada: ${nombreOperador(cerrada.operador)} trabajó ${textoDias(
        cerrada.dias,
      )} en la ${nombreMaquina(cerrada.maquina)}.`,
    );
  }

  return (
    <div className="dashboard pagina-asignaciones">
      <Sidebar activo="Asignaciones" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'asignaciones' }]} />

        <main className="dashboard-contenido admin-contenido">
          <PageHeader
            eyebrow="Trabajos"
            titulo="Asignaciones"
            descripcion="Asigna operadores a las máquinas y lleva el registro de quién operó cada equipo, cuándo y por cuánto tiempo."
            acciones={
              <>
                <a className="btn btn-fantasma" href="/maquinaria">
                  <TruckIcon />
                  Maquinaria
                </a>
                <a className="btn btn-fantasma" href="/operadores">
                  <UsersIcon />
                  Operadores
                </a>
              </>
            }
          />

          <section className="stats-grid" aria-label="Resumen de asignaciones">
            <StatCard
              etiqueta="Asignaciones activas"
              valor={activas.length}
              detalle={`${asignaciones.length - activas.length} cerradas en el historial`}
              Icono={LinkIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Máquinas sin operador"
              valor={maquinasLibres}
              detalle={`De ${maquinas.length} en la flota`}
              Icono={TruckIcon}
              tono={maquinasLibres > 0 ? 'ambar' : 'neutro'}
            />
            <StatCard
              etiqueta="Operadores libres"
              valor={operadoresLibres}
              detalle={`De ${operadores.length} registrados`}
              Icono={UsersIcon}
              tono="azul"
            />
            <StatCard
              etiqueta="Horas en curso"
              valor={`${horasActivas} h`}
              detalle="Registradas en las asignaciones activas"
              Icono={ClockIcon}
              tono="neutro"
            />
          </section>

          <div className="admin-grid">
            <section className="tarjeta admin-form-card">
              <header className="admin-form-cabecera">
                <div>
                  <p className="panel-eyebrow">Nuevo trabajo</p>
                  <h2>Asignar operador</h2>
                  <p>Los campos con * son obligatorios.</p>
                </div>
                <span className="admin-badge">Asignar</span>
              </header>

              <form className="admin-form" onSubmit={handleSubmit} noValidate>
                {aviso && (
                  <p className="admin-aviso" role="status">
                    <CheckIcon />
                    {aviso}
                  </p>
                )}

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="form-grid">
                  <label className="form-campo form-campo-ancho">
                    <span>Máquina *</span>
                    <select
                      value={formulario.id_maquina}
                      onChange={(event) => actualizar('id_maquina', event.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Selecciona una máquina
                      </option>
                      {maquinas.map((maquina) => {
                        const actual = obtenerOperadorActual(maquina.id_maquina);
                        return (
                          <option key={maquina.id_maquina} value={maquina.id_maquina}>
                            {nombreMaquina(maquina)} ·{' '}
                            {actual ? nombreOperador(actual) : 'Sin operador'}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="form-campo form-campo-ancho">
                    <span>Operador *</span>
                    <select
                      value={formulario.id_operador}
                      onChange={(event) => actualizar('id_operador', event.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Selecciona un operador
                      </option>
                      {operadores.map((operador) => {
                        const actual = obtenerMaquinaActual(operador.id_operador);
                        return (
                          <option key={operador.id_operador} value={operador.id_operador}>
                            {nombreOperador(operador)} ·{' '}
                            {actual ? `en ${actual.placa}` : 'Libre'}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="form-campo">
                    <span>Fecha de inicio *</span>
                    <input
                      type="date"
                      value={formulario.fecha_ingreso}
                      onChange={(event) => actualizar('fecha_ingreso', event.target.value)}
                      required
                    />
                  </label>
                </div>

                {yaAsignado ? (
                  <p className="asig-nota">Ese operador ya está a cargo de esta máquina.</p>
                ) : (
                  cambios.length > 0 && (
                    <div className="asig-nota">
                      <strong>Al asignar:</strong>
                      <ul>
                        {cambios.map((cambio) => (
                          <li key={cambio}>{cambio}</li>
                        ))}
                      </ul>
                      <span>
                        Las asignaciones anteriores se cierran con la fecha de inicio.
                      </span>
                    </div>
                  )
                )}

                <div className="admin-form-pie">
                  <button className="btn btn-primario" type="submit" disabled={guardando}>
                    <LinkIcon />
                    {guardando ? 'Asignando…' : 'Asignar operador'}
                  </button>
                </div>
              </form>
            </section>

            <section className="tarjeta admin-listado">
              <header className="panel-cabecera admin-listado-cabecera">
                <div>
                  <p className="panel-eyebrow">Historial</p>
                  <h2>Trabajos registrados</h2>
                </div>
                <span className="admin-conteo">
                  {filtradas.length} de {asignaciones.length}
                </span>
              </header>

              <div className="admin-toolbar asig-toolbar">
                <label className="admin-buscador" htmlFor="buscar-asignacion">
                  <SearchIcon />
                  <input
                    id="buscar-asignacion"
                    type="search"
                    placeholder="Buscar por máquina, operador o fecha…"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                  />
                </label>

                <div className="tabs" role="tablist" aria-label="Filtrar asignaciones">
                  {FILTROS.map(({ id, texto }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={filtro === id}
                      className={filtro === id ? 'tab activo' : 'tab'}
                      onClick={() => setFiltro(id)}
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </div>

              {filtradas.length > 0 ? (
                <div
                  className="admin-tabla"
                  role="table"
                  aria-label="Asignaciones"
                  style={{ '--admin-columnas': COLUMNAS }}
                >
                  <div className="admin-fila admin-encabezado" role="row">
                    <span role="columnheader">Máquina</span>
                    <span role="columnheader">Operador</span>
                    <span role="columnheader">Periodo</span>
                    <span role="columnheader">Horas</span>
                    <span className="admin-col-acciones" role="columnheader">
                      Estado
                    </span>
                  </div>

                  {filtradas.map((asignacion) => (
                    <div className="admin-fila" role="row" key={asignacion.id}>
                      <span className="admin-principal" role="cell">
                        {asignacion.maquina ? (
                          <a
                            className="admin-principal-titulo"
                            href={`/maquinaria/${asignacion.maquina.placa}`}
                          >
                            {nombreMaquina(asignacion.maquina)}
                          </a>
                        ) : (
                          <span className="admin-principal-titulo">—</span>
                        )}
                        <span className="admin-principal-sub">
                          {asignacion.maquina ? `Placa ${asignacion.maquina.placa}` : 'Máquina eliminada'}
                        </span>
                      </span>

                      <span className="admin-celda asig-col-operador" role="cell" data-etiqueta="Operador">
                        {asignacion.operador ? (
                          <a href={`/operador/${asignacion.operador.id_operador}`}>
                            {nombreOperador(asignacion.operador)}
                          </a>
                        ) : (
                          '—'
                        )}
                      </span>

                      <span className="admin-celda asig-doble" role="cell" data-etiqueta="Periodo">
                        <span>
                          {periodo(asignacion)}
                          <small>{textoDias(asignacion.dias)}</small>
                        </span>
                      </span>

                      <span
                        className="admin-celda asig-doble"
                        role="cell"
                        data-etiqueta="Horas"
                        title={`Ingresos registrados: ${formatearMoneda(asignacion.ingresos, false)}`}
                      >
                        <span>
                          {asignacion.horas} h
                          <small>{formatearMoneda(asignacion.ingresos)}</small>
                        </span>
                      </span>

                      <span className="admin-acciones" role="cell">
                        {asignacion.activa ? (
                          <button
                            className="btn btn-fantasma btn-mini asig-cerrar"
                            type="button"
                            onClick={() => pedirCierre(asignacion)}
                            aria-label={`Cerrar la asignación de ${
                              asignacion.operador ? nombreOperador(asignacion.operador) : 'operador'
                            } en ${asignacion.maquina ? nombreMaquina(asignacion.maquina) : 'la máquina'}`}
                          >
                            <StopIcon />
                            Cerrar
                          </button>
                        ) : (
                          <span className="estado-pill gris compacto">Cerrada</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  Icono={LinkIcon}
                  titulo={
                    asignaciones.length ? 'No hay asignaciones con ese filtro' : 'Aún no hay asignaciones'
                  }
                  texto={
                    asignaciones.length
                      ? 'Prueba con otro término de búsqueda o cambia el filtro.'
                      : 'Asigna el primer operador a una máquina con el formulario.'
                  }
                />
              )}
            </section>
          </div>
        </main>
      </div>

      <Dialogo
        abierto={Boolean(porCerrar)}
        onCerrar={() => setPorCerrar(null)}
        Icono={StopIcon}
        tono="aviso"
        titulo="¿Cerrar esta asignación?"
        texto="El operador deja la máquina en la fecha de cierre. El trabajo queda en el historial."
        error={errorCerrar}
        textoConfirmar={cerrando ? 'Cerrando…' : 'Cerrar asignación'}
        IconoConfirmar={CheckIcon}
        onConfirmar={confirmarCierre}
        ocupado={cerrando}
      >
        {porCerrar && (
          <>
            <p className="admin-dialogo-detalle">
              {porCerrar.operador ? nombreOperador(porCerrar.operador) : '—'} ·{' '}
              {porCerrar.maquina ? nombreMaquina(porCerrar.maquina) : '—'}
              <br />
              Desde {formatearFecha(porCerrar.fecha_ingreso, true)} · {porCerrar.horas} h registradas
            </p>

            <label className="form-campo">
              <span>Fecha de cierre *</span>
              <input
                type="date"
                value={fechaCierre}
                min={porCerrar.fecha_ingreso}
                onChange={(event) => {
                  setFechaCierre(event.target.value);
                  setErrorCerrar('');
                }}
                required
              />
            </label>
          </>
        )}
      </Dialogo>
    </div>
  );
}
