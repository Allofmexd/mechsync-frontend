import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import CustomerCreatePage from '../features/customers/CustomerCreatePage.jsx';
import CustomerDetailPage from '../features/customers/CustomerDetailPage.jsx';
import CustomersListPage from '../features/customers/CustomersListPage.jsx';
import LandingPage from '../features/landing/LandingPage.jsx';
import VehicleIntakeCreatePage from '../features/vehicleIntakes/VehicleIntakeCreatePage.jsx';
import VehicleCreatePage from '../features/vehicles/VehicleCreatePage.jsx';
import VehicleDetailPage from '../features/vehicles/VehicleDetailPage.jsx';
import VehiclesListPage from '../features/vehicles/VehiclesListPage.jsx';
import AdminLayout from '../shared/components/AdminLayout.jsx';
import ProtectedRoute from '../shared/components/ProtectedRoute.jsx';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/customers" element={<CustomersListPage />} />
          <Route path="/admin/customers/new" element={<CustomerCreatePage />} />
          <Route path="/admin/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/admin/vehicles" element={<VehiclesListPage />} />
          <Route path="/admin/vehicles/new" element={<VehicleCreatePage />} />
          <Route path="/admin/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/admin/vehicle-intakes/new" element={<VehicleIntakeCreatePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
