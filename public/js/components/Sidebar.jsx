import {
  ClipboardIcon,
  HomeIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from './Icons.jsx';

const enlaces = [
  { texto: 'Inicio', Icono: HomeIcon, href: '/home' },
  { texto: 'Maquinaria', Icono: TruckIcon, href: '/maquinaria' },
  { texto: 'Operadores', Icono: UsersIcon, href: '/operadores' },
  { texto: 'Solicitudes', Icono: ClipboardIcon, href: '/solicitudes' },
  { texto: 'Movimientos', Icono: WalletIcon, href: '/movimientos' },
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
        {enlaces.map(({ texto, Icono, href }) => {
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
              <span className="nav-texto">{texto}</span>
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
