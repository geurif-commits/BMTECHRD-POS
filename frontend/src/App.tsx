import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { LicenseExpiredPage } from './pages/LicenseExpiredPage';
import { WaiterPage } from './pages/WaiterPage';
import { KitchenPage } from './pages/KitchenPage';
import { BarPage } from './pages/BarPage';
import { CashierPage } from './pages/CashierPage';
import { DashboardPage } from './pages/DashboardPage';
import { BusinessSettingsPage } from './pages/BusinessSettingsPage';
// @ts-ignore
import ProtectedRoute from './auth/ProtectedRoute';

import DashboardLayout from './layouts/DashboardLayout';

// Admin Pages
import { ProductsPage } from './pages/admin/ProductsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { TablesManagementPage } from './pages/admin/TablesManagementPage';
import { InventoryReportsPage } from './pages/admin/InventoryReportsPage';
import { AdvancedReportsPage } from './pages/admin/ReportsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { CashShiftPage } from './pages/CashShiftPage';
import { ActivationPage } from './pages/ActivationPage';
import { LandingPage } from './pages/LandingPage';

// Setup
import { SetupWizard } from './pages/setup/SetupWizard';
import { useEffect } from 'react';
import { useStore } from './stores/useStore';
import api from './stores/api';

export default function App() {
  const { deviceId, setDeviceId, user, business, setBusiness } = useStore();

  useEffect(() => {
    // Generate deviceId if not exists
    if (!deviceId) {
      const newId = 'BMT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setDeviceId(newId);
    }

    // Fetch business info if logged in but business is null
    const fetchBusiness = async () => {
      if (user && !business) {
        try {
          const { data } = await api.get('/business/settings');
          setBusiness(data.data);
        } catch (error) {
          console.error('Error fetching business settings:', error);
        }
      }
    };

    fetchBusiness();
  }, [user, business, deviceId, setDeviceId, setBusiness]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/license-expired" element={<LicenseExpiredPage />} />
      <Route path="/activar" element={<ActivationPage />} />
      <Route path="/registro" element={<ActivationPage />} />
      <Route path="/setup" element={<SetupWizard />} />

      {/* Rutas protegidas con Layout */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/waiter"
          element={
            <ProtectedRoute roles={['CAMARERO', 'ADMIN', 'SUPERVISOR']}>
              <WaiterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['COCINERO', 'ADMIN', 'SUPERVISOR']}>
              <KitchenPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bar"
          element={
            <ProtectedRoute roles={['BARTENDER', 'ADMIN', 'SUPERVISOR']}>
              <BarPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier"
          element={
            <ProtectedRoute roles={['CAJERO', 'ADMIN', 'SUPERVISOR']}>
              <CashierPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['OWNER', 'ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER', 'SUPERVISOR']}>
              <BusinessSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER', 'SUPERVISOR']}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER', 'SUPERVISOR']}>
              <TablesManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/inventory-reports"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER', 'SUPERVISOR']}>
              <InventoryReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER']}>
              <AdvancedReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER']}>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/cash"
          element={
            <ProtectedRoute roles={['ADMIN', 'OWNER', 'CAJERO']}>
              <CashShiftPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
