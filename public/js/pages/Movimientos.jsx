import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatCard from '../components/StatCard.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  DollarIcon,
  SearchIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TruckIcon,
  WalletIcon,
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
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarTodos, setMostrarTodos] = useState(false);

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

  const visibles = mostrarTodos ? filtrados : filtrados.slice(0, 10);

  const balanceTexto =
    resumen.balance < 0
      ? `−${formatearMoneda(Math.abs(resumen.balance))}`
      : formatearMoneda(resumen.balance);

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
  }

  function handleSubmit(event) {
    event.preventDefault();

    const idMaquina = Number(formulario.id_maquina);
    const valor = Number(formulario.valor);

    if (!formulario.fecha) {
      setError('Selecciona la fecha del movimiento.');
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

    const movimiento = crearMovimiento({
      tipo,
      fecha: formulario.fecha,
      id_maquina: idMaquina,
      id_cliente: esIngreso ? Number(formulario.id_cliente) : null,
      horas: esIngreso ? horasNumero : null,
      valor,
      descripcion: formulario.descripcion,
    });

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

          <section className="stats-grid" aria-label="Resumen de movimientos">
            <StatCard
              etiqueta="Ingresos"
              valor={formatearMoneda(resumen.ingresos)}
              detalle={`${resumen.cantidadIngresos} registros de entrada`}
              Icono={TrendingUpIcon}
              tono="verde"
            />
            <StatCard
              etiqueta="Egresos"
              valor={formatearMoneda(resumen.egresos)}
              detalle={`${resumen.cantidadEgresos} registros de salida`}
              Icono={TrendingDownIcon}
              tono="rojo"
            />
            <StatCard
              etiqueta="Balance"
              valor={balanceTexto}
              detalle="Ingresos menos egresos"
              Icono={WalletIcon}
              tono={resumen.balance < 0 ? 'rojo' : 'ambar'}
            />
            <StatCard
              etiqueta="Movimientos"
              valor={resumen.total}
              detalle={`${resumen.horas} horas facturadas`}
              Icono={ClipboardIcon}
              tono="azul"
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
                        value={formulario.fecha}
                        onChange={(event) =>
                          actualizar('fecha', event.target.value)
                        }
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

                  <button className="btn btn-primario" type="submit">
                    <CheckIcon />
                    {esIngreso ? 'Registrar ingreso' : 'Registrar egreso'}
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
                    onChange={(event) => setBusqueda(event.target.value)}
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
                      onClick={() => setFiltro(id)}
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
                    </div>
                  ))}

                  {filtrados.length > 10 && (
                    <div className="mov-historial-pie">
                      <button
                        className="btn btn-fantasma btn-mini"
                        type="button"
                        onClick={() => setMostrarTodos((valor) => !valor)}
                      >
                        {mostrarTodos
                          ? 'Ver menos'
                          : `Ver todos (${filtrados.length})`}
                      </button>
                    </div>
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
    </div>
  );
}
