import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getSpecialties, getTechnicianById, updateTechnician } from './techniciansService';
import './technicians.css';

function unwrap(response) { return response?.data ?? response; }
function collection(response) {
  const data = unwrap(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

function formatDateTime(value) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function TechnicianDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [technician, setTechnician] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.success || '');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [profile, specialtyList] = await Promise.all([getTechnicianById(id), getSpecialties()]);
        if (active) {
          setTechnician(unwrap(profile));
          setSpecialties(collection(specialtyList));
        }
      } catch (requestError) {
        if (active) setError(getAdminApiErrorMessage(requestError, 'cargar el perfil técnico'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const specialtyId = Number(data.get('specialtyId'));
    const hireDate = String(data.get('hireDate') || '').trim();
    if (!specialtyId) {
      setError('Selecciona una especialidad válida.');
      return;
    }
    setWorking(true);
    setError('');
    setSuccess('');
    try {
      setTechnician(unwrap(await updateTechnician(id, {
        specialtyId,
        hireDate: hireDate || null,
      })));
      setSuccess('Perfil técnico actualizado correctamente.');
    } catch (requestError) {
      setError(getAdminApiErrorMessage(requestError, 'actualizar el perfil técnico'));
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div className="directory-state">Cargando perfil técnico...</div>;
  if (!technician) return <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error || 'Perfil técnico no encontrado.'}</p></div>;

  return <section className="technician-admin-page">
    <div className="admin-breadcrumb"><Link to="/admin/technicians">Técnicos</Link><span>›</span><strong>TEC-{technician.id}</strong></div>
    <div className="directory-heading"><div><p className="admin-eyebrow">Perfil operativo</p><h1>{technician.fullName || `${technician.firstName} ${technician.lastName}`}</h1><p>{technician.email}</p></div><span className="directory-readonly">Usuario USR-{technician.userId}</span></div>
    {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
    {success && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>{success}</p></div>}
    {specialties.length === 0 && <div className="admin-alert work-order-info" role="status"><span>i</span><p>No hay especialidades disponibles. Verifica la configuración inicial del sistema.</p></div>}
    <div className="technician-admin-grid">
      <section className="technician-profile-card"><h2>Identidad</h2><dl><div><dt>ID técnico</dt><dd>TEC-{technician.id}</dd></div><div><dt>Usuario</dt><dd><Link to={`/admin/users/${technician.userId}`}>USR-{technician.userId}</Link></dd></div><div><dt>Nombre</dt><dd>{technician.fullName || `${technician.firstName} ${technician.lastName}`}</dd></div><div><dt>Correo</dt><dd>{technician.email}</dd></div><div><dt>Teléfono</dt><dd>{technician.phone || 'No registrado'}</dd></div><div><dt>Especialidad</dt><dd>{technician.specialtyName || technician.specialtyCode}</dd></div><div><dt>Contratación</dt><dd>{technician.hireDate || 'No registrada'}</dd></div><div><dt>Creado</dt><dd>{formatDateTime(technician.createdAt)}</dd></div><div><dt>Actualizado</dt><dd>{formatDateTime(technician.updatedAt)}</dd></div></dl></section>
      <form className="technician-admin-form" onSubmit={submit}><h2>Editar perfil</h2><p>La identidad del usuario permanece inmutable desde este formulario.</p><label><span>Especialidad *</span><select name="specialtyId" defaultValue={technician.specialtyId} required disabled={working}>{specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label><label><span>Fecha de contratación</span><input name="hireDate" type="date" defaultValue={technician.hireDate || ''} disabled={working} /></label><footer><button className="admin-button admin-button--primary" type="submit" disabled={working || specialties.length === 0}>{working ? 'Guardando...' : 'Guardar cambios'}</button></footer></form>
    </div>
  </section>;
}
