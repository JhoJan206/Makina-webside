import { useMemo, useState } from 'react';
import Dialogo from '../components/Dialogo.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  DollarIcon,
  SearchIcon,
  TrashIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TruckIcon,
} from '../components/Icons.jsx';
import {
  formatearFecha,
  formatearMoneda,
  maquinas,
  nombreMaquina,
} from '../data/datos.js';
import { listarClientes } from '../data/solicitudes.js';
import {
  crearMovimiento,
  eliminarMovimiento,
  listarMovimientos,
  resumenMovimientos,
} from '../data/movimientos.js';

const TIPOS = [
  { id: 'ingreso', texto: 'Ingreso', Icono: TrendingUpIcon },
  { id: 'egreso', texto: 'Egreso', Icono: TrendingDownIcon },
];

const FILTROS = [
  { id: 'todos', texto: 'Todos' },
  { id: 'ingreso', texto: 'Ingresos' },
  { id: 'egreso', texto: 'Egresos' },
];

const POR_PAGINA = 10;

// Números de página a mostrar: todos si son pocos; si no, la primera, la
// última y las vecinas de la actual, con '…' en los huecos.
function paginasVisibles(actual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...paginas]
    .filter((pagina) => pagina >= 1 && pagina <= total)
    .sort((a, b) => a - b);

  return ordenadas.flatMap((pagina, i) =>
    i > 0 && pagina - ordenadas[i - 1] > 1 ? ['…', pagina] : [pagina],
  );
}

function fechaDeHoy() {
  const fecha = new Date();
  const desplazamiento = fecha.getTimezoneOffset() * 60000;

  return new Date(fecha.getTime() - desplazamiento)
    .toISOString()
    .slice(0, 10);
}

function formularioInicial() {
  return {
    fecha: fechaDeHoy(),
    id_maquina: '',
    id_cliente: '',
    horas: '',
    valor: '',
    descripcion: '',
  };
}

