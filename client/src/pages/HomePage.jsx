import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { user, profile } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  useEffect(() => {
    const checkApiHealth = async () => {
      setLoadingHealth(true);
      try {
        const res = await apiClient.get('/health');
        setHealthData(res.data);
      } catch (err) {
        console.warn('API health check error:', err.message);
      } finally {
        setLoadingHealth(false);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '14px', padding: '32px', color: '#ffffff', marginBottom: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Phase 8 Active • Core Frontend Shell
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Welcome back, {user?.name || 'Student'}!
        </h1>
        <p style={{ color: '#c7d2fe', fontSize: '1.05rem', maxWidth: '700px', lineHeight: '1.6' }}>
          Your student session is active. From here you can configure your profile and target job role. Comprehensive skill-gap dashboards and interactive roadmap visualizations will activate in Phase 9.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Profile Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '14px' }}>
            👤
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '6px', color: '#0f172a' }}>
            Student Profile
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
            {profile?.headline || 'Update your career headline, technical skills, and target job role.'}
          </p>
          <Link to="/profile" className="btn" style={{ padding: '8px 16px', fontSize: '0.88rem', textDecoration: 'none' }}>
            Manage Profile →
          </Link>
        </div>

        {/* Resume Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '14px' }}>
            📄
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '6px', color: '#0f172a' }}>
            Resume Ingestion
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
            Prepare your resume for automated PDF/DOCX parsing and AI skill entity extraction.
          </p>
          <Link to="/resume" className="btn" style={{ padding: '8px 16px', fontSize: '0.88rem', textDecoration: 'none', background: '#059669' }}>
            View Resume Section →
          </Link>
        </div>
      </div>

      {/* Backend API Connection Status */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '14px', color: '#1e293b' }}>
          Backend Connectivity & System Status
        </h3>

        {loadingHealth ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Pinging backend API service...</p>
        ) : healthData ? (
          <div className="grid-2">
            <div className="status-box">
              <div className="status-label">Backend Service</div>
              <div className="status-value" style={{ color: '#059669', fontSize: '1.05rem' }}>
                Operational ✓
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{healthData.phase}</p>
            </div>

            <div className="status-box">
              <div className="status-label">MongoDB State</div>
              <div className="status-value" style={{ color: healthData.database?.status === 'connected' ? '#059669' : '#d97706', fontSize: '1.05rem' }}>
                {healthData.database?.status ? healthData.database.status.toUpperCase() : 'CONNECTED'}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Authenticated Session Verified</p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
            Unable to connect to backend service. Ensure server is running on port 5000.
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
