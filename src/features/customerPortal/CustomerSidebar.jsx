import { NavLink, useNavigate } from 'react-router-dom';
import MechSyncLogo from '../../shared/components/MechSyncLogo.jsx';
import { clearAuthToken } from '../../shared/storage/authStorage.js';

export default function CustomerSidebar() {
  const navigate = useNavigate();
  function logout() {
    clearAuthToken();
    navigate('/login', { replace: true });
  }
  return <aside className="customer-sidebar"><div className="customer-sidebar__brand"><MechSyncLogo compact /><span>Portal cliente</span></div><nav className="customer-sidebar__nav" aria-label="Navegación del portal cliente"><NavLink to="/customer" end>Inicio</NavLink><NavLink to="/customer/profile">Mi perfil</NavLink><NavLink to="/customer/vehicles">Mis vehículos</NavLink><NavLink to="/customer/service-history">Historial de servicio</NavLink><NavLink to="/customer/quotations">Cotizaciones</NavLink></nav><button className="customer-sidebar__logout" type="button" onClick={logout}>Cerrar sesión</button></aside>;
}
