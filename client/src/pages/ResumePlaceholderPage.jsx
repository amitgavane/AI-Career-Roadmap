import React from 'react';
import { Link } from 'react-router-dom';

export const ResumePlaceholderPage = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 20px auto' }}>
        📄
      </div>

      <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
        Phase 9 Up Next
      </span>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>
        Resume Management & Analysis
      </h1>

      <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', maxWidth: '600px', margin: '16px auto 28px auto' }}>
        The backend resume ingestion and Phase 5 Gemini AI entity extraction services are fully operational. The interactive upload dropzone, document viewer, and extracted entity cards will be enabled in Phase 9.
      </p>

      <div className="card" style={{ maxWidth: '520px', margin: '0 auto 24px auto', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
          Backend Endpoints Ready:
        </h3>
        <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: '#475569', lineHeight: '1.8' }}>
          <li><code>POST /api/resumes/upload</code> (PDF & DOCX ingestion)</li>
          <li><code>POST /api/resumes/:id/extract</code> (AI skill extraction)</li>
          <li><code>GET /api/resumes</code> (Candidate resume repository)</li>
        </ul>
      </div>

      <Link to="/profile" className="btn" style={{ textDecoration: 'none' }}>
        Configure Profile Target Role →
      </Link>
    </div>
  );
};

export default ResumePlaceholderPage;
