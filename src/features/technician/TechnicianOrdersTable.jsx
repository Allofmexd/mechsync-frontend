import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

function statusClass(code) {
  return String(code || 'default').toLocaleLowerCase('es').replaceAll('_', '-');
}

export default function TechnicianOrdersTable({
  workOrders,
  statuses,
  intakes,
  vehicles,
  customers,
  showPendingActions = false,
}) {
  const statusMap = new Map(statuses.map((status) => [String(status.id), status]));

  return (
    <div className="technician-orders-table-wrap">
      <table className="technician-orders-table">
        <thead><tr><th>Folio</th><th>Vehículo</th><th>Cliente</th><th>Problema reportado</th><th>Entrega estimada</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {workOrders.map((order) => {
            const intake = intakes[order.vehicleIntakeId];
            const vehicle = intake ? vehicles[intake.vehicleId] : null;
            const customer = vehicle ? customers[vehicle.customerId] : null;
            const status = statusMap.get(String(order.statusId));
            return (
              <tr key={order.id}>
                <td><strong>OT-{order.id}</strong><small>ING-{order.vehicleIntakeId}</small></td>
                <td><strong>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Dato no disponible'}</strong><small>{vehicle?.licensePlate || 'Placa no disponible'}</small></td>
                <td><strong>{vehicle?.customerId ? `Cliente #${vehicle.customerId}` : 'Dato no disponible'}</strong><small>{customer?.address || 'Nombre no expuesto por API'}</small></td>
                <td>{intake?.reportedProblem || 'Dato no disponible'}</td>
                <td>{formatDate(order.estimatedDeliveryDate)}</td>
                <td><span className={`technician-status technician-status--${statusClass(status?.code)}`}>{status?.name || `Estado #${order.statusId}`}</span></td>
                <td><div className="technician-order-actions"><Link to={`/technician/work-orders/${order.id}`}>Ver detalle</Link>{showPendingActions && <button type="button" disabled title="Pendiente de endpoint PATCH para iniciar trabajo">Iniciar trabajo</button>}</div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
