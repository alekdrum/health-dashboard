import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import UploadPage from './pages/Upload'
import { ReportsPage } from './pages/Reports'
import { ReportDetailPage } from './pages/ReportDetail'
import { RemindersPage } from './pages/Reminders'
import { SettingsPage } from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><ReportDetailPage /></ProtectedRoute>} />
          <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
