import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios'
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

// Main Dashboard Component (The old App content)
const Dashboard = () => {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const { user, logout } = useAuth();

  useEffect(() => {
    axios.get('/api/health')
      .then(res => setHealth(res.data))
      .catch(err => setError(err.message))
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Music Calendar</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Welcome, {user?.name}!</span>
          <button onClick={logout} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'red', color: 'white', border: 'none', borderRadius: '4px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Backend Status:</h2>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {health ? (
          <pre>{JSON.stringify(health, null, 2)}</pre>
        ) : (
          !error && <p>Loading...</p>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
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
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
