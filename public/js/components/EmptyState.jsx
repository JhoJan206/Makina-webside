export default function EmptyState({ Icono, titulo, texto, accion }) {
  return (
    <div className="empty-state">
      {Icono && (
        <span className="empty-state-icono" aria-hidden="true">
          <Icono />
        </span>
      )}
      <p className="empty-state-titulo">{titulo}</p>
      {texto && <p className="empty-state-texto">{texto}</p>}
      {accion && <div className="empty-state-accion">{accion}</div>}
    </div>
  );
}
