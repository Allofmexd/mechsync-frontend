import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getVehicleById } from './vehiclesService';
import './vehicles.css';

function formatDate(value) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getVehicleById(id)
      .then((response) => {
        if (active) setVehicle(response?.data ?? response);
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'No fue posible cargar el vehículo.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="vehicles-state">Cargando detalle del vehículo…</div>;
  }

  if (error || !vehicle) {
    return (
      <section>
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span>
          <p>{error || 'El vehículo solicitado no está disponible.'}</p>
        </div>
        <Link className="admin-button admin-button--secondary" to="/admin/vehicles">Volver</Link>
      </section>
    );
  }

  const fields = [
    ['ID de vehículo', `#${vehicle.id}`],
    ['Customer propietario', `#${vehicle.customerId}`],
    ['Marca', vehicle.brand],
    ['Modelo', vehicle.model],
    ['Año', vehicle.year],
    ['Color', vehicle.color || 'No registrado'],
    ['Placa', vehicle.licensePlate],
    ['VIN', vehicle.vin || 'No registrado'],
    ['Kilometraje actual', vehicle.currentMileage == null
      ? 'No registrado'
      : `${Number(vehicle.currentMileage).toLocaleString('es-MX')} km`],
    ['Creado', formatDate(vehicle.createdAt)],
    ['Actualizado', formatDate(vehicle.updatedAt)],
  ];

  return (
    <section className="vehicle-detail-page">
      <div className="admin-breadcrumb">
        <span>Panel principal</span><span>›</span>
        <Link to="/admin/vehicles">Vehículos</Link><span>›</span>
        <strong>Detalle</strong>
      </div>

      <div className="vehicles-heading">
        <div>
          <p className="admin-eyebrow">Ficha del vehículo</p>
          <h1>{vehicle.brand} {vehicle.model}</h1>
          <p>{vehicle.licensePlate} · Vehicle #{vehicle.id}</p>
        </div>
        <Link
          className="admin-button admin-button--primary"
          to={`/admin/vehicle-intakes/new?vehicleId=${vehicle.id}`}
        >
          Nuevo ingreso
        </Link>
      </div>

      <div className="vehicle-detail-grid">
        <div className="vehicle-detail-card">
          <h2>Datos registrados</h2>
          <dl>
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="vehicle-detail-aside">
          <span className="pending-badge">Pendiente de endpoint/dato</span>
          <h2>Estado e historial de servicio</h2>
          <p>
            VehicleResponse no incluye estado actual, último ingreso ni historial. Estos datos no
            se infieren ni se inventan.
          </p>
          <Link to={`/admin/customers/${vehicle.customerId}`}>Ver Customer #{vehicle.customerId}</Link>
        </aside>
      </div>
    </section>
  );
}
