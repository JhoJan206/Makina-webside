import {
  ClipboardIcon,
  HomeIcon,
  LinkIcon,
  SettingsIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from './Icons.jsx';

const enlaces = [
  { texto: 'Inicio', Icono: HomeIcon, href: '/home' },
  { texto: 'Maquinaria', Icono: TruckIcon, href: '/maquinaria' },
  { texto: 'Operadores', Icono: UsersIcon, href: '/operadores' },
  { texto: 'Asignaciones', corto: 'Trabajos', Icono: LinkIcon, href: '/asignaciones' },
  { texto: 'Solicitudes', Icono: ClipboardIcon, href: '/solicitudes' },
  { texto: 'Movimientos', corto: 'Finanzas', Icono: WalletIcon, href: '/movimientos' },
  { texto: 'Gestión', Icono: SettingsIcon, href: '/admin/maquinas' },
];

export default function Sidebar({ activo = 'Inicio' }) {
  return (
    <aside className="sidebar">
      <div className="marca">
        <div className="marca-logo">
          <img src="/img/logo_fondo_negro.png" alt="" />
        </div>
        <div className="marca-texto" aria-label="MAKINA">
          MA<span>K</span>INA
        </div>
      </div>

      <nav className="nav" aria-label="Principal">
        {enlaces.map(({ texto, corto, Icono, href }) => {
          const esActivo = texto === activo;

          return (
            <a
              key={texto}
              className={esActivo ? 'nav-item activo' : 'nav-item'}
              href={href}
              aria-current={esActivo ? 'page' : undefined}
            >
              <span className="nav-icono">
                <Icono />
              </span>
              <span className="nav-texto">
                <span className="nav-texto-largo">{texto}</span>
                <span className="nav-texto-corto">{corto ?? texto}</span>
              </span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-pie">
        <p className="sidebar-version">MAKINA · Gestión de obra</p>
      </div>
    </aside>
  );
}
