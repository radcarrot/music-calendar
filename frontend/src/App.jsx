import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Artists = lazy(() => import('./pages/Artists'));
const Releases = lazy(() => import('./pages/Releases'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            className: 'bg-[#1a1a1a] border border-white/10 text-white font-display shadow-2xl rounded-xl',
            style: { '--toast-icon-margin-start': '-0.5rem', '--toast-icon-margin-end': '1rem' }
          }}
        />
        <Suspense fallback={
          <div className="h-screen w-full flex items-center justify-center bg-[#050505] text-[#59f20d] font-mono text-xl animate-pulse">
            LOADING ASSETS...
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/artists"
              element={
                <ProtectedRoute>
                  <Artists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/releases"
              element={
                <ProtectedRoute>
                  <Releases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App
