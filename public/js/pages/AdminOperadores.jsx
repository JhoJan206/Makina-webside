import AdminCrud from '../components/AdminCrud.jsx';
import { CheckIcon, UsersIcon, WalletIcon } from '../components/Icons.jsx';
import {
  formatearMoneda,
  maquinaOperador,
  nombreMaquina,
  nombreOperador,
  obtenerMaquinaActual,
  operadores,
} from '../data/datos.js';

const campos = [
  {
    nombre: 'nombre',
    etiqueta: 'Nombre',
    requerido: true,
    max: 100,
    placeholder: 'Ej. Carlos',
  },
  {
    nombre: 'apellido',
    etiqueta: 'Apellido',
    requerido: true,
    max: 100,
    placeholder: 'Ej. Pérez',
  },
  {
    nombre: 'cedula',
    etiqueta: 'Cédula',
    requerido: true,
    max: 20,
    placeholder: 'Ej. 1.020.304.050',
  },
  {
    nombre: 'sueldo',
    etiqueta: 'Sueldo mensual (COP)',
    tipo: 'numero',
    min: 0,
    paso: 1000,
    placeholder: 'Ej. 3200000',
  },
];

export default function AdminOperadores() {
  return (
    <AdminCrud
      seccion="operadores"
      entidad={{
        singular: 'operador',
        articulo: 'el',
        genero: 'm',
        nuevo: 'Nuevo operador',
        crear: 'Registrar operador',
        columnaPrincipal: 'Operador',
      }}
      descripcion="Registra, edita o retira operadores del equipo."
      rutaApi="/operadores"
      clave="id_operador"
      cache={operadores}
      campos={campos}
      titulo={nombreOperador}
      subtitulo={(operador) => `C.C. ${operador.cedula}`}
      enlace={(operador) => `/operador/${operador.id_operador}`}
      textoBusqueda={(operador) =>
        `${operador.nombre} ${operador.apellido} ${operador.cedula}`
      }
      columnas={[
        {
          etiqueta: 'Sueldo',
          valor: (operador) =>
            operador.sueldo === null
              ? '—'
              : formatearMoneda(operador.sueldo, false),
        },
        {
          etiqueta: 'Máquina actual',
          valor: (operador) => {
            const maquina = obtenerMaquinaActual(operador.id_operador);
            return maquina ? nombreMaquina(maquina) : 'Sin asignar';
          },
        },
      ]}
      estadisticas={(filas) => [
        {
          etiqueta: 'Operadores',
          valor: filas.length,
          detalle: 'Registrados en el equipo',
          Icono: UsersIcon,
          tono: 'neutro',
        },
        {
          etiqueta: 'Asignados',
          valor: filas.filter((operador) =>
            obtenerMaquinaActual(operador.id_operador),
          ).length,
          detalle: 'Operando una máquina',
          Icono: CheckIcon,
          tono: 'verde',
        },
        {
          etiqueta: 'Nómina mensual',
          valor: formatearMoneda(
            filas.reduce((total, operador) => total + (operador.sueldo ?? 0), 0),
          ),
          detalle: 'Suma de sueldos',
          Icono: WalletIcon,
          tono: 'ambar',
        },
      ]}
      avisoEliminar={(operador) => {
        const total = maquinaOperador.filter(
          (asignacion) => asignacion.id_operador === operador.id_operador,
        ).length;
        if (total === 0) return null;

        return `También se borrará su historial de ${total} ${
          total === 1 ? 'asignación' : 'asignaciones'
        } a máquinas.`;
      }}
    />
  );
}
