import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { notificationAPI } from './services/api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import PomodoroPage from './pages/PomodoroPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import VisionTracker from './components/VisionTracker';

function Sidebar() {
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    notificationAPI.getAll().then(res => setUnread(res.data.data.unreadCount)).catch(() => {});
    const interval = setInterval(() => {
      notificationAPI.getAll().then(res => setUnread(res.data.data.unreadCount)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tasks', label: 'Tasks', icon: '📋' },
    { path: '/pomodoro', label: 'Pomodoro', icon: '🍅' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🍅</div>
        <h1>Pomodoro</h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          {unread > 0 && (
            <div style={{
              background: 'var(--accent-danger)', borderRadius: '50%',
              width: 20, height: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, fontWeight: 700
            }}>{unread}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <VisionTracker />
    </div>
  );
}

export default function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => { loadUser(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
