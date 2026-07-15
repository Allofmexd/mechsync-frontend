import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getUserById } from '../users/usersService';
import { getCustomerById } from './customersService';
import './customers.css';

function unwrap(response) {
  return response?.data ?? response;
}

function formatDate(value) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(date);
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
      setLoading(true);
      setError('');
      setProfileError('');

      try {
        const customerResponse = await getCustomerById(id);
        const customerData = unwrap(customerResponse);
        if (!active) return;
        setCustomer(customerData);

        try {
          const userResponse = await getUserById(customerData.userId);
          if (active) setUser(unwrap(userResponse));
        } catch (requestError) {
          if (active) {
            setProfileError(getApiErrorMessage(
              requestError,
              'No fue posible cargar los datos del usuario asociado.',
            ));
          }
        }
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError, 'No fue posible cargar el cliente.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCustomer();
    return () => {
      active = false;
    };
  }, [id]);

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : `Cliente #${id}`;

  if (loading) {
    return (
      <div className="customers-state" aria-live="polite">
        <span className="customers-loader" aria-hidden="true" />
        <p>Cargando detalle del cliente…</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <section className="customer-detail-page">
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span>
          <p>{error || 'El cliente solicitado no está disponible.'}</p>
        </div>
        <Link className="admin-button admin-button--secondary" to="/admin/customers">
          Volver a clientes
        </Link>
      </section>
    );
  }

  return (
    <section className="customer-detail-page">
      <div className="admin-breadcrumb" aria-label="Ruta actual">
        <span>Panel principal</span>
        <span aria-hidden="true">›</span>
        <Link to="/admin/customers">Clientes</Link>
        <span aria-hidden="true">›</span>
        <strong>Detalle de cliente</strong>
      </div>

      <div className="customer-detail-heading">
        <div>
          <p className="admin-eyebrow">Ficha individual</p>
          <h1>{fullName}</h1>
          <p>ID de cliente: #{customer.id} · ID de usuario: #{customer.userId}</p>
        </div>
        <div className="customer-detail-heading__actions">
          <button
            className="admin-button admin-button--secondary"
            type="button"
            disabled
            title="La edición combinada de User y Customer no forma parte de esta fase"
          >
            Editar cliente
          </button>
          <Link
            className="admin-button admin-button--primary"
            to={`/admin/vehicles/new?customerId=${customer.id}`}
          >
            Registrar vehículo
          </Link>
        </div>
      </div>

      {profileError && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span>
          <p>{profileError} Se muestran únicamente los datos disponibles de Customer.</p>
        </div>
      )}

      <div className="customer-detail-grid">
        <aside className="customer-profile-card">
          <h2>Información general</h2>
          <dl>
            <div>
              <dt>Estado de cuenta</dt>
              <dd><span className="pending-badge">Pendiente de dato</span></dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{user?.phone || 'No registrado'}</dd>
            </div>
            <div>
              <dt>Correo electrónico</dt>
              <dd>{user?.email || 'No disponible'}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{customer.address || 'No registrada'}</dd>
            </div>
            <div>
              <dt>Roles del usuario</dt>
              <dd>{user?.roles?.join(', ') || 'No disponibles'}</dd>
            </div>
            <div>
              <dt>Registrado</dt>
              <dd>{formatDate(customer.registeredAt)}</dd>
            </div>
          </dl>

          <div className="customer-advisor-note">
            <span>Nota del asesor</span>
            <strong>Pendiente de endpoint</strong>
            <p>La API no expone notas administrativas del cliente.</p>
          </div>
        </aside>

        <div className="customer-detail-content">
          <div className="customer-detail-tabs" aria-label="Secciones del cliente">
            <button type="button" className="active">Resumen</button>
            <button type="button" disabled>Vehículos</button>
            <button type="button" disabled>Historial</button>
            <button type="button" disabled>Reportes</button>
          </div>

          <div className="customer-detail-pending-grid">
            <article>
              <span>Servicios activos</span>
              <strong>Pendiente</strong>
              <small>Sin endpoint agregado por cliente</small>
            </article>
            <article>
              <span>Último servicio</span>
              <strong>Pendiente</strong>
              <small>Sin dato en CustomerResponse</small>
            </article>
            <article>
              <span>Gasto total</span>
              <strong>Pendiente</strong>
              <small>Sin endpoint de métricas</small>
            </article>
          </div>

          <div className="customer-feature-pending">
            <span className="pending-badge">Pendiente de endpoint</span>
            <h2>Vehículos, historial y reportes del cliente</h2>
            <p>
              La API todavía no ofrece consultas anidadas por Customer. No se muestran resultados
              parciales de una página global para evitar datos incompletos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
