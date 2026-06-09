import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/ui/Layout';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Dashboard from './components/dashboard/Dashboard';
import PredictForm from './components/predict/PredictForm';
import PredictionHistory from './components/predict/PredictionHistory';
import Leaderboard from './components/leaderboard/Leaderboard';
import DreamTeam from './components/dreamteam/DreamTeam';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLoginPage from './components/admin/AdminLoginPage';
import { syncCustomPlayers } from './services/playerService';

function AppContent() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    syncCustomPlayers().finally(() => {
      setSynced(true);
    });
  }, []);

  if (!synced) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold tracking-wide text-xs">Syncing player rosters...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Main Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/predict"
        element={
          <ProtectedRoute>
            <Layout>
              <PredictForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/my-predictions"
        element={
          <ProtectedRoute>
            <Layout>
              <PredictionHistory />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Leaderboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dream-team"
        element={
          <ProtectedRoute>
            <Layout>
              <DreamTeam />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Redirect all unmatched routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
