import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import FileUpload from '../pages/FileUpload';
import ApiKeys from '../pages/ApiKeys';
import UserQuery from '../pages/UserQuery';
import Subscription from '../pages/Subscription';
import Settings from '../pages/Settings';

/**
 * ProtectedRoute Guard:
 * Prevents unauthenticated users from accessing any route without logging in.
 * If no authentication token exists in localStorage, redirects to /login.
 */
export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('rag_auth_token');
  const location = useLocation();

  if (!token) {
    // User is not authenticated -> redirect to login immediately
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

/**
 * PublicRoute Guard:
 * If user is already authenticated and visits /login, redirect to /dashboard.
 */
export function PublicRoute({ children }) {
  const token = localStorage.getItem('rag_auth_token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Landing Page with provided prebuilt UI hero section */}
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />

      {/* 2. Public Auth Entrypoint */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />


      {/* 2. Strictly Protected Dashboard Routes (Login required) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/file-upload"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <FileUpload />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={<Navigate to="/file-upload" replace />}
      />
      <Route
        path="/api-keys"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ApiKeys />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/api-key"
        element={<Navigate to="/api-keys" replace />}
      />
      <Route
        path="/user-query"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UserQuery />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Subscription />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* 3. Fallback Route */}
      <Route
        path="*"
        element={
          localStorage.getItem('rag_auth_token') ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

    </Routes>
  );
}

export default AppRoutes;
