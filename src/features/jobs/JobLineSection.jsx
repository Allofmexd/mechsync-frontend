import { useMemo, useState } from 'react';
import {
  calculateLineSubtotalPreview,
  formatJobMoney,
  getJobLineErrorMessage,
  validateJobLineInput,
} from './jobUtils';

const CONFIG = {
  service: {
    title: 'Servicios reales',
    description: 'Servicios efectivamente realizados durante la ejecución del Job.',
    emptyMessage: 'Aún no hay servicios reales registrados para este trabajo.',
    catalogEmptyMessage: 'No hay servicios disponibles en el catálogo.',
    catalogLabel: 'un servicio',
    optionLabel: 'Selecciona un servicio',
    idField: 'serviceId',
    nameField: 'serviceName',
    priceField: 'basePrice',
    addLabel: 'Agregar servicio',
    entityLabel: 'servicio',
  },
  part: {
    title: 'Piezas reales',
    description: 'Piezas realmente utilizadas; esta sección no administra ni descuenta inventario.',
    emptyMessage: 'Aún no hay piezas reales registradas para este trabajo.',
    catalogEmptyMessage: 'No hay piezas disponibles en el catálogo.',
    catalogLabel: 'una pieza',
    optionLabel: 'Selecciona una pieza',
    idField: 'partId',
    nameField: 'partName',
    priceField: 'unitPrice',
    addLabel: 'Agregar pieza',
    entityLabel: 'pieza',
  },
};

const EMPTY_FORM = { catalogId: '', quantity: '1.00', unitPrice: '0.00' };

function decimalValue(value, fallback = '0.00') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export default function JobLineSection({
  kind,
  lines,
  catalog,
  loading,
  catalogError,
  canMutate,
  onSave,
  onDelete,
}) {
  const config = CONFIG[kind];
  const [formOpen, setFormOpen] = useState(false);
  const [editingLineId, setEditingLineId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const preview = useMemo(
    () => calculateLineSubtotalPreview(form.quantity, form.unitPrice),
    [form.quantity, form.unitPrice],
  );

  function closeForm() {
    setFormOpen(false);
    setEditingLineId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  function openCreate() {
    setEditingLineId(null);
    setForm(EMPTY_FORM);
    setError('');
    setFormOpen(true);
  }

  function openEdit(line) {
    setEditingLineId(line.id);
    setForm({
      catalogId: String(line[config.idField]),
      quantity: decimalValue(line.quantity, '1.00'),
      unitPrice: decimalValue(line.unitPrice),
    });
    setError('');
    setFormOpen(true);
  }

  function handleCatalogChange(event) {
    const catalogId = event.target.value;
    const item = catalog.find((entry) => String(entry.id) === catalogId);
    setForm((current) => ({
      ...current,
      catalogId,
      unitPrice: item ? decimalValue(item[config.priceField]) : current.unitPrice,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateJobLineInput(
      form.catalogId,
      form.quantity,
      form.unitPrice,
      config.catalogLabel,
    );
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSave({
        lineId: editingLineId,
        payload: {
          [config.idField]: validation.catalogId,
          quantity: validation.quantity,
          unitPrice: validation.unitPrice,
        },
      });
      closeForm();
    } catch (requestError) {
      setError(getJobLineErrorMessage(
        requestError,
        `${editingLineId ? 'actualizar' : 'agregar'} ${config.catalogLabel}`,
      ));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(line) {
    if (!window.confirm(`¿Eliminar ${line[config.nameField]} de las líneas reales del Job?`)) return;
    setBusy(true);
    setError('');
    try {
      await onDelete(line.id);
      if (editingLineId === line.id) closeForm();
    } catch (requestError) {
      setError(getJobLineErrorMessage(requestError, `eliminar ${config.catalogLabel}`));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="job-detail-card job-lines-card">
      <header className="job-lines-header">
        <div><h2>{config.title}</h2><p>{config.description}</p></div>
        {canMutate && (
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={openCreate}
            disabled={busy || loading || Boolean(catalogError) || catalog.length === 0}
          >
            {config.addLabel}
          </button>
        )}
      </header>

      {catalogError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{catalogError}</p></div>}
      {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
      {loading && <div className="job-lines-state">Cargando líneas reales...</div>}

      {!loading && lines.length === 0 && <div className="job-lines-state">{config.emptyMessage}</div>}

      {!loading && lines.length > 0 && (
        <div className="jobs-table-wrap">
          <table className="jobs-table job-lines-table">
            <thead><tr><th>Nombre</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Acciones</th></tr></thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td><strong>{line[config.nameField]}</strong></td>
                  <td>{line.quantity}</td>
                  <td>{formatJobMoney(line.unitPrice)}</td>
                  <td>{formatJobMoney(line.lineSubtotal)}</td>
                  <td>
                    {canMutate ? (
                      <div className="job-line-actions">
                        <button type="button" onClick={() => openEdit(line)} disabled={busy || Boolean(catalogError)}>Editar</button>
                        <button type="button" className="job-line-delete" onClick={() => handleDelete(line)} disabled={busy}>Eliminar</button>
                      </div>
                    ) : <span className="job-line-readonly">Solo lectura</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canMutate && !catalogError && catalog.length === 0 && !loading && (
        <div className="job-lines-state">{config.catalogEmptyMessage}</div>
      )}

      {formOpen && canMutate && (
        <form className="job-line-form" onSubmit={handleSubmit}>
          <h3>{editingLineId ? `Editar ${config.entityLabel}` : config.addLabel}</h3>
          <div className="job-line-form-grid">
            <label className="job-field">
              <span>Catálogo *</span>
              <select value={form.catalogId} onChange={handleCatalogChange} disabled={busy} required>
                <option value="">{config.optionLabel}</option>
                {catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="job-field">
              <span>Cantidad *</span>
              <input type="text" inputMode="decimal" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} disabled={busy} required />
            </label>
            <label className="job-field">
              <span>Precio unitario *</span>
              <input type="text" inputMode="decimal" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))} disabled={busy} required />
            </label>
            <div className="job-line-preview"><span>Subtotal estimado</span><strong>{preview === null ? 'Revisa cantidad y precio' : formatJobMoney(preview)}</strong><small>El backend calcula el importe definitivo.</small></div>
          </div>
          <div className="job-line-form-actions">
            <button className="admin-button admin-button--primary" type="submit" disabled={busy}>{busy ? 'Guardando...' : 'Guardar línea'}</button>
            <button className="admin-button admin-button--secondary" type="button" onClick={closeForm} disabled={busy}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
