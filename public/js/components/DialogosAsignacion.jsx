import { useState } from 'react';
import Dialogo from './Dialogo.jsx';
import { CheckIcon, LinkIcon, StopIcon } from './Icons.jsx';
import {
  formatearFecha,
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
} from '../data/asignaciones.js';

export function textoDias(dias) {
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

// Asigna un operador a una máquina. Desde el detalle de una máquina se pasa
// `maquina` y se elige el operador; desde el de un operador, al revés.
// Monta el componente solo mientras está abierto para empezar siempre limpio.
export function DialogoAsignar({ maquina = null, operador = null, onCerrar, onAsignado }) {
  const [idMaquina, setIdMaquina] = useState(maquina ? String(maquina.id_maquina) : '');
  const [idOperador, setIdOperador] = useState(operador ? String(operador.id_operador) : '');
  const [fecha, setFecha] = useState(fechaDeHoy);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const maquinaElegida =
    maquinas.find((item) => item.id_maquina === Number(idMaquina)) ?? null;
  const operadorElegido =
    operadores.find((item) => item.id_operador === Number(idOperador)) ?? null;
  const operadorDeLaMaquina = maquinaElegida
    ? obtenerOperadorActual(maquinaElegida.id_maquina)
    : null;
  const maquinaDelOperador = operadorElegido
    ? obtenerMaquinaActual(operadorElegido.id_operador)
    : null;
  const yaAsignado =
    operadorDeLaMaquina &&
    operadorElegido &&
    operadorDeLaMaquina.id_operador === operadorElegido.id_operador;

  const cambios = [];
  if (operadorDeLaMaquina && !yaAsignado) {
    cambios.push(
      `${nombreOperador(operadorDeLaMaquina)} dejará la ${nombreMaquina(maquinaElegida)}.`,
    );
  }
  if (maquinaDelOperador && maquinaDelOperador.id_maquina !== maquinaElegida?.id_maquina) {
    cambios.push(
      `${nombreOperador(operadorElegido)} dejará la ${nombreMaquina(
        maquinaDelOperador,
      )}, que quedará sin operador.`,
    );
  }

  const cambiando = maquina
    ? Boolean(obtenerOperadorActual(maquina.id_maquina))
    : Boolean(obtenerMaquinaActual(operador.id_operador));

  async function handleSubmit(event) {
    event.preventDefault();
    if (guardando) return;

    if (!maquinaElegida) return setError('Selecciona la máquina.');
    if (!operadorElegido) return setError('Selecciona el operador.');
    if (!fecha) return setError('Indica la fecha de inicio.');
    if (yaAsignado) return setError('Ese operador ya está asignado a esta máquina.');

    setGuardando(true);
    setError('');

    let resultado;

    try {
      resultado = await crearAsignacion({
        id_maquina: maquinaElegida.id_maquina,
        id_operador: operadorElegido.id_operador,
        fecha_ingreso: fecha,
      });
    } catch (errorApi) {
      setError(errorApi.message);
      setGuardando(false);
      return;
    }

    const { asignacion, cerradas } = resultado;
    onAsignado(
      `${nombreOperador(asignacion.operador)} quedó a cargo de la ${nombreMaquina(
        asignacion.maquina,
      )}.${
        cerradas.length
          ? ` Se ${
              cerradas.length === 1
                ? 'cerró 1 asignación anterior'
                : `cerraron ${cerradas.length} asignaciones anteriores`
            }.`
          : ''
      }`,
    );
  }

  const titulo = maquina
    ? cambiando
      ? 'Cambiar operador'
      : 'Asignar operador'
    : cambiando
      ? 'Cambiar máquina'
      : 'Asignar máquina';

  return (
    <Dialogo
      abierto
      onCerrar={onCerrar}
      Icono={LinkIcon}
      tono="aviso"
      titulo={titulo}
      texto={
        maquina
          ? `Elige quién operará la ${nombreMaquina(maquina)} y desde cuándo.`
          : `Elige la máquina que operará ${nombreOperador(operador)} y desde cuándo.`
      }
      error={error}
      textoConfirmar={guardando ? 'Asignando…' : 'Asignar'}
      IconoConfirmar={LinkIcon}
      onEnviar={handleSubmit}
      ocupado={guardando}
      ancho
    >
      <div className="form-grid">
        {maquina ? (
          <label className="form-campo form-campo-ancho">
            <span>Operador *</span>
            <select
              value={idOperador}
              onChange={(event) => {
                setIdOperador(event.target.value);
                setError('');
              }}
              required
            >
              <option value="" disabled>
                Selecciona un operador
              </option>
              {operadores.map((item) => {
                const actual = obtenerMaquinaActual(item.id_operador);
                return (
                  <option key={item.id_operador} value={item.id_operador}>
                    {nombreOperador(item)} · {actual ? `en ${actual.placa}` : 'Libre'}
                  </option>
                );
              })}
            </select>
          </label>
        ) : (
          <label className="form-campo form-campo-ancho">
            <span>Máquina *</span>
            <select
              value={idMaquina}
              onChange={(event) => {
                setIdMaquina(event.target.value);
                setError('');
              }}
              required
            >
              <option value="" disabled>
                Selecciona una máquina
              </option>
              {maquinas.map((item) => {
                const actual = obtenerOperadorActual(item.id_maquina);
                return (
                  <option key={item.id_maquina} value={item.id_maquina}>
                    {nombreMaquina(item)} · {actual ? nombreOperador(actual) : 'Sin operador'}
                  </option>
                );
              })}
            </select>
          </label>
        )}

        <label className="form-campo form-campo-ancho">
          <span>Fecha de inicio *</span>
          <input
            type="date"
            value={fecha}
            onChange={(event) => {
              setFecha(event.target.value);
              setError('');
            }}
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
            <span>Las asignaciones anteriores se cierran con la fecha de inicio.</span>
          </div>
        )
      )}
    </Dialogo>
  );
}

