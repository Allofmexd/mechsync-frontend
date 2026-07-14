import { useState } from 'react';
import {
  getDatabaseHealth,
  getHealth,
} from './features/health/healthService.js';
import { API_BASE_URL } from './shared/api/apiClient.js';

const healthChecks = {
  general: {
    label: 'Health general',
    description: 'Comprueba la disponibilidad del servicio principal.',
    request: getHealth,
  },
  database: {
    label: 'Health database',
    description: 'Comprueba la conexión del backend con la base de datos.',
    request: getDatabaseHealth,
  },
};

function formatResult(result) {
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}

function App() {
  const [checks, setChecks] = useState({});

  const runHealthCheck = async (checkId) => {
    setChecks((current) => ({
      ...current,
      [checkId]: { status: 'loading' },
    }));

    try {
      const result = await healthChecks[checkId].request();
      setChecks((current) => ({
        ...current,
        [checkId]: { status: 'success', result },
      }));
    } catch (error) {
      setChecks((current) => ({
        ...current,
        [checkId]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
        },
      }));
    }
  };

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="brand-mark" aria-hidden="true">
          <span>MS</span>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">Control de taller conectado</p>
          <h1 id="page-title">MechSync</h1>
          <p className="subtitle">
            Sistema de gestión para talleres de transmisiones automáticas.
          </p>
          <p className="intro">
            El frontend está listo para integrarse con el backend Spring Boot y crecer
            por módulos de forma segura.
          </p>
        </div>
      </section>

      <section className="connection-panel" aria-labelledby="connection-title">
        <div>
          <p className="section-label">Configuración activa</p>
          <h2 id="connection-title">Conexión con la API</h2>
        </div>

        <div className="api-url">
          <span className={`status-dot ${API_BASE_URL ? 'configured' : 'missing'}`} />
          <code>{API_BASE_URL || 'VITE_API_BASE_URL no configurada'}</code>
        </div>
      </section>

      <section className="checks-section" aria-labelledby="checks-title">
        <div className="section-heading">
          <div>
            <p className="section-label">Diagnóstico</p>
            <h2 id="checks-title">Estado de servicios</h2>
          </div>
          <p>Ejecuta una comprobación para validar la integración actual.</p>
        </div>

        <div className="checks-grid">
          {Object.entries(healthChecks).map(([checkId, check]) => {
            const state = checks[checkId];
            const isLoading = state?.status === 'loading';

            return (
              <article className="check-card" key={checkId}>
                <div className="check-card-header">
                  <div>
                    <h3>{check.label}</h3>
                    <p>{check.description}</p>
                  </div>
                  <span className={`result-badge ${state?.status ?? 'idle'}`}>
                    {state?.status === 'success'
                      ? 'Disponible'
                      : state?.status === 'error'
                        ? 'Con error'
                        : isLoading
                          ? 'Consultando'
                          : 'Sin probar'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => runHealthCheck(checkId)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Consultando…' : 'Probar conexión'}
                </button>

                {state?.status === 'success' && (
                  <pre className="result success" aria-live="polite">
                    {formatResult(state.result)}
                  </pre>
                )}

                {state?.status === 'error' && (
                  <p className="result error" role="alert">
                    {state.message}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;
