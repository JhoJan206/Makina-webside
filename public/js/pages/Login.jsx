import { LockIcon, MailIcon, UserIcon,  } from '../components/Icons.jsx';

export default function Login() {
  // Aqui se conectara el POST /api/login cuando exista
  function handleSubmit(event) {
    event.preventDefault();
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
          <form onSubmit={handleSubmit}>
            <label htmlFor="usuario">NOMBRE DE USUARIO</label>
            <div className="campo">
              <span>
                <UserIcon />
              </span>
              <input id="usuario" name="usuario" type="text" placeholder="UserName" />
            </div>

            <label htmlFor="correo">CORREO ELECTRÓNICO</label>
            <div className="campo">
              <span>
                <MailIcon />
              </span>
              <input id="correo" name="correo" type="email" placeholder="user@email.com" />
            </div>

            <label htmlFor="contrasena">CONTRASEÑA</label>
            <div className="campo">
              <span>
                <LockIcon />
              </span>
              <input id="contrasena" name="contrasena" type="password" placeholder="••••••••••" />
            </div>

            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </>
  );
}
