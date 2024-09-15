import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Payments from './components/Payments';
import Waivers from './components/Waivers';
import CheckMember from './components/CheckMember';
import AdminPanel from './components/AdminPanel';
// Add this import at the top of your file
import logo from './logo.png'; // Adjust the path as needed

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/waivers" element={<ProtectedRoute><Waivers /></ProtectedRoute>} />
      <Route path="/checkmember" element={<CheckMember />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 max-w-6xl">
        {!isLoginPage && (
          <>
            <div className="flex items-center justify-between py-4">
              <img src={logo} alt="Logo" className="w-12 h-12 mr-4" />
              <Navbar />
            </div>
            <hr className="border-t border-gray-300 my-4" />
          </>
        )}
      </div>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <AppRoutes />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;