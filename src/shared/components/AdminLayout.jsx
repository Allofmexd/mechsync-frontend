import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import './admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>Panel principal</span>
          <span className="admin-topbar__session">Sesión protegida</span>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
