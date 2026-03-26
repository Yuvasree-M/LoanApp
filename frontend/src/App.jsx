import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Admin
import Users from './pages/admin/Users';
import Areas from './pages/admin/Areas';
import Settings from './pages/admin/Settings';
import AdminWallet from './pages/admin/Wallet';
import Expenses from './pages/admin/Expenses';

// Manager/Area Manager
import AddCustomer from './pages/manager/AddCustomer';
import CustomerApproval from './pages/manager/CustomerApproval';
import AddAccount from './pages/manager/AddAccount';
import Accounts from './pages/manager/Accounts';
import VerifyCollections from './pages/manager/VerifyCollections';
import MyWallet from './pages/manager/MyWallet';

// Agent
import MyAccounts from './pages/agent/MyAccounts';
import Ledger from './pages/agent/Ledger';

// Reports
import Reports from './pages/reports/Reports';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin/users" element={<PrivateRoute roles={['ADMIN']}><Users /></PrivateRoute>} />
      <Route path="/admin/areas" element={<PrivateRoute roles={['ADMIN']}><Areas /></PrivateRoute>} />
      <Route path="/admin/settings" element={<PrivateRoute roles={['ADMIN']}><Settings /></PrivateRoute>} />
      <Route path="/admin/wallet" element={<PrivateRoute roles={['ADMIN']}><AdminWallet /></PrivateRoute>} />
      <Route path="/admin/expenses" element={<PrivateRoute roles={['ADMIN','MANAGER']}><Expenses /></PrivateRoute>} />

      {/* Customers */}
      <Route path="/customers/add" element={<PrivateRoute roles={['ADMIN','MANAGER','AREAMANAGER','AGENT']}><AddCustomer /></PrivateRoute>} />
      <Route path="/customers/approval" element={<PrivateRoute roles={['ADMIN','MANAGER','AREAMANAGER']}><CustomerApproval /></PrivateRoute>} />

      {/* Accounts */}
      <Route path="/accounts/add" element={<PrivateRoute roles={['ADMIN','MANAGER','AREAMANAGER']}><AddAccount /></PrivateRoute>} />
      <Route path="/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />

      {/* Collections */}
      <Route path="/collections/verify" element={<PrivateRoute roles={['ADMIN','MANAGER','AREAMANAGER']}><VerifyCollections /></PrivateRoute>} />
      <Route path="/wallet" element={<PrivateRoute><MyWallet /></PrivateRoute>} />

      {/* Agent */}
      <Route path="/agent/accounts" element={<PrivateRoute roles={['AGENT']}><MyAccounts /></PrivateRoute>} />
      <Route path="/agent/ledger" element={<PrivateRoute roles={['AGENT']}><Ledger /></PrivateRoute>} />

      {/* Reports */}
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/reports/aging" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/reports/efficiency" element={<PrivateRoute><Reports /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background:'#1b2e45', color:'#f8fafc', border:'1px solid rgba(255,255,255,0.08)', fontFamily:"'DM Sans', sans-serif", fontSize:14 },
            success: { iconTheme: { primary:'#00d4aa', secondary:'#0d1b2a' } },
            error: { iconTheme: { primary:'#e17055', secondary:'#fff' } }
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
