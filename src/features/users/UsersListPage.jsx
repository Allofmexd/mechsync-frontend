import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getUsers } from './usersService';
import './users.css';

const PAGE_SIZE = 20;

function unwrapPage(response) {
  const data = response?.data ?? response ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];
  return {
    content,
    page: Number(data.page ?? 0),
    totalElements: Number(data.totalElements ?? content.length),
    totalPages: Number(data.totalPages ?? (content.length ? 1 : 0)),
  };
}

export default function UsersListPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [page, setPage] = useState({ content: [], page: 0, totalElements: 0, totalPages: 0 });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = unwrapPage(await getUsers({ page: pageIndex, size: PAGE_SIZE }));
        if (active) setPage(result);
      } catch (requestError) {
        if (active) setError(getAdminApiErrorMessage(requestError, 'cargar los usuarios'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [pageIndex]);

  const users = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return page.content;
    return page.content.filter((user) => [user.id, user.firstName, user.lastName, user.email, ...(user.roles ?? [])]
      .filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalized));
  }, [page.content, query]);

  return <section className="users-page">
    <div className="admin-breadcrumb"><span>Administración</span><span>›</span><strong>Usuarios</strong></div>
    <div className="users-heading"><div><p className="admin-eyebrow">Cuentas y acceso</p><h1>Usuarios</h1><p>Administración real de cuentas; nunca se muestran contraseñas ni hashes.</p></div><Link className="admin-button admin-button--primary" to="/admin/users/new">＋ Crear usuario</Link></div>
    <div className="users-summary"><article><span>Total</span><strong>{page.totalElements}</strong><small>Reportado por la API</small></article><article><span>Página</span><strong>{page.totalPages ? page.page + 1 : 0}</strong><small>de {page.totalPages}</small></article></div>
    <section className="users-panel"><div className="users-toolbar"><label>Buscar en esta página<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, correo, rol o ID" /></label></div>
      {error && <div className="admin-alert admin-alert--error users-alert" role="alert"><span>!</span><p>{error}</p></div>}
      {loading ? <div className="users-state">Cargando usuarios...</div> : !error && page.content.length === 0 ? <div className="users-state">No hay usuarios registrados.</div> : !error && <><div className="users-table-wrap"><table className="users-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Teléfono</th><th>Roles</th><th>Acción</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.firstName} {user.lastName}</strong><small>USR-{user.id}</small></td><td>{user.email}</td><td>{user.phone || 'No registrado'}</td><td><div className="users-roles">{(user.roles ?? []).map((role) => <span key={role}>{role}</span>)}</div></td><td><Link className="table-action-link" to={`/admin/users/${user.id}`}>Administrar</Link></td></tr>)}</tbody></table></div>{users.length === 0 && <div className="users-state">Sin coincidencias en esta página.</div>}{page.totalPages > 1 && <div className="users-pagination"><span>Página {page.page + 1} de {page.totalPages}</span><div><button type="button" disabled={page.page <= 0} onClick={() => setPageIndex((value) => value - 1)}>Anterior</button><button type="button" disabled={page.page + 1 >= page.totalPages} onClick={() => setPageIndex((value) => value + 1)}>Siguiente</button></div></div>}</>}
    </section>
  </section>;
}
