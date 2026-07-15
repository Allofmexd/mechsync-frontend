import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../shared/components/PublicLayout.jsx';
import './auth.css';

const REGISTER_UNAVAILABLE_MESSAGE =
  'El registro público todavía no está disponible. Solicita tu cuenta a un administrador.';

function RegisterPage() {
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(REGISTER_UNAVAILABLE_MESSAGE);
  };

  return (
    <PublicLayout>
      <div className="auth-card__heading">
        <h1>Crear cuenta</h1>
        <p>Únete a la red de especialistas en transmisiones.</p>
      </div>

      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <div className="register-form__names">
          <div>
            <label htmlFor="register-name">Nombre</label>
            <input
              id="register-name"
              name="firstName"
              placeholder="Nombre"
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label htmlFor="register-last-name">Apellido</label>
            <input
              id="register-last-name"
              name="lastName"
              placeholder="Apellido"
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <label htmlFor="register-email">Correo electrónico</label>
        <input
          id="register-email"
          name="email"
          type="email"
          placeholder="nombre@taller.com"
          autoComplete="email"
          required
        />

        <label htmlFor="register-password">Contraseña</label>
        <input
          id="register-password"
          name="password"
          type="password"
          placeholder="Crea una contraseña"
          autoComplete="new-password"
          minLength="8"
          required
        />

        <label htmlFor="register-password-confirmation">Confirmar contraseña</label>
        <input
          id="register-password-confirmation"
          name="passwordConfirmation"
          type="password"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          minLength="8"
          required
        />

        <label className="terms-check">
          <input name="terms" type="checkbox" required />
          <span>Acepto los términos de servicio y la política de privacidad.</span>
        </label>

        <button className="button button--primary auth-form__submit" type="submit">
          Registrarse <span aria-hidden="true">→</span>
        </button>

        {message && (
          <p className="form-message form-message--info" role="status">
            {message}
          </p>
        )}
      </form>

      <p className="auth-switch auth-switch--bordered">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </PublicLayout>
  );
}

export default RegisterPage;
