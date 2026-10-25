export default function PageHeader({
  eyebrow,
  titulo,
  descripcion,
  acciones,
  children,
}) {
  return (
    <header className="page-header">
      <div className="page-header-texto">
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1>{titulo}</h1>
        {descripcion && <p className="page-descripcion">{descripcion}</p>}
        {children}
      </div>

      {acciones && <div className="page-header-acciones">{acciones}</div>}
    </header>
  );
}
