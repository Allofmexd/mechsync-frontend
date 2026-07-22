import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getCustomers } from '../customers/customersService';
import { getUsers } from '../users/usersService';
import { createVehicle } from './vehiclesService';
import './vehicles.css';

const MAX_YEAR = new Date().getFullYear() + 1;

function readData(response) {
  return response?.data ?? response ?? {};
}

function readContent(response) {
  const data = readData(response);
  return Array.isArray(data) ? data : data.content ?? [];
}

async function loadAllUsers() {
  const firstResponse = await getUsers({ page: 0, size: 100 });
  const firstPage = readData(firstResponse);
  const content = readContent(firstResponse);
  const totalPages = Number(firstPage.totalPages ?? (content.length ? 1 : 0));
  if (totalPages <= 1) return content;
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => (
      getUsers({ page: index + 1, size: 100 })
    )),
  );
  return [...content, ...remaining.flatMap(readContent)];
}

function fullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ');
}

function customerLabel(user) {
  return [fullName(user), user?.email, user?.phone].filter(Boolean).join(' — ')
    || 'Cliente sin datos de contacto';
}

export default function VehicleCreatePage() {
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [usersById, setUsersById] = useState(new Map());
  const [selectedCustomerId, setSelectedCustomerId] = useState(searchParams.get('customerId') || '');
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersWarning, setCustomersWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdVehicle, setCreatedVehicle] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getCustomers({ page: 0, size: 100 }),
      loadAllUsers(),
    ])
      .then(([response, users]) => {
        if (!active) return;
        const data = readData(response);
        setCustomers(Array.isArray(data?.content) ? data.content : []);
        setUsersById(new Map(users.map((user) => [Number(user.id), user])));
        if (Number(data?.totalPages ?? 0) > 1) {
          setCustomersWarning('El selector muestra los primeros 100 clientes disponibles.');
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(getApiErrorMessage(requestError, 'No fue posible cargar los clientes.'));
        }
      })
      .finally(() => {
        if (active) setLoadingCustomers(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === selectedCustomerId,
  );
  const selectedUser = selectedCustomer
    ? usersById.get(Number(selectedCustomer.userId))
    : null;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setCreatedVehicle(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await createVehicle({
        customerId: Number(selectedCustomerId),
        brand: String(form.get('brand')).trim(),
        model: String(form.get('model')).trim(),
        year: Number(form.get('year')),
        color: String(form.get('color')).trim() || null,
        licensePlate: String(form.get('licensePlate')).trim(),
        vin: String(form.get('vin')).trim() || null,
        currentMileage: form.get('currentMileage') === ''
          ? null
          : Number(form.get('currentMileage')),
      });
      setCreatedVehicle(response?.data ?? response);
      formRef.current?.reset();
      setSelectedCustomerId('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No fue posible registrar el vehículo.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="vehicle-create-page">
      <div className="admin-breadcrumb">
        <span>Panel principal</span><span>›</span>
        <Link to="/admin/vehicles">Vehículos</Link><span>›</span>
        <strong>Nuevo vehículo</strong>
      </div>

      <div className="vehicles-heading">
        <div>
          <p className="admin-eyebrow">Gestión de vehículos</p>
          <h1>Registrar vehículo</h1>
          <p>Asocia el vehículo a un cliente existente.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span><p>{error}</p>
        </div>
      )}
      {createdVehicle && (
        <div className="admin-alert admin-alert--success" role="status">
          <span aria-hidden="true">✓</span>
          <p>Vehículo registrado correctamente.</p>
          <Link to={`/admin/vehicles/${createdVehicle.id}`}>Ver detalle</Link>
        </div>
      )}

      <form ref={formRef} className="vehicle-form" onSubmit={handleSubmit}>
        <div className="vehicle-form__header">
          <div>
            <h2>Datos del vehículo</h2>
            <p>Los campos marcados con * son obligatorios.</p>
          </div>
        </div>
        <fieldset disabled={submitting || loadingCustomers}>
          <div className="vehicle-form__grid">
            <label className="vehicle-form__full">
              <span>Cliente propietario *</span>
              <select
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                required
              >
                <option value="">Selecciona un cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customerLabel(usersById.get(Number(customer.userId)))}
                  </option>
                ))}
              </select>
              {customersWarning && <small>{customersWarning}</small>}
            </label>
            {selectedCustomer && (
              <section className="vehicle-form__full vehicle-owner-summary" aria-label="Resumen del cliente propietario">
                <h3>Cliente seleccionado</h3>
                <dl>
                  <div><dt>Nombre completo</dt><dd>{fullName(selectedUser) || 'Sin nombre registrado'}</dd></div>
                  <div><dt>Correo</dt><dd>{selectedUser?.email || 'Sin correo registrado'}</dd></div>
                  <div><dt>Teléfono</dt><dd>{selectedUser?.phone || 'Sin teléfono registrado'}</dd></div>
                  <div><dt>Dirección</dt><dd>{selectedCustomer.address || 'Sin dirección registrada'}</dd></div>
                </dl>
              </section>
            )}
            <label><span>Marca *</span><input name="brand" maxLength="80" required /></label>
            <label><span>Modelo *</span><input name="model" maxLength="80" required /></label>
            <label>
              <span>Año *</span>
              <input name="year" type="number" min="1900" max={MAX_YEAR} required />
            </label>
            <label><span>Color <small>(opcional)</small></span><input name="color" maxLength="50" /></label>
            <label><span>Placa *</span><input name="licensePlate" maxLength="20" required /></label>
            <label><span>VIN <small>(opcional)</small></span><input name="vin" maxLength="100" /></label>
            <label>
              <span>Kilometraje actual <small>(opcional)</small></span>
              <input name="currentMileage" type="number" min="0" />
            </label>
          </div>
        </fieldset>
        <div className="vehicle-form__actions">
          <Link className="admin-button admin-button--secondary" to="/admin/vehicles">Cancelar</Link>
          <button
            className="admin-button admin-button--primary"
            type="submit"
            disabled={submitting || loadingCustomers || customers.length === 0}
          >
            {submitting ? 'Guardando…' : 'Guardar vehículo'}
          </button>
        </div>
      </form>
    </section>
  );
}
