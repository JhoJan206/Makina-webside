import { useEffect, useState } from 'react';
import { LockIcon, UserIcon } from '../components/Icons.jsx';
import { api } from '../api/cliente.js';

export default function Login() {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Si ya hay una sesión activa se entra directo al dashboard
  useEffect(() => {
    api('/auth/me', { redirigirSinSesion: false })
      .then(() => window.location.replace('/home'))
      .catch(() => {});
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (enviando) return;

    const datos = Object.fromEntries(new FormData(event.currentTarget));

    if (!datos.identificador?.trim() || !datos.contrasena) {
      setError('Ingresa tu usuario o correo y tu contraseña.');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      await api('/auth/login', {
        metodo: 'POST',
        cuerpo: {
          identificador: datos.identificador.trim(),
          contrasena: datos.contrasena,
        },
        redirigirSinSesion: false,
      });
      window.location.assign('/home');
    } catch (errorApi) {
      setError(errorApi.message);
      setEnviando(false);
    }
  }

  return (
    <>
      {/* Lado izquierdo */}
      <div className="izquierda">
        <div className="logo">
          <img src="/img/logo_fondo_negro.png" alt="MAKINA" />
        </div>
        <h1>Bienvenido</h1>
      </div>

      {/* Lado derecho */}
      <div className="derecha">
        <div className="tarjeta">
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="identificador">USUARIO O CORREO ELECTRÓNICO</label>
            <div className="campo">
              <span>
                <UserIcon />
              </span>
              <input
                id="identificador"
                name="identificador"
                type="text"
                placeholder="UserName o user@email.com"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                required
              />
            </div>

            <label htmlFor="contrasena">CONTRASEÑA</label>
            <div className="campo">
              <span>
                <LockIcon />
              </span>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                placeholder="••••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={enviando}>
              {enviando ? 'Ingresando…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
