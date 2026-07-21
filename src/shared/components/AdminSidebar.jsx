import { NavLink, useNavigate } from 'react-router-dom';
import MechSyncLogo from './MechSyncLogo';
import { clearAuthToken } from '../storage/authStorage';

function CustomersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AddCustomerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M16 11h6" />
    </svg>
  );
}

function VehiclesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 16V9l2-4h14l2 4v7M5 16v3M19 16v3M3 11h18M7 14h.01M17 14h.01" />
    </svg>
  );
}

function IntakeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16v16H4zM8 2v4M16 2v4M7 11h10M7 15h6" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4M9 19h6" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9M12 7v5l3 2" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6zM14 3v4h4M9 11h6M9 15h6M9 19h4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}

function UsersIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /></svg>;
}

function CatalogIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4" /></svg>;
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />
    </svg>
  );
}

export default function AdminSidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearAuthToken();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <MechSyncLogo compact />
        <span>Panel administrativo</span>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Navegación administrativa">
        <span className="admin-sidebar__group">Administración</span>
        <NavLink to="/admin/dashboard">
          <DashboardIcon />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/users">
          <UsersIcon />
          <span>Usuarios</span>
        </NavLink>
        <NavLink to="/admin/customers" end>
          <CustomersIcon />
          <span>Clientes</span>
        </NavLink>
        <NavLink to="/admin/technicians">
          <AddCustomerIcon />
          <span>Técnicos</span>
        </NavLink>

        <span className="admin-sidebar__group">Operación</span>
        <NavLink to="/admin/vehicles">
          <VehiclesIcon />
          <span>Vehículos</span>
        </NavLink>
        <NavLink to="/admin/vehicle-intakes" end>
          <IntakeIcon />
          <span>Ingresos</span>
        </NavLink>
        <NavLink to="/admin/work-orders" end>
          <OrdersIcon />
          <span>Órdenes de servicio</span>
        </NavLink>
        <NavLink to="/admin/jobs">
          <PendingIcon />
          <span>Trabajos realizados</span>
        </NavLink>
        <NavLink to="/admin/service-reports">
          <ReportsIcon />
          <span>Reportes de servicio</span>
        </NavLink>

        <span className="admin-sidebar__group">Cotizaciones</span>
        <NavLink to="/admin/quotations/new">
          <PendingIcon />
          <span>Nueva cotización</span>
        </NavLink>

        <span className="admin-sidebar__group">Catálogos</span>
        <NavLink to="/admin/catalogs">
          <CatalogIcon />
          <span>Catálogos</span>
        </NavLink>

      </nav>

      <button className="admin-sidebar__logout" type="button" onClick={handleLogout}>
        <LogoutIcon />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}
