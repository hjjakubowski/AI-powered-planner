import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountPage from './pages/AccountPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } />
            <Route path="/board/:id" element={
              <ProtectedRoute>
                <Navigate to="/" replace />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
