import { Link } from 'react-router-dom';
import PublicLayout from '../../shared/components/PublicLayout.jsx';
import './auth.css';

function RegisterPage() {
  return (
    <PublicLayout>
      <div className="auth-card__heading">
        <h1>Solicitar acceso</h1>
        <p>Las cuentas de MechSync se crean de forma administrativa.</p>
      </div>

      <section className="access-information" aria-labelledby="access-title">
        <h2 id="access-title">Registro público no disponible</h2>
        <p>
          Esta versión no ofrece registro público. Solicita al administrador del taller que cree
          tu usuario y te asigne el rol correspondiente.
        </p>
        <p>No captures contraseñas ni datos personales en formularios externos.</p>
        <Link className="button button--primary" to="/login">Ir a iniciar sesión</Link>
        <Link className="button button--secondary" to="/">Volver al inicio</Link>
      </section>
    </PublicLayout>
  );
}

export default RegisterPage;
