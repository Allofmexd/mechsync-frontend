import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuthToken } from '../storage/authStorage';
import MechSyncLogo from './MechSyncLogo';

function DashboardIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>;
}

function OrdersIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" /></svg>;
}

function ToolsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 7 3-3 3 3-3 3M4 20l9-9M5 4l4 4M3 6l3-3 5 5-3 3z" /></svg>;
}

function ReportsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5zM8 16v-3M12 16V8M16 16v-5" /></svg>;
}

function LogoutIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg>;
}

export default function TechnicianSidebar() {
  const navigate = useNavigate();

  function logout() {
    clearAuthToken();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="technician-sidebar">
      <div className="technician-sidebar__brand"><MechSyncLogo compact /><span>Panel técnico</span></div>
      <nav className="technician-sidebar__nav" aria-label="Navegación técnica">
        <NavLink to="/technician" end><DashboardIcon /><span>Panel técnico</span></NavLink>
        <NavLink to="/technician/work-orders" end><OrdersIcon /><span>Mis órdenes</span></NavLink>
        <NavLink to="/technician/jobs"><ToolsIcon /><span>Mis trabajos</span></NavLink>
        <NavLink to="/technician/service-reports"><ReportsIcon /><span>Mis reportes de servicio</span></NavLink>
      </nav>
      <button className="technician-sidebar__logout" type="button" onClick={logout}><LogoutIcon /><span>Cerrar sesión</span></button>
    </aside>
  );
}
