import { tonoEstado } from '../data/solicitudes.js';

export default function EstadoPill({ estado, compacto = false }) {
  return (
    <span
      className={`estado-pill ${tonoEstado(estado)}${compacto ? ' compacto' : ''}`}
    >
      {estado}
    </span>
  );
}
