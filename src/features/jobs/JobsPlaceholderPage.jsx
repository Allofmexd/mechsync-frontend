import ApiPendingPage from '../../shared/components/ApiPendingPage';

const endpointGroups = [
  {
    title: 'Jobs',
    endpoints: ['GET /jobs', 'GET /jobs/{id}', 'POST /jobs', 'PUT /jobs/{id}', 'PATCH /jobs/{id}/status'],
  },
  {
    title: 'Reportes de servicio',
    endpoints: ['GET /service-reports', 'GET /service-reports/{id}', 'POST /service-reports'],
  },
];

export default function JobsPlaceholderPage() {
  return (
    <ApiPendingPage
      eyebrow="Ejecución del taller"
      title="Gestión de trabajos realizados"
      message="Gestión de trabajos realizados pendiente de API. Se requieren endpoints de Jobs y/o Service Reports para mostrar trabajos ejecutados."
      details="Una Work Order solo representa planificación o cotización. Esta vista no reutiliza órdenes como si fueran trabajos ejecutados y no presenta métricas, estados o importes ficticios."
      endpointGroups={endpointGroups}
      backTo="/admin/work-orders"
    />
  );
}
