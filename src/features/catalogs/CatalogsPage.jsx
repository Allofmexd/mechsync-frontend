import { useEffect, useState } from 'react';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getVehicleIntakeStatuses, getWorkOrderStatuses } from './catalogsService';
import './adminCatalogs.css';

function unwrapCollection(response) {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.content ?? [];
}

function StatusGroup({ title, context, statuses }) {
  return <section className="catalog-group"><header><div><h2>{title}</h2><code>{context}</code></div><span>{statuses.length} estado(s)</span></header>{statuses.length === 0 ? <div className="directory-state">Catálogo vacío.</div> : <div className="catalog-table-wrap"><table><thead><tr><th>Nombre</th><th>Código</th><th>Descripción</th><th>ID del entorno</th></tr></thead><tbody>{statuses.map((status) => <tr key={status.id}><td><strong>{status.name}</strong></td><td><code>{status.code}</code></td><td>{status.description || 'Sin descripción'}</td><td>{status.id}</td></tr>)}</tbody></table></div>}</section>;
}

export default function CatalogsPage() {
  const [intakeStatuses, setIntakeStatuses] = useState([]);
  const [workOrderStatuses, setWorkOrderStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [intakes, workOrders] = await Promise.all([getVehicleIntakeStatuses(), getWorkOrderStatuses()]);
        if (active) { setIntakeStatuses(unwrapCollection(intakes)); setWorkOrderStatuses(unwrapCollection(workOrders)); }
      } catch (requestError) {
        if (active) setError(getAdminApiErrorMessage(requestError, 'cargar los catálogos'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return <section className="directory-page"><div className="admin-breadcrumb"><span>Administración</span><span>›</span><strong>Catálogos</strong></div><div className="directory-heading"><div><p className="admin-eyebrow">Configuración visible</p><h1>Catálogos de estados</h1><p>Valores reales del entorno para ingresos y Work Orders.</p></div><span className="directory-readonly">Solo lectura</span></div><div className="admin-alert work-order-info" role="status"><span>i</span><p>Los IDs se muestran únicamente como diagnóstico del entorno. Los formularios siempre obtienen las opciones desde la API y no hardcodean identificadores.</p></div>{error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}{loading ? <div className="directory-state">Cargando catálogos...</div> : !error && <div className="catalog-groups"><StatusGroup title="Estados de ingresos" context="VEHICLE_INTAKES" statuses={intakeStatuses} /><StatusGroup title="Estados de Work Orders" context="WORK_ORDERS" statuses={workOrderStatuses} /></div>}</section>;
}
