// Datos de la empresa, cargados desde la API (/api) al abrir cada vista.
// Los arreglos se llenan con llenarDatos() (ver cargar.js) y los helpers de
// abajo trabajan sobre ellos de forma síncrona.
//
// Tablas usadas:
//   clientes        -> nombre_obra
//   operadores      -> nombre, apellido, cedula, sueldo
//   maquinas        -> tipo, placa, valor_hora, imagen, imagen_alt
//   maquina_operador-> id_maquina, id_operador, fecha_ingreso, fecha_salida
//   ingresos        -> id_maquina, id_cliente, horas, valor_ingreso, descripcion, fecha
//   egresos         -> id_maquina, valor_egreso, descripcion, fecha

// Mes que resumen el dashboard y los detalles (AAAA-MM, hora local)
export const PERIODO = (() => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
})();

export const clientes = [];
export const operadores = [];
export const maquinas = [];
export const maquinaOperador = [];
export const ingresos = [];
export const egresos = [];

const IMAGENES_POR_TIPO = {
  Pajarita: '/img/maquinaria/retroexcavadora.jpg',
  Bulldozer: '/img/maquinaria/excavadora.jpg',
  Excavadora: '/img/maquinaria/excavadora.jpg',
};

export function normalizarMaquina(maquina) {
  return {
    ...maquina,
    imagen: maquina.imagen || IMAGENES_POR_TIPO[maquina.tipo] || '/img/maquinaria/cargadora.jpg',
    alt: maquina.imagen_alt || `${tipoMaquinaVisible(maquina.tipo)} ${maquina.placa}`,
  };
}

function reemplazar(arreglo, filas) {
  arreglo.splice(0, arreglo.length, ...(filas ?? []));
}

export function llenarDatos(datos) {
  if (datos.clientes) reemplazar(clientes, datos.clientes);
  if (datos.operadores) reemplazar(operadores, datos.operadores);
  if (datos.maquinas) reemplazar(maquinas, datos.maquinas.map(normalizarMaquina));
  if (datos.asignaciones) reemplazar(maquinaOperador, datos.asignaciones);
  if (datos.ingresos) reemplazar(ingresos, datos.ingresos);
  if (datos.egresos) reemplazar(egresos, datos.egresos);
}

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
    ) ?? null
  );
}

export function obtenerOperador(id) {
  const buscado = String(id ?? '');

  return (
    operadores.find(
      (operador) =>
        String(operador.id_operador) === buscado || operador.cedula === buscado,
    ) ?? null
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

export function tipoMaquinaVisible(tipo) {
  return tipo === 'Pajarita' ? 'Retroexcavadora' : tipo;
}

export function telefonoEnlace(telefono) {
  return `tel:${String(telefono ?? '').replace(/[^\d+]/g, '')}`;
}

export function promedioValorHora() {
  if (maquinas.length === 0) return 0;

  return Math.round(
    maquinas.reduce((total, maquina) => total + maquina.valor_hora, 0) /
      maquinas.length,
  );
}

export function resumenGeneral() {
  const ingresosPeriodo = ingresos.filter((ingreso) =>
    ingreso.fecha.startsWith(PERIODO),
  );
  const egresosPeriodo = egresos.filter((egreso) =>
    egreso.fecha.startsWith(PERIODO),
  );

  const totalIngresos = ingresosPeriodo.reduce(
    (total, ingreso) => total + ingreso.valor_ingreso,
    0,
  );
  const totalEgresos = egresosPeriodo.reduce(
    (total, egreso) => total + egreso.valor_egreso,
    0,
  );
  const horas = ingresosPeriodo.reduce(
    (total, ingreso) => total + ingreso.horas,
    0,
  );

  return {
    ingresos: totalIngresos,
    egresos: totalEgresos,
    ganancia: totalIngresos - totalEgresos,
    horas,
    maquinas: maquinas.length,
  };
}

export function ultimosRegistros(limite = 5) {
  const registros = [
    ...ingresos.map((ingreso) => ({
      id: `ingreso-${ingreso.id_ingreso}`,
      tipo: 'ingreso',
      fecha: ingreso.fecha,
      descripcion: ingreso.descripcion || 'Ingreso',
      valor: ingreso.valor_ingreso,
      cliente:
        clientes.find(
          (cliente) => cliente.id_cliente === ingreso.id_cliente,
        )?.nombre_obra ?? '—',
      maquina:
        maquinas.find(
          (maquina) => maquina.id_maquina === ingreso.id_maquina,
        )?.placa ?? '—',
    })),
    ...egresos.map((egreso) => ({
      id: `egreso-${egreso.id_egreso}`,
      tipo: 'egreso',
      fecha: egreso.fecha,
      descripcion: egreso.descripcion || 'Egreso',
      valor: egreso.valor_egreso,
      cliente: '—',
      maquina:
        maquinas.find(
          (maquina) => maquina.id_maquina === egreso.id_maquina,
        )?.placa ?? '—',
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return registros.slice(0, limite);
}

// Totales de ingresos y egresos de los últimos `meses` meses (hasta PERIODO).
// Si se pasan ids de máquinas, solo se suman sus movimientos.
export function serieMensual(idsMaquinas = null, meses = 6) {
  const [anio, mes] = PERIODO.split('-').map(Number);
  const filtro = idsMaquinas ? new Set(idsMaquinas) : null;
  const incluir = (registro) => !filtro || filtro.has(registro.id_maquina);

  return Array.from({ length: meses }, (_, i) => {
    const fecha = new Date(anio, mes - meses + i, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const etiqueta = MESES[fecha.getMonth()];

    return {
      mes: etiqueta[0].toUpperCase() + etiqueta.slice(1),
      ingresos: ingresos
        .filter((ingreso) => incluir(ingreso) && ingreso.fecha.startsWith(clave))
        .reduce((total, ingreso) => total + ingreso.valor_ingreso, 0),
      egresos: egresos
        .filter((egreso) => incluir(egreso) && egreso.fecha.startsWith(clave))
        .reduce((total, egreso) => total + egreso.valor_egreso, 0),
    };
  });
}
