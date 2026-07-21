import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCustomerProfile, getCustomerVehicles } from './customerPortalService.js';
import { getCustomerPortalErrorMessage } from './customerPortalUtils.js';

export default function CustomerDashboardPage() {
  const [state, setState] = useState({ loading: true, profile: null, vehicles: 0, error: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: '' }));

    Promise.all([
      getCustomerProfile({ signal: controller.signal }),
      getCustomerVehicles({ page: 0, size: 1, signal: controller.signal }),
    ])
      .then(([profile, vehicles]) => {
        setState({ loading: false, profile, vehicles: vehicles.totalElements, error: '' });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setState({ loading: false, profile: null, vehicles: 0, error: getCustomerPortalErrorMessage(error) });
      });

    return () => controller.abort();
  }, [reloadKey]);

  if (state.loading) {
    return <section className="customer-state" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando tu portal…</p></section>;
  }

  if (state.error) {
    return <section className="customer-state customer-state--error" role="alert"><h1>No fue posible cargar el portal</h1><p>{state.error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button></section>;
  }

  return (
    <section className="customer-page customer-dashboard" aria-busy="false">
      <header className="customer-page__heading">
        <div><span>Inicio</span><h1>Hola, {state.profile?.firstName || 'cliente'}</h1></div>
        <p>Consulta los datos de tu cuenta y los vehículos registrados a tu nombre.</p>
      </header>
      <div className="customer-summary-grid">
        <article><span>Vehículos registrados</span><strong>{state.vehicles}</strong></article>
        <article><span>Correo de contacto</span><strong>{state.profile?.email || 'No registrado'}</strong></article>
      </div>
      <nav className="customer-quick-links" aria-label="Accesos rápidos">
        <Link to="/customer/profile">Consultar mi perfil</Link>
        <Link to="/customer/vehicles">Consultar mis vehículos</Link>
      </nav>
    </section>
  );
}
