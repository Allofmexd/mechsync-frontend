import { Outlet, useOutletContext } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar.jsx';
import './customerPortal.css';

export default function CustomerLayout() {
  const { currentUser } = useOutletContext();

  return (
    <div className="customer-shell">
      <CustomerSidebar />
      <div className="customer-workspace">
        <header className="customer-topbar">
          <strong>Portal de atención MechSync</strong>
          <span>{currentUser?.email || 'Sesión protegida'}</span>
        </header>
        <main className="customer-main">
          <Outlet context={{ currentUser }} />
        </main>
      </div>
    </div>
  );
}
