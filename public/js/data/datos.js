// Datos de ejemplo alineados con el esquema de baseDatos.sql.
// El proyecto no tiene una conexión activa a PostgreSQL: estas filas
// permiten visualizar las pantallas usando los mismos campos del esquema.
//
// Tablas usadas:
//   clientes        -> nombre_obra
//   operadores      -> nombre, apellido, cedula, sueldo
//   maquinas        -> tipo, placa, valor_hora
//   maquina_operador-> id_maquina, id_operador, fecha_ingreso, fecha_salida
//   ingresos        -> id_maquina, id_cliente, horas, valor_ingreso, descripcion, fecha
//   egresos         -> id_maquina, valor_egreso, descripcion, fecha

export const PERIODO = '2026-09';

export const clientes = [
  {
    id_cliente: 1,
    nombre_obra: 'Obra #1',
    nombre_empresa: 'Constructora Andina',
    nombre_responsable: 'Laura Méndez',
    telefono: '300 123 4567',
  },
  {
    id_cliente: 2,
    nombre_obra: 'Vía Norte',
    nombre_empresa: 'Vías del Norte SAS',
    nombre_responsable: 'Diego Ramírez',
    telefono: '310 456 7890',
  },
  {
    id_cliente: 3,
    nombre_obra: 'Cantera Sur',
    nombre_empresa: 'Agregados del Sur',
    nombre_responsable: 'Sandra Rojas',
    telefono: '320 987 6543',
  },
];

export const operadores = [
  {
    id_operador: 1,
    nombre: 'Carlos',
    apellido: 'Pérez',
    cedula: '1.020.304.050',
    sueldo: 3200000,
  },
  {
    id_operador: 2,
    nombre: 'Jhojan',
    apellido: 'Jacome',
    cedula: '1.098.765.432',
    sueldo: 3500000,
  },
  {
    id_operador: 3,
    nombre: 'Andrés',
    apellido: 'Gómez',
    cedula: '1.045.678.901',
    sueldo: 3000000,
  },
  {
    id_operador: 4,
    nombre: 'Mateo',
    apellido: 'Salazar',
    cedula: '1.112.233.445',
    sueldo: 2900000,
  },
];

export const maquinas = [
  {
    id_maquina: 1,
    tipo: 'Pajarita',
    placa: '387J',
    valor_hora: 85000,
    imagen: '/img/maquinaria/retroexcavadora.jpg',
    alt: 'Retroexcavadora amarilla trabajando en un terreno de tierra',
  },
  {
    id_maquina: 2,
    tipo: 'Bulldozer',
    placa: '786H',
    valor_hora: 120000,
    imagen: '/img/maquinaria/excavadora.jpg',
    alt: 'Excavadora amarilla sobre un montón de tierra',
  },
  {
    id_maquina: 3,
    tipo: 'Pajarita',
    placa: '023Y',
    valor_hora: 95000,
    imagen: '/img/maquinaria/cargadora.jpg',
    alt: 'Cargadora amarilla en una cantera',
  },
];

export const maquinaOperador = [
  // Máquina 387J
  { id: 1, id_maquina: 1, id_operador: 1, fecha_ingreso: '2026-01-15', fecha_salida: null },
  { id: 2, id_maquina: 1, id_operador: 4, fecha_ingreso: '2025-06-01', fecha_salida: '2026-01-10' },
  { id: 3, id_maquina: 1, id_operador: 2, fecha_ingreso: '2024-09-01', fecha_salida: '2025-05-25' },

  // Máquina 786H
  { id: 4, id_maquina: 2, id_operador: 2, fecha_ingreso: '2026-02-01', fecha_salida: null },
  { id: 5, id_maquina: 2, id_operador: 1, fecha_ingreso: '2025-03-01', fecha_salida: '2026-01-30' },
  { id: 6, id_maquina: 2, id_operador: 3, fecha_ingreso: '2024-11-01', fecha_salida: '2025-02-20' },

  // Máquina 023Y
  { id: 7, id_maquina: 3, id_operador: 3, fecha_ingreso: '2026-03-10', fecha_salida: null },
  { id: 8, id_maquina: 3, id_operador: 4, fecha_ingreso: '2025-08-01', fecha_salida: '2026-03-01' },
  { id: 9, id_maquina: 3, id_operador: 1, fecha_ingreso: '2025-01-15', fecha_salida: '2025-07-20' },
];

