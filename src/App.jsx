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
    </AuthProvider>

    
  );
}

export default App;
