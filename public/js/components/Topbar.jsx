import { Fragment, useEffect, useRef, useState } from 'react';
import {
  BellFilledIcon,
  BellIcon,
  ClipboardIcon,
  LogOutIcon,
  UserIcon,
} from './Icons.jsx';
import {
  formatearFechaSolicitud,
  listarSolicitudes,
} from '../data/solicitudes.js';
import { tipoMaquinaVisible } from '../data/datos.js';

const CLAVE_NOTIFICACIONES_LEIDAS = 'makina.notificaciones.leidas.v1';
const CLAVES_SESION = ['makina.sesion', 'makina.usuario', 'token', 'usuario'];

function leerNotificacionesLeidas() {
  if (typeof window === 'undefined') return [];

  try {
    const guardadas = window.localStorage.getItem(
      CLAVE_NOTIFICACIONES_LEIDAS,
    );
    const valor = guardadas === null ? [] : JSON.parse(guardadas);

    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function guardarNotificacionesLeidas(ids) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      CLAVE_NOTIFICACIONES_LEIDAS,
      JSON.stringify(ids),
    );
  } catch {
    // Si el navegador bloquea localStorage, se conserva el estado en memoria.
  }
}

function tiempoRelativo(valor) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return '';

  const minutos = Math.round((Date.now() - fecha.getTime()) / 60000);

  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.round(horas / 24);
  if (dias < 7) return `hace ${dias} d`;

  return formatearFechaSolicitud(String(valor).slice(0, 10));
}

function construirNotificaciones() {
  return listarSolicitudes()
    .filter(
      (solicitud) =>
        solicitud.estado === 'Pendiente' ||
        solicitud.estado === 'Contactado',
    )
    .slice(0, 5)
    .map((solicitud) => ({
      id: `solicitud-${solicitud.id_solicitud}`,
      titulo:
        solicitud.estado === 'Pendiente'
          ? 'Solicitud pendiente'
          : 'Solicitud contactada',
      detalle: `${solicitud.cliente?.nombre_obra ?? 'Cliente'} · ${tipoMaquinaVisible(
        solicitud.tipo_maquina,
      )} para el ${formatearFechaSolicitud(solicitud.fecha_requerida)}`,
      cuando: tiempoRelativo(solicitud.created_at),
      href: `/solicitud/${solicitud.id_solicitud}`,
      estado: solicitud.estado,
    }));
}

function cerrarSesion() {
  try {
    CLAVES_SESION.forEach((clave) => window.localStorage.removeItem(clave));
    window.sessionStorage.clear();
  } catch {
    // Aun si el navegador bloquea el almacenamiento, se cierra la sesión.
  }

  window.location.assign('/login');
}

