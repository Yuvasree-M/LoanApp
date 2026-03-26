import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, MapPin, UserPlus, CheckSquare, PlusCircle,
  List, CheckCircle, Wallet, BarChart2, Settings, Receipt, LogOut,
  ClipboardList, FileText, TrendingUp, Menu, X, IndianRupee
} from 'lucide-react';

const MENU = {
  ADMIN: [
    { section: 'Overview', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'Users', items: [
      { to: '/admin/users', icon: Users, label: 'Manage Users' },
      { to: '/admin/areas', icon: MapPin, label: 'Manage Areas' },
    ]},
    { section: 'Finance', items: [
      { to: '/admin/wallet', icon: Wallet, label: 'Main Wallet' },
      { to: '/admin/audit', icon: CheckSquare, label: 'Audit & Transfer' },
      { to: '/admin/expenses', icon: Receipt, label: 'Office Expenses' },
    ]},
    { section: 'Reports', items: [
      { to: '/reports', icon: BarChart2, label: 'Collection Reports' },
      { to: '/reports/aging', icon: TrendingUp, label: 'Aging Report' },
      { to: '/reports/efficiency', icon: TrendingUp, label: 'Agent Efficiency' },
    ]},
    { section: 'System', items: [
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ]},
  ],
  MANAGER: [
    { section: 'Overview', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'Customers', items: [
      { to: '/customers/add', icon: UserPlus, label: 'Add Customer' },
      { to: '/customers/approval', icon: CheckCircle, label: 'Customer Approval' },
    ]},
    { section: 'Loans', items: [
      { to: '/accounts/add', icon: PlusCircle, label: 'Create Loan' },
      { to: '/accounts', icon: List, label: 'All Accounts' },
    ]},
    { section: 'Collections', items: [
      { to: '/collections/verify', icon: CheckSquare, label: 'Verify Collections' },
      { to: '/wallet', icon: Wallet, label: 'My Wallet' },
    ]},
    { section: 'Reports', items: [
      { to: '/reports', icon: BarChart2, label: 'Reports' },
    ]},
  ],
  AREAMANAGER: [
    { section: 'Overview', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'Customers', items: [
      { to: '/customers/add', icon: UserPlus, label: 'Add Customer' },
      { to: '/customers/approval', icon: CheckCircle, label: 'Customer Approval' },
    ]},
    { section: 'Loans', items: [
      { to: '/accounts/add', icon: PlusCircle, label: 'Create Loan' },
      { to: '/accounts', icon: List, label: 'Area Accounts' },
    ]},
    { section: 'Collections', items: [
      { to: '/collections/verify', icon: CheckSquare, label: 'Verify Collections' },
      { to: '/wallet', icon: Wallet, label: 'Area Wallet' },
    ]},
    { section: 'Reports', items: [
      { to: '/reports', icon: BarChart2, label: 'Reports' },
    ]},
  ],
  AGENT: [
    { section: 'Overview', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'Collection', items: [
      { to: '/agent/accounts', icon: List, label: 'My Accounts' },
      { to: '/agent/ledger', icon: ClipboardList, label: 'My Ledger' },
    ]},
  ],
  OFFICESTAFF: [
    { section: 'Overview', items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }] },
    { section: 'Reports', items: [
      { to: '/reports', icon: BarChart2, label: 'Collection Reports' },
      { to: '/reports/aging', icon: TrendingUp, label: 'Aging Report' },
    ]},
    { section: 'View', items: [
      { to: '/accounts', icon: List, label: 'View Accounts' },
    ]},
  ],
};

const ROLE_BADGE = {
  ADMIN: 'badge-admin', MANAGER: 'badge-manager',
  AREAMANAGER: 'badge-areamanager', AGENT: 'badge-agent', OFFICESTAFF: 'badge-officestaff'
};

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menu = MENU[user?.role] || [];
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💰</div>
          <div>
            <h2>Loan MS</h2>
            <span>Management System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menu.map(group => (
            <div key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to} to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.fullName}</div>
              <div className="role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <button
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <h1 className="topbar-title">{title}</h1>
          <span className={`topbar-badge ${ROLE_BADGE[user?.role]}`}>{user?.role}</span>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
