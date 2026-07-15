import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthToken } from '../storage/authStorage';

export default function ProtectedRoute() {
  const location = useLocation();

  if (!getAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
