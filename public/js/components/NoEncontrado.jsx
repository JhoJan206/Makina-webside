import EmptyState from './EmptyState.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

// Vista completa para un detalle (máquina, operador...) que no existe
export default function NoEncontrado({
  activo,
  clase,
  migas,
  Icono,
  titulo,
  texto = 'Es posible que el enlace esté incompleto o que el registro ya no exista.',
  volver,
}) {
  return (
    <div className={`dashboard ${clase}`}>
      <Sidebar activo={activo} />

      <div className="dashboard-principal">
        <Topbar migas={migas} />

        <main className="dashboard-contenido">
          <EmptyState
            Icono={Icono}
            titulo={titulo}
            texto={texto}
            accion={
              <a className="btn btn-primario" href={volver.href}>
                {volver.texto}
              </a>
            }
          />
        </main>
      </div>
    </div>
  );
}
