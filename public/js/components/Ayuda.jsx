import { useEffect, useId, useRef, useState } from 'react';
import { HelpIcon, XIcon } from './Icons.jsx';

// Guía breve de cada vista, según la ruta actual.
const GUIAS = [
  {
    ruta: /^\/(login)?$/,
    titulo: 'Iniciar sesión',
    pasos: [
      'Escribe tu usuario o correo y tu contraseña.',
      'Pulsa "Login" para entrar al panel de la empresa.',
      'Si eres cliente y quieres pedir una máquina, entra a /solicitar.',
    ],
  },
  {
    ruta: /^\/(home|dashboard)$/,
    titulo: 'Inicio',
    pasos: [
      'Las tarjetas muestran ingresos, egresos, ganancia y horas del mes.',
      'La gráfica compara la operación de cada máquina.',
      'Toca una solicitud o una máquina para ver su detalle.',
    ],
  },
  {
    ruta: /^\/maquinaria\/[^/]+$/,
    titulo: 'Detalle de máquina',
    pasos: [
      'Arriba ves el operador actual y el resumen del mes.',
      'Usa "Asignar operador" o "Cambiar operador" para moverlo.',
      'Abajo están el historial de operadores y los registros, que puedes filtrar.',
    ],
  },
  {
    ruta: /^\/maquinaria$/,
    titulo: 'Maquinaria',
    pasos: [
      'Pulsa "Nueva máquina" para registrar un equipo (la placa no se repite).',
      'Usa los botones de cada fila para editar o eliminar.',
      'Toca una máquina para ver su detalle, operador e historial.',
    ],
  },
  {
    ruta: /^\/operador\/[^/]+$/,
    titulo: 'Detalle de operador',
    pasos: [
      'Muestra la máquina asignada y la experiencia del operador.',
      'Usa "Asignar máquina" o "Cambiar máquina" para moverlo.',
      'El historial conserva todas sus asignaciones anteriores.',
    ],
  },
  {
    ruta: /^\/operadores$/,
    titulo: 'Operadores',
    pasos: [
      'Pulsa "Nuevo operador" para registrar a una persona del equipo.',
      'Edita o elimina con los botones de cada fila.',
      'Toca un operador para asignarle una máquina o ver su historial.',
    ],
  },
  {
    ruta: /^\/clientes$/,
    titulo: 'Clientes',
    pasos: [
      'Registra las obras y empresas a las que les trabajas.',
      'Edita o elimina un cliente con los botones de su fila.',
      'Un cliente con ingresos o solicitudes no se puede eliminar.',
    ],
  },
  {
    ruta: /^\/solicitud\/[^/]+$/,
    titulo: 'Detalle de solicitud',
    pasos: [
      'Revisa los datos del cliente, la máquina y la fecha requerida.',
      'Cambia el estado (Contactado, Aprobada…) con los botones de acción.',
    ],
  },
  {
    ruta: /^\/solicitudes$/,
    titulo: 'Solicitudes',
    pasos: [
      'Aquí llegan los pedidos que hacen los clientes desde la web pública.',
      'Busca por cliente u obra y filtra por estado.',
      'Toca una solicitud para ver el detalle y darle seguimiento.',
    ],
  },
  {
    ruta: /^\/movimientos$/,
    titulo: 'Ingresos y egresos',
    pasos: [
      'Elige "Ingreso" o "Egreso" y completa el formulario.',
      'En un ingreso el valor se calcula con horas × valor/hora de la máquina.',
      'Busca y filtra el historial; puedes eliminar un registro equivocado.',
    ],
  },
  {
    ruta: /^\/solicitar$/,
    titulo: 'Solicitar una máquina',
    pasos: [
      'Completa los datos de tu obra y cómo contactarte.',
      'Elige el tipo de máquina, la fecha y las horas estimadas.',
      'Al enviar recibes un número de solicitud; te contactaremos pronto.',
    ],
  },
];

function guiaActual() {
  const ruta = window.location.pathname.replace(/\/+$/, '') || '/';
  return GUIAS.find((guia) => guia.ruta.test(ruta));
}

export default function Ayuda() {
  const [abierta, setAbierta] = useState(false);
  const contenedor = useRef(null);
  const idPanel = useId();
  const guia = guiaActual();

  useEffect(() => {
    if (!abierta) return undefined;

    function alTeclear(event) {
      if (event.key === 'Escape') setAbierta(false);
    }
    function alPulsarFuera(event) {
      if (!contenedor.current?.contains(event.target)) setAbierta(false);
    }

    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alPulsarFuera);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alPulsarFuera);
    };
  }, [abierta]);

  if (!guia) return null;

  return (
    <div className="ayuda" ref={contenedor}>
      {abierta && (
        <section className="ayuda-panel" id={idPanel} role="dialog" aria-label={`Ayuda: ${guia.titulo}`}>
          <header className="ayuda-cabecera">
            <p className="ayuda-eyebrow">Ayuda</p>
            <button
              className="ayuda-cerrar"
              type="button"
              aria-label="Cerrar ayuda"
              onClick={() => setAbierta(false)}
            >
              <XIcon />
            </button>
          </header>
          <h2 className="ayuda-titulo">{guia.titulo}</h2>
          <ul className="ayuda-pasos">
            {guia.pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ul>
        </section>
      )}

      <button
        className="ayuda-boton"
        type="button"
        aria-label={abierta ? 'Cerrar ayuda' : '¿Cómo uso esta página?'}
        title="Ayuda"
        aria-expanded={abierta}
        aria-controls={abierta ? idPanel : undefined}
        onClick={() => setAbierta((valor) => !valor)}
      >
        <HelpIcon />
      </button>
    </div>
  );
}
