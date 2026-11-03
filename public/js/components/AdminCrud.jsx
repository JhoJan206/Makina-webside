import { useMemo, useState } from 'react';
import { api } from '../api/cliente.js';
import Dialogo from './Dialogo.jsx';
import EmptyState from './EmptyState.jsx';
import {
  CheckIcon,
  EditIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from './Icons.jsx';

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

// Lógica común de crear / editar / eliminar para máquinas, operadores y
// clientes. Cada página la configura con sus campos y decide cómo mostrar el
// listado; el formulario y la confirmación de borrado van en diálogos
// (`crud.dialogos`).
export function useCrud({
  entidad,
  rutaApi,
  clave,
  cache,
  normalizar = (fila) => fila,
  campos,
  titulo,
  bloqueoEliminar = () => null,
  avisoEliminar = () => null,
}) {
  const [filas, setFilas] = useState(() => [...cache]);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [valores, setValores] = useState(() => valoresIniciales(campos));
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [porEliminar, setPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const terminacion = entidad.genero === 'f' ? 'a' : 'o';

  function sincronizar(actualizar) {
    actualizar(cache);
    setFilas([...cache]);
  }

  function abrirFormulario(fila = null) {
    setEditando(fila);
    setValores(valoresIniciales(campos, fila));
    setClaveFormulario((actual) => actual + 1);
    setError('');
    setAviso('');
    setFormularioAbierto(true);
  }

  function cambiarValor(nombre, valor) {
    setValores((actuales) => ({ ...actuales, [nombre]: valor }));
    if (error) setError('');
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
        `${titulo(guardada)} quedó ${editando ? 'actualizad' : 'registrad'}${terminacion}.`,
      );
      setFormularioAbierto(false);
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setGuardando(false);
    }
  }

  function pedirEliminar(fila) {
    setErrorEliminar('');
    setAviso('');
    setPorEliminar(fila);
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

      setAviso(`${titulo(porEliminar)} fue eliminad${terminacion}.`);
      setPorEliminar(null);
    } catch (errorApi) {
      setErrorEliminar(errorApi.message);
    } finally {
      setEliminando(false);
    }
  }

  const bloqueo = porEliminar ? bloqueoEliminar(porEliminar) : null;
  const advertencia = porEliminar ? avisoEliminar(porEliminar) : null;

  const dialogos = (
    <>
      <Dialogo
        abierto={formularioAbierto}
        onCerrar={() => setFormularioAbierto(false)}
        Icono={editando ? EditIcon : PlusIcon}
        tono="aviso"
        titulo={editando ? `Editar ${entidad.singular}` : entidad.nuevo}
        texto={
          editando
            ? `Estás modificando ${titulo(editando)}. Los campos con * son obligatorios.`
            : 'Los campos con * son obligatorios.'
        }
        error={error}
        textoConfirmar={guardando ? 'Guardando…' : editando ? 'Guardar cambios' : entidad.crear}
        IconoConfirmar={editando ? CheckIcon : PlusIcon}
        onEnviar={handleSubmit}
        ocupado={guardando}
        ancho
      >
        <div className="form-grid" key={claveFormulario}>
          {campos.map((campo) => (
            <Campo key={campo.nombre} campo={campo} valores={valores} onChange={cambiarValor} />
          ))}
        </div>
      </Dialogo>

      <Dialogo
        abierto={Boolean(porEliminar)}
        onCerrar={() => setPorEliminar(null)}
        Icono={bloqueo ? LockIcon : TrashIcon}
        tono={bloqueo ? 'aviso' : 'peligro'}
        titulo={
          porEliminar &&
          (bloqueo
            ? `No se puede eliminar ${titulo(porEliminar)}`
            : `¿Eliminar ${titulo(porEliminar)}?`)
        }
        texto={
          bloqueo ??
          `Esta acción no se puede deshacer.${advertencia ? ` ${advertencia}` : ''}`
        }
        error={errorEliminar}
        textoCancelar={bloqueo ? 'Entendido' : 'Cancelar'}
        textoConfirmar={eliminando ? 'Eliminando…' : 'Eliminar'}
        IconoConfirmar={TrashIcon}
        onConfirmar={bloqueo ? undefined : confirmarEliminar}
        ocupado={eliminando}
      />
    </>
  );

  return {
    filas,
    aviso,
    nuevo: () => abrirFormulario(),
    editar: abrirFormulario,
    pedirEliminar,
    dialogos,
  };
}

// Aviso de "registrado / actualizado / eliminado" tras una acción del CRUD
export function AvisoCrud({ crud }) {
  if (!crud.aviso) return null;

  return (
    <p className="admin-aviso" role="status">
      <CheckIcon />
      {crud.aviso}
    </p>
  );
}

// Botones de editar y eliminar de una fila o tarjeta
export function AccionesCrud({ crud, fila, nombre, celda = false }) {
  return (
    <span className="admin-acciones" role={celda ? 'cell' : undefined}>
      <button
        type="button"
        className="admin-accion"
        aria-label={`Editar ${nombre}`}
        title="Editar"
        onClick={() => crud.editar(fila)}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="admin-accion peligro"
        aria-label={`Eliminar ${nombre}`}
        title="Eliminar"
        onClick={() => crud.pedirEliminar(fila)}
      >
        <TrashIcon />
      </button>
    </span>
  );
}

// Listado en tabla con buscador (lo usa Clientes)
export function TablaCrud({
  crud,
  plural,
  columnaPrincipal,
  clave,
  columnas,
  titulo,
  subtitulo,
  enlace,
  textoBusqueda,
  Icono,
  textoVacio,
}) {
  const [busqueda, setBusqueda] = useState('');
  const { filas } = crud;

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return filas;

    return filas.filter((fila) => textoBusqueda(fila).toLowerCase().includes(termino));
  }, [busqueda, filas, textoBusqueda]);

  const plantillaColumnas = {
    '--admin-columnas': `minmax(180px, 1.5fr) repeat(${columnas.length}, minmax(90px, 1fr)) 84px`,
  };

  return (
    <section className="tarjeta admin-listado">
      <header className="panel-cabecera admin-listado-cabecera">
        <div>
          <p className="panel-eyebrow">Registros</p>
          <h2>{plural}</h2>
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
            placeholder={`Buscar ${plural.toLowerCase()}…`}
            aria-label={`Buscar ${plural.toLowerCase()}`}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>
      </div>

      {filtradas.length > 0 ? (
        <div className="admin-tabla" role="table" aria-label={plural} style={plantillaColumnas}>
          <div className="admin-fila admin-encabezado" role="row">
            <span role="columnheader">{columnaPrincipal}</span>
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
            const href = enlace?.(fila);

            return (
              <div key={fila[clave]} className="admin-fila" role="row">
                <span className="admin-principal" role="cell">
                  {href ? (
                    <a href={href} className="admin-principal-titulo">
                      {titulo(fila)}
                    </a>
                  ) : (
                    <span className="admin-principal-titulo">{titulo(fila)}</span>
                  )}
                  {subtitulo && <span className="admin-principal-sub">{subtitulo(fila)}</span>}
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

                <AccionesCrud crud={crud} fila={fila} nombre={titulo(fila)} celda />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          Icono={Icono}
          titulo={filas.length === 0 ? `Aún no hay ${plural.toLowerCase()}` : 'Sin resultados'}
          texto={filas.length === 0 ? textoVacio : 'Prueba con otro término de búsqueda.'}
        />
      )}
    </section>
  );
}
