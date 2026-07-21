import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getUsers } from '../users/usersService';
import { createTechnician, getSpecialties, getTechnicians } from './techniciansService';
import './technicians.css';

function unwrap(response) { return response?.data ?? response; }
function collection(response) {
  const data = unwrap(response) ?? {};
  return Array.isArray(data) ? data : data.content ?? [];
}

async function loadAllUsers() {
  const first = unwrap(await getUsers({ page: 0, size: 100 })) ?? {};
  const content = Array.isArray(first) ? first : first.content ?? [];
  const totalPages = Number(first.totalPages ?? (content.length ? 1 : 0));
  if (totalPages <= 1) return content;
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => getUsers({ page: index + 1, size: 100 })),
  );
  return [...content, ...rest.flatMap(collection)];
}

export default function TechnicianCreatePage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [loadedUsers, loadedTechnicians, loadedSpecialties] = await Promise.all([
          loadAllUsers(),
          getTechnicians(),
          getSpecialties(),
        ]);
        if (active) {
          setUsers(loadedUsers);
          setTechnicians(collection(loadedTechnicians));
          setSpecialties(collection(loadedSpecialties));
        }
      } catch (requestError) {
        if (active) setError(getAdminApiErrorMessage(requestError, 'cargar usuarios y especialidades disponibles'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const availableUsers = useMemo(() => {
    const profiled = new Set(technicians.map((item) => Number(item.userId)));
    return users.filter((user) => (user.roles ?? []).map(String)
      .some((role) => role.replace(/^ROLE_/, '') === 'TECNICO')
      && !profiled.has(Number(user.id)));
  }, [technicians, users]);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const userId = Number(data.get('userId'));
    const specialtyId = Number(data.get('specialtyId'));
    if (!userId || !specialtyId) {
      setError('Selecciona un usuario TECNICO sin perfil y una especialidad disponible.');
      return;
    }
    const hireDate = String(data.get('hireDate') || '').trim();
    setSubmitting(true);
    setError('');
    try {
      const created = unwrap(await createTechnician({
        userId,
        specialtyId,
        ...(hireDate ? { hireDate } : {}),
      }));
      navigate(`/admin/technicians/${created.id}`, {
        replace: true,
        state: { success: 'Perfil técnico creado correctamente.' },
      });
    } catch (requestError) {
      setError(getAdminApiErrorMessage(requestError, 'crear el perfil técnico'));
    } finally {
      setSubmitting(false);
    }
  }

  const blocked = loading || submitting || availableUsers.length === 0 || specialties.length === 0;

  return <section className="technician-admin-page">
    <div className="admin-breadcrumb"><Link to="/admin/technicians">Técnicos</Link><span>›</span><strong>Nuevo perfil</strong></div>
    <div className="directory-heading"><div><p className="admin-eyebrow">Perfil operativo</p><h1>Crear perfil técnico</h1><p>Vincula un usuario con rol TECNICO a una especialidad existente.</p></div></div>
    {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
    {!loading && specialties.length === 0 && <div className="admin-alert work-order-info" role="status"><span>i</span><p>No hay especialidades disponibles. Verifica la configuración inicial del sistema.</p></div>}
    {!loading && availableUsers.length === 0 && <div className="admin-alert work-order-info" role="status"><span>i</span><p>No hay usuarios con rol TECNICO pendientes de perfil.</p></div>}
    <form className="technician-admin-form" onSubmit={submit}>
      <label><span>Usuario TECNICO *</span><select name="userId" required disabled={blocked}><option value="">Selecciona un usuario</option>{availableUsers.map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} · {user.email}</option>)}</select></label>
      <label><span>Especialidad *</span><select name="specialtyId" required disabled={blocked}><option value="">Selecciona una especialidad</option>{specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label>
      <label><span>Fecha de contratación</span><input name="hireDate" type="date" disabled={submitting} /></label>
      <footer><button className="admin-button admin-button--primary" type="submit" disabled={blocked}>{submitting ? 'Creando...' : 'Crear perfil'}</button><Link className="admin-button admin-button--secondary" to="/admin/technicians">Cancelar</Link></footer>
    </form>
  </section>;
}
