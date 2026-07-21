import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatJobDate, formatJobMoney } from '../jobs/jobUtils';
import { getTechnicianDashboardData } from './technicianDashboardService';
import { getTechnicianResourceErrorMessage } from './technicianResourceUtils';
import './technician.css';

const EMPTY_DASHBOARD = {
  technician: null,
  workOrders: [],
  workOrderCount: 0,
  jobCount: 0,
  serviceReportCount: 0,
};

function technicianName(technician) {
  return technician?.fullName
    || [technician?.firstName, technician?.lastName].filter(Boolean).join(' ')
    || 'Técnico';
}

function MetricCard({ label, value, description, limited = false }) {
  return (
    <article className={limited ? 'technician-metric--limited' : undefined}>
      <span>{label}</span>
      <strong aria-label={limited ? `${label}: sin conteo disponible` : `${label}: ${value}`}>
        {value}
      </strong>
      <small>{description}</small>
    </article>
  );
}

function DashboardLoading() {
  return (
    <div className="technician-state" role="status" aria-live="polite">
      <span className="technician-loader" aria-hidden="true" />
      <p>Cargando tu resumen operativo...</p>
    </div>
  );
}

export default function TechnicianDashboardPage() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const nextDashboard = await getTechnicianDashboardData();
        if (active) setDashboard(nextDashboard);
      } catch (requestError) {
        if (active) {
          setError(getTechnicianResourceErrorMessage(requestError, 'el dashboard técnico'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, [reloadKey]);

  if (loading) return <DashboardLoading />;

  if (error) {
    return (
      <div className="technician-state technician-state--error" role="alert">
        <strong>No fue posible cargar el dashboard</strong>
        <p>{error}</p>
        <button className="admin-button admin-button--primary" type="button" onClick={reload}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!dashboard.technician) {
    return (
      <div className="technician-state technician-state--warning" role="alert">
        <strong>Perfil técnico no disponible</strong>
        <p>Tu sesión no tiene un perfil técnico asociado.</p>
      </div>
    );
  }

  const today = new Date();
  const noAssignments = dashboard.workOrderCount === 0
    && dashboard.jobCount === 0
    && dashboard.serviceReportCount === 0;

  return (
    <section className="technician-dashboard-page" aria-labelledby="technician-dashboard-title">
      <div className="technician-page-heading">
        <div>
          <p className="admin-eyebrow">Panel técnico</p>
          <h1 id="technician-dashboard-title">Bienvenido, {technicianName(dashboard.technician)}</h1>
          <p>
            {dashboard.technician.specialtyName || dashboard.technician.specialtyCode || 'Especialidad no informada'}
            {' · '}
            Consulta el estado de tus asignaciones y continúa con tu operación diaria.
          </p>
        </div>
        <time className="technician-date" dateTime={today.toISOString().slice(0, 10)}>
          {new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(today)}
        </time>
      </div>

      <section aria-labelledby="technician-dashboard-summary-title">
        <h2 id="technician-dashboard-summary-title" className="technician-visually-hidden">
          Resumen de asignaciones
        </h2>
        <div className="technician-metrics technician-metrics--operational">
          <MetricCard label="Órdenes asignadas" value={dashboard.workOrderCount} description="Total autorizado por la API" />
          <MetricCard label="Jobs asignados" value={dashboard.jobCount} description="Total autorizado por la API" />
          <MetricCard label="Jobs pendientes" value="—" description="Consulta el desglose en Mis trabajos" limited />
          <MetricCard label="Jobs en proceso" value="—" description="Consulta el desglose en Mis trabajos" limited />
          <MetricCard label="Jobs completados" value="—" description="Consulta el desglose en Mis trabajos" limited />
          <MetricCard label="Reportes de servicio" value={dashboard.serviceReportCount} description="Cierres oficiales asignados" />
        </div>
      </section>

      <nav className="technician-dashboard-actions" aria-label="Accesos rápidos del técnico">
        <Link className="admin-button admin-button--primary" to="/technician/work-orders">Mis órdenes</Link>
        <Link className="admin-button admin-button--secondary" to="/technician/jobs">Mis trabajos</Link>
        <Link className="admin-button admin-button--secondary" to="/technician/service-reports">Mis reportes de servicio</Link>
      </nav>

      {noAssignments && (
        <div className="technician-dashboard-empty" role="status">
          <strong>Aún no tienes actividad asignada.</strong>
          <p>Las nuevas órdenes, trabajos y reportes aparecerán en este panel.</p>
        </div>
      )}

      <section className="technician-panel" aria-labelledby="technician-dashboard-orders-title">
        <header>
          <div>
            <h2 id="technician-dashboard-orders-title">Órdenes asignadas</h2>
            <p>Muestra inicial de tus órdenes, sin descargar el listado completo.</p>
          </div>
          <Link to="/technician/work-orders">Ver todas las órdenes</Link>
        </header>

        {dashboard.workOrders.length === 0 ? (
          <div className="technician-empty">
            <strong>No tienes órdenes asignadas.</strong>
            <p>Las nuevas asignaciones aparecerán aquí.</p>
          </div>
        ) : (
          <ul className="technician-dashboard-order-list">
            {dashboard.workOrders.map((workOrder) => (
              <li key={workOrder.id}>
                <div>
                  <strong>OT-{workOrder.id}</strong>
                  <span>Ingreso ING-{workOrder.vehicleIntakeId}</span>
                </div>
                <dl>
                  <div><dt>Entrega estimada</dt><dd>{formatJobDate(workOrder.estimatedDeliveryDate)}</dd></div>
                  <div><dt>Total estimado</dt><dd>{formatJobMoney(workOrder.estimatedTotal)}</dd></div>
                </dl>
                <Link to={`/technician/work-orders/${workOrder.id}`} aria-label={`Ver detalle de la orden OT-${workOrder.id}`}>
                  Ver detalle
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
