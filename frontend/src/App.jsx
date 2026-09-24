import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import { PatientProvider } from './PatientContext.jsx'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import { LanguageProvider } from './LanguageContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PatientPage from './pages/PatientPage.jsx'
import PrescriptionsPage from './pages/PrescriptionsPage.jsx'
import InteractionPage from './pages/InteractionPage.jsx'
import AgentAnalysisPage from './pages/AgentAnalysisPage.jsx'
import FinalReviewPage from './pages/FinalReviewPage.jsx'
import AuditLogPage from './pages/AuditLogPage.jsx'

function ProtectedLayout({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">{children}</div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout><PatientPage /></ProtectedLayout>} />
      <Route path="/prescriptions" element={<ProtectedLayout><PrescriptionsPage /></ProtectedLayout>} />
      <Route path="/interactions" element={<ProtectedLayout><InteractionPage /></ProtectedLayout>} />
      <Route path="/analysis" element={<ProtectedLayout><AgentAnalysisPage /></ProtectedLayout>} />
      <Route path="/review" element={<ProtectedLayout><FinalReviewPage /></ProtectedLayout>} />
      <Route path="/audit-log" element={<ProtectedLayout><AuditLogPage /></ProtectedLayout>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PatientProvider>
          <AppRoutes />
        </PatientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}