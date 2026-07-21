import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getTechnicians } from './techniciansService';
import '../catalogs/adminCatalogs.css';
import './technicians.css';

function unwrapCollection(response) {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.content ?? [];
}

export default function TechniciansListPage() {
  const [technicians, setTechnicians] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const items = unwrapCollection(await getTechnicians());
        if (active) setTechnicians(items);
      } catch (requestError) {
        if (active) setError(getAdminApiErrorMessage(requestError, 'cargar los técnicos'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return technicians;
    return technicians.filter((item) => [item.id, item.fullName, item.firstName, item.lastName, item.email, item.specialtyCode, item.specialtyName]
      .filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalized));
  }, [query, technicians]);

  return <section className="directory-page"><div className="admin-breadcrumb"><span>Administración</span><span>›</span><strong>Técnicos</strong></div><div className="directory-heading"><div><p className="admin-eyebrow">Directorio operativo</p><h1>Técnicos</h1><p>Perfiles operativos vinculados con usuarios de rol TECNICO.</p></div><Link className="admin-button admin-button--primary" to="/admin/technicians/new">＋ Crear perfil</Link></div>
    <section className="directory-panel"><div className="directory-toolbar"><label>Buscar<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, correo o especialidad" /></label></div>{error && <div className="admin-alert admin-alert--error directory-alert" role="alert"><span>!</span><p>{error}</p></div>}{loading ? <div className="directory-state">Cargando técnicos...</div> : !error && technicians.length === 0 ? <div className="directory-state">No hay técnicos registrados.</div> : !error && <div className="directory-grid">{filtered.map((technician) => <article key={technician.id}><div><span>TEC-{technician.id}</span><strong>{technician.fullName || `${technician.firstName} ${technician.lastName}`}</strong></div><dl><div><dt>Correo</dt><dd>{technician.email}</dd></div><div><dt>Teléfono</dt><dd>{technician.phone || 'No registrado'}</dd></div><div><dt>Especialidad</dt><dd>{technician.specialtyName || technician.specialtyCode || 'No registrada'}</dd></div><div><dt>Fecha de ingreso</dt><dd>{technician.hireDate || 'No registrada'}</dd></div></dl><Link className="table-action-link" to={`/admin/technicians/${technician.id}`}>Administrar perfil</Link></article>)}</div>}{!loading && !error && technicians.length > 0 && filtered.length === 0 && <div className="directory-state">Sin coincidencias.</div>}</section>
  </section>;
}
