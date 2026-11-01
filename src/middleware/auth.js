import jwt from 'jsonwebtoken';
import { env, isProduction, requerirVariable } from '../config/env.js';
import { HttpError } from './validar.js';

export const COOKIE_SESION = 'makina_sesion';

const opcionesCookie = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
  maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000,
});

export function iniciarSesion(res, usuario) {
  const token = jwt.sign(
    { sub: String(usuario.id_usuario) },
    requerirVariable('JWT_SECRET'),
    { expiresIn: `${env.SESSION_DAYS}d` },
  );

  res.cookie(COOKIE_SESION, token, opcionesCookie());
}

export function cerrarSesion(res) {
  const { maxAge, ...opciones } = opcionesCookie();
  res.clearCookie(COOKIE_SESION, opciones);
}

export function requiereSesion(req, res, next) {
  const token = req.cookies?.[COOKIE_SESION];

  if (!token) {
    return next(new HttpError(401, 'Debes iniciar sesión.'));
  }

  try {
    const datos = jwt.verify(token, requerirVariable('JWT_SECRET'));
    req.usuario = { id_usuario: Number(datos.sub) };
    next();
  } catch (error) {
    if (error.status) return next(error);

    cerrarSesion(res);
    next(new HttpError(401, 'La sesión expiró, vuelve a iniciar sesión.'));
  }
}

