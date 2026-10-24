import { Fragment } from 'react';
import { BellFilledIcon, UserIcon } from './Icons.jsx';

export default function Topbar({ migas = [] }) {
  return (
    <header className="topbar">
      <div className="topbar-marca" aria-label="MAKINA">
        MA<span>K</span>INA
      </div>

      {migas.length > 0 && (
        <nav className="topbar-migas" aria-label="Ruta de navegación">
          {migas.map(({ texto, href }, indice) => {
            const esUltimo = indice === migas.length - 1;

            return (
              <Fragment key={`${texto}-${indice}`}>
                {indice > 0 && (
                  <span className="miga-sep" aria-hidden="true">
                    /
                  </span>
                )}

                <span className="miga">
                  {href && !esUltimo ? (
                    <a className="miga-enlace" href={href}>
                      {texto}
                    </a>
                  ) : (
                    <span
                      className={esUltimo ? 'miga-actual' : undefined}
                      aria-current={esUltimo ? 'page' : undefined}
                    >
                      {texto}
                    </span>
                  )}
                </span>
              </Fragment>
            );
          })}
        </nav>
      )}

      <div className="topbar-acciones">
        <button className="notificacion" type="button" aria-label="Notificaciones">
          <BellFilledIcon />
          <span className="punto-rojo" />
        </button>

        <div className="usuario">
          <span className="avatar">
            <UserIcon />
          </span>
          <span className="usuario-nombre">Jhojan Jacome</span>
        </div>
      </div>
    </header>
  );
}
