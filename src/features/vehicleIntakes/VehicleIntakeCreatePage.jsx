import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getVehicleIntakeStatuses } from '../catalogs/catalogsService';
import { getCustomerById } from '../customers/customersService';
import { getTechnicians } from '../technicians/techniciansService';
import { getUserById } from '../users/usersService';
import { getVehicleById, getVehicles } from '../vehicles/vehiclesService';
import { createVehicleIntake } from './vehicleIntakesService';
import './vehicleIntakes.css';

function unwrap(response) {
  return response?.data ?? response;
}

function formatCode(code) {
  if (!code) return 'Sin nombre';
  const normalized = String(code).toLocaleLowerCase('es-MX').replaceAll('_', ' ');
  return normalized.charAt(0).toLocaleUpperCase('es-MX') + normalized.slice(1);
}

function getCreateErrorMessage(error) {
  if (error?.status === 400) {
    return getApiErrorMessage(error, 'Revisa los campos obligatorios del ingreso.');
  }
  if (error?.status === 404) {
    return 'El vehículo, técnico o estado seleccionado ya no está disponible.';
  }
  if (error?.status === 409) {
    return getApiErrorMessage(error, 'Existe un conflicto al registrar el ingreso.');
  }
  return getApiErrorMessage(error, 'No fue posible registrar el ingreso del vehículo.');
}

