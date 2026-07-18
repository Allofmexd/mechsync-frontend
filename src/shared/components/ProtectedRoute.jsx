import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../features/auth/authService';
import { clearAuthToken, getAuthToken } from '../storage/authStorage';
import './protectedRoute.css';

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return roles.map((role) => String(role).replace(/^ROLE_/, ''));
}

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const token = getAuthToken();
  const requiredRolesKey = useMemo(() => (allowedRoles ?? []).join('|'), [allowedRoles]);
  const [identity, setIdentity] = useState(null);
  const [state, setState] = useState(allowedRoles?.length ? 'loading' : 'ready');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!token || !requiredRolesKey) {
      setState('ready');
      return () => { active = false; };
    }

    async function validateRole() {
      setState('loading');
      setError('');
      try {
        const response = await getCurrentUser();
        const currentUser = response?.data ?? response;
        const roles = normalizeRoles(currentUser?.roles);
        if (!active) return;
        setIdentity({ ...currentUser, roles });
        setState(roles.some((role) => requiredRolesKey.split('|').includes(role)) ? 'ready' : 'forbidden');
      } catch (requestError) {
        if (!active) return;
        if (requestError?.status === 401) {
          clearAuthToken();
          setState('unauthorized');
          return;
        }
        setError(requestError?.message || 'No fue posible validar los permisos de la sesión.');
        setState('error');
      }
    }

    validateRole();
    return () => { active = false; };
  }, [reloadKey, requiredRolesKey, token]);

  if (!token || state === 'unauthorized') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!requiredRolesKey) return <Outlet />;

  if (state === 'loading') {
    return <div className="protected-route-state"><span className="protected-route-loader" /><p>Validando sesión y permisos...</p></div>;
  }

  if (state === 'forbidden') {
    return (
      <div className="protected-route-state protected-route-state--forbidden">
        <strong>Acceso no autorizado</strong>
        <p>Tu cuenta no tiene el rol requerido para entrar a esta sección.</p>
        <Link className="admin-button admin-button--secondary" to="/">Volver al inicio</Link>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="protected-route-state protected-route-state--error">
        <strong>No fue posible validar la sesión</strong>
        <p>{error}</p>
        <button className="admin-button admin-button--primary" type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button>
      </div>
    );
  }

  return <Outlet context={{ currentUser: identity }} />;
}
