export default function StatCard({
  etiqueta,
  valor,
  detalle,
  Icono,
  tono = 'neutro',
}) {
  return (
    <article className={`stat-card ${tono}`}>
      <div className="stat-card-top">
        <span className="stat-card-icono" aria-hidden="true">
          {Icono && <Icono />}
        </span>
        <span className="stat-card-etiqueta">{etiqueta}</span>
      </div>

      <p className="stat-card-valor">{valor}</p>
      {detalle && <p className="stat-card-detalle">{detalle}</p>}
    </article>
  );
}
