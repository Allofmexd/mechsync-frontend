import { Outlet, useOutletContext } from 'react-router-dom';
import TechnicianSidebar from './TechnicianSidebar';
import '../../features/technician/technician.css';

export default function TechnicianLayout() {
  const { currentUser } = useOutletContext();

  return (
    <div className="technician-shell">
      <TechnicianSidebar />
      <div className="technician-workspace">
        <header className="technician-topbar">
          <strong>Herramienta de reparación de transmisiones</strong>
          <div><span className="technician-topbar__role">Técnico</span><span>{currentUser?.email || 'Sesión protegida'}</span></div>
        </header>
        <main className="technician-main"><Outlet context={{ currentUser }} /></main>
      </div>
    </div>
  );
}
