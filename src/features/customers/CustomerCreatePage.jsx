import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getUsers } from '../users/usersService';
import { createCustomer, getCustomers } from './customersService';
import './customers.css';

const LOOKUP_PAGE_SIZE = 20;

function readData(response) {
  return response?.data ?? response;
}

function readPage(response) {
  const data = readData(response) ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];
  return {
    content,
    totalPages: Number(data.totalPages ?? (content.length ? 1 : 0)),
  };
}

async function loadAllPages(fetchPage) {
  const firstPage = readPage(await fetchPage(0));
  if (firstPage.totalPages <= 1) return firstPage.content;

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.totalPages - 1 },
      (_, index) => fetchPage(index + 1),
    ),
  );
  return [
    ...firstPage.content,
    ...remainingPages.flatMap((response) => readPage(response).content),
  ];
}

function roleValue(role) {
  return String(typeof role === 'string' ? role : role?.code ?? role?.name ?? '')
    .replace(/^ROLE_/, '')
    .toUpperCase();
}

function hasClientRole(user) {
  return (user?.roles ?? []).some((role) => roleValue(role) === 'CLIENTE');
}

function fullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Nombre no registrado';
}

function userOptionLabel(user) {
  return [fullName(user), user?.email, user?.phone].filter(Boolean).join(' — ');
}

function getCustomerCreationError(requestError) {
  const message = String(requestError?.message ?? '').toLocaleLowerCase('es');
  if (message.includes('rol') || message.includes('role')) {
    return 'El usuario seleccionado no tiene el rol CLIENTE.';
  }
  if (requestError?.status === 409 || message.includes('already') || message.includes('ya tiene')) {
    return 'El usuario seleccionado ya está asociado a un cliente.';
  }
  return getApiErrorMessage(requestError, 'No fue posible crear el perfil de cliente.');
}

