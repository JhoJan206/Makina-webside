import { useEffect, useRef } from 'react';

// Ventana modal de confirmación (<dialog> nativo). Se muestra mientras
// `abierto` es true; Escape y el botón secundario llaman a `onCerrar`.
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
  ocupado = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;

    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  function cerrar() {
    if (!ocupado) onCerrar();
  }

  return (
    <dialog
      className="admin-dialogo"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        cerrar();
      }}
      aria-labelledby="dialogo-titulo"
    >
      {abierto && (
        <div className="admin-dialogo-cuerpo">
          {Icono && (
            <span className={`admin-dialogo-icono ${tono}`}>
              <Icono />
            </span>
          )}

          <h2 id="dialogo-titulo">{titulo}</h2>
          {texto && <p>{texto}</p>}
          {children}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="admin-dialogo-acciones">
            <button className="btn btn-fantasma" type="button" onClick={cerrar} disabled={ocupado}>
              {textoCancelar}
            </button>

            {onConfirmar && (
              <button
                className={`btn ${tono === 'peligro' ? 'btn-peligro' : 'btn-primario'}`}
                type="button"
                onClick={onConfirmar}
                disabled={ocupado}
              >
                {IconoConfirmar && <IconoConfirmar />}
                {textoConfirmar}
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
