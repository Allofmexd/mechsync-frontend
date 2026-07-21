import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from '../shared/components/ProtectedRoute.jsx';
import RouteChunkErrorBoundary from '../shared/components/RouteChunkErrorBoundary.jsx';
import RouteLoadingFallback from '../shared/components/RouteLoadingFallback.jsx';

const AdminLayout = lazy(() => import('../shared/components/AdminLayout.jsx'));
const TechnicianLayout = lazy(() => import('../shared/components/TechnicianLayout.jsx'));
const CustomerLayout = lazy(() => import('../features/customerPortal/CustomerLayout.jsx'));

const LoginPage = lazy(() => import('../features/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage.jsx'));
const LandingPage = lazy(() => import('../features/landing/LandingPage.jsx'));

const CatalogsPage = lazy(() => import('../features/catalogs/CatalogsPage.jsx'));
const AdminDashboardPage = lazy(() => import('../features/dashboard/AdminDashboardPage.jsx'));
const CustomerCreatePage = lazy(() => import('../features/customers/CustomerCreatePage.jsx'));
const CustomerDetailPage = lazy(() => import('../features/customers/CustomerDetailPage.jsx'));
const CustomersListPage = lazy(() => import('../features/customers/CustomersListPage.jsx'));
const JobCreatePage = lazy(() => import('../features/jobs/JobCreatePage.jsx'));
const JobDetailPage = lazy(() => import('../features/jobs/JobDetailPage.jsx'));
const JobsListPage = lazy(() => import('../features/jobs/JobsListPage.jsx'));
const QuotationCreatePage = lazy(() => import('../features/quotations/QuotationCreatePage.jsx'));
const ServiceReportDetailPage = lazy(() => import('../features/serviceReports/ServiceReportDetailPage.jsx'));
const ServiceReportsListPage = lazy(() => import('../features/serviceReports/ServiceReportsListPage.jsx'));
const TechniciansListPage = lazy(() => import('../features/technicians/TechniciansListPage.jsx'));
const TechnicianCreatePage = lazy(() => import('../features/technicians/TechnicianCreatePage.jsx'));
const TechnicianDetailPage = lazy(() => import('../features/technicians/TechnicianDetailPage.jsx'));
const UserCreatePage = lazy(() => import('../features/users/UserCreatePage.jsx'));
const UserDetailPage = lazy(() => import('../features/users/UserDetailPage.jsx'));
const UsersListPage = lazy(() => import('../features/users/UsersListPage.jsx'));
const VehicleIntakeCreatePage = lazy(() => import('../features/vehicleIntakes/VehicleIntakeCreatePage.jsx'));
const VehicleIntakeDetailPage = lazy(() => import('../features/vehicleIntakes/VehicleIntakeDetailPage.jsx'));
const VehicleIntakesListPage = lazy(() => import('../features/vehicleIntakes/VehicleIntakesListPage.jsx'));
const VehicleCreatePage = lazy(() => import('../features/vehicles/VehicleCreatePage.jsx'));
const VehicleDetailPage = lazy(() => import('../features/vehicles/VehicleDetailPage.jsx'));
const VehiclesListPage = lazy(() => import('../features/vehicles/VehiclesListPage.jsx'));
const WorkOrderCreatePage = lazy(() => import('../features/workOrders/WorkOrderCreatePage.jsx'));
const WorkOrderDetailPage = lazy(() => import('../features/workOrders/WorkOrderDetailPage.jsx'));
const WorkOrderRevisionDetailPage = lazy(() => import('../features/workOrders/WorkOrderRevisionDetailPage.jsx'));
const WorkOrderRevisionsPage = lazy(() => import('../features/workOrders/WorkOrderRevisionsPage.jsx'));
const WorkOrdersListPage = lazy(() => import('../features/workOrders/WorkOrdersListPage.jsx'));

const TechnicianDashboardPage = lazy(() => import('../features/technician/TechnicianDashboardPage.jsx'));
const TechnicianJobDetailPage = lazy(() => import('../features/technician/TechnicianJobDetailPage.jsx'));
const TechnicianJobsPage = lazy(() => import('../features/technician/TechnicianJobsPage.jsx'));
const TechnicianServiceReportDetailPage = lazy(() => import('../features/technician/TechnicianServiceReportDetailPage.jsx'));
const TechnicianServiceReportsPage = lazy(() => import('../features/technician/TechnicianServiceReportsPage.jsx'));
const TechnicianWorkOrderDetailPage = lazy(() => import('../features/technician/TechnicianWorkOrderDetailPage.jsx'));
const TechnicianWorkOrdersPage = lazy(() => import('../features/technician/TechnicianWorkOrdersPage.jsx'));

