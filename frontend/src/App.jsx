// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StoreList from './pages/StoreList';
import OwnerDashboard from './pages/OwnerDashboard';
import { getToken, getUserRole } from './utils/auth';

// Simple protected route component
function Protected({ children, roles }) {
  const token = getToken();
  const role = getUserRole();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <Protected roles={['admin']}>
              <AdminDashboard />
            </Protected>
          }
        />
        <Route
          path="/stores"
          element={
            <Protected roles={['user', 'owner', 'admin']}>
              <StoreList />
            </Protected>
          }
        />
        <Route
          path="/owner"
          element={
            <Protected roles={['owner']}>
              <OwnerDashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
