import { useEffect, useState } from 'react';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { formatJobMoney } from '../jobs/jobUtils';
import {
  getAllPartsCatalog,
  getAllServicesCatalog,
  getStatusesByContext,
} from './catalogsService';
import './adminCatalogs.css';

const STATUS_GROUPS = [
  ['USERS', 'Estados de usuarios'],
  ['SERVICES', 'Estados de servicios'],
  ['PARTS', 'Estados de piezas'],
  ['VEHICLE_INTAKES', 'Estados de ingresos'],
  ['WORK_ORDERS', 'Estados de Work Orders'],
  ['JOBS', 'Estados de Jobs'],
  ['SERVICE_REPORTS', 'Estados de reportes'],
];

function unwrapCollection(response) {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.content ?? [];
}

function StatusGroup({ title, context, statuses }) {
  return <section className="catalog-group"><header><div><h2>{title}</h2><code>{context}</code></div><span>{statuses.length} estado(s)</span></header>{statuses.length === 0 ? <div className="directory-state">Catálogo vacío.</div> : <div className="catalog-table-wrap"><table><thead><tr><th>Nombre</th><th>Código</th><th>Descripción</th><th>ID</th></tr></thead><tbody>{statuses.map((status) => <tr key={status.id}><td><strong>{status.name}</strong></td><td><code>{status.code}</code></td><td>{status.description || 'Sin descripción'}</td><td>{status.id}</td></tr>)}</tbody></table></div>}</section>;
}

function ServiceCatalog({ services }) {
  return <section className="catalog-group"><header><div><h2>Servicios</h2><code>GET /services</code></div><span>{services.length} registro(s)</span></header>{services.length === 0 ? <div className="directory-state">No hay servicios registrados.</div> : <div className="catalog-table-wrap"><table><thead><tr><th>Servicio</th><th>Descripción</th><th>Precio base</th><th>Horas estimadas</th><th>ID</th></tr></thead><tbody>{services.map((service) => <tr key={service.id}><td><strong>{service.name}</strong></td><td>{service.description || 'Sin descripción'}</td><td>{formatJobMoney(service.basePrice)}</td><td>{service.estimatedHours ?? 'No registradas'}</td><td>{service.id}</td></tr>)}</tbody></table></div>}</section>;
}

function PartCatalog({ parts }) {
  return <section className="catalog-group"><header><div><h2>Piezas</h2><code>GET /parts</code></div><span>{parts.length} registro(s)</span></header>{parts.length === 0 ? <div className="directory-state">No hay piezas registradas.</div> : <div className="catalog-table-wrap"><table><thead><tr><th>Pieza</th><th>Descripción</th><th>Precio unitario</th><th>Unidad</th><th>ID</th></tr></thead><tbody>{parts.map((part) => <tr key={part.id}><td><strong>{part.name}</strong></td><td>{part.description || 'Sin descripción'}</td><td>{formatJobMoney(part.unitPrice)}</td><td>{part.measurementUnitName || 'No registrada'}{part.measurementUnitAbbreviation ? ` (${part.measurementUnitAbbreviation})` : ''}</td><td>{part.id}</td></tr>)}</tbody></table></div>}</section>;
}

export default function CatalogsPage() {
  const [statuses, setStatuses] = useState({});
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [servicesResponse, partsResponse, ...statusResponses] = await Promise.all([
          getAllServicesCatalog(),
          getAllPartsCatalog(),
          ...STATUS_GROUPS.map(([context]) => getStatusesByContext(context)),
        ]);
        if (active) {
          setServices(unwrapCollection(servicesResponse));
          setParts(unwrapCollection(partsResponse));
          setStatuses(Object.fromEntries(STATUS_GROUPS.map(([context], index) => [
            context,
            unwrapCollection(statusResponses[index]),
          ])));
        }
      } catch (requestError) {
        if (active) setError(getAdminApiErrorMessage(requestError, 'cargar los catálogos'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return <section className="directory-page"><div className="admin-breadcrumb"><span>Administración</span><span>›</span><strong>Catálogos</strong></div><div className="directory-heading"><div><p className="admin-eyebrow">Consulta operativa</p><h1>Catálogos</h1><p>Servicios, piezas, unidades asociadas y estados reales del entorno.</p></div><span className="directory-readonly">Solo lectura</span></div><div className="admin-alert work-order-info" role="status"><span>i</span><p>El backend permite consultar estos catálogos, pero no administrarlos. No se muestran botones de alta, edición o eliminación.</p></div>{error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}{loading ? <div className="directory-state">Cargando catálogos...</div> : !error && <div className="catalog-groups"><ServiceCatalog services={services} /><PartCatalog parts={parts} />{STATUS_GROUPS.map(([context, title]) => <StatusGroup key={context} title={title} context={context} statuses={statuses[context] ?? []} />)}</div>}</section>;
}
