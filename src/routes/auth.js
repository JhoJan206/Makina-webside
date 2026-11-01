import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { cerrarSesion, iniciarSesion, requiereSesion } from '../middleware/auth.js';
import { campo, HttpError, validar } from '../middleware/validar.js';
import { buscarPorIdentificador, obtenerUsuario } from '../models/usuarios.js';

const router = Router();

// Hash de relleno para comparar aunque el usuario no exista (mismo tiempo de respuesta)
const HASH_FALSO = bcrypt.hashSync('makina-relleno', 10);

function publico({ password_hash, ...usuario }) {
  return usuario;
}

router.post('/login', async (req, res) => {
  const { identificador, contrasena } = validar(req.body, {
    identificador: campo.texto({ requerido: true, max: 150 }),
    contrasena: campo.texto({ requerido: true, max: 200 }),
  });

  const usuario = await buscarPorIdentificador(identificador);
  const valida = await bcrypt.compare(contrasena, usuario?.password_hash ?? HASH_FALSO);

  if (!usuario || !valida) {
    throw new HttpError(401, 'Usuario, correo o contraseña incorrectos.');
  }

  iniciarSesion(res, usuario);
  res.json({ usuario: publico(usuario) });
});

router.post('/logout', (req, res) => {
  cerrarSesion(res);
  res.status(204).end();
});

router.get('/me', requiereSesion, async (req, res) => {
  const usuario = await obtenerUsuario(req.usuario.id_usuario);

  if (!usuario) {
    cerrarSesion(res);
    throw new HttpError(401, 'Debes iniciar sesión.');
  }

  res.json({ usuario });
});

export default router;