export default function Movimientos() {
  const [tipo, setTipo] = useState('ingreso');
  const [formulario, setFormulario] = useState(formularioInicial);
  const [movimientos, setMovimientos] = useState(() => listarMovimientos());
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porEliminar, setPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const clientes = useMemo(() => listarClientes(), []);
  const resumen = resumenMovimientos(movimientos);
  const esIngreso = tipo === 'ingreso';

  const maquinaSeleccionada =
    maquinas.find(
      (maquina) =>
        String(maquina.id_maquina) === String(formulario.id_maquina),
    ) ?? null;

  const horasNumero = Number(formulario.horas);
  const valorSugerido =
    esIngreso &&
    maquinaSeleccionada &&
    Number.isFinite(horasNumero) &&
    horasNumero > 0
      ? Math.round(maquinaSeleccionada.valor_hora * horasNumero)
      : 0;

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return movimientos.filter((movimiento) => {
      if (filtro !== 'todos' && movimiento.tipo !== filtro) return false;
      if (!termino) return true;

      return [
        movimiento.descripcion,
        movimiento.maquina?.tipo,
        movimiento.maquina?.placa,
        movimiento.cliente?.nombre_obra,
        movimiento.cliente?.nombre_empresa,
        movimiento.fecha,
        movimiento.valor,
      ].some((valor) =>
        String(valor ?? '')
          .toLowerCase()
          .includes(termino),
      );
    });
  }, [busqueda, filtro, movimientos]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  // Si se eliminan registros o cambia el filtro, la página nunca queda vacía
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);

  function actualizar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));

    if (error) setError('');
    if (aviso) setAviso('');
  }

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo);
    setError('');
    setAviso('');
  }

  function limpiarFiltros() {
    setBusqueda('');
    setFiltro('todos');
    setPagina(1);
  }

  function pedirEliminar(movimiento) {
    setErrorEliminar('');
    setPorEliminar(movimiento);
  }

  async function confirmarEliminar() {
    if (!porEliminar || eliminando) return;

    setEliminando(true);
    setErrorEliminar('');

    try {
      await eliminarMovimiento(porEliminar);
    } catch (errorApi) {
      setErrorEliminar(errorApi.message);
      return;
    } finally {
      setEliminando(false);
    }

    const tipoEliminado = porEliminar.tipo === 'ingreso' ? 'Ingreso' : 'Egreso';
    setMovimientos(listarMovimientos());
    setPorEliminar(null);
    setError('');
    setAviso(
      `${tipoEliminado} de ${formatearMoneda(porEliminar.valor, false)} eliminado.`,
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (enviando) return;

    const idMaquina = Number(formulario.id_maquina);
    const valor = Number(formulario.valor);

    if (!formulario.fecha) {
      setError('Selecciona la fecha del movimiento.');
      return;
    }

    // Fechas AAAA-MM-DD: la comparación de texto respeta el orden cronológico
    if (formulario.fecha > fechaDeHoy()) {
      setError('La fecha no puede ser posterior a hoy.');
      return;
    }

    if (!Number.isFinite(idMaquina) || idMaquina <= 0) {
      setError('Selecciona la máquina del movimiento.');
      return;
    }

    if (esIngreso && !formulario.id_cliente) {
      setError('Selecciona el cliente de la obra.');
      return;
    }

    if (
      esIngreso &&
      (!Number.isFinite(horasNumero) || horasNumero <= 0)
    ) {
      setError('Indica las horas trabajadas.');
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      setError(
        `Indica un valor de ${esIngreso ? 'ingreso' : 'egreso'} mayor a cero.`,
      );
      return;
    }

    setEnviando(true);
    setError('');

    let movimiento;

    try {
      movimiento = await crearMovimiento({
        tipo,
        fecha: formulario.fecha,
        id_maquina: idMaquina,
        id_cliente: esIngreso ? Number(formulario.id_cliente) : null,
        horas: esIngreso ? horasNumero : null,
        valor,
        descripcion: formulario.descripcion,
      });
    } catch (errorApi) {
      setError(errorApi.message);
      return;
    } finally {
      setEnviando(false);
    }

    setMovimientos(listarMovimientos());
    setFormulario(formularioInicial());
    setError('');
    setAviso(
      `${esIngreso ? 'Ingreso' : 'Egreso'} registrado: ${formatearMoneda(
        movimiento.valor,
        false,
      )}.`,
    );
  }

  return (
    <div className="dashboard pagina-movimientos">
      <Sidebar activo="Movimientos" />

      <div className="dashboard-principal">
        <Topbar migas={[{ texto: 'movimientos' }]} />

        <main className="dashboard-contenido movimientos-contenido">
          <PageHeader
            eyebrow="Finanzas"
            titulo="Ingresos y egresos"
            descripcion="Registra los movimientos de la flota y consulta el historial en un solo lugar."
          />

          <section
            className="stats-grid tres mov-resumen"
            aria-label="Resumen de movimientos"
          >
            <StatCard
              etiqueta="Registros"
              valor={resumen.total}
              detalle="Movimientos en el historial"
              Icono={ClipboardIcon}
              tono="neutro"
            />
            <StatCard
              etiqueta="Entradas"
              valor={resumen.cantidadIngresos}
              detalle="Ingresos registrados"
              Icono={TrendingUpIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Salidas"
              valor={resumen.cantidadEgresos}
              detalle="Egresos registrados"
              Icono={TrendingDownIcon}
              tono="rojo"
            />
          </section>

          <div className="movimientos-grid">
            <section className="tarjeta mov-form-card">
              <header className="mov-form-cabecera">
                <div>
                  <p className="panel-eyebrow">Registro</p>
                  <h2>Nuevo movimiento</h2>
                  <p>
                    Completa los datos para actualizar el balance. Los campos
                    con * son obligatorios.
                  </p>
                </div>

                <span className={`mov-badge ${tipo}`}>
                  {esIngreso ? 'Entrada' : 'Salida'}
                </span>
              </header>

              <form className="mov-form" onSubmit={handleSubmit}>
                <div
                  className="mov-tipo"
                  role="group"
                  aria-label="Tipo de movimiento"
                >
                  {TIPOS.map(({ id, texto, Icono }) => (
                    <button
                      key={id}
                      type="button"
                      className={`mov-tipo-btn ${id}${
                        tipo === id ? ' activo' : ''
                      }`}
                      aria-pressed={tipo === id}
                      onClick={() => cambiarTipo(id)}
                    >
                      <Icono />
                      {texto}
                    </button>
                  ))}
                </div>

                {aviso && (
                  <p className="mov-aviso" role="status">
                    <CheckIcon />
                    {aviso}
                  </p>
                )}

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                <fieldset className="form-seccion">
                  <legend>
                    <TruckIcon />
                    Datos del movimiento
                  </legend>

                  <div className="form-grid">
                    <label className="form-campo">
                      <span>Fecha *</span>
                      <input
                        type="date"
                        name="fecha"
                        max={fechaDeHoy()}
                        value={formulario.fecha}
                        onChange={(event) => {
                          // El calendario ya deshabilita los días futuros; si
                          // se escribe uno a mano, se ajusta a la fecha de hoy.
                          const valor = event.target.value;
                          const hoy = fechaDeHoy();
                          actualizar('fecha', valor && valor > hoy ? hoy : valor);
                        }}
                        required
                      />
                    </label>

                    <label className="form-campo">
                      <span>Máquina *</span>
                      <select
                        name="id_maquina"
                        value={formulario.id_maquina}
                        onChange={(event) =>
                          actualizar('id_maquina', event.target.value)
                        }
                        required
                      >
                        <option value="" disabled>
                          Selecciona una máquina
                        </option>
                        {maquinas.map((maquina) => (
                          <option
                            key={maquina.id_maquina}
                            value={maquina.id_maquina}
                          >
                            {nombreMaquina(maquina)} ·{' '}
                            {formatearMoneda(maquina.valor_hora, false)}/h
                          </option>
                        ))}
                      </select>
                    </label>

                    {esIngreso && (
                      <label className="form-campo">
                        <span>Cliente *</span>
                        <select
                          name="id_cliente"
                          value={formulario.id_cliente}
                          onChange={(event) =>
                            actualizar('id_cliente', event.target.value)
                          }
                          required
                        >
                          <option value="" disabled>
                            Selecciona un cliente
                          </option>
                          {clientes.map((cliente) => (
                            <option
                              key={cliente.id_cliente}
                              value={cliente.id_cliente}
                            >
                              {cliente.nombre_obra}
                              {cliente.nombre_empresa
                                ? ` · ${cliente.nombre_empresa}`
                                : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {esIngreso && (
                      <label className="form-campo">
                        <span>Horas trabajadas *</span>
                        <input
                          type="number"
                          name="horas"
                          min="0.5"
                          step="0.5"
                          inputMode="decimal"
                          placeholder="Ej. 8"
                          value={formulario.horas}
                          onChange={(event) =>
                            actualizar('horas', event.target.value)
                          }
                          required
                        />
                      </label>
                    )}

                    <label className="form-campo">
                      <span>
                        {esIngreso ? 'Valor del ingreso *' : 'Valor del egreso *'}
                      </span>
                      <input
                        type="number"
                        name="valor"
                        min="1"
                        step="1"
                        inputMode="decimal"
                        placeholder="Ej. 850000"
                        value={formulario.valor}
                        onChange={(event) =>
                          actualizar('valor', event.target.value)
                        }
                        required
                      />
                    </label>

                    <div className="mov-ayuda">
                      <span className="mov-ayuda-icono" aria-hidden="true">
                        {esIngreso ? <ClockIcon /> : <TrendingDownIcon />}
                      </span>
                      <div className="mov-ayuda-texto">
                        <strong>
                          {esIngreso ? 'Cálculo por tarifa' : 'Solo costo'}
                        </strong>
                        <span>
                          {esIngreso
                            ? maquinaSeleccionada
                              ? `${formatearMoneda(
                                  maquinaSeleccionada.valor_hora,
                                  false,
                                )} / hora`
                              : 'Selecciona una máquina para calcular.'
                            : 'Los egresos no requieren cliente ni horas.'}
                        </span>
                      </div>

                      {valorSugerido > 0 && (
                        <button
                          type="button"
                          className="mov-ayuda-btn"
                          onClick={() =>
                            actualizar('valor', String(valorSugerido))
                          }
                        >
                          Usar {formatearMoneda(valorSugerido)}
                        </button>
                      )}
                    </div>

                    <label className="form-campo form-campo-ancho">
                      <span>Descripción</span>
                      <textarea
                        name="descripcion"
                        rows="3"
                        placeholder={
                          esIngreso
                            ? 'Trabajo realizado, obra o detalle del cobro.'
                            : 'Repuesto, combustible, mantenimiento u otro costo.'
                        }
                        value={formulario.descripcion}
                        onChange={(event) =>
                          actualizar('descripcion', event.target.value)
                        }
                      />
                    </label>
                  </div>
                </fieldset>

                <div className="mov-form-pie">
                  <p>
                    <DollarIcon />
                    {esIngreso
                      ? 'El ingreso suma al balance de la empresa.'
                      : 'El egreso se descuenta del balance de la empresa.'}
                  </p>

                  <button
                    className="btn btn-primario"
                    type="submit"
                    disabled={enviando}
                  >
                    <CheckIcon />
                    {enviando
                      ? 'Guardando…'
                      : esIngreso
                        ? 'Registrar ingreso'
                        : 'Registrar egreso'}
                  </button>
                </div>
              </form>
            </section>

            <section className="tarjeta mov-historial">
              <header className="panel-cabecera mov-historial-cabecera">
                <div>
                  <p className="panel-eyebrow">Historial</p>
                  <h2>Movimientos registrados</h2>
                </div>
                <span className="mov-conteo">
                  {filtrados.length} de {movimientos.length}
                </span>
              </header>

              <div className="mov-toolbar">
                <label className="mov-buscador" htmlFor="buscar-movimiento">
                  <SearchIcon />
                  <input
                    id="buscar-movimiento"
                    type="search"
                    placeholder="Buscar por descripción, máquina o cliente…"
                    value={busqueda}
                    onChange={(event) => {
                      setBusqueda(event.target.value);
                      setPagina(1);
                    }}
                  />
                </label>

                <div
                  className="tabs"
                  role="tablist"
                  aria-label="Filtrar movimientos"
                >
                  {FILTROS.map(({ id, texto }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={filtro === id}
                      className={filtro === id ? 'tab activo' : 'tab'}
                      onClick={() => {
                        setFiltro(id);
                        setPagina(1);
                      }}
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </div>

              {filtrados.length > 0 ? (
                <div
                  className="mov-tabla"
                  role="table"
                  aria-label="Movimientos registrados"
                >
                  <div className="mov-fila mov-encabezado" role="row">
                    <span role="columnheader">Movimiento</span>
                    <span role="columnheader">Máquina</span>
                    <span role="columnheader">Cliente / obra</span>
                    <span role="columnheader">Fecha</span>
                    <span className="mov-col-valor" role="columnheader">
                      Valor
                    </span>
                    <span role="columnheader">
                      <span className="sr-only">Acciones</span>
                    </span>
                  </div>

                  {visibles.map((movimiento) => (
                    <div
                      className="mov-fila"
                      role="row"
                      key={movimiento.id_registro}
                    >
                      <span className="mov-concepto" role="cell">
                        <span
                          className={`mov-signo ${movimiento.tipo}`}
                          aria-hidden="true"
                        >
                          {movimiento.tipo === 'ingreso' ? '+' : '−'}
                        </span>
                        <span className="mov-concepto-info">
                          <span className="mov-concepto-titulo">
                            {movimiento.descripcion ||
                              (movimiento.tipo === 'ingreso'
                                ? 'Ingreso'
                                : 'Egreso')}
                          </span>
                          <span className="mov-concepto-sub">
                            {movimiento.tipo === 'ingreso'
                              ? 'Ingreso'
                              : 'Egreso'}
                            {movimiento.horas
                              ? ` · ${movimiento.horas} h`
                              : ''}
                          </span>
                        </span>
                      </span>

                      <span
                        className="mov-celda"
                        role="cell"
                        data-label="Máquina"
                      >
                        {movimiento.maquina
                          ? nombreMaquina(movimiento.maquina)
                          : '—'}
                      </span>

                      <span
                        className="mov-celda"
                        role="cell"
                        data-label="Cliente / obra"
                      >
                        {movimiento.cliente?.nombre_obra ?? '—'}
                      </span>

                      <span
                        className="mov-celda"
                        role="cell"
                        data-label="Fecha"
                      >
                        {formatearFecha(movimiento.fecha, true)}
                      </span>

                      <span
                        className={`mov-valor ${movimiento.tipo}`}
                        role="cell"
                        data-label="Valor"
                      >
                        {movimiento.tipo === 'ingreso' ? '+' : '−'}
                        {formatearMoneda(movimiento.valor, false)}
                      </span>

                      <span role="cell">
                        <button
                          className="mov-eliminar"
                          type="button"
                          onClick={() => pedirEliminar(movimiento)}
                          aria-label={`Eliminar ${movimiento.tipo} de ${formatearMoneda(
                            movimiento.valor,
                            false,
                          )} del ${formatearFecha(movimiento.fecha, true)}`}
                          title="Eliminar"
                        >
                          <TrashIcon />
                        </button>
                      </span>
                    </div>
                  ))}

                  {filtrados.length > POR_PAGINA && (
                    <nav
                      className="mov-paginacion"
                      aria-label="Paginación del historial"
                    >
                      <p className="mov-paginacion-info">
                        Mostrando <strong>{inicio + 1}</strong>–
                        <strong>{inicio + visibles.length}</strong> de{' '}
                        <strong>{filtrados.length}</strong>
                      </p>

                      <div className="mov-paginacion-controles">
                        <button
                          className="mov-pagina mov-pagina-flecha"
                          type="button"
                          onClick={() => setPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                          aria-label="Página anterior"
                        >
                          <ArrowLeftIcon />
                        </button>

                        {paginasVisibles(paginaActual, totalPaginas).map(
                          (numero, i) =>
                            numero === '…' ? (
                              <span
                                key={`hueco-${i}`}
                                className="mov-pagina-hueco"
                                aria-hidden="true"
                              >
                                …
                              </span>
                            ) : (
                              <button
                                key={numero}
                                className={`mov-pagina${
                                  numero === paginaActual ? ' activa' : ''
                                }`}
                                type="button"
                                onClick={() => setPagina(numero)}
                                aria-label={`Página ${numero}`}
                                aria-current={
                                  numero === paginaActual ? 'page' : undefined
                                }
                              >
                                {numero}
                              </button>
                            ),
                        )}

                        <button
                          className="mov-pagina mov-pagina-flecha"
                          type="button"
                          onClick={() => setPagina(paginaActual + 1)}
                          disabled={paginaActual === totalPaginas}
                          aria-label="Página siguiente"
                        >
                          <ArrowRightIcon />
                        </button>
                      </div>
                    </nav>
                  )}
                </div>
              ) : (
                <EmptyState
                  Icono={SearchIcon}
                  titulo={
                    movimientos.length
                      ? 'No encontramos movimientos'
                      : 'Aún no hay movimientos'
                  }
                  texto={
                    movimientos.length
                      ? 'Prueba con otro término de búsqueda o cambia el filtro.'
                      : 'Registra el primer ingreso o egreso con el formulario.'
                  }
                  accion={
                    movimientos.length ? (
                      <button
                        className="btn btn-fantasma"
                        type="button"
                        onClick={limpiarFiltros}
                      >
                        Limpiar filtros
                      </button>
                    ) : null
                  }
                />
              )}
            </section>
          </div>
        </main>
      </div>

      <Dialogo
        abierto={Boolean(porEliminar)}
        onCerrar={() => setPorEliminar(null)}
        Icono={TrashIcon}
        titulo={`¿Eliminar este ${porEliminar?.tipo ?? 'movimiento'}?`}
        texto="Se borrará de forma permanente y el balance se recalculará. Esta acción no se puede deshacer."
        error={errorEliminar}
        textoConfirmar={eliminando ? 'Eliminando…' : 'Eliminar'}
        IconoConfirmar={TrashIcon}
        onConfirmar={confirmarEliminar}
        ocupado={eliminando}
      >
        {porEliminar && (
          <p className="admin-dialogo-detalle">
            {porEliminar.descripcion ||
              (porEliminar.tipo === 'ingreso' ? 'Ingreso' : 'Egreso')}
            {' · '}
            {porEliminar.tipo === 'ingreso' ? '+' : '−'}
            {formatearMoneda(porEliminar.valor, false)}
            <br />
            {porEliminar.maquina ? nombreMaquina(porEliminar.maquina) : '—'}
            {' · '}
            {formatearFecha(porEliminar.fecha, true)}
            {porEliminar.cliente ? ` · ${porEliminar.cliente.nombre_obra}` : ''}
          </p>
        )}
      </Dialogo>
    </div>
  );
}
