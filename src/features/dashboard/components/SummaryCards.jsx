import { formatMoney, formatNumber } from '../adminDashboardUtils';

const CARDS = [
  ['registeredCustomers', 'Clientes registrados', 'Perfiles de clientes en el sistema'],
  ['registeredVehicles', 'Vehículos registrados', 'Vehículos asociados a clientes'],
  ['openVehicleIntakes', 'Ingresos abiertos', 'Ingresos aún no completados o cancelados'],
  ['activeWorkOrders', 'Work Orders activas', 'Pendientes, aprobadas o en proceso'],
  ['jobsInProgress', 'Jobs en proceso', 'Trabajos actualmente en ejecución'],
];

export default function SummaryCards({ summary }) {
  return (
    <section className="admin-dashboard-summary" aria-labelledby="dashboard-summary-title">
      <h2 id="dashboard-summary-title" className="sr-only">Resumen operativo</h2>
      {CARDS.map(([key, label, description]) => (
        <article key={key}>
          <span>{label}</span>
          <strong>{formatNumber(summary?.[key])}</strong>
          <small>{description}</small>
        </article>
      ))}
      <article className="admin-dashboard-summary__revenue">
        <span>Ingresos del periodo</span>
        <strong>{formatMoney(summary?.periodRevenue)}</strong>
        <small>Reportes entregados · {summary?.currency ?? 'MXN'}</small>
      </article>
    </section>
  );
}
