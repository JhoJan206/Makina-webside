// Crea un usuario de la empresa para iniciar sesión en /login.
//
//   npm run crear-usuario -- --usuario admin --correo admin@makina.com --nombre "Administrador"
//
// La contraseña se toma de la variable MAKINA_PASSWORD o se pide por consola.
import bcrypt from 'bcryptjs';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { cerrarPool } from '../src/config/db.js';
import { crearUsuario } from '../src/models/usuarios.js';

const { values } = parseArgs({
  options: {
    usuario: { type: 'string' },
    correo: { type: 'string' },
    nombre: { type: 'string' },
  },
});

if (!values.usuario || !values.correo || !values.nombre) {
  console.error(
    'Uso: npm run crear-usuario -- --usuario <usuario> --correo <correo> --nombre "<nombre>"',
  );
  process.exit(1);
}

let contrasena = process.env.MAKINA_PASSWORD;

if (!contrasena) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  contrasena = await rl.question('Contraseña (mínimo 8 caracteres): ');
  rl.close();
}

if (!contrasena || contrasena.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

try {
  const usuario = await crearUsuario({
    usuario: values.usuario.trim(),
    correo: values.correo.trim().toLowerCase(),
    nombre: values.nombre.trim(),
    password_hash: await bcrypt.hash(contrasena, 10),
  });

  console.log(`Usuario creado: ${usuario.usuario} <${usuario.correo}> (id ${usuario.id_usuario})`);
} catch (error) {
  console.error(
    error.code === '23505'
      ? 'Ya existe un usuario con ese nombre de usuario o correo.'
      : `No se pudo crear el usuario: ${error.message}`,
  );
  process.exitCode = 1;
} finally {
  await cerrarPool();
}
