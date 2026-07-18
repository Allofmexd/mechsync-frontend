import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAdminApiErrorMessage, getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { deleteVehicle, getVehicleById, updateVehicle } from './vehiclesService';
import '../../shared/components/crudActions.css';
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
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleUpdate(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const mileage = String(data.get('currentMileage') || '').trim();
    const payload = {
      brand: String(data.get('brand') || '').trim(),
      model: String(data.get('model') || '').trim(),
      year: Number(data.get('year')),
      color: String(data.get('color') || '').trim() || null,
      licensePlate: String(data.get('licensePlate') || '').trim(),
      vin: String(data.get('vin') || '').trim() || null,
      currentMileage: mileage ? Number(mileage) : null,
    };
    setWorking('update'); setActionError(''); setSuccess('');
    try { const response = await updateVehicle(id, payload); setVehicle(response?.data ?? response); setEditing(false); setSuccess('Vehículo actualizado correctamente.'); }
    catch (requestError) { setActionError(getAdminApiErrorMessage(requestError, 'actualizar el vehículo')); }
    finally { setWorking(''); }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar este vehículo? La API lo rechazará si conserva ingresos asociados.')) return;
    setWorking('delete'); setActionError(''); setSuccess('');
    try { await deleteVehicle(id); navigate('/admin/vehicles', { replace: true }); }
    catch (requestError) { setActionError(getAdminApiErrorMessage(requestError, 'eliminar el vehículo')); setWorking(''); }
  }

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
        <div className="crud-heading-actions"><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditing((value) => !value)} disabled={Boolean(working)}>Editar</button><button className="admin-button crud-button--danger" type="button" onClick={handleDelete} disabled={Boolean(working)}>{working === 'delete' ? 'Eliminando...' : 'Eliminar'}</button><Link className="admin-button admin-button--primary" to={`/admin/vehicle-intakes/new?vehicleId=${vehicle.id}`}>Nuevo ingreso</Link></div>
      </div>

      {actionError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{actionError}</p></div>}
      {success && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>{success}</p></div>}
      {editing && <form className="crud-editor" onSubmit={handleUpdate}><header><h2>Editar vehículo</h2><p>El Customer propietario permanece inmutable.</p></header><div className="crud-fields"><label className="crud-field"><span>Marca *</span><input name="brand" maxLength="80" defaultValue={vehicle.brand} required disabled={Boolean(working)} /></label><label className="crud-field"><span>Modelo *</span><input name="model" maxLength="80" defaultValue={vehicle.model} required disabled={Boolean(working)} /></label><label className="crud-field"><span>Año *</span><input name="year" type="number" min="1900" max={new Date().getFullYear() + 1} defaultValue={vehicle.year} required disabled={Boolean(working)} /></label><label className="crud-field"><span>Color</span><input name="color" maxLength="50" defaultValue={vehicle.color ?? ''} disabled={Boolean(working)} /></label><label className="crud-field"><span>Placa *</span><input name="licensePlate" maxLength="20" defaultValue={vehicle.licensePlate} required disabled={Boolean(working)} /></label><label className="crud-field"><span>VIN</span><input name="vin" maxLength="100" defaultValue={vehicle.vin ?? ''} disabled={Boolean(working)} /></label><label className="crud-field"><span>Kilometraje</span><input name="currentMileage" type="number" min="0" step="1" defaultValue={vehicle.currentMileage ?? ''} disabled={Boolean(working)} /></label></div><footer><button className="admin-button admin-button--primary" type="submit" disabled={Boolean(working)}>{working === 'update' ? 'Guardando...' : 'Guardar cambios'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditing(false)} disabled={Boolean(working)}>Cancelar</button></footer></form>}

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
