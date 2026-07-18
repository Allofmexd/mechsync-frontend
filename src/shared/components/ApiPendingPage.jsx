import { Link } from 'react-router-dom';
import './apiPending.css';

export default function ApiPendingPage({ eyebrow, title, message, details, endpointGroups, backTo = '/admin/work-orders' }) {
  return (
    <section className="api-pending-page">
      <div className="admin-breadcrumb"><span>Panel principal</span><span>›</span><strong>{title}</strong></div>
      <div className="api-pending-hero">
        <div className="api-pending-hero__icon" aria-hidden="true">⌁</div>
        <div>
          <p className="admin-eyebrow">{eyebrow}</p>
          <span className="api-pending-badge">Pendiente de API</span>
          <h1>{title}</h1>
          <p>{message}</p>
        </div>
      </div>

      <div className="api-pending-layout">
        <article className="api-pending-card">
          <h2>Qué falta para habilitar esta vista</h2>
          <p>{details}</p>
          <div className="api-pending-disabled-preview" aria-label="Vista bloqueada">
            <div><span>Datos relacionados</span><strong>Funcionalidad aún no disponible en API</strong></div>
            <button className="admin-button admin-button--primary" type="button" disabled>Guardar</button>
          </div>
        </article>

        <aside className="api-pending-endpoints">
          <h2>Endpoints candidatos documentados</h2>
          <p>Estos contratos son una brecha técnica; el frontend todavía no los consume.</p>
          {endpointGroups.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              <ul>{group.endpoints.map((endpoint) => <li key={endpoint}><code>{endpoint}</code></li>)}</ul>
            </section>
          ))}
        </aside>
      </div>

      <Link className="admin-button admin-button--secondary" to={backTo}>Volver</Link>
    </section>
  );
}
