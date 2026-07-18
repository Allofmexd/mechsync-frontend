import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import CatalogsPage from '../features/catalogs/CatalogsPage.jsx';
import CustomerCreatePage from '../features/customers/CustomerCreatePage.jsx';
import CustomerDetailPage from '../features/customers/CustomerDetailPage.jsx';
import CustomersListPage from '../features/customers/CustomersListPage.jsx';
import JobCreatePage from '../features/jobs/JobCreatePage.jsx';
import JobDetailPage from '../features/jobs/JobDetailPage.jsx';
import JobsListPage from '../features/jobs/JobsListPage.jsx';
import LandingPage from '../features/landing/LandingPage.jsx';
import QuotationCreatePage from '../features/quotations/QuotationCreatePage.jsx';
import TechnicianAssignedWorkOrdersPage from '../features/technician/TechnicianAssignedWorkOrdersPage.jsx';
import TechnicianDashboardPage from '../features/technician/TechnicianDashboardPage.jsx';
import TechnicianWorkOrderDetailPage from '../features/technician/TechnicianWorkOrderDetailPage.jsx';
import TechnicianWorkOrdersPage from '../features/technician/TechnicianWorkOrdersPage.jsx';
import TechniciansListPage from '../features/technicians/TechniciansListPage.jsx';
import UserCreatePage from '../features/users/UserCreatePage.jsx';
import UserDetailPage from '../features/users/UserDetailPage.jsx';
import UsersListPage from '../features/users/UsersListPage.jsx';
import VehicleIntakeCreatePage from '../features/vehicleIntakes/VehicleIntakeCreatePage.jsx';
import VehicleIntakeDetailPage from '../features/vehicleIntakes/VehicleIntakeDetailPage.jsx';
import VehicleIntakesListPage from '../features/vehicleIntakes/VehicleIntakesListPage.jsx';
import VehicleCreatePage from '../features/vehicles/VehicleCreatePage.jsx';
import VehicleDetailPage from '../features/vehicles/VehicleDetailPage.jsx';
import VehiclesListPage from '../features/vehicles/VehiclesListPage.jsx';
import WorkOrderCreatePage from '../features/workOrders/WorkOrderCreatePage.jsx';
import WorkOrderDetailPage from '../features/workOrders/WorkOrderDetailPage.jsx';
import WorkOrderRevisionDetailPage from '../features/workOrders/WorkOrderRevisionDetailPage.jsx';
import WorkOrderRevisionsPage from '../features/workOrders/WorkOrderRevisionsPage.jsx';
import WorkOrdersListPage from '../features/workOrders/WorkOrdersListPage.jsx';
import AdminLayout from '../shared/components/AdminLayout.jsx';
import ProtectedRoute from '../shared/components/ProtectedRoute.jsx';
import TechnicianLayout from '../shared/components/TechnicianLayout.jsx';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/users" element={<UsersListPage />} />
          <Route path="/admin/users/new" element={<UserCreatePage />} />
          <Route path="/admin/users/:id" element={<UserDetailPage />} />
          <Route path="/admin/customers" element={<CustomersListPage />} />
          <Route path="/admin/customers/new" element={<CustomerCreatePage />} />
          <Route path="/admin/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/admin/vehicles" element={<VehiclesListPage />} />
          <Route path="/admin/vehicles/new" element={<VehicleCreatePage />} />
          <Route path="/admin/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/admin/vehicle-intakes" element={<VehicleIntakesListPage />} />
          <Route path="/admin/vehicle-intakes/new" element={<VehicleIntakeCreatePage />} />
          <Route path="/admin/vehicle-intakes/:id" element={<VehicleIntakeDetailPage />} />
          <Route path="/admin/work-orders" element={<WorkOrdersListPage />} />
          <Route path="/admin/work-orders/new" element={<WorkOrderCreatePage />} />
          <Route path="/admin/work-orders/:workOrderId/revisions" element={<WorkOrderRevisionsPage />} />
          <Route path="/admin/work-orders/:workOrderId/revisions/:revisionId" element={<WorkOrderRevisionDetailPage />} />
          <Route path="/admin/work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="/admin/quotations/new" element={<QuotationCreatePage />} />
          <Route path="/admin/technicians" element={<TechniciansListPage />} />
          <Route path="/admin/catalogs" element={<CatalogsPage />} />
          <Route path="/admin/jobs" element={<JobsListPage />} />
          <Route path="/admin/jobs/new" element={<JobCreatePage />} />
          <Route path="/admin/jobs/:id" element={<JobDetailPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['TECNICO']} />}>
        <Route element={<TechnicianLayout />}>
          <Route path="/technician" element={<TechnicianDashboardPage />} />
          <Route path="/technician/dashboard" element={<Navigate to="/technician" replace />} />
          <Route path="/technician/work-orders" element={<TechnicianWorkOrdersPage />} />
          <Route path="/technician/assigned-work-orders" element={<TechnicianAssignedWorkOrdersPage />} />
          <Route path="/technician/work-orders/:id" element={<TechnicianWorkOrderDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