const CustomerDashboardPage = lazy(() => import('../features/customerPortal/CustomerDashboardPage.jsx'));
const CustomerProfilePage = lazy(() => import('../features/customerPortal/CustomerProfilePage.jsx'));
const CustomerVehiclesPage = lazy(() => import('../features/customerPortal/CustomerVehiclesPage.jsx'));
const CustomerVehicleDetailPage = lazy(() => import('../features/customerPortal/CustomerVehicleDetailPage.jsx'));
const CustomerHistoryPage = lazy(() => import('../features/customerPortal/CustomerHistoryPage.jsx'));
const CustomerIntakeDetailPage = lazy(() => import('../features/customerPortal/CustomerIntakeDetailPage.jsx'));
const CustomerWorkOrderDetailPage = lazy(() => import('../features/customerPortal/CustomerWorkOrderDetailPage.jsx'));
const CustomerQuotationsPage = lazy(() => import('../features/customerPortal/CustomerQuotationsPage.jsx'));
const CustomerQuotationDetailPage = lazy(() => import('../features/customerPortal/CustomerQuotationDetailPage.jsx'));
const CustomerJobDetailPage = lazy(() => import('../features/customerPortal/CustomerJobDetailPage.jsx'));

function AppRouter() {
  const location = useLocation();

  return (
    <RouteChunkErrorBoundary key={location.key}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
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
          <Route path="/admin/technicians/new" element={<TechnicianCreatePage />} />
          <Route path="/admin/technicians/:id" element={<TechnicianDetailPage />} />
          <Route path="/admin/catalogs" element={<CatalogsPage />} />
          <Route path="/admin/jobs" element={<JobsListPage />} />
          <Route path="/admin/jobs/new" element={<JobCreatePage />} />
          <Route path="/admin/jobs/:id" element={<JobDetailPage />} />
          <Route path="/admin/service-reports" element={<ServiceReportsListPage />} />
          <Route path="/admin/service-reports/:id" element={<ServiceReportDetailPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['TECNICO']} />}>
        <Route element={<TechnicianLayout />}>
          <Route path="/technician" element={<TechnicianDashboardPage />} />
          <Route path="/technician/dashboard" element={<Navigate to="/technician" replace />} />
          <Route path="/technician/work-orders" element={<TechnicianWorkOrdersPage />} />
          <Route path="/technician/assigned-work-orders" element={<Navigate to="/technician/work-orders" replace />} />
          <Route path="/technician/work-orders/:id" element={<TechnicianWorkOrderDetailPage />} />
          <Route path="/technician/jobs" element={<TechnicianJobsPage />} />
          <Route path="/technician/jobs/:id" element={<TechnicianJobDetailPage />} />
          <Route path="/technician/service-reports" element={<TechnicianServiceReportsPage />} />
          <Route path="/technician/service-reports/:id" element={<TechnicianServiceReportDetailPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['CLIENTE']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/customer" element={<CustomerDashboardPage />} />
          <Route path="/customer/profile" element={<CustomerProfilePage />} />
          <Route path="/customer/vehicles" element={<CustomerVehiclesPage />} />
          <Route path="/customer/vehicles/:vehicleId" element={<CustomerVehicleDetailPage />} />
          <Route path="/customer/service-history" element={<CustomerHistoryPage />} />
          <Route path="/customer/service-history/:intakeId" element={<CustomerIntakeDetailPage />} />
          <Route path="/customer/work-orders/:workOrderId" element={<CustomerWorkOrderDetailPage />} />
          <Route path="/customer/quotations" element={<CustomerQuotationsPage />} />
          <Route path="/customer/quotations/:workOrderId" element={<CustomerQuotationDetailPage />} />
          <Route path="/customer/jobs/:jobId" element={<CustomerJobDetailPage />} />
        </Route>
      </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteChunkErrorBoundary>
  );
}

export default AppRouter;
