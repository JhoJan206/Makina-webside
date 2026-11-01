import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/cliente.js';
import EmptyState from './EmptyState.jsx';
import PageHeader from './PageHeader.jsx';
import Sidebar from './Sidebar.jsx';
import StatCard from './StatCard.jsx';
import Topbar from './Topbar.jsx';
import {
  BuildingIcon,
  CheckIcon,
  EditIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  TruckIcon,
  UsersIcon,
  XIcon,
} from './Icons.jsx';

export const SECCIONES_ADMIN = [
  { id: 'maquinas', texto: 'Máquinas', href: '/admin/maquinas', Icono: TruckIcon },
  { id: 'operadores', texto: 'Operadores', href: '/admin/operadores', Icono: UsersIcon },
  { id: 'clientes', texto: 'Clientes', href: '/admin/clientes', Icono: BuildingIcon },
];

function valoresIniciales(campos, fila) {
  return Object.fromEntries(
    campos.map((campo) => {
      const valor = fila?.[campo.nombre] ?? campo.defecto ?? '';
      return [campo.nombre, valor === null ? '' : String(valor)];
    }),
  );
}

// Convierte los valores del formulario en el cuerpo que espera la API
function construirCuerpo(campos, valores) {
  return Object.fromEntries(
    campos.map((campo) => {
      let valor = String(valores[campo.nombre] ?? '').trim();
      if (campo.transformar) valor = campo.transformar(valor);

      if (valor === '') return [campo.nombre, null];
      if (campo.tipo === 'numero') return [campo.nombre, Number(valor)];
      return [campo.nombre, valor];
    }),
  );
}

