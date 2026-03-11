import { Routes, Route, Navigate } from 'react-router-dom'

// Auth
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import OTPVerify      from './pages/auth/OTPVerify'
import ForgotPassword from './pages/auth/ForgotPassword'

// User pages
import Dashboard from './pages/user/Dashboard'
import Statement from './pages/user/Statement'
import Transfer  from './pages/user/Transfer'
import UPI       from './pages/user/UPI'
import Loans     from './pages/user/Loans'
import Profile        from './pages/user/Profile'
import ChangePassword from './pages/user/ChangePassword'
import Chat      from './pages/user/Chat'
import Cards     from './pages/user/Cards'
import AddMoney  from './pages/user/AddMoney'

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard'
import UserManagement    from './pages/admin/UserManagement'
import AdminTransactions from './pages/admin/AdminTransactions'
import LoanManagement    from './pages/admin/LoanManagement'
import CardManagement    from './pages/admin/CardManagement'
import Reports           from './pages/admin/Reports'

const Private = ({ children, adminOnly = false }) => {
  const token = sessionStorage.getItem('access_token')
  const user  = JSON.parse(sessionStorage.getItem('user') || 'null')
  if (!token || !user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/verify-otp"      element={<OTPVerify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* User */}
      <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
      <Route path="/statement" element={<Private><Statement /></Private>} />
      <Route path="/transfer"  element={<Private><Transfer /></Private>} />
      <Route path="/upi"       element={<Private><UPI /></Private>} />
      <Route path="/cards"     element={<Private><Cards /></Private>} />
      <Route path="/add-money"  element={<Private><AddMoney /></Private>} />
      <Route path="/loans"     element={<Private><Loans /></Private>} />
      <Route path="/profile"          element={<Private><Profile /></Private>} />
      <Route path="/change-password" element={<Private><ChangePassword /></Private>} />
      <Route path="/chat"      element={<Private><Chat /></Private>} />

      {/* Admin */}
      <Route path="/admin"               element={<Private adminOnly><AdminDashboard /></Private>} />
      <Route path="/admin/users"         element={<Private adminOnly><UserManagement /></Private>} />
      <Route path="/admin/transactions"  element={<Private adminOnly><AdminTransactions /></Private>} />
      <Route path="/admin/loans"         element={<Private adminOnly><LoanManagement /></Private>} />
      <Route path="/admin/cards"         element={<Private adminOnly><CardManagement /></Private>} />
      <Route path="/admin/reports"       element={<Private adminOnly><Reports /></Private>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
