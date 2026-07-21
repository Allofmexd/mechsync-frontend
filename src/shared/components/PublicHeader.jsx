import { Link } from 'react-router-dom';
import MechSyncLogo from './MechSyncLogo.jsx';
import './public.css';

function PublicHeader() {
  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Link className="public-header__brand" to="/" aria-label="Ir al inicio de MechSync">
          <MechSyncLogo compact />
        </Link>

        <nav className="public-header__nav" aria-label="Navegación principal">
          <a href="/#servicios">Servicios</a>
          <a href="/#proceso">Cómo funciona</a>
          <a href="/#seguimiento">Seguimiento</a>
          <a href="/#contacto">Contacto</a>
        </nav>

        <div className="public-header__actions">
          <Link className="button button--ghost button--small" to="/register">
            Solicitar acceso
          </Link>
          <Link className="button button--primary button--small" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
