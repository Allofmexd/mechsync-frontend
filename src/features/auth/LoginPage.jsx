import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../../shared/components/PublicLayout.jsx';
import { saveAuthToken } from '../../shared/storage/authStorage.js';
import { extractAccessToken, extractAuthenticatedUser, login } from './authService.js';
import './auth.css';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [trackingMessage, setTrackingMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    setStatus({ type: 'loading', message: 'Verificando tus datos…' });

    try {
      const response = await login({ email, password });
      const token = extractAccessToken(response);
      const authenticatedUser = extractAuthenticatedUser(response);

      if (!token) {
        throw new Error('Login exitoso, pero no se encontró token en la respuesta.');
      }

      saveAuthToken(token);
      setStatus({
        type: 'success',
        message: 'Sesión iniciada correctamente.',
      });

      const requestedPath = location.state?.from?.pathname;
      const roles = Array.isArray(authenticatedUser?.roles)
        ? authenticatedUser.roles.map((role) => String(role).replace(/^ROLE_/, ''))
        : [];
      const isAdministrator = roles.includes('ADMINISTRADOR');
      const isTechnician = roles.includes('TECNICO');
      let destination = '/';

      if (requestedPath?.startsWith('/technician') && isTechnician) {
        destination = requestedPath;
      } else if (requestedPath?.startsWith('/admin') && isAdministrator) {
        destination = requestedPath;
      } else if (isTechnician) {
        destination = '/technician';
      } else if (isAdministrator) {
        destination = '/admin/customers';
      }

      navigate(destination, {
        replace: true,
        state: { success: 'Sesión iniciada correctamente.' },
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No fue posible iniciar sesión. Inténtalo nuevamente.',
      });
    } finally {
      const passwordInput = form.elements.namedItem('password');
      if (passwordInput instanceof HTMLInputElement) {
        passwordInput.value = '';
      }
    }
  };

  const handleTrackingSubmit = (event) => {
    event.preventDefault();
    setTrackingMessage('La consulta pública de órdenes estará disponible próximamente.');
  };

  const isLoading = status.type === 'loading';

  return (
    <PublicLayout footerText={`© ${new Date().getFullYear()} MechSync`}>
      <div className="auth-card__heading">
        <h1>Iniciar sesión</h1>
        <p>Accede al portal de especialistas en transmisiones.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Correo electrónico</label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="nombre@taller.com"
          autoComplete="email"
          required
          disabled={isLoading}
        />

        <label htmlFor="login-password">Contraseña</label>
        <div className="password-field">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <button className="button button--primary auth-form__submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>

        {status.type !== 'idle' && (
          <p className={`form-message form-message--${status.type}`} aria-live="polite">
            {status.message}
          </p>
        )}
      </form>

      <p className="auth-switch">
        ¿No tienes cuenta? <Link to="/register">Registrarte</Link>
      </p>

      <div className="auth-divider" aria-hidden="true">
        <span>o</span>
      </div>

      <form className="tracking-form" onSubmit={handleTrackingSubmit}>
        <strong>¿Eres cliente?</strong>
        <p>Ingresa tu número de orden para consultar el estado de tu reparación.</p>
        <label className="sr-only" htmlFor="order-number">
          Número de orden
        </label>
        <input id="order-number" name="orderNumber" placeholder="Ej: TX-9942" required />
        <button className="button button--secondary" type="submit">
          Consultar estado
        </button>
        {trackingMessage && (
          <p className="tracking-form__message" aria-live="polite">
            {trackingMessage}
          </p>
        )}
      </form>
    </PublicLayout>
  );
}

export default LoginPage;