export default function VehicleIntakeCreatePage() {
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);
  const requestedVehicleId = searchParams.get('vehicleId') || '';
  const validRequestedVehicleId = /^\d+$/.test(requestedVehicleId)
    && Number(requestedVehicleId) > 0
    ? requestedVehicleId
    : '';

  const [vehicles, setVehicles] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(validRequestedVehicleId);
  const [selectedStatusId, setSelectedStatusId] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [reportedProblem, setReportedProblem] = useState('');
  const [customer, setCustomer] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [loadingRelation, setLoadingRelation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehiclesError, setVehiclesError] = useState('');
  const [statusesError, setStatusesError] = useState('');
  const [techniciansError, setTechniciansError] = useState('');
  const [relationError, setRelationError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [createdIntake, setCreatedIntake] = useState(null);
  const [selectionNotice, setSelectionNotice] = useState(
    requestedVehicleId && !validRequestedVehicleId
      ? 'El vehicleId recibido no es válido. Selecciona un vehículo de la lista.'
      : '',
  );

  useEffect(() => {
    setSelectedVehicleId(validRequestedVehicleId);
    setSelectionNotice(
      requestedVehicleId && !validRequestedVehicleId
        ? 'El vehicleId recibido no es válido. Selecciona un vehículo de la lista.'
        : '',
    );
  }, [requestedVehicleId, validRequestedVehicleId]);

  useEffect(() => {
    let active = true;

    async function loadVehicles() {
      setVehiclesError('');
      try {
        const response = await getVehicles({ page: 0, size: 100 });
        const data = unwrap(response);
        let availableVehicles = Array.isArray(data?.content) ? data.content : [];

        if (
          validRequestedVehicleId
          && !availableVehicles.some(
            (vehicle) => String(vehicle.id) === validRequestedVehicleId,
          )
        ) {
          try {
            const requestedVehicle = unwrap(await getVehicleById(validRequestedVehicleId));
            availableVehicles = [requestedVehicle, ...availableVehicles];
          } catch (requestError) {
            if (active) {
              setSelectedVehicleId('');
              setSelectionNotice(getApiErrorMessage(
                requestError,
                'El vehículo precargado no está disponible. Selecciona otro vehículo.',
              ));
            }
          }
        }

        if (active) setVehicles(availableVehicles);
      } catch (requestError) {
        if (active) {
          setVehiclesError(getApiErrorMessage(
            requestError,
            'Error al cargar los vehículos.',
          ));
        }
      } finally {
        if (active) setLoadingVehicles(false);
      }
    }

    loadVehicles();
    return () => {
      active = false;
    };
  }, [validRequestedVehicleId]);

  useEffect(() => {
    let active = true;

    async function loadStatuses() {
      setStatusesError('');
      try {
        const data = unwrap(await getVehicleIntakeStatuses());
        const availableStatuses = Array.isArray(data) ? data : [];
        if (!active) return;
        setStatuses(availableStatuses);
        if (availableStatuses.length === 0) {
          setStatusesError('No hay estados de ingreso disponibles en la API.');
        }
      } catch (requestError) {
        if (active) {
          setStatusesError(getApiErrorMessage(
            requestError,
            'No fue posible cargar los estados de ingreso.',
          ));
        }
      } finally {
        if (active) setLoadingStatuses(false);
      }
    }

    loadStatuses();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTechnicians() {
      setTechniciansError('');
      try {
        const data = unwrap(await getTechnicians());
        if (active) setTechnicians(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (active) {
          setTechniciansError(getApiErrorMessage(
            requestError,
            'No fue posible cargar los técnicos. Puedes crear el ingreso sin asignar uno.',
          ));
        }
      } finally {
        if (active) setLoadingTechnicians(false);
      }
    }

    loadTechnicians();
    return () => {
      active = false;
    };
  }, []);

  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.id) === String(selectedVehicleId),
  );

  useEffect(() => {
    let active = true;
    setCustomer(null);
    setUser(null);
    setRelationError('');
    setLoadingRelation(false);

    if (!selectedVehicle) return () => {
      active = false;
    };

    async function loadRelatedCustomer() {
      setLoadingRelation(true);
      try {
        const customerData = unwrap(await getCustomerById(selectedVehicle.customerId));
        if (!active) return;
        setCustomer(customerData);

        const userData = unwrap(await getUserById(customerData.userId));
        if (active) setUser(userData);
      } catch (requestError) {
        if (active) {
          setRelationError(getApiErrorMessage(
            requestError,
            'No fue posible cargar el cliente relacionado.',
          ));
        }
      } finally {
        if (active) setLoadingRelation(false);
      }
    }

    loadRelatedCustomer();
    return () => {
      active = false;
    };
  }, [selectedVehicle?.id, selectedVehicle?.customerId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setCreatedIntake(null);

    const selectedStatus = statuses.find(
      (status) => String(status.id) === String(selectedStatusId),
    );
    const selectedTechnician = technicians.find(
      (technician) => String(technician.id) === String(selectedTechnicianId),
    );

    if (!selectedVehicle || !selectedStatus || !reportedProblem.trim()) {
      setSubmitError('Selecciona vehículo y estado, y describe el problema reportado.');
      return;
    }
    if (selectedTechnicianId && !selectedTechnician) {
      setSubmitError('El técnico seleccionado ya no está disponible.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const intakeDate = String(formData.get('intakeDate') || '').trim();
    const intakeMileage = String(formData.get('intakeMileage') || '').trim();
    const initialObservations = String(formData.get('initialObservations') || '').trim();
    const payload = {
      vehicleId: Number(selectedVehicle.id),
      reportedProblem: reportedProblem.trim(),
      statusId: Number(selectedStatus.id),
    };

    if (selectedTechnician) payload.technicianId = Number(selectedTechnician.id);
    if (intakeDate) payload.intakeDate = intakeDate;
    if (intakeMileage) payload.intakeMileage = Number(intakeMileage);
    if (initialObservations) payload.initialObservations = initialObservations;

    setSubmitting(true);
    try {
      const created = unwrap(await createVehicleIntake(payload));
      setCreatedIntake(created);
      setSelectedStatusId('');
      setSelectedTechnicianId('');
      setReportedProblem('');
      formRef.current?.reset();
    } catch (requestError) {
      setSubmitError(getCreateErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : customer
      ? `Customer #${customer.id}`
      : 'Selecciona un vehículo';
  const loadingRequiredData = loadingVehicles || loadingStatuses;
  const requiredDataError = Boolean(vehiclesError || statusesError);
  const integrationStatus = loadingRequiredData
    ? { className: 'intake-status-loading', label: 'Cargando datos' }
    : requiredDataError
      ? { className: 'intake-status-error', label: 'Requiere atención' }
      : { className: 'intake-status-ready', label: 'Integración disponible' };
  const canSubmit = Boolean(
    selectedVehicle
    && selectedStatusId
    && reportedProblem.trim()
    && !vehiclesError
    && !statusesError
    && !loadingRequiredData
    && !submitting,
  );

  return (
    <section className="intake-create-page">
      <div className="admin-breadcrumb">
        <span>Panel principal</span><span>›</span>
        <Link to="/admin/vehicles">Vehículos</Link><span>›</span>
        <strong>Nuevo ingreso</strong>
      </div>

      <div className="intake-heading">
        <div>
          <p className="admin-eyebrow">Recepción del taller</p>
          <h1>Nuevo ingreso de vehículo</h1>
          <p>Completa los datos disponibles para iniciar el diagnóstico técnico.</p>
        </div>
        <span className={integrationStatus.className}>
          {integrationStatus.label}
        </span>
      </div>

      {vehiclesError && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span><p>{vehiclesError}</p>
        </div>
      )}
      {statusesError && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span><p>{statusesError}</p>
        </div>
      )}
      {techniciansError && (
        <div className="admin-alert intake-info-alert" role="status">
          <span aria-hidden="true">i</span><p>{techniciansError}</p>
        </div>
      )}
      {!loadingTechnicians && !techniciansError && technicians.length === 0 && (
        <div className="admin-alert intake-info-alert" role="status">
          <span aria-hidden="true">i</span>
          <p>No hay técnicos registrados. El ingreso se puede crear sin técnico asignado.</p>
        </div>
      )}
      {selectionNotice && (
        <div className="admin-alert intake-info-alert" role="status">
          <span aria-hidden="true">i</span><p>{selectionNotice}</p>
        </div>
      )}
      {submitError && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span><p>{submitError}</p>
        </div>
      )}
      {createdIntake && (
        <div className="admin-alert admin-alert--success" role="status">
          <span aria-hidden="true">✓</span>
          <p>Ingreso de vehículo registrado correctamente.</p>
          <Link to={`/admin/vehicles/${createdIntake.vehicleId ?? selectedVehicleId}`}>
            Ver vehículo
          </Link>
        </div>
      )}

      <form ref={formRef} className="intake-form" onSubmit={handleSubmit}>
        <section className="intake-section">
          <header><span aria-hidden="true">▣</span><h2>Selección de vehículo</h2></header>
          <div className="intake-section__body">
            <label className="intake-field intake-field--full">
              <span>Vehículo registrado *</span>
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                disabled={loadingVehicles || Boolean(vehiclesError) || submitting}
                required
              >
                <option value="">
                  {loadingVehicles ? 'Cargando vehículos…' : 'Selecciona un vehículo'}
                </option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licensePlate} · {vehicle.brand} {vehicle.model} · Customer #{vehicle.customerId}
                  </option>
                ))}
              </select>
              <small>Datos obtenidos mediante GET /vehicles.</small>
            </label>
          </div>
        </section>

        <section className="intake-section">
          <header><span aria-hidden="true">♙</span><h2>Datos del cliente</h2></header>
          <div className="intake-section__body intake-readonly-grid">
            <div><span>Nombre completo</span><strong>{loadingRelation ? 'Cargando…' : fullName}</strong></div>
            <div><span>Teléfono</span><strong>{user?.phone || 'No disponible'}</strong></div>
            <div><span>Correo electrónico</span><strong>{user?.email || 'No disponible'}</strong></div>
            <div><span>Dirección</span><strong>{customer?.address || 'No disponible'}</strong></div>
          </div>
          {relationError && <p className="intake-relation-error">{relationError}</p>}
        </section>

        <section className="intake-section">
          <header><span aria-hidden="true">▤</span><h2>Datos del vehículo</h2></header>
          <div className="intake-section__body intake-readonly-grid">
            <div><span>Marca</span><strong>{selectedVehicle?.brand || '—'}</strong></div>
            <div><span>Modelo</span><strong>{selectedVehicle?.model || '—'}</strong></div>
            <div><span>Año</span><strong>{selectedVehicle?.year || '—'}</strong></div>
            <div><span>Placa</span><strong>{selectedVehicle?.licensePlate || '—'}</strong></div>
            <div><span>Color</span><strong>{selectedVehicle?.color || 'No registrado'}</strong></div>
            <div>
              <span>Kilometraje registrado</span>
              <strong>{selectedVehicle?.currentMileage == null
                ? 'No registrado'
                : `${Number(selectedVehicle.currentMileage).toLocaleString('es-MX')} km`}</strong>
            </div>
          </div>
        </section>

        <section className="intake-section">
          <header><span aria-hidden="true">⌕</span><h2>Información del servicio</h2></header>
          <div className="intake-section__body intake-fields-grid">
            <label className="intake-field intake-field--full">
              <span>Problema reportado por el cliente *</span>
              <textarea
                name="reportedProblem"
                rows="4"
                value={reportedProblem}
                onChange={(event) => setReportedProblem(event.target.value)}
                disabled={submitting}
                required
                placeholder="Describe la falla reportada"
              />
            </label>
            <label className="intake-field">
              <span>Fecha de ingreso <small>(opcional)</small></span>
              <input name="intakeDate" type="datetime-local" disabled={submitting} />
            </label>
            <label className="intake-field">
              <span>Kilometraje de ingreso <small>(opcional)</small></span>
              <input name="intakeMileage" type="number" min="0" disabled={submitting} />
            </label>
            <label className="intake-field intake-field--full">
              <span>Observaciones iniciales <small>(opcional)</small></span>
              <textarea
                name="initialObservations"
                rows="3"
                disabled={submitting}
                placeholder="Observaciones de recepción"
              />
            </label>
            <label className="intake-field">
              <span>Técnico <small>(opcional)</small></span>
              <select
                value={selectedTechnicianId}
                onChange={(event) => setSelectedTechnicianId(event.target.value)}
                disabled={loadingTechnicians || technicians.length === 0 || submitting}
              >
                <option value="">
                  {loadingTechnicians ? 'Cargando técnicos…' : 'Sin técnico asignado'}
                </option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.fullName
                      || `${technician.firstName ?? ''} ${technician.lastName ?? ''}`.trim()
                      || `Técnico #${technician.id}`}
                    {technician.specialtyName ? ` · ${technician.specialtyName}` : ''}
                  </option>
                ))}
              </select>
              <small>Si no seleccionas uno, `technicianId` se omite del request.</small>
            </label>
            <label className="intake-field">
              <span>Estado *</span>
              <select
                value={selectedStatusId}
                onChange={(event) => setSelectedStatusId(event.target.value)}
                disabled={loadingStatuses || Boolean(statusesError) || submitting}
                required
              >
                <option value="">
                  {loadingStatuses ? 'Cargando estados…' : 'Selecciona un estado'}
                </option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name || formatCode(status.code)}
                    {status.code ? ` · ${status.code}` : ''}
                  </option>
                ))}
              </select>
              <small>El `statusId` se obtiene mediante GET /catalogs/statuses.</small>
            </label>
          </div>
        </section>

        <div className="intake-form__actions">
          <Link className="admin-button admin-button--secondary" to="/admin/vehicles">Cancelar</Link>
          <button
            className="admin-button admin-button--primary"
            type="submit"
            disabled={!canSubmit}
          >
            {submitting ? 'Guardando…' : 'Guardar reporte de ingreso'}
          </button>
        </div>
      </form>
    </section>
  );
}
