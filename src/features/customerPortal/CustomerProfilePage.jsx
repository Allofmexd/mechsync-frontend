import { useEffect, useState } from 'react';
import { getCustomerProfile } from './customerPortalService.js';
import { getCustomerPortalErrorMessage } from './customerPortalUtils.js';

export default function CustomerProfilePage() {
  const [state, setState] = useState({ loading: true, profile: null, error: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: '' }));
    getCustomerProfile({ signal: controller.signal })
      .then((profile) => setState({ loading: false, profile, error: '' }))
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setState({ loading: false, profile: null, error: getCustomerPortalErrorMessage(error, 'tu perfil') });
      });
    return () => controller.abort();
  }, [reloadKey]);

  if (state.loading) return <section className="customer-state" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando perfil…</p></section>;
  if (state.error) return <section className="customer-state customer-state--error" role="alert"><h1>No fue posible cargar tu perfil</h1><p>{state.error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button></section>;

  const profile = state.profile;
  return (
    <section className="customer-page" aria-busy="false">
      <header className="customer-page__heading"><div><span>Cuenta</span><h1>Mi perfil</h1></div><p>Información de contacto registrada por el taller.</p></header>
      <article className="customer-card">
        <dl className="customer-detail-grid">
          <div><dt>Nombre</dt><dd>{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'No registrado'}</dd></div>
          <div><dt>Correo electrónico</dt><dd>{profile.email || 'No registrado'}</dd></div>
          <div><dt>Teléfono</dt><dd>{profile.phone || 'No registrado'}</dd></div>
          <div><dt>Dirección</dt><dd>{profile.address || 'No registrada'}</dd></div>
        </dl>
      </article>
    </section>
  );
}
