import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { createUser, getUserById, getUsers } from '../users/usersService';
import { createCustomer, getCustomers } from './customersService';
import './customers.css';

const CREATE_MODES = {
  NEW: 'new',
  EXISTING: 'existing',
};

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

function hasClientRole(user) {
  return (user?.roles ?? []).some((role) => {
    const value = typeof role === 'string' ? role : role?.code ?? role?.name;
    return String(value ?? '').replace(/^ROLE_/, '').toUpperCase() === 'CLIENTE';
  });
}

function getCustomerCreationError(requestError) {
  const apiMessage = getApiErrorMessage(
    requestError,
    'No fue posible crear el perfil de cliente.',
  );
  const normalizedMessage = String(requestError?.message ?? '').toLocaleLowerCase('es');

  if (normalizedMessage.includes('rol') || normalizedMessage.includes('role')) {
    return 'El usuario seleccionado no tiene el rol CLIENTE.';
  }

  if (
    requestError?.status === 409
    || normalizedMessage.includes('already has')
    || normalizedMessage.includes('ya tiene')
    || normalizedMessage.includes('already exists')
  ) {
    return 'El usuario seleccionado ya está asociado a un cliente.';
  }

  return `No fue posible crear el perfil de cliente. ${apiMessage}`;
}

export default function CustomerCreatePage() {
  const formRef = useRef(null);
  const [mode, setMode] = useState(CREATE_MODES.NEW);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [partialCreation, setPartialCreation] = useState(false);
  const [success, setSuccess] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [existingUsersLoading, setExistingUsersLoading] = useState(false);
  const [existingUsersError, setExistingUsersError] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [eligibilityReloadKey, setEligibilityReloadKey] = useState(0);

  useEffect(() => {
    if (mode !== CREATE_MODES.EXISTING) return undefined;

    let active = true;

    async function loadEligibleUsers() {
      setExistingUsersLoading(true);
      setExistingUsersError('');

      try {
        const [users, customers] = await Promise.all([
          loadAllPages((page) => getUsers({ page, size: LOOKUP_PAGE_SIZE })),
          loadAllPages((page) => getCustomers({ page, size: LOOKUP_PAGE_SIZE })),
        ]);
        const associatedUserIds = new Set(
          customers
            .map((customer) => Number(customer.userId))
            .filter(Number.isFinite),
        );
        const availableUsers = users
          .filter((user) => hasClientRole(user) && !associatedUserIds.has(Number(user.id)))
          .sort((left, right) => String(left.email ?? '').localeCompare(String(right.email ?? ''), 'es'));

        if (active) {
          setEligibleUsers(availableUsers);
          setSelectedUserId('');
        }
      } catch (requestError) {
        if (active) {
          setEligibleUsers([]);
          setExistingUsersError(getApiErrorMessage(
            requestError,
            'No fue posible cargar los usuarios disponibles.',
          ));
        }
      } finally {
        if (active) setExistingUsersLoading(false);
      }
    }

    loadEligibleUsers();
    return () => {
      active = false;
    };
  }, [eligibilityReloadKey, mode]);

  const visibleEligibleUsers = useMemo(() => {
    const normalizedQuery = userQuery.trim().toLocaleLowerCase('es');
    if (!normalizedQuery) return eligibleUsers;

    return eligibleUsers.filter((user) => [
      user.email,
      user.firstName,
      user.lastName,
    ].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalizedQuery));
  }, [eligibleUsers, userQuery]);

  const selectedUser = eligibleUsers.find((user) => String(user.id) === selectedUserId);

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setError('');
    setPartialCreation(false);
    setSuccess('');
    setStage('');
    setSelectedUserId('');
    setUserQuery('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setPartialCreation(false);
    setSuccess('');

    const form = new FormData(event.currentTarget);
    const address = String(form.get('address') ?? '').trim();
    let userWasCreated = false;
    let creatingCustomer = false;

    try {
      let userId;

      if (mode === CREATE_MODES.NEW) {
        const firstName = String(form.get('firstName') ?? '').trim();
        const lastName = String(form.get('lastName') ?? '').trim();
        const phone = String(form.get('phone') ?? '').trim();
        const email = String(form.get('email') ?? '').trim();
        const password = form.get('password');

        setStage('Creando usuario con rol CLIENTE…');
        const userResponse = await createUser({
          firstName,
          lastName,
          phone: phone || null,
          email,
          password,
          role: 'CLIENTE',
        });

        userWasCreated = true;
        userId = readData(userResponse)?.id;

        if (userId === null || userId === undefined) {
          throw new Error('El usuario fue creado, pero la API no devolvió su identificador.');
        }
      } else {
        if (!selectedUser) {
          throw new Error('Selecciona un usuario CLIENTE disponible.');
        }

        setStage('Validando usuario seleccionado…');
        const currentUser = readData(await getUserById(selectedUser.id));
        if (!hasClientRole(currentUser)) {
          throw new Error('El usuario seleccionado no tiene el rol CLIENTE.');
        }
        userId = currentUser.id;
      }

      creatingCustomer = true;
      setStage('Creando perfil de cliente…');
      await createCustomer({
        userId,
        address: address || null,
      });

      formRef.current?.reset();
      setSelectedUserId('');
      setUserQuery('');
      setSuccess(mode === CREATE_MODES.NEW
        ? 'El usuario y su perfil quedaron asociados.'
        : 'El usuario existente quedó asociado a su perfil de cliente.');
      if (mode === CREATE_MODES.EXISTING) {
        setEligibilityReloadKey((value) => value + 1);
      }
      setStage('');
    } catch (requestError) {
      setPartialCreation(userWasCreated);
      setError(creatingCustomer
        ? getCustomerCreationError(requestError)
        : getApiErrorMessage(requestError, 'No fue posible completar el registro del cliente.'));
      setStage('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="customer-create-page">
      <div className="admin-breadcrumb" aria-label="Ruta actual">
        <span>Panel principal</span>
        <span aria-hidden="true">›</span>
        <Link to="/admin/customers">Clientes</Link>
        <span aria-hidden="true">›</span>
        <strong>Registrar cliente</strong>
      </div>

      <div className="customers-heading customer-create-heading">
        <div>
          <p className="admin-eyebrow">Gestión de clientes</p>
          <h1>Registrar cliente</h1>
          <p>Crea una cuenta nueva o asocia un usuario CLIENTE que aún no tenga perfil.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span>
          <p>
            <strong>{partialCreation ? 'Registro incompleto. ' : ''}</strong>
            {partialCreation
              ? `El usuario fue creado, pero el perfil customer no pudo completarse. ${error}`
              : error}
          </p>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert--success" role="status">
          <span aria-hidden="true">✓</span>
          <p><strong>Cliente registrado correctamente.</strong> {success}</p>
          <Link to="/admin/customers">Ver clientes</Link>
        </div>
      )}

      <div className="customer-create-grid">
        <form ref={formRef} className="customer-form" onSubmit={handleSubmit}>
          <div className="customer-form__header">
            <div>
              <h2>Información del cliente</h2>
              <p>Selecciona cómo deseas crear el perfil.</p>
            </div>
            <span className="customer-role-badge">Rol: CLIENTE</span>
          </div>

          <fieldset className="customer-mode-selector" disabled={submitting}>
            <legend>Tipo de registro</legend>
            <label>
              <input
                type="radio"
                name="createMode"
                value={CREATE_MODES.NEW}
                checked={mode === CREATE_MODES.NEW}
                onChange={() => handleModeChange(CREATE_MODES.NEW)}
              />
              <span><strong>Crear usuario nuevo</strong><small>Registra la cuenta y después el perfil Customer.</small></span>
            </label>
            <label>
              <input
                type="radio"
                name="createMode"
                value={CREATE_MODES.EXISTING}
                checked={mode === CREATE_MODES.EXISTING}
                onChange={() => handleModeChange(CREATE_MODES.EXISTING)}
              />
              <span><strong>Asociar usuario existente</strong><small>Usa una cuenta CLIENTE que todavía no tenga perfil.</small></span>
            </label>
          </fieldset>

          <fieldset disabled={submitting || existingUsersLoading}>
            <legend className="sr-only">Datos del usuario y cliente</legend>
            <div className="customer-form__grid">
              {mode === CREATE_MODES.NEW ? (
                <>
                  <label>
                    <span>Nombre *</span>
                    <input name="firstName" type="text" maxLength="100" autoComplete="given-name" required placeholder="Ej. Juan" />
                  </label>
                  <label>
                    <span>Apellido *</span>
                    <input name="lastName" type="text" maxLength="100" autoComplete="family-name" required placeholder="Ej. Pérez" />
                  </label>
                  <label>
                    <span>Teléfono <small>(opcional)</small></span>
                    <input name="phone" type="tel" maxLength="20" autoComplete="tel" placeholder="Ej. 961 000 0000" />
                  </label>
                  <label>
                    <span>Correo electrónico *</span>
                    <input name="email" type="email" maxLength="150" autoComplete="email" required placeholder="cliente@ejemplo.com" />
                  </label>
                  <label className="customer-form__full">
                    <span>Contraseña temporal *</span>
                    <input
                      name="password"
                      type="password"
                      minLength="8"
                      maxLength="200"
                      autoComplete="new-password"
                      required
                      placeholder="Mínimo 8 caracteres"
                    />
                    <small>Se envía únicamente al backend y no se guarda en el navegador.</small>
                  </label>
                </>
              ) : (
                <>
                  <label className="customer-form__full">
                    <span>Buscar por correo o nombre</span>
                    <input
                      type="search"
                      value={userQuery}
                      onChange={(event) => setUserQuery(event.target.value)}
                      placeholder="cliente@ejemplo.com"
                      autoComplete="off"
                    />
                  </label>
                  <label className="customer-form__full">
                    <span>Usuario CLIENTE disponible *</span>
                    <select
                      value={selectedUserId}
                      onChange={(event) => setSelectedUserId(event.target.value)}
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {visibleEligibleUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} — {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                    <small>Solo se muestran usuarios con rol CLIENTE y sin perfil Customer.</small>
                  </label>
                  {existingUsersLoading && (
                    <p className="customer-form__full customer-form__state" role="status">
                      Cargando usuarios disponibles…
                    </p>
                  )}
                  {!existingUsersLoading && existingUsersError && (
                    <div className="customer-form__full customer-form__inline-error" role="alert">
                      <span>{existingUsersError}</span>
                      <button type="button" onClick={() => setEligibilityReloadKey((value) => value + 1)}>
                        Reintentar
                      </button>
                    </div>
                  )}
                  {!existingUsersLoading && !existingUsersError && eligibleUsers.length === 0 && (
                    <p className="customer-form__full customer-form__state">
                      No hay usuarios CLIENTE pendientes de asociar.
                    </p>
                  )}
                  {!existingUsersLoading && !existingUsersError && eligibleUsers.length > 0 && visibleEligibleUsers.length === 0 && (
                    <p className="customer-form__full customer-form__state">
                      No hay usuarios que coincidan con la búsqueda.
                    </p>
                  )}
                </>
              )}

              <label className="customer-form__full">
                <span>Dirección <small>(opcional)</small></span>
                <textarea name="address" maxLength="255" rows="3" autoComplete="street-address" placeholder="Calle, número, colonia, ciudad" />
              </label>
            </div>
          </fieldset>

          {stage && <p className="customer-form__progress" role="status">{stage}</p>}

          <div className="customer-form__actions">
            <Link className="admin-button admin-button--secondary" to="/admin/customers">
              Cancelar
            </Link>
            <button
              className="admin-button admin-button--primary"
              type="submit"
              disabled={submitting || existingUsersLoading || Boolean(existingUsersError)}
            >
              {submitting ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </div>
        </form>

        <aside className="customer-create-help">
          <div className="customer-create-help__dark">
            <span aria-hidden="true">i</span>
            <h2>Proceso de registro</h2>
            {mode === CREATE_MODES.NEW ? (
              <>
                <ol>
                  <li>Se crea un usuario con rol CLIENTE.</li>
                  <li>Se usa el ID devuelto para crear el perfil customer.</li>
                </ol>
                <p>Si el segundo paso falla, el usuario permanece creado y no se realiza un rollback automático.</p>
              </>
            ) : (
              <>
                <ol>
                  <li>Se selecciona una cuenta CLIENTE disponible.</li>
                  <li>Se crea únicamente su perfil customer.</li>
                </ol>
                <p>En este modo no se solicita ni se envía una contraseña.</p>
              </>
            )}
          </div>
          <div className="customer-create-help__card">
            <span>Seguridad</span>
            <strong>Acceso administrativo</strong>
            <p>El backend valida el JWT y el rol ADMINISTRADOR en ambos endpoints.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
