// Carga los datos de la API antes de montar cada vista de React.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from '../api/cliente.js';
import { llenarDatos } from './datos.js';
import { llenarSolicitudes, llenarTarifas } from './solicitudes.js';

// Usuario con sesión iniciada (lo muestra la barra superior)
export const sesion = { usuario: null };

// Área de la empresa: todo lo que usan el dashboard y los detalles
export async function cargarDatos() {
  const [me, maquinas, operadores, clientes, asignaciones, movimientos, solicitudes] =
    await Promise.all([
      api('/auth/me'),
      api('/maquinas'),
      api('/operadores'),
      api('/clientes'),
      api('/asignaciones'),
      api('/movimientos'),
      api('/solicitudes'),
    ]);

  sesion.usuario = me.usuario;
  llenarDatos({
    maquinas,
    operadores,
    clientes,
    asignaciones,
    ingresos: movimientos.ingresos,
    egresos: movimientos.egresos,
  });
  llenarSolicitudes(solicitudes);
}

// Web pública de clientes (/solicitar)
export async function cargarTarifas() {
  llenarTarifas(await api('/publico/tarifas', { redirigirSinSesion: false }));
}

function Estado({ titulo, texto, reintentar }) {
  return (
    <div className="carga-estado" role={reintentar ? 'alert' : 'status'}>
      <img src="/img/logo_fondo_amarillo.png" alt="" width="56" height="56" />
      <p className="carga-estado-titulo">{titulo}</p>
      {texto && <p className="carga-estado-texto">{texto}</p>}
      {reintentar && (
        <button className="btn btn-primario" type="button" onClick={reintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export async function montar(Vista, { cargar = cargarDatos } = {}) {
  const root = createRoot(document.getElementById('root'));

  async function iniciar() {
    root.render(<Estado titulo="Cargando…" />);

    try {
      await cargar();
    } catch (error) {
      root.render(
        <Estado
          titulo="No se pudieron cargar los datos"
          texto={error.message}
          reintentar={iniciar}
        />,
      );
      return;
    }

    root.render(
      <StrictMode>
        <Vista />
      </StrictMode>,
    );
  }

  await iniciar();
}
