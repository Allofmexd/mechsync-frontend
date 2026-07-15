import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getCustomers } from './customersService';
import './customers.css';

const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function CustomersListPage() {
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState(location.state?.success || '');

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      setLoading(true);
      setError('');

      try {
        const response = await getCustomers({ page, size: PAGE_SIZE });
        if (active) {
          setPageData(response?.data ?? response);
        }
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError, 'No fue posible cargar los clientes.'));
          setPageData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCustomers();
    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  const customers = Array.isArray(pageData?.content) ? pageData.content : [];
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    if (!normalizedQuery) return customers;

    return customers.filter((customer) =>
      [customer.id, customer.userId, customer.address]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLocaleLowerCase('es').includes(normalizedQuery)),
    );
  }, [customers, query]);

  const totalElements = Number(pageData?.totalElements ?? customers.length);
  const totalPages = Number(pageData?.totalPages ?? (customers.length ? 1 : 0));
  const currentPage = Number(pageData?.page ?? page);

  return (
    <section className="customers-page">
      <div className="admin-breadcrumb" aria-label="Ruta actual">
        <span>Panel principal</span>
        <span aria-hidden="true">›</span>
        <strong>Clientes</strong>
      </div>

      {notice && (
        <div className="admin-alert admin-alert--success" role="status">
          <span aria-hidden="true">✓</span>
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice('')} aria-label="Cerrar mensaje">
            ×
          </button>
        </div>
      )}

      <div className="customers-heading">
        <div>
          <p className="admin-eyebrow">Gestión de clientes</p>
          <h1>Clientes</h1>
          <p>Consulta los perfiles de clientes registrados en MechSync.</p>
        </div>
        <Link className="admin-button admin-button--primary" to="/admin/customers/new">
          <span aria-hidden="true">＋</span>
          Nuevo cliente
        </Link>
      </div>

      <div className="customers-stats" aria-label="Resumen del listado">
        <article>
          <span>Total de clientes</span>
          <strong>{loading ? '…' : totalElements}</strong>
          <small>Dato reportado por la API</small>
        </article>
        <article>
          <span>Página actual</span>
          <strong>{totalPages > 0 ? currentPage + 1 : 0}</strong>
          <small>de {totalPages} páginas</small>
        </article>
        <article>
          <span>Registros por página</span>
          <strong>{Number(pageData?.size ?? PAGE_SIZE)}</strong>
          <small>Paginación del backend</small>
        </article>
      </div>

      <div className="customers-panel">
        <div className="customers-toolbar">
          <label className="customers-search">
            <span className="sr-only">Buscar en esta página</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por ID, usuario o dirección"
            />
          </label>
          <button
            className="admin-button admin-button--secondary"
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>

        {error && (
          <div className="admin-alert admin-alert--error" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="customers-state" aria-live="polite">
            <span className="customers-loader" aria-hidden="true" />
            <p>Cargando clientes…</p>
          </div>
        ) : !error && customers.length === 0 ? (
          <div className="customers-state">
            <strong>Aún no hay clientes registrados</strong>
            <p>Crea el primer usuario con rol CLIENTE y su perfil de cliente.</p>
            <Link className="admin-button admin-button--primary" to="/admin/customers/new">
              Registrar cliente
            </Link>
          </div>
        ) : !error ? (
          <>
            <div className="customers-table-wrap">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ID cliente</th>
                    <th>ID usuario</th>
                    <th>Dirección</th>
                    <th>Fecha de registro</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td><strong>#{customer.id}</strong></td>
                      <td>#{customer.userId}</td>
                      <td>{customer.address || 'Sin dirección'}</td>
                      <td>{formatDate(customer.registeredAt)}</td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>
                        <Link className="table-action-link" to={`/admin/customers/${customer.id}`}>
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="customers-filter-empty">
                No hay coincidencias en la página actual.
              </div>
            )}

            <div className="customers-pagination">
              <p>
                Mostrando {filteredCustomers.length} de {customers.length} registros en esta página
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  disabled={loading || currentPage <= 0}
                >
                  Anterior
                </button>
                <span>{totalPages > 0 ? currentPage + 1 : 0} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={loading || totalPages === 0 || currentPage >= totalPages - 1}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
