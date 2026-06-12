import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

// Lazy Loaded Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const FileDetailPage = lazy(() => import('./pages/FileDetailPage'));
const StagePage = lazy(() => import('./pages/StagePage'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const ExportPage = lazy(() => import('./pages/ExportPage'));
const HealthDashboard = lazy(() => import('./pages/Admin/HealthDashboard'));
const ManageRoles = lazy(() => import('./pages/Admin/ManageRoles'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));

// Loading Fallback
const PageSkeleton = () => (
  <div className="p-4 w-100">
    <div className="glass-card p-5 animate-pulse" style={{ height: '200px', background: '#f8fafc' }} />
    <div className="row mt-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="col-md-3">
          <div className="glass-card animate-pulse" style={{ height: '120px', background: '#f8fafc' }} />
        </div>
      ))}
    </div>
  </div>
);

// Route guard
function PrivateRoute({ children, adminOnly = false, modOk = false }) {
  const { user, isAdmin, isModerator } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  // Force password setup on first login
  if (user.first_login && window.location.pathname !== '/setup') {
      return <Navigate to="/setup" replace />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (modOk && !isAdmin && !isModerator) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        <Route path="/setup" element={user ? <SetupPage /> : <Navigate to="/login" replace />} />

        {/* Protected */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />

        <Route path="/file/:visitNumber" element={<PrivateRoute><FileDetailPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Dynamic stage route — covers all 10 stages */}
        <Route path="/stage/:stageName" element={<PrivateRoute><StagePage /></PrivateRoute>} />

        {/* Admin-only */}
        <Route path="/admin/users" element={<PrivateRoute adminOnly><ManageUsers /></PrivateRoute>} />
        <Route path="/admin/logs" element={<PrivateRoute adminOnly><LogsPage /></PrivateRoute>} />
        <Route path="/admin/health" element={<PrivateRoute adminOnly><HealthDashboard /></PrivateRoute>} />
        <Route path="/admin/roles" element={<PrivateRoute adminOnly><ManageRoles /></PrivateRoute>} />

        {/* Admin + Moderator */}
        <Route path="/export" element={<PrivateRoute modOk><ExportPage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

import { ThemeProvider } from './context/ThemeContext';
import { HospitalProvider } from './context/HospitalContext';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <HospitalProvider>
            <Toaster position="top-right" />
            <AppRoutes />
          </HospitalProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
