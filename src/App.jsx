import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import PrivateRoute from './components/auth/PrivateRoute';
import DashboardLayout from './components/Layouts/DashboardLayout';
import IssueCertificatePage from './pages/IssueCertificatePage';
import GenerateCertificatePage from './pages/GenerateCertificatePage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Private Routes with nested dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* Nested routes */}
          <Route index element={<DashboardPage />} /> {/* default /dashboard page */}
          <Route path="issue-certificate" element={<IssueCertificatePage />} />
          <Route path="generate-certificate" element={<GenerateCertificatePage/>} />
        </Route>
      </Routes>


         {/* Optional React Footer only for homepage */}
      {location.pathname === "/" && (
        <footer className="text-center bg-gray-50 py-4 text-sm text-gray-600 border-t border-gray-200">
          <strong>Disclaimer:</strong> EduchainX is a demo/prototype created solely
          for <strong>educational and demonstration purposes.</strong> This site does
          not collect, store, or share any personal data. All functionality is
          simulated for research and learning use only.
        </footer>
      )}
    </AuthProvider>

    
  );
}

export default App;
