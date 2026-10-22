import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="navbar" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                AI
              </div>
              <span style={{ fontWeight: '700', fontSize: '1.15rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Career Roadmap
              </span>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive ? '#4f46e5' : '#475569',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/resumes"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive ? '#4f46e5' : '#475569',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              Resumes
            </NavLink>

            <NavLink
              to="/skill-gap"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive ? '#4f46e5' : '#475569',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              Skill Gap
            </NavLink>

            <NavLink
              to="/roadmap"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive ? '#4f46e5' : '#475569',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              Roadmap
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: isActive ? '#4f46e5' : '#475569',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              Profile
            </NavLink>
          </nav>

          {/* User Profile & Logout Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>
                {user?.name || 'Student'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {user?.email || ''}
              </span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: '500',
                color: '#b91c1c',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
              aria-label="Logout"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Outlet for Child Routes */}
      <main style={{ flex: 1, padding: '32px 16px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      {/* Basic Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 24px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', background: '#ffffff' }}>
        <p>AI-Powered Skill Gap Analysis & Personalized Career Roadmap System • B.Tech Major Project</p>
      </footer>
    </div>
  );
};

export default AppLayout;
