import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import PeriodSelector from './components/PeriodSelector';
import SummaryCards from './components/SummaryCards';
import { loadAdminDashboard } from './adminDashboardService';
import {
  getDashboardErrorMessage,
  getPresetPeriod,
  validatePeriod,
} from './adminDashboardUtils';
import './adminDashboard.css';

const INITIAL_PRESET = 'current-month';
const DashboardCharts = lazy(() => import('./charts/DashboardCharts'));

function DashboardLoading() {
  return (
    <div className="admin-dashboard-state" role="status" aria-live="polite">
      <span className="admin-dashboard-loader" aria-hidden="true" />
      <strong>Cargando Dashboard administrativo...</strong>
      <p>Estamos consultando las métricas agregadas del periodo.</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const initialPeriod = useRef(getPresetPeriod(INITIAL_PRESET)).current;
  const requestSequence = useRef(0);
  const [preset, setPreset] = useState(INITIAL_PRESET);
  const [period, setPeriod] = useState(initialPeriod);
  const [draft, setDraft] = useState(initialPeriod);
  const [periodError, setPeriodError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    setError('');
    if (dashboard) setRefreshing(true);
    else setLoading(true);

    loadAdminDashboard(period, controller.signal)
      .then((result) => {
        if (sequence === requestSequence.current) setDashboard(result);
      })
      .catch((requestError) => {
        if (requestError?.name !== 'AbortError' && sequence === requestSequence.current) {
          setError(getDashboardErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (sequence === requestSequence.current) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [period.from, period.to, reloadKey]);

  function handlePresetChange(nextPreset) {
    setPreset(nextPreset);
    setPeriodError('');
    if (nextPreset === 'custom') return;
    const nextPeriod = getPresetPeriod(nextPreset);
    setDraft(nextPeriod);
    setPeriod(nextPeriod);
  }

  function applyCustomPeriod() {
    const validationMessage = validatePeriod(draft);
    setPeriodError(validationMessage);
    if (!validationMessage) setPeriod({ ...draft });
  }

  if (loading && !dashboard) return <DashboardLoading />;

  if (error && !dashboard) {
    return (
      <div className="admin-dashboard-state admin-dashboard-state--error" role="alert">
        <strong>No fue posible cargar el Dashboard</strong>
        <p>{error}</p>
        <button className="admin-button admin-button--primary" type="button" onClick={retry}>
          Reintentar
        </button>
      </div>
    );
  }

  const noOperationalData = dashboard
    && Object.values({
      customers: dashboard.summary?.registeredCustomers,
      vehicles: dashboard.summary?.registeredVehicles,
      intakes: dashboard.summary?.openVehicleIntakes,
      workOrders: dashboard.summary?.activeWorkOrders,
      jobs: dashboard.summary?.jobsInProgress,
      revenue: dashboard.summary?.periodRevenue,
    }).every((value) => Number(value ?? 0) === 0);

  return (
    <section
      className="admin-dashboard-page"
      aria-labelledby="admin-dashboard-title"
      aria-busy={refreshing}
    >
      <header className="admin-dashboard-heading">
        <div>
          <p className="admin-eyebrow">Resumen operativo</p>
          <h1 id="admin-dashboard-title">Dashboard administrativo</h1>
          <p>Métricas reales del taller, calculadas directamente por el backend.</p>
        </div>
        {refreshing && <span role="status" aria-live="polite">Actualizando métricas...</span>}
      </header>

      <PeriodSelector
        preset={preset}
        draft={draft}
        activePeriod={period}
        validationError={periodError}
        disabled={refreshing}
        onPresetChange={handlePresetChange}
        onDraftChange={setDraft}
        onApply={applyCustomPeriod}
      />

      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span>
          <p>{error}</p>
          <button className="admin-button admin-button--secondary" type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      <SummaryCards summary={dashboard?.summary} />

      {noOperationalData && (
        <div className="admin-dashboard-empty" role="status">
          <strong>No hay actividad registrada para mostrar.</strong>
          <p>Las métricas y gráficas se actualizarán cuando existan datos operativos.</p>
        </div>
      )}

      <Suspense
        fallback={(
          <div className="admin-dashboard-charts-loading" role="status" aria-live="polite">
            Preparando gráficas...
          </div>
        )}
      >
        <DashboardCharts dashboard={dashboard} />
      </Suspense>
    </section>
  );
}
