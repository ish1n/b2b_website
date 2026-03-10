import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MonthOrders from "./pages/MonthOrders";
import DayOrders from "./pages/DayOrders";
import TenantMonths from "./pages/TenantMonths";
import TenantDays from "./pages/TenantDays";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/orders/months" element={<ProtectedRoute><MonthOrders /></ProtectedRoute>} />
          <Route path="/orders/months/:month" element={<ProtectedRoute><DayOrders /></ProtectedRoute>} />
          <Route path="/tenants/:tenantName/months" element={<ProtectedRoute><TenantMonths /></ProtectedRoute>} />
          <Route path="/tenants/:tenantName/months/:month" element={<ProtectedRoute><TenantDays /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