export default function Topbar({ migas = [] }) {
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [usuarioAbierto, setUsuarioAbierto] = useState(false);
  const [notificaciones] = useState(construirNotificaciones);
  const [leidas, setLeidas] = useState(leerNotificacionesLeidas);
  const accionesRef = useRef(null);

  const sinLeer = notificaciones.filter(
    (notificacion) => !leidas.includes(notificacion.id),
  ).length;

  useEffect(() => {
    if (!notificacionesAbiertas && !usuarioAbierto) return;

    function cerrarAlHacerClic(evento) {
      if (accionesRef.current?.contains(evento.target)) return;

      setNotificacionesAbiertas(false);
      setUsuarioAbierto(false);
    }

    function cerrarConEscape(evento) {
      if (evento.key !== 'Escape') return;

      setNotificacionesAbiertas(false);
      setUsuarioAbierto(false);
    }

    document.addEventListener('mousedown', cerrarAlHacerClic);
    document.addEventListener('keydown', cerrarConEscape);

    return () => {
      document.removeEventListener('mousedown', cerrarAlHacerClic);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [notificacionesAbiertas, usuarioAbierto]);

  function alternarNotificaciones() {
    setNotificacionesAbiertas((abiertas) => !abiertas);
    setUsuarioAbierto(false);
  }

  function alternarUsuario() {
    setUsuarioAbierto((abierto) => !abierto);
    setNotificacionesAbiertas(false);
  }

  function marcarComoLeida(id) {
    setLeidas((anteriores) => {
      if (anteriores.includes(id)) return anteriores;

      const siguientes = [...anteriores, id];
      guardarNotificacionesLeidas(siguientes);

      return siguientes;
    });
  }

  function marcarTodasComoLeidas() {
    const ids = notificaciones.map((notificacion) => notificacion.id);

    guardarNotificacionesLeidas(ids);
    setLeidas(ids);
  }

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

      <div className="topbar-acciones" ref={accionesRef}>
        <div className="topbar-menu">
          <button
            className={
              notificacionesAbiertas ? 'notificacion activa' : 'notificacion'
            }
            type="button"
            aria-label={
              sinLeer > 0
                ? `Notificaciones, ${sinLeer} sin leer`
                : 'Notificaciones'
            }
            aria-expanded={notificacionesAbiertas}
            aria-haspopup="true"
            onClick={alternarNotificaciones}
          >
            <BellFilledIcon />
            {sinLeer > 0 && <span className="punto-rojo" />}
          </button>

          {notificacionesAbiertas && (
            <div
              className="menu-panel menu-notificaciones"
              role="region"
              aria-label="Notificaciones"
            >
              <header className="menu-cabecera">
                <div>
                  <p className="menu-titulo">Notificaciones</p>
                  <p className="menu-subtitulo">
                    {sinLeer > 0
                      ? `${sinLeer} sin leer`
                      : 'Todo al día'}
                  </p>
                </div>

                {sinLeer > 0 && (
                  <button
                    className="menu-accion"
                    type="button"
                    onClick={marcarTodasComoLeidas}
                  >
                    Marcar todas
                  </button>
                )}
              </header>

              {notificaciones.length > 0 ? (
                <ul className="menu-lista">
                  {notificaciones.map((notificacion) => {
                    const leida = leidas.includes(notificacion.id);

                    return (
                      <li key={notificacion.id}>
                        <a
                          className={
                            leida
                              ? 'notificacion-item leida'
                              : 'notificacion-item'
                          }
                          href={notificacion.href}
                          onClick={() => marcarComoLeida(notificacion.id)}
                        >
                          <span
                            className={`notificacion-item-icono ${notificacion.estado.toLowerCase()}`}
                            aria-hidden="true"
                          >
                            <ClipboardIcon />
                          </span>

                          <span className="notificacion-item-texto">
                            <span className="notificacion-item-cabecera">
                              <span className="notificacion-item-titulo">
                                {notificacion.titulo}
                              </span>
                              {!leida && (
                                <span
                                  className="notificacion-item-punto"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                            <span className="notificacion-item-detalle">
                              {notificacion.detalle}
                            </span>
                            <span className="notificacion-item-hora">
                              {notificacion.cuando}
                            </span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="menu-vacio">
                  <BellIcon />
                  <p>No tienes notificaciones pendientes.</p>
                </div>
              )}

              <footer className="menu-pie">
                <a href="/solicitudes">Ver todas las solicitudes</a>
              </footer>
            </div>
          )}
        </div>

        <div className="topbar-menu">
          <button
            className={usuarioAbierto ? 'usuario activo' : 'usuario'}
            type="button"
            aria-label="Menú de usuario"
            aria-expanded={usuarioAbierto}
            aria-haspopup="menu"
            onClick={alternarUsuario}
          >
            <span className="avatar">
              <UserIcon />
            </span>
            <span className="usuario-nombre">Jhojan Jacome</span>
          </button>

          {usuarioAbierto && (
            <div className="menu-panel menu-usuario" role="menu">
              <button
                className="menu-opcion"
                type="button"
                role="menuitem"
                onClick={cerrarSesion}
              >
                <LogOutIcon />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
