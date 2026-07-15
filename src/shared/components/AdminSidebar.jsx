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

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
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
        <NavLink to="/admin/customers" end>
          <CustomersIcon />
          <span>Clientes</span>
        </NavLink>
        <NavLink to="/admin/customers/new">
          <AddCustomerIcon />
          <span>Registrar cliente</span>
        </NavLink>
        <NavLink to="/admin/vehicles">
          <VehiclesIcon />
          <span>Vehículos</span>
        </NavLink>
        <NavLink to="/admin/vehicle-intakes/new">
          <IntakeIcon />
          <span>Nuevo ingreso</span>
        </NavLink>
      </nav>

      <button className="admin-sidebar__logout" type="button" onClick={handleLogout}>
        <LogoutIcon />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}