export const ingresos = [
  // Máquina 387J
  { id_ingreso: 1, id_maquina: 1, id_cliente: 1, horas: 20, valor_ingreso: 1700000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-02' },
  { id_ingreso: 2, id_maquina: 1, id_cliente: 2, horas: 26, valor_ingreso: 2210000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-05' },
  { id_ingreso: 3, id_maquina: 1, id_cliente: 2, horas: 24, valor_ingreso: 2040000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-09' },
  { id_ingreso: 4, id_maquina: 1, id_cliente: 1, horas: 18, valor_ingreso: 1530000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-12' },
  { id_ingreso: 5, id_maquina: 1, id_cliente: 3, horas: 22, valor_ingreso: 1870000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-16' },
  { id_ingreso: 6, id_maquina: 1, id_cliente: 1, horas: 28, valor_ingreso: 2380000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-20' },

  // Máquina 786H
  { id_ingreso: 7, id_maquina: 2, id_cliente: 2, horas: 16, valor_ingreso: 1920000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-03' },
  { id_ingreso: 8, id_maquina: 2, id_cliente: 2, horas: 20, valor_ingreso: 2400000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-08' },
  { id_ingreso: 9, id_maquina: 2, id_cliente: 1, horas: 24, valor_ingreso: 2880000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-14' },
  { id_ingreso: 10, id_maquina: 2, id_cliente: 3, horas: 18, valor_ingreso: 2160000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-18' },
  { id_ingreso: 11, id_maquina: 2, id_cliente: 2, horas: 22, valor_ingreso: 2640000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-25' },

  // Máquina 023Y
  { id_ingreso: 12, id_maquina: 3, id_cliente: 3, horas: 24, valor_ingreso: 2280000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-02' },
  { id_ingreso: 13, id_maquina: 3, id_cliente: 3, horas: 28, valor_ingreso: 2660000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-07' },
  { id_ingreso: 14, id_maquina: 3, id_cliente: 1, horas: 20, valor_ingreso: 1900000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-11' },
  { id_ingreso: 15, id_maquina: 3, id_cliente: 3, horas: 26, valor_ingreso: 2470000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-17' },
  { id_ingreso: 16, id_maquina: 3, id_cliente: 2, horas: 22, valor_ingreso: 2090000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-21' },
  { id_ingreso: 17, id_maquina: 3, id_cliente: 3, horas: 30, valor_ingreso: 2850000, descripcion: 'Trabajo/proyecto', fecha: '2026-09-28' },
];

export const egresos = [
  // Máquina 387J
  { id_egreso: 1, id_maquina: 1, valor_egreso: 850000, descripcion: 'Repuesto', fecha: '2026-09-04' },
  { id_egreso: 2, id_maquina: 1, valor_egreso: 320000, descripcion: 'Repuesto', fecha: '2026-09-10' },
  { id_egreso: 3, id_maquina: 1, valor_egreso: 180000, descripcion: 'Mantenimiento', fecha: '2026-09-15' },
  { id_egreso: 4, id_maquina: 1, valor_egreso: 950000, descripcion: 'Combustible', fecha: '2026-09-22' },

  // Máquina 786H
  { id_egreso: 5, id_maquina: 2, valor_egreso: 1200000, descripcion: 'Combustible', fecha: '2026-09-06' },
  { id_egreso: 6, id_maquina: 2, valor_egreso: 480000, descripcion: 'Repuesto', fecha: '2026-09-12' },
  { id_egreso: 7, id_maquina: 2, valor_egreso: 350000, descripcion: 'Mantenimiento', fecha: '2026-09-19' },
  { id_egreso: 8, id_maquina: 2, valor_egreso: 670000, descripcion: 'Repuesto', fecha: '2026-09-27' },

  // Máquina 023Y
  { id_egreso: 9, id_maquina: 3, valor_egreso: 1450000, descripcion: 'Combustible', fecha: '2026-09-05' },
  { id_egreso: 10, id_maquina: 3, valor_egreso: 620000, descripcion: 'Repuesto', fecha: '2026-09-13' },
  { id_egreso: 11, id_maquina: 3, valor_egreso: 410000, descripcion: 'Mantenimiento', fecha: '2026-09-23' },
];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatearMoneda(valor, compacto = true) {
  if (!valor) return '$0';

  if (compacto) {
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `$${Math.round(valor / 1000)}K`;
    return `$${valor}`;
  }

  return `$${new Intl.NumberFormat('es-CO').format(valor)}`;
}

export function formatearFecha(fecha, conAnio = false) {
  if (!fecha) return '—';

  const [anio, mes, dia] = fecha.split('-');
  const base = `${Number(dia)} ${MESES[Number(mes) - 1]}`;

  return conAnio ? `${base} ${anio}` : base;
}

export function nombreOperador(operador) {
  return `${operador.nombre} ${operador.apellido}`;
}

export function inicialesOperador(operador) {
  return `${operador.nombre[0]}${operador.apellido[0]}`.toUpperCase();
}

export function nombreMaquina(maquina) {
  const nombre = maquina.tipo === 'Pajarita' ? 'Retroexcavadora' : maquina.tipo;
  return `${nombre} ${maquina.placa}`;
}

export function inicialesMaquina(maquina) {
  return `${nombreMaquina(maquina)[0]}${maquina.placa[0]}`.toUpperCase();
}

export function obtenerMaquina(id) {
  const buscado = String(id ?? '').toLowerCase();

  return (
    maquinas.find(
      (maquina) =>
        maquina.placa.toLowerCase() === buscado ||
        String(maquina.id_maquina) === buscado,
    ) ?? maquinas[0]
  );
}

export function obtenerOperador(id) {
  const buscado = String(id ?? '');

  return (
    operadores.find(
      (operador) =>
        String(operador.id_operador) === buscado || operador.cedula === buscado,
    ) ?? operadores[0]
  );
}

export function obtenerAsignacionActualMaquina(idMaquina) {
  return (
    maquinaOperador.find(
      (asignacion) =>
        asignacion.id_maquina === idMaquina && asignacion.fecha_salida === null,
    ) ?? null
  );
}

export function obtenerAsignacionActualOperador(idOperador) {
  return (
    maquinaOperador.find(
      (asignacion) =>
        asignacion.id_operador === idOperador && asignacion.fecha_salida === null,
    ) ?? null
  );
}

export function obtenerOperadorActual(idMaquina) {
  const asignacion = obtenerAsignacionActualMaquina(idMaquina);
  if (!asignacion) return null;

  return (
    operadores.find(
      (operador) => operador.id_operador === asignacion.id_operador,
    ) ?? null
  );
}

export function obtenerMaquinaActual(idOperador) {
  const asignacion = obtenerAsignacionActualOperador(idOperador);
  if (!asignacion) return null;

  return (
    maquinas.find((maquina) => maquina.id_maquina === asignacion.id_maquina) ??
    null
  );
}

function ordenarAsignaciones(a, b) {
  if (!a.fecha_salida && b.fecha_salida) return -1;
  if (a.fecha_salida && !b.fecha_salida) return 1;

  return b.fecha_ingreso.localeCompare(a.fecha_ingreso);
}

export function historialOperadores(idMaquina) {
  return maquinaOperador
    .filter((asignacion) => asignacion.id_maquina === idMaquina)
    .map((asignacion) => ({
      ...asignacion,
      operador: operadores.find(
        (operador) => operador.id_operador === asignacion.id_operador,
      ),
    }))
    .filter((asignacion) => asignacion.operador)
    .sort(ordenarAsignaciones);
}

export function historialMaquinas(idOperador) {
  return maquinaOperador
    .filter((asignacion) => asignacion.id_operador === idOperador)
    .map((asignacion) => ({
      ...asignacion,
      maquina: maquinas.find(
        (maquina) => maquina.id_maquina === asignacion.id_maquina,
      ),
    }))
    .filter((asignacion) => asignacion.maquina)
    .sort(ordenarAsignaciones);
}

export function obraActualMaquina(idMaquina) {
  const ultimoIngreso = ingresos
    .filter(
      (ingreso) =>
        ingreso.id_maquina === idMaquina && ingreso.fecha.startsWith(PERIODO),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  if (!ultimoIngreso) return '—';

  return (
    clientes.find(
      (cliente) => cliente.id_cliente === ultimoIngreso.id_cliente,
    )?.nombre_obra ?? '—'
  );
}

export function resumenMaquina(idMaquina) {
  const ingresosMaquina = ingresos.filter(
    (ingreso) =>
      ingreso.id_maquina === idMaquina && ingreso.fecha.startsWith(PERIODO),
  );
  const egresosMaquina = egresos.filter(
    (egreso) =>
      egreso.id_maquina === idMaquina && egreso.fecha.startsWith(PERIODO),
  );

  const totalIngresos = ingresosMaquina.reduce(
    (total, ingreso) => total + ingreso.valor_ingreso,
    0,
  );
  const totalEgresos = egresosMaquina.reduce(
    (total, egreso) => total + egreso.valor_egreso,
    0,
  );
  const horas = ingresosMaquina.reduce(
    (total, ingreso) => total + ingreso.horas,
    0,
  );

  return {
    ingresos: totalIngresos,
    egresos: totalEgresos,
    ganancia: totalIngresos - totalEgresos,
    horas,
  };
}

export function resumenOperador(idOperador) {
  const asignaciones = maquinaOperador.filter(
    (asignacion) =>
      asignacion.id_operador === idOperador &&
      asignacion.fecha_salida === null,
  );
  const idsMaquinas = asignaciones.map(
    (asignacion) => asignacion.id_maquina,
  );

  const ingresosOperador = ingresos.filter(
    (ingreso) =>
      idsMaquinas.includes(ingreso.id_maquina) &&
      ingreso.fecha.startsWith(PERIODO),
  );

  return {
    maquinas: idsMaquinas.length,
    horas: ingresosOperador.reduce(
      (total, ingreso) => total + ingreso.horas,
      0,
    ),
    ingresos: ingresosOperador.reduce(
      (total, ingreso) => total + ingreso.valor_ingreso,
      0,
    ),
  };
}

function registrosDeMaquinas(idsMaquinas) {
  const ids = new Set(idsMaquinas);

  return [
    ...ingresos
      .filter((ingreso) => ids.has(ingreso.id_maquina))
      .map((ingreso) => ({
        id: `ingreso-${ingreso.id_ingreso}`,
        id_maquina: ingreso.id_maquina,
        tipo: 'ingreso',
        descripcion: ingreso.descripcion || 'Ingreso',
        cliente:
          clientes.find(
            (cliente) => cliente.id_cliente === ingreso.id_cliente,
          )?.nombre_obra ?? '—',
        fecha: ingreso.fecha,
        valor: ingreso.valor_ingreso,
      })),
    ...egresos
      .filter((egreso) => ids.has(egreso.id_maquina))
      .map((egreso) => ({
        id: `egreso-${egreso.id_egreso}`,
        id_maquina: egreso.id_maquina,
        tipo: 'egreso',
        descripcion: egreso.descripcion || 'Egreso',
        cliente: '—',
        fecha: egreso.fecha,
        valor: egreso.valor_egreso,
      })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function registrosMaquina(idMaquina) {
  return registrosDeMaquinas([idMaquina]);
}

export function registrosOperador(idOperador) {
  const idsMaquinas = maquinaOperador
    .filter(
      (asignacion) =>
        asignacion.id_operador === idOperador &&
        asignacion.fecha_salida === null,
    )
    .map((asignacion) => asignacion.id_maquina);

  return registrosDeMaquinas(idsMaquinas).map((registro) => ({
    ...registro,
    maquina:
      maquinas.find(
        (maquina) => maquina.id_maquina === registro.id_maquina,
      )?.placa ?? '—',
  }));
}
