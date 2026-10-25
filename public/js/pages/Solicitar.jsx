import { useState } from 'react';
import EstadoPill from '../components/EstadoPill.jsx';
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  PhoneIcon,
  SendIcon,
  TruckIcon,
} from '../components/Icons.jsx';
import {
  formatearMoneda,
  maquinas,
  promedioValorHora,
  tipoMaquinaVisible,
} from '../data/datos.js';
import {
  crearSolicitud,
  formatearFechaSolicitud,
  valorEstimadoSolicitud,
} from '../data/solicitudes.js';

const tipos = [...new Set(maquinas.map((maquina) => maquina.tipo))];
const fechaMinima = new Date().toISOString().slice(0, 10);

export default function Solicitar() {
  const [enviada, setEnviada] = useState(null);
  const [error, setError] = useState('');
  const [claveFormulario, setClaveFormulario] = useState(0);

  function handleSubmit(event) {
    event.preventDefault();

    const datos = Object.fromEntries(new FormData(event.currentTarget));
    const horas = Number(datos.horas_estimadas);

    if (!datos.nombre_obra?.trim()) {
      setError('Indica el nombre de la obra.');
      return;
    }

    if (!datos.telefono?.trim()) {
      setError('Necesitamos un teléfono para contactarte.');
      return;
    }

    if (!datos.tipo_maquina) {
      setError('Selecciona el tipo de máquina que necesitas.');
      return;
    }

    if (!datos.fecha_requerida) {
      setError('Selecciona la fecha en la que necesitas la maquinaria.');
      return;
    }

    if (!Number.isFinite(horas) || horas <= 0) {
      setError('Indica una cantidad de horas válida.');
      return;
    }

    setError('');
    const solicitud = crearSolicitud({ ...datos, horas_estimadas: horas });
    setEnviada(solicitud);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reiniciar() {
    setEnviada(null);
    setError('');
    setClaveFormulario((clave) => clave + 1);
  }

  return (
    <div className="portal">
      <header className="portal-topbar">
        <a className="portal-marca" href="/solicitar">
          <span className="portal-marca-logo">
            <img src="/img/logo_fondo_negro.png" alt="" />
          </span>
          <span className="portal-marca-texto">
            MA<span>K</span>INA
          </span>
        </a>

        <div className="portal-topbar-acciones">
          <span className="portal-etiqueta">Portal de clientes</span>
        </div>
      </header>

      <main className="portal-contenido">
        <section className="portal-hero">
          <div className="portal-hero-texto">
            <p className="page-eyebrow">Solicita tu maquinaria</p>
            <h1>
              Tu obra no puede esperar. <span>Nosotros tampoco.</span>
            </h1>
            <p className="portal-hero-descripcion">
              Cuéntanos qué necesitas y te contactamos para confirmar la
              disponibilidad, la tarifa y la programación del equipo.
            </p>

            <ul className="portal-beneficios">
              <li>
                <span className="portal-beneficio-icono" aria-hidden="true">
                  <ClockIcon />
                </span>
                <div>
                  <strong>Respuesta rápida</strong>
                  <small>Te escribimos en menos de 24 horas hábiles.</small>
                </div>
              </li>
              <li>
                <span className="portal-beneficio-icono" aria-hidden="true">
                  <CheckIcon />
                </span>
                <div>
                  <strong>Maquinaria lista para operar</strong>
                  <small>Equipos revisados y operadores con experiencia.</small>
                </div>
              </li>
              <li>
                <span className="portal-beneficio-icono" aria-hidden="true">
                  <PhoneIcon />
                </span>
                <div>
                  <strong>Atención directa</strong>
                  <small>Hablas con una persona, no con un formulario.</small>
                </div>
              </li>
            </ul>

            <div className="portal-datos">
              <div>
                <span className="portal-dato-icono" aria-hidden="true">
                  <DollarIcon />
                </span>
                <div>
                  <small>Tarifa promedio</small>
                  <strong>
                    {formatearMoneda(promedioValorHora(), false)} / hora
                  </strong>
                </div>
              </div>

              <div>
                <span className="portal-dato-icono" aria-hidden="true">
                  <TruckIcon />
                </span>
                <div>
                  <small>Flota disponible</small>
                  <strong>{maquinas.length} equipos</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="portal-form-card">
            {enviada ? (
              <div className="portal-exito">
                <span className="portal-exito-icono" aria-hidden="true">
                  <CheckIcon />
                </span>
                <p className="page-eyebrow">Solicitud enviada</p>
                <h2>¡Recibimos tu solicitud!</h2>
                <p className="portal-exito-texto">
                  Un asesor de Makina se pondrá en contacto contigo para
                  confirmar los detalles del trabajo.
                </p>

                <div className="portal-exito-resumen">
                  <div>
                    <span>Número</span>
                    <strong>#{enviada.id_solicitud}</strong>
                  </div>
                  <div>
                    <span>Máquina</span>
                    <strong>{tipoMaquinaVisible(enviada.tipo_maquina)}</strong>
                  </div>
                  <div>
                    <span>Fecha requerida</span>
                    <strong>
                      {formatearFechaSolicitud(enviada.fecha_requerida)}
                    </strong>
                  </div>
                  <div>
                    <span>Horas estimadas</span>
                    <strong>{enviada.horas_estimadas} h</strong>
                  </div>
                  <div>
                    <span>Valor estimado</span>
                    <strong>
                      {formatearMoneda(
                        valorEstimadoSolicitud(enviada),
                        false,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Estado</span>
                    <EstadoPill estado={enviada.estado} compacto />
                  </div>
                </div>

                <p className="portal-exito-nota">
                  <PhoneIcon />
                  Te contactaremos al {enviada.cliente?.telefono}.
                </p>

                <div className="portal-exito-acciones">
                  <button
                    className="btn btn-primario"
                    type="button"
                    onClick={reiniciar}
                  >
                    Enviar otra solicitud
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="portal-form"
                key={claveFormulario}
                onSubmit={handleSubmit}
              >
                <div className="portal-form-cabecera">
                  <p className="page-eyebrow">Formulario</p>
                  <h2>¿Qué necesitas para tu obra?</h2>
                  <p>Los campos con * son obligatorios.</p>
                </div>

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                <fieldset className="form-seccion">
                  <legend>
                    <BuildingIcon />
                    Datos de la obra
                  </legend>

                  <div className="form-grid">
                    <label className="form-campo form-campo-ancho">
                      <span>Nombre de la obra *</span>
                      <input
                        name="nombre_obra"
                        type="text"
                        required
                        placeholder="Ej. Obra #1"
                      />
                    </label>

                    <label className="form-campo">
                      <span>Empresa</span>
                      <input
                        name="nombre_empresa"
                        type="text"
                        placeholder="Constructora Andina"
                      />
                    </label>

                    <label className="form-campo">
                      <span>Responsable</span>
                      <input
                        name="nombre_responsable"
                        type="text"
                        placeholder="Nombre y apellido"
                      />
                    </label>

                    <label className="form-campo form-campo-ancho">
                      <span>Teléfono de contacto *</span>
                      <div className="campo-icono">
                        <PhoneIcon />
                        <input
                          name="telefono"
                          type="tel"
                          required
                          inputMode="tel"
                          placeholder="300 123 4567"
                        />
                      </div>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="form-seccion">
                  <legend>
                    <TruckIcon />
                    Detalle del trabajo
                  </legend>

                  <div className="form-grid">
                    <label className="form-campo">
                      <span>Tipo de máquina *</span>
                      <select name="tipo_maquina" required defaultValue="">
                        <option value="" disabled>
                          Selecciona una opción
                        </option>
                        {tipos.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipoMaquinaVisible(tipo)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-campo">
                      <span>Fecha requerida *</span>
                      <input
                        name="fecha_requerida"
                        type="date"
                        required
                        min={fechaMinima}
                      />
                    </label>

                    <label className="form-campo">
                      <span>Horas estimadas *</span>
                      <input
                        name="horas_estimadas"
                        type="number"
                        required
                        min="1"
                        step="1"
                        placeholder="Ej. 24"
                      />
                    </label>

                    <label className="form-campo form-campo-ancho">
                      <span>Descripción del trabajo</span>
                      <textarea
                        name="descripcion"
                        rows="4"
                        placeholder="Cuéntanos qué debes hacer, el tipo de terreno y cualquier detalle que debamos saber."
                      />
                    </label>
                  </div>
                </fieldset>

                <div className="portal-form-pie">
                  <p>
                    <ClockIcon />
                    Respuesta estimada en menos de 24 horas hábiles.
                  </p>
                  <button className="btn btn-primario btn-enviar" type="submit">
                    <SendIcon />
                    Enviar solicitud
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="portal-footer">
        <p>© 2026 Makina · Maquinaria para construcción y obra civil.</p>
      </footer>
    </div>
  );
}