export default function CustomerCreatePage() {
  const formRef = useRef(null);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function loadEligibleUsers() {
      setLoading(true);
      setLoadError('');
      try {
        const [users, customers] = await Promise.all([
          loadAllPages((page) => getUsers({ page, size: LOOKUP_PAGE_SIZE })),
          loadAllPages((page) => getCustomers({ page, size: LOOKUP_PAGE_SIZE })),
        ]);
        const associatedUserIds = new Set(customers.map((customer) => Number(customer.userId)));
        const available = users
          .filter((user) => hasClientRole(user) && !associatedUserIds.has(Number(user.id)))
          .sort((left, right) => String(left.email ?? '').localeCompare(String(right.email ?? ''), 'es'));
        if (active) {
          setEligibleUsers(available);
          setSelectedUserId('');
        }
      } catch (requestError) {
        if (active) {
          setEligibleUsers([]);
          setLoadError(getApiErrorMessage(
            requestError,
            'No fue posible cargar los usuarios disponibles.',
          ));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadEligibleUsers();
    return () => { active = false; };
  }, [reloadKey]);

  const visibleUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return eligibleUsers;
    return eligibleUsers.filter((user) => [
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
    ].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalized));
  }, [eligibleUsers, query]);

  const selectedUser = eligibleUsers.find((user) => String(user.id) === selectedUserId);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedUser || !hasClientRole(selectedUser)) {
      setError('Selecciona un usuario con rol CLIENTE disponible.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const address = String(form.get('address') ?? '').trim();
    setSubmitting(true);
    try {
      await createCustomer({
        userId: Number(selectedUser.id),
        address: address || null,
      });
      formRef.current?.reset();
      setSelectedUserId('');
      setQuery('');
      setSuccess('El usuario quedó asociado correctamente a su perfil de cliente.');
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setError(getCustomerCreationError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="customer-create-page">
      <div className="admin-breadcrumb" aria-label="Ruta actual">
        <span>Panel principal</span><span aria-hidden="true">›</span>
        <Link to="/admin/customers">Clientes</Link><span aria-hidden="true">›</span>
        <strong>Registrar cliente</strong>
      </div>

      <div className="customers-heading customer-create-heading">
        <div>
          <p className="admin-eyebrow">Gestión de clientes</p>
          <h1>Registrar cliente</h1>
          <p>Asocia una cuenta con rol CLIENTE que todavía no tenga perfil.</p>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error" role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
      {success && <div className="admin-alert admin-alert--success" role="status"><span aria-hidden="true">✓</span><p><strong>Cliente registrado.</strong> {success}</p><Link to="/admin/customers">Ver clientes</Link></div>}

      <div className="customer-create-grid">
        <form ref={formRef} className="customer-form" onSubmit={handleSubmit}>
          <div className="customer-form__header">
            <div><h2>Usuario y dirección</h2><p>Los datos de Usuario son de solo lectura.</p></div>
            <span className="customer-role-badge">Rol: CLIENTE</span>
          </div>

          <fieldset disabled={submitting || loading}>
            <legend className="sr-only">Datos del usuario y cliente</legend>
            <div className="customer-form__grid">
              <label className="customer-form__full">
                <span>Buscar usuario</span>
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, correo o teléfono" autoComplete="off" />
              </label>
              <label className="customer-form__full">
                <span>Usuario con rol CLIENTE *</span>
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required>
                  <option value="">Selecciona un usuario</option>
                  {visibleUsers.map((user) => (
                    <option key={user.id} value={user.id}>{userOptionLabel(user)}</option>
                  ))}
                </select>
              </label>

              {loading && <p className="customer-form__full customer-form__state" role="status">Cargando usuarios disponibles…</p>}
              {!loading && loadError && <div className="customer-form__full customer-form__inline-error" role="alert"><span>{loadError}</span><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button></div>}
              {!loading && !loadError && eligibleUsers.length === 0 && (
                <div className="customer-form__full customer-form__empty">
                  <p>No hay usuarios con rol CLIENTE disponibles para asociar.</p>
                  <Link to="/admin/users/new">Registrar usuario</Link>
                </div>
              )}
              {!loading && !loadError && eligibleUsers.length > 0 && visibleUsers.length === 0 && <p className="customer-form__full customer-form__state">No hay usuarios que coincidan con la búsqueda.</p>}

              {selectedUser && (
                <section className="customer-form__full customer-user-summary" aria-label="Resumen del usuario seleccionado">
                  <h3>Usuario seleccionado</h3>
                  <dl>
                    <div><dt>Nombre completo</dt><dd>{fullName(selectedUser)}</dd></div>
                    <div><dt>Correo</dt><dd>{selectedUser.email || 'Sin correo registrado'}</dd></div>
                    <div><dt>Teléfono</dt><dd>{selectedUser.phone || 'Sin teléfono registrado'}</dd></div>
                    <div><dt>Rol</dt><dd>{(selectedUser.roles ?? []).map(roleValue).filter(Boolean).join(', ') || 'Sin rol registrado'}</dd></div>
                  </dl>
                </section>
              )}

              <label className="customer-form__full">
                <span>Dirección <small>(opcional)</small></span>
                <textarea name="address" maxLength="255" rows="3" autoComplete="street-address" placeholder="Calle, número, colonia, ciudad" />
              </label>
            </div>
          </fieldset>

          <div className="customer-form__actions">
            <Link className="admin-button admin-button--secondary" to="/admin/customers">Cancelar</Link>
            <button className="admin-button admin-button--primary" type="submit" disabled={submitting || loading || Boolean(loadError) || !selectedUser}>
              {submitting ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </div>
        </form>

        <aside className="customer-create-help">
          <div className="customer-create-help__dark">
            <span aria-hidden="true">i</span><h2>Antes de asociar</h2>
            <p>La cuenta debe existir y tener el rol CLIENTE. Si aún no existe, regístrala desde el módulo de Usuarios.</p>
            <Link to="/admin/users/new">Ir a registrar usuario</Link>
          </div>
          <div className="customer-create-help__card"><span>Seguridad</span><strong>Asociación controlada</strong><p>El backend valida el usuario, su rol y que no tenga otro perfil de cliente.</p></div>
        </aside>
      </div>
    </section>
  );
}
