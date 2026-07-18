import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAdminApiErrorMessage, getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getVehicleIntakeStatuses } from '../catalogs/catalogsService';
import { getTechnicians } from '../technicians/techniciansService';
import { getVehicleById } from '../vehicles/vehiclesService';
import { deleteVehicleIntake, getVehicleIntakeById, updateVehicleIntake } from './vehicleIntakesService';
import '../../shared/components/crudActions.css';
import './vehicleIntakes.css';

function unwrapCollection(response) {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.content ?? [];
}

function formatDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

function dateTimeInputValue(value) {
  return value ? String(value).slice(0, 16) : '';
}

export default function VehicleIntakeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intake, setIntake] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleUpdate(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const technicianId = String(data.get('technicianId') || '');
    const mileage = String(data.get('intakeMileage') || '').trim();
    const payload = {
      technicianId: technicianId ? Number(technicianId) : null,
      intakeDate: String(data.get('intakeDate') || '').trim() || null,
      intakeMileage: mileage ? Number(mileage) : null,
      reportedProblem: String(data.get('reportedProblem') || '').trim(),
      initialObservations: String(data.get('initialObservations') || '').trim() || null,
      statusId: Number(data.get('statusId')),
    };
    setWorking('update'); setActionError(''); setSuccess('');
    try { const response = await updateVehicleIntake(id, payload); setIntake(response?.data ?? response); setEditing(false); setSuccess('Ingreso actualizado correctamente.'); }
    catch (requestError) { setActionError(getAdminApiErrorMessage(requestError, 'actualizar el ingreso')); }
    finally { setWorking(''); }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar este ingreso? La API lo rechazará si tiene Work Orders asociadas.')) return;
    setWorking('delete'); setActionError(''); setSuccess('');
    try { await deleteVehicleIntake(id); navigate('/admin/vehicle-intakes', { replace: true }); }
    catch (requestError) { setActionError(getAdminApiErrorMessage(requestError, 'eliminar el ingreso')); setWorking(''); }
  }

  useEffect(() => {
    let active = true;
    async function loadDetail() {
      try {
        const [intakeResponse, statusesResponse, techniciansResponse] = await Promise.all([
          getVehicleIntakeById(id),
          getVehicleIntakeStatuses(),
          getTechnicians(),
        ]);
        const nextIntake = intakeResponse?.data ?? intakeResponse;
        let nextVehicle = null;
        if (nextIntake?.vehicleId) {
          try {
            const vehicleResponse = await getVehicleById(nextIntake.vehicleId);
            nextVehicle = vehicleResponse?.data ?? vehicleResponse;
          } catch {
            nextVehicle = null;
          }
        }
        if (active) {
          setIntake(nextIntake);
          setVehicle(nextVehicle);
          setStatuses(unwrapCollection(statusesResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'No fue posible cargar el ingreso solicitado.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDetail();
    return () => { active = false; };
  }, [id]);

  const status = useMemo(() => statuses.find((item) => String(item.id) === String(intake?.statusId)), [intake?.statusId, statuses]);
  const technician = useMemo(() => technicians.find((item) => String(item.id) === String(intake?.technicianId)), [intake?.technicianId, technicians]);
  const technicianName = technician?.fullName || [technician?.firstName, technician?.lastName].filter(Boolean).join(' ') || (intake?.technicianId ? `Técnico #${intake.technicianId}` : 'Sin técnico asignado');

  if (loading) return <div className="intake-management-state">Cargando detalle del ingreso...</div>;
  if (error) return <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>;
  if (!intake) return <div className="intake-management-state">Ingreso no encontrado.</div>;

  return (
    <section className="intake-detail-page">
      <div className="admin-breadcrumb"><Link to="/admin/vehicle-intakes">Ingresos</Link><span>›</span><strong>ING-{intake.id}</strong></div>
      <div className="intake-management-heading">
        <div><p className="admin-eyebrow">Ingreso ING-{intake.id}</p><h1>Detalle de ingreso de vehículo</h1><p>Información registrada al recibir el vehículo en el taller.</p></div>
        <div className="crud-heading-actions"><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditing((value) => !value)} disabled={Boolean(working)}>Editar</button><button className="admin-button crud-button--danger" type="button" onClick={handleDelete} disabled={Boolean(working)}>{working === 'delete' ? 'Eliminando...' : 'Eliminar'}</button><Link className="admin-button admin-button--primary" to={`/admin/work-orders/new?vehicleIntakeId=${intake.id}`}>Crear orden</Link></div>
      </div>

      {actionError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{actionError}</p></div>}
      {success && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>{success}</p></div>}
      {editing && <form className="crud-editor" onSubmit={handleUpdate}><header><h2>Editar ingreso</h2><p>El vehículo relacionado permanece inmutable.</p></header><div className="crud-fields"><label className="crud-field"><span>Técnico</span><select name="technicianId" defaultValue={intake.technicianId ?? ''} disabled={Boolean(working)}><option value="">Sin técnico</option>{technicians.map((item) => <option key={item.id} value={item.id}>{item.fullName || `${item.firstName} ${item.lastName}`}</option>)}</select></label><label className="crud-field"><span>Estado *</span><select name="statusId" defaultValue={intake.statusId} required disabled={Boolean(working)}>{statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="crud-field"><span>Fecha de ingreso</span><input name="intakeDate" type="datetime-local" defaultValue={dateTimeInputValue(intake.intakeDate)} disabled={Boolean(working)} /></label><label className="crud-field"><span>Kilometraje</span><input name="intakeMileage" type="number" min="0" step="1" defaultValue={intake.intakeMileage ?? ''} disabled={Boolean(working)} /></label><label className="crud-field crud-field--wide"><span>Problema reportado *</span><textarea name="reportedProblem" defaultValue={intake.reportedProblem} required disabled={Boolean(working)} /></label><label className="crud-field crud-field--wide"><span>Observaciones iniciales</span><textarea name="initialObservations" defaultValue={intake.initialObservations ?? ''} disabled={Boolean(working)} /></label></div><footer><button className="admin-button admin-button--primary" type="submit" disabled={Boolean(working)}>{working === 'update' ? 'Guardando...' : 'Guardar cambios'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditing(false)} disabled={Boolean(working)}>Cancelar</button></footer></form>}

      <div className="intake-detail-grid">
        <article className="intake-detail-card intake-detail-card--vehicle">
          <span>Vehículo</span><h2>{vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehículo #${intake.vehicleId}`}</h2>
          <dl><div><dt>Placa</dt><dd>{vehicle?.licensePlate || 'Dato no disponible'}</dd></div><div><dt>VIN</dt><dd>{vehicle?.vin || 'Dato no disponible'}</dd></div><div><dt>Cliente</dt><dd>{vehicle?.customerId ? `Cliente #${vehicle.customerId}` : 'Dato no disponible'}</dd></div><div><dt>Kilometraje</dt><dd>{intake.intakeMileage?.toLocaleString('es-MX') ?? 'Dato no disponible'} km</dd></div></dl>
        </article>
        <article className="intake-detail-card">
          <span>Seguimiento</span>
          <dl><div><dt>Estado</dt><dd><span className="intake-status-badge">{status?.name || `Estado #${intake.statusId}`}</span></dd></div><div><dt>Técnico</dt><dd>{technicianName}</dd></div><div><dt>Fecha de ingreso</dt><dd>{formatDate(intake.intakeDate)}</dd></div><div><dt>Actualización</dt><dd>{formatDate(intake.updatedAt)}</dd></div></dl>
        </article>
        <article className="intake-detail-card intake-detail-card--wide"><span>Problema reportado</span><p>{intake.reportedProblem}</p></article>
        <article className="intake-detail-card intake-detail-card--wide"><span>Observaciones iniciales</span><p>{intake.initialObservations || 'Sin observaciones iniciales registradas.'}</p></article>
      </div>
    </section>
  );
}