function CampoImagen({ campo, valor, valores, onChange }) {
  const predefinida = campo.opciones.some((opcion) => opcion.valor === valor);
  const [personalizada, setPersonalizada] = useState(valor !== '' && !predefinida);
  const vistaPrevia = valor || campo.vistaPrevia?.(valores);

  return (
    <div className="form-campo form-campo-ancho admin-imagen">
      <span>{campo.etiqueta}</span>

      <div className="admin-imagen-cuerpo">
        {vistaPrevia && (
          <img className="admin-imagen-preview" src={vistaPrevia} alt="" />
        )}

        <div className="admin-imagen-controles">
          <select
            value={personalizada ? 'otra' : valor}
            onChange={(event) => {
              const elegido = event.target.value;
              setPersonalizada(elegido === 'otra');
              onChange(elegido === 'otra' ? '' : elegido);
            }}
          >
            <option value="">Automática (según el tipo)</option>
            {campo.opciones.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
            <option value="otra">Otra (URL)</option>
          </select>

          {personalizada && (
            <input
              type="url"
              value={valor}
              placeholder="https://… o /img/…"
              onChange={(event) => onChange(event.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ campo, valores, onChange }) {
  const valor = valores[campo.nombre] ?? '';
  const cambiar = (nuevo) => onChange(campo.nombre, nuevo);

  if (campo.tipo === 'imagen') {
    return (
      <CampoImagen
        campo={campo}
        valor={valor}
        valores={valores}
        onChange={cambiar}
      />
    );
  }

  const comunes = {
    name: campo.nombre,
    value: valor,
    required: campo.requerido,
    placeholder: campo.placeholder,
    onChange: (event) => cambiar(event.target.value),
  };

  return (
    <label className={`form-campo${campo.ancho ? ' form-campo-ancho' : ''}`}>
      <span>
        {campo.etiqueta}
        {campo.requerido && ' *'}
      </span>

      {campo.tipo === 'select' ? (
        <select {...comunes}>
          <option value="" disabled>
            Selecciona una opción
          </option>
          {campo.opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...comunes}
          type={
            campo.tipo === 'numero' ? 'number' : campo.tipo === 'tel' ? 'tel' : 'text'
          }
          inputMode={campo.tipo === 'numero' ? 'decimal' : undefined}
          min={campo.min}
          step={campo.paso}
          maxLength={campo.max}
        />
      )}

      {campo.ayuda && <small className="admin-ayuda">{campo.ayuda}</small>}
    </label>
  );
}

// Página de administración genérica: listado con búsqueda, formulario de
// creación / edición y confirmación de borrado. Cada entidad (máquinas,
// operadores, clientes) la configura con sus campos y columnas.
export default function AdminCrud({
  seccion,
  entidad,
  descripcion,
  rutaApi,
  clave,
  cache,
  normalizar = (fila) => fila,
  campos,
  columnas,
  titulo,
  subtitulo,
  enlace,
  textoBusqueda,
  estadisticas,
  bloqueoEliminar = () => null,
  avisoEliminar = () => null,
}) {
  const [filas, setFilas] = useState(() => [...cache]);
  const [editando, setEditando] = useState(null);
  const [valores, setValores] = useState(() => valoresIniciales(campos));
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [porEliminar, setPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const formRef = useRef(null);
  const dialogoRef = useRef(null);

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return filas;

    return filas.filter((fila) =>
      textoBusqueda(fila).toLowerCase().includes(termino),
    );
  }, [busqueda, filas, textoBusqueda]);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;

    if (porEliminar && !dialogo.open) dialogo.showModal();
    if (!porEliminar && dialogo.open) dialogo.close();
  }, [porEliminar]);

  const seccionActual = SECCIONES_ADMIN.find((item) => item.id === seccion);

  function sincronizar(actualizar) {
    actualizar(cache);
    setFilas([...cache]);
  }

  function reiniciarFormulario(fila = null) {
    setEditando(fila);
    setValores(valoresIniciales(campos, fila));
    setClaveFormulario((actual) => actual + 1);
    setError('');
  }

  function editar(fila) {
    reiniciarFormulario(fila);
    setAviso('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cambiarValor(nombre, valor) {
    setValores((actuales) => ({ ...actuales, [nombre]: valor }));
    if (error) setError('');
    if (aviso) setAviso('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (guardando) return;

    const faltante = campos.find(
      (campo) => campo.requerido && !String(valores[campo.nombre] ?? '').trim(),
    );
    if (faltante) {
      setError(`El campo "${faltante.etiqueta}" es obligatorio.`);
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const cuerpo = construirCuerpo(campos, valores);
      const guardada = normalizar(
        editando
          ? await api(`${rutaApi}/${editando[clave]}`, { metodo: 'PUT', cuerpo })
          : await api(rutaApi, { metodo: 'POST', cuerpo }),
      );

      sincronizar((lista) => {
        const indice = lista.findIndex((fila) => fila[clave] === guardada[clave]);
        if (indice === -1) lista.push(guardada);
        else lista[indice] = guardada;
      });

      setAviso(
        `${titulo(guardada)} quedó ${editando ? 'actualizad' : 'registrad'}${
          entidad.genero === 'f' ? 'a' : 'o'
        }.`,
      );
      reiniciarFormulario();
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setGuardando(false);
    }
  }

  function pedirEliminar(fila) {
    setErrorEliminar('');
    setPorEliminar(fila);
  }

  function cerrarDialogo() {
    if (eliminando) return;
    setPorEliminar(null);
  }

  async function confirmarEliminar() {
    if (!porEliminar || eliminando) return;

    setEliminando(true);
    setErrorEliminar('');

    try {
      await api(`${rutaApi}/${porEliminar[clave]}`, { metodo: 'DELETE' });

      sincronizar((lista) => {
        const indice = lista.findIndex((fila) => fila[clave] === porEliminar[clave]);
        if (indice !== -1) lista.splice(indice, 1);
      });

      if (editando?.[clave] === porEliminar[clave]) reiniciarFormulario();
      setAviso(`${titulo(porEliminar)} fue eliminad${entidad.genero === 'f' ? 'a' : 'o'}.`);
      setPorEliminar(null);
    } catch (errorApi) {
      setErrorEliminar(errorApi.message);
    } finally {
      setEliminando(false);
    }
  }

  const bloqueo = porEliminar ? bloqueoEliminar(porEliminar) : null;
  const advertencia = porEliminar ? avisoEliminar(porEliminar) : null;
  const plantillaColumnas = {
    '--admin-columnas': `minmax(180px, 1.5fr) repeat(${columnas.length}, minmax(90px, 1fr)) 84px`,
  };

  return (
    <div className="dashboard pagina-admin">
      <Sidebar activo="Gestión" />

      <div className="dashboard-principal">
        <Topbar
          migas={[
            { texto: 'gestión', href: '/admin/maquinas' },
            { texto: seccionActual.texto.toLowerCase() },
          ]}
        />

        <main className="dashboard-contenido admin-contenido">
          <PageHeader
            eyebrow="Administración"
            titulo={`Gestión de ${seccionActual.texto.toLowerCase()}`}
            descripcion={descripcion}
          />

          <nav className="admin-secciones" aria-label="Secciones de gestión">
            {SECCIONES_ADMIN.map(({ id, texto, href, Icono }) => (
              <a
                key={id}
                href={href}
                className={id === seccion ? 'admin-seccion activo' : 'admin-seccion'}
                aria-current={id === seccion ? 'page' : undefined}
              >
                <Icono />
                {texto}
              </a>
            ))}
          </nav>

          <section className="stats-grid admin-stats" aria-label="Resumen">
            {estadisticas(filas).map((stat) => (
              <StatCard key={stat.etiqueta} {...stat} />
            ))}
          </section>

          <div className="admin-grid">
            <section className="tarjeta admin-form-card" ref={formRef}>
              <header className="admin-form-cabecera">
                <div>
                  <p className="panel-eyebrow">
                    {editando ? 'Edición' : 'Registro'}
                  </p>
                  <h2>{editando ? `Editar ${entidad.singular}` : entidad.nuevo}</h2>
                  <p>
                    {editando
                      ? `Estás modificando ${titulo(editando)}.`
                      : 'Los campos con * son obligatorios.'}
                  </p>
                </div>

                <span className={`admin-badge${editando ? ' editando' : ''}`}>
                  {editando ? 'Editando' : 'Nuevo'}
                </span>
              </header>

              <form
                className="admin-form"
                key={claveFormulario}
                onSubmit={handleSubmit}
                noValidate
              >
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
                  {campos.map((campo) => (
                    <Campo
                      key={campo.nombre}
                      campo={campo}
                      valores={valores}
                      onChange={cambiarValor}
                    />
                  ))}
                </div>

                <div className="admin-form-pie">
                  {editando && (
                    <button
                      className="btn btn-fantasma"
                      type="button"
                      onClick={() => reiniciarFormulario()}
                      disabled={guardando}
                    >
                      <XIcon />
                      Cancelar
                    </button>
                  )}

                  <button className="btn btn-primario" type="submit" disabled={guardando}>
                    {editando ? <CheckIcon /> : <PlusIcon />}
                    {guardando
                      ? 'Guardando…'
                      : editando
                        ? 'Guardar cambios'
                        : entidad.crear}
                  </button>
                </div>
              </form>
            </section>

            <section className="tarjeta admin-listado">
              <header className="panel-cabecera admin-listado-cabecera">
                <div>
                  <p className="panel-eyebrow">Registros</p>
                  <h2>{seccionActual.texto}</h2>
                </div>
                <span className="admin-conteo">
                  {filtradas.length} de {filas.length}
                </span>
              </header>

              <div className="admin-toolbar">
                <label className="admin-buscador">
                  <SearchIcon />
                  <input
                    type="search"
                    placeholder={`Buscar ${seccionActual.texto.toLowerCase()}…`}
                    aria-label={`Buscar ${seccionActual.texto.toLowerCase()}`}
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                  />
                </label>
              </div>

              {filtradas.length > 0 ? (
                <div
                  className="admin-tabla"
                  role="table"
                  aria-label={seccionActual.texto}
                  style={plantillaColumnas}
                >
                  <div className="admin-fila admin-encabezado" role="row">
                    <span role="columnheader">{entidad.columnaPrincipal}</span>
                    {columnas.map((columna) => (
                      <span key={columna.etiqueta} role="columnheader">
                        {columna.etiqueta}
                      </span>
                    ))}
                    <span className="admin-col-acciones" role="columnheader">
                      Acciones
                    </span>
                  </div>

                  {filtradas.map((fila) => {
                    const seleccionada = editando?.[clave] === fila[clave];
                    const href = enlace?.(fila);

                    return (
                      <div
                        key={fila[clave]}
                        className={`admin-fila${seleccionada ? ' seleccionada' : ''}`}
                        role="row"
                      >
                        <span className="admin-principal" role="cell">
                          {href ? (
                            <a href={href} className="admin-principal-titulo">
                              {titulo(fila)}
                            </a>
                          ) : (
                            <span className="admin-principal-titulo">{titulo(fila)}</span>
                          )}
                          {subtitulo && (
                            <span className="admin-principal-sub">{subtitulo(fila)}</span>
                          )}
                        </span>

                        {columnas.map((columna) => (
                          <span
                            key={columna.etiqueta}
                            className="admin-celda"
                            role="cell"
                            data-etiqueta={columna.etiqueta}
                          >
                            {columna.valor(fila)}
                          </span>
                        ))}

                        <span className="admin-acciones" role="cell">
                          <button
                            type="button"
                            className="admin-accion"
                            aria-label={`Editar ${titulo(fila)}`}
                            title="Editar"
                            onClick={() => editar(fila)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="admin-accion peligro"
                            aria-label={`Eliminar ${titulo(fila)}`}
                            title="Eliminar"
                            onClick={() => pedirEliminar(fila)}
                          >
                            <TrashIcon />
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  Icono={seccionActual.Icono}
                  titulo={
                    filas.length === 0
                      ? `Aún no hay ${seccionActual.texto.toLowerCase()}`
                      : 'Sin resultados'
                  }
                  texto={
                    filas.length === 0
                      ? `Registra ${entidad.articulo} primer${entidad.genero === 'f' ? 'a' : ''} ${entidad.singular} con el formulario.`
                      : 'Prueba con otro término de búsqueda.'
                  }
                />
              )}
            </section>
          </div>
        </main>
      </div>

      <dialog
        className="admin-dialogo"
        ref={dialogoRef}
        onCancel={(event) => {
          event.preventDefault();
          cerrarDialogo();
        }}
        aria-labelledby="admin-dialogo-titulo"
      >
        {porEliminar && (
          <div className="admin-dialogo-cuerpo">
            <span className={`admin-dialogo-icono${bloqueo ? ' bloqueado' : ''}`}>
              {bloqueo ? <LockIcon /> : <TrashIcon />}
            </span>

            <h2 id="admin-dialogo-titulo">
              {bloqueo
                ? `No se puede eliminar ${titulo(porEliminar)}`
                : `¿Eliminar ${titulo(porEliminar)}?`}
            </h2>

            <p>
              {bloqueo ??
                `Esta acción no se puede deshacer.${advertencia ? ` ${advertencia}` : ''}`}
            </p>

            {errorEliminar && (
              <p className="form-error" role="alert">
                {errorEliminar}
              </p>
            )}

            <div className="admin-dialogo-acciones">
              <button
                className="btn btn-fantasma"
                type="button"
                onClick={cerrarDialogo}
                disabled={eliminando}
              >
                {bloqueo ? 'Entendido' : 'Cancelar'}
              </button>

              {!bloqueo && (
                <button
                  className="btn btn-peligro"
                  type="button"
                  onClick={confirmarEliminar}
                  disabled={eliminando}
                >
                  <TrashIcon />
                  {eliminando ? 'Eliminando…' : 'Eliminar'}
                </button>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
