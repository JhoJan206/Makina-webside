import { useEffect, useId, useRef } from 'react';

// Ventana modal (<dialog> nativo). Se muestra mientras `abierto` es true;
// Escape y el botón secundario llaman a `onCerrar`. Con `onEnviar` el cuerpo
// es un formulario y el botón principal lo envía (también con Enter).
export default function Dialogo({
  abierto,
  onCerrar,
  Icono,
  tono = 'peligro',
  titulo,
  texto,
  error,
  children,
  textoCancelar = 'Cancelar',
  textoConfirmar,
  IconoConfirmar,
  onConfirmar,
  onEnviar,
  ocupado = false,
  ancho = false,
}) {
  const ref = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;

    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  function cerrar() {
    if (!ocupado) onCerrar();
  }

  const conBotonPrincipal = Boolean(onConfirmar || onEnviar);

  const acciones = (
    <div className="admin-dialogo-acciones">
      <button className="btn btn-fantasma" type="button" onClick={cerrar} disabled={ocupado}>
        {textoCancelar}
      </button>

      {conBotonPrincipal && (
        <button
          className={`btn ${tono === 'peligro' ? 'btn-peligro' : 'btn-primario'}`}
          type={onEnviar ? 'submit' : 'button'}
          onClick={onEnviar ? undefined : onConfirmar}
          disabled={ocupado}
        >
          {IconoConfirmar && <IconoConfirmar />}
          {textoConfirmar}
        </button>
      )}
    </div>
  );

  const mensajeError = error && (
    <p className="form-error" role="alert">
      {error}
    </p>
  );

  return (
    <dialog
      className={`admin-dialogo${ancho ? ' ancho' : ''}`}
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        cerrar();
      }}
      aria-labelledby={idTitulo}
    >
      {abierto && (
        <div className="admin-dialogo-cuerpo">
          {Icono && (
            <span className={`admin-dialogo-icono ${tono}`}>
              <Icono />
            </span>
          )}

          <h2 id={idTitulo}>{titulo}</h2>
          {texto && <p>{texto}</p>}

          {onEnviar ? (
            <form className="admin-dialogo-form" onSubmit={onEnviar} noValidate>
              {mensajeError}
              {children}
              {acciones}
            </form>
          ) : (
            <>
              {children}
              {mensajeError}
              {acciones}
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
