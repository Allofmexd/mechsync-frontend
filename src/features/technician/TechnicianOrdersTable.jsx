import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'Dato no disponible';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
}

export default function TechnicianOrdersTable({ workOrders }) {
  return (
    <div className="technician-orders-table-wrap">
      <table className="technician-orders-table">
        <caption className="technician-visually-hidden">Órdenes asignadas de la página actual</caption>
        <thead>
          <tr>
            <th>Orden</th>
            <th>Ingreso</th>
            <th>Fecha de orden</th>
            <th>Entrega estimada</th>
            <th>Horas</th>
            <th>Estado</th>
            <th>Total estimado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {workOrders.map((order) => (
            <tr key={order.id}>
              <td><strong>OT-{order.id}</strong></td>
              <td>ING-{order.vehicleIntakeId}</td>
              <td>{formatDate(order.workOrderDate)}</td>
              <td>{formatDate(order.estimatedDeliveryDate)}</td>
              <td>{order.estimatedHours ?? 'Dato no disponible'}</td>
              <td><span className="technician-status">Estado #{order.statusId}</span></td>
              <td><strong>{formatMoney(order.estimatedTotal)}</strong></td>
              <td>
                <div className="technician-order-actions">
                  <Link
                    to={`/technician/work-orders/${order.id}`}
                    aria-label={`Ver detalle de la orden OT-${order.id}`}
                  >
                    Ver detalle
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
