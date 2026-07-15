import { Link } from 'react-router-dom';
import MechSyncLogo from './MechSyncLogo.jsx';
import './public.css';

function PublicLayout({ children, footerText }) {
  return (
    <div className="auth-page">
      <Link className="auth-page__back" to="/">
        <span aria-hidden="true">←</span> Volver al inicio
      </Link>

      <main className="auth-card">
        <Link className="auth-card__brand" to="/" aria-label="Ir al inicio de MechSync">
          <MechSyncLogo />
        </Link>
        {children}
        {footerText && <footer className="auth-card__footer">{footerText}</footer>}
      </main>
    </div>
  );
}

export default PublicLayout;