// Cierra una asignación activa (ya detallada con listarAsignaciones)
export function DialogoCerrarAsignacion({ asignacion, onCerrar, onCerrada }) {
  const [fecha, setFecha] = useState(() =>
    fechaDeHoy() < asignacion.fecha_ingreso ? asignacion.fecha_ingreso : fechaDeHoy(),
  );
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState('');

  async function confirmar(event) {
    event.preventDefault();
    if (cerrando) return;

    if (!fecha) return setError('Indica la fecha de cierre.');
    if (fecha < asignacion.fecha_ingreso) {
      return setError('La fecha de cierre no puede ser anterior al inicio.');
    }

    setCerrando(true);
    setError('');

    let cerrada;

    try {
      cerrada = await cerrarAsignacion(asignacion.id, fecha);
    } catch (errorApi) {
      setError(errorApi.message);
      setCerrando(false);
      return;
    }

    onCerrada(
      `Asignación cerrada: ${nombreOperador(cerrada.operador)} trabajó ${textoDias(
        cerrada.dias,
      )} en la ${nombreMaquina(cerrada.maquina)}.`,
    );
  }

  return (
    <Dialogo
      abierto
      onCerrar={onCerrar}
      Icono={StopIcon}
      tono="aviso"
      titulo="¿Cerrar esta asignación?"
      texto="El operador deja la máquina en la fecha de cierre. El trabajo queda en el historial."
      error={error}
      textoConfirmar={cerrando ? 'Cerrando…' : 'Cerrar asignación'}
      IconoConfirmar={CheckIcon}
      onEnviar={confirmar}
      ocupado={cerrando}
    >
      <p className="admin-dialogo-detalle">
        {asignacion.operador ? nombreOperador(asignacion.operador) : '—'} ·{' '}
        {asignacion.maquina ? nombreMaquina(asignacion.maquina) : '—'}
        <br />
        Desde {formatearFecha(asignacion.fecha_ingreso, true)} · {asignacion.horas} h registradas
      </p>

      <label className="form-campo">
        <span>Fecha de cierre *</span>
        <input
          type="date"
          value={fecha}
          min={asignacion.fecha_ingreso}
          onChange={(event) => {
            setFecha(event.target.value);
            setError('');
          }}
          required
        />
      </label>
    </Dialogo>
  );
}
