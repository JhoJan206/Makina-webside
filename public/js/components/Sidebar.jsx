import {
  CalendarIcon,
  HomeIcon,
  MenuIcon,
  TruckIcon,
  UsersIcon,
} from './Icons.jsx';

const enlaces = [
  { texto: 'Maquinaria', Icono: TruckIcon, href: '/maquinaria' },
  { texto: 'Operadores', Icono: UsersIcon, href: '/operadores' },
  { texto: 'Inicio', Icono: HomeIcon, href: '/home' },
  { texto: 'Calendario', Icono: CalendarIcon, href: '#' },
  { texto: 'Menú', Icono: MenuIcon, href: '#' },
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
              onClick={href === '#' ? (event) => event.preventDefault() : undefined}
            >
              <span className="nav-icono">
                <Icono />
              </span>
              <span className="nav-texto">{texto}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
