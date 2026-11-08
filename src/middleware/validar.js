// Validación de datos de entrada sin dependencias externas.
//
// Uso:
//   const datos = validar(req.body, {
//     placa: campo.texto({ requerido: true, max: 20 }),
//     valor_hora: campo.numero({ requerido: true, min: 0 }),
//   });
//
// Con { parcial: true } solo se validan los campos presentes (para PUT/PATCH).

export class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.expose = true;
    this.detalles = detalles;
  }
}

// Zona horaria del negocio. El servidor (Vercel) corre en UTC: sin esto,
const ZONA_HORARIA = 'America/Bogota';

// Fecha de hoy (AAAA-MM-DD) en la zona horaria del negocio
export function fechaDeHoy() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const vacio = (valor) =>
  valor === undefined || valor === null || String(valor).trim() === '';

function regla(convertir) {
  return ({ requerido = false, ...opciones } = {}) =>
    (valor) => {
      if (vacio(valor)) {
        if (requerido) throw new Error('es obligatorio');
        return null;
      }

      return convertir(valor, opciones);
    };
}

export const campo = {
  texto: regla((valor, { max }) => {
    const texto = String(valor).trim();
    if (max && texto.length > max) {
      throw new Error(`debe tener máximo ${max} caracteres`);
    }
    return texto;
  }),

  numero: regla((valor, { min, max, entero }) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) throw new Error('debe ser un número');
    if (entero && !Number.isInteger(numero)) {
      throw new Error('debe ser un número entero');
    }
    if (min !== undefined && numero < min) {
      throw new Error(`debe ser mayor o igual a ${min}`);
    }
    if (max !== undefined && numero > max) {
      throw new Error(`debe ser menor o igual a ${max}`);
    }
    return numero;
  }),

  positivo: regla((valor) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) {
      throw new Error('debe ser un número mayor a 0');
    }
    return numero;
  }),

  id: regla((valor) => {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0) {
      throw new Error('debe ser un id válido');
    }
    return numero;
  }),

  // { noFutura: true } rechaza fechas posteriores a hoy
  fecha: regla((valor, { noFutura }) => {
    const texto = String(valor).trim();
    const fecha = new Date(`${texto}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(texto) ||
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== texto
    ) {
      throw new Error('debe ser una fecha válida (AAAA-MM-DD)');
    }
    // AAAA-MM-DD: la comparación de texto respeta el orden cronológico
    if (noFutura && texto > fechaDeHoy()) {
      throw new Error('no puede ser posterior a hoy');
    }
    return texto;
  }),

  opcion: (opciones, config) =>
    regla((valor) => {
      if (!opciones.includes(valor)) {
        throw new Error(`debe ser uno de: ${opciones.join(', ')}`);
      }
      return valor;
    })(config),
};

export function validar(datos, esquema, { parcial = false } = {}) {
  const entrada = datos ?? {};
  const limpio = {};
  const errores = {};

  for (const [nombre, validarCampo] of Object.entries(esquema)) {
    if (parcial && !(nombre in entrada)) continue;

    try {
      limpio[nombre] = validarCampo(entrada[nombre]);
    } catch (error) {
      errores[nombre] = error.message;
    }
  }

  const nombres = Object.keys(errores);
  if (nombres.length > 0) {
    throw new HttpError(
      400,
      `Datos inválidos: ${nombres.map((n) => `${n} ${errores[n]}`).join('; ')}.`,
      errores,
    );
  }

  if (parcial && Object.keys(limpio).length === 0) {
    throw new HttpError(400, 'No se envió ningún campo para actualizar.');
  }

  return limpio;
}

export function validarId(valor, nombre = 'id') {
  return validar({ [nombre]: valor }, { [nombre]: campo.id({ requerido: true }) })[nombre];
}
