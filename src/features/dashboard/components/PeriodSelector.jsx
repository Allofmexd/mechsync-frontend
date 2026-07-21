const PRESETS = [
  ['current-month', 'Este mes'],
  ['last-3-months', 'Últimos 3 meses'],
  ['last-6-months', 'Últimos 6 meses'],
  ['current-year', 'Año actual'],
  ['custom', 'Personalizado'],
];

export default function PeriodSelector({
  preset,
  draft,
  activePeriod,
  validationError,
  disabled,
  onPresetChange,
  onDraftChange,
  onApply,
}) {
  return (
    <section className="admin-dashboard-period" aria-labelledby="dashboard-period-title">
      <div>
        <p className="admin-eyebrow">Periodo de análisis</p>
        <h2 id="dashboard-period-title">Filtrar métricas históricas</h2>
        <p>
          Periodo activo: <strong>{activePeriod.from}</strong> a <strong>{activePeriod.to}</strong>
        </p>
      </div>

      <div className="admin-dashboard-period__controls">
        <label>
          Rango
          <select
            value={preset}
            disabled={disabled}
            onChange={(event) => onPresetChange(event.target.value)}
          >
            {PRESETS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        {preset === 'custom' && (
          <div className="admin-dashboard-period__custom">
            <label>
              Desde
              <input
                type="date"
                value={draft.from}
                disabled={disabled}
                onChange={(event) => onDraftChange({ ...draft, from: event.target.value })}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={draft.to}
                disabled={disabled}
                onChange={(event) => onDraftChange({ ...draft, to: event.target.value })}
              />
            </label>
            <button
              className="admin-button admin-button--primary"
              type="button"
              disabled={disabled}
              onClick={onApply}
            >
              Aplicar
            </button>
          </div>
        )}
        {validationError && (
          <p className="admin-dashboard-period__error" role="alert">{validationError}</p>
        )}
      </div>
    </section>
  );
}
