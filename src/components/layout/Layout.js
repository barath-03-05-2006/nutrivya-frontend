import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authAPI } from '../../services/api';
import {
  LayoutDashboard, UtensilsCrossed, TrendingUp, Users,
  Bell, Plus, LogOut, ChevronLeft, ChevronRight,
  UserPlus, UserCircle, Menu, X, BookOpen
} from 'lucide-react';
import './Layout.css';

const clientNav = [
  { path: '/client', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/client/meals', label: "Today's Meals", icon: UtensilsCrossed },
  { path: '/client/my-plans', label: 'My Plans', icon: BookOpen },
  { path: '/client/progress', label: 'My Progress', icon: TrendingUp },
  { path: '/client/profile', label: 'My Profile', icon: UserCircle },
];

const dietitianNav = [
  { path: '/dietitian', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dietitian/clients', label: 'Client Overview', icon: Users },
  { path: '/dietitian/manage-clients', label: 'Manage Clients', icon: UserPlus },
  { path: '/dietitian/create-meal-plan', label: 'Create Meal Plan', icon: Plus },
  { path: '/dietitian/alerts', label: 'Alerts', icon: Bell },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const nav = user?.role === 'DIETITIAN' ? dietitianNav : clientNav;
  const isDietitian = user?.role === 'DIETITIAN';

  const handleLogout = () => { logout(); navigate('/login'); };
  const sendReset = async () => {
    try {
      await authAPI.forgotPassword(user?.email);
      setResetSent(true);
      addToast('Password reset link sent to your email!', 'success');
    } catch { addToast('Failed to send reset link', 'error'); }
  };
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <img src="/logo.png" alt="Nutrivya" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          Nutrivya
        </div>
        <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Nutrivya" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            {!collapsed && <span className="logo-text">Nutrivya</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          {/* Mobile close - visible only on mobile via CSS */}
          <button className="hamburger" onClick={closeMobile} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{user?.fullName}</div>
              <div className="user-role" style={{ color: isDietitian ? '#2563EB' : '#22C55E' }}>
                {isDietitian ? 'Dietitian' : 'Client'}
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}
              className={`nav-item ${location.pathname === path ? 'active' : ''}`}
              onClick={closeMobile}>
              <Icon size={17} />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        {!collapsed && (
          <button onClick={sendReset} disabled={resetSent} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', margin: '0 10px 4px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: resetSent ? 'default' : 'pointer', fontFamily: 'var(--font)' }}>
            <span style={{ fontSize: 14 }}>🔑</span>
            <span>{resetSent ? '✓ Reset link sent!' : 'Reset Password'}</span>
          </button>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={17} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </aside>

      <main className="main-content">
        <div className="content-wrapper fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
