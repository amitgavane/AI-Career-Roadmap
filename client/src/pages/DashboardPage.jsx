import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MatchGapGauge,
  CategoryBreakdownChart,
  StatCard,
  PriorityBadge,
  ProgressBar,
} from '../components/SkillVisualizations';

export const DashboardPage = () => {
  const { user, profile, refreshUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [resumes, setResumes] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [latestRoadmap, setLatestRoadmap] = useState(null);

  const [uploadingResume, setUploadingResume] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  // Fetch all dashboard context
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Concurrently fetch resumes, job roles, past analyses, and roadmaps
      const [resumesRes, rolesRes, analysesRes, roadmapsRes] = await Promise.all([
        apiClient.get('/resumes').catch(() => ({ data: { resumes: [] } })),
        apiClient.get('/skill-gap/roles').catch(() => ({ data: { roles: [] } })),
        apiClient.get('/skill-gap/my').catch(() => ({ data: { analyses: [] } })),
        apiClient.get('/roadmaps').catch(() => ({ data: { roadmaps: [] } })),
      ]);

      const fetchedResumes = resumesRes.data?.resumes || [];
      const fetchedRoles = rolesRes.data?.roles || [];
      const fetchedAnalyses = analysesRes.data?.analyses || [];
      const fetchedRoadmaps = roadmapsRes.data?.roadmaps || [];

      setResumes(fetchedResumes);
      setJobRoles(fetchedRoles);

      // Set target role from profile or first analysis or first role
      if (profile?.targetRoleId?._id || profile?.targetRoleId) {
        setSelectedRoleId(profile.targetRoleId._id || profile.targetRoleId);
      } else if (fetchedAnalyses.length > 0 && fetchedAnalyses[0].targetRole?.id) {
        setSelectedRoleId(fetchedAnalyses[0].targetRole.id);
      } else if (fetchedRoles.length > 0) {
        setSelectedRoleId(fetchedRoles[0]._id || fetchedRoles[0].id);
      }

      if (fetchedAnalyses.length > 0) {
        setLatestAnalysis(fetchedAnalyses[0]);
      }

      if (fetchedRoadmaps.length > 0) {
        setLatestRoadmap(fetchedRoadmaps[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Target Role Quick Update
  const handleRoleChange = async (newRoleId) => {
    setSelectedRoleId(newRoleId);
    try {
      await apiClient.patch('/profile', { targetRoleId: newRoleId });
      if (refreshUser) refreshUser();
      setSuccessMessage('Target job role updated.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.warn('Failed to update target role in profile:', err.message);
    }
  };

  // Quick Resume Upload from Dashboard
  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage('');

    // Validations consistent with Phase 4
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx'].includes(fileExt)) {
      setError('Only PDF (.pdf) and Word (.docx) documents are permitted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds maximum 5 MB limit.');
      return;
    }

    try {
      setUploadingResume(true);
      const formData = new FormData();
      formData.append('resume', file);

      const res = await apiClient.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.resume) {
        const newResume = res.data.resume;
        setSuccessMessage(`Resume "${file.name}" uploaded successfully!`);

        // Automatically trigger AI extraction for smooth user journey
        try {
          await apiClient.post(`/resumes/${newResume.id || newResume._id}/extract`);
        } catch (extractErr) {
          console.warn('Extraction queued:', extractErr.message);
        }

        await loadDashboardData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Resume upload failed.');
    } finally {
      setUploadingResume(false);
    }
  };

  // Run Skill Gap Analysis directly from Dashboard
  const handleQuickRunAnalysis = async () => {
    if (!selectedRoleId) {
      setError('Please select a target job role.');
      return;
    }
    if (resumes.length === 0) {
      setError('Please upload a resume first.');
      return;
    }

    // Pick first completed resume or first resume
    const targetResume = resumes.find((r) => r.extractionStatus === 'completed') || resumes[0];

    try {
      setRunningAnalysis(true);
      setError(null);
      setSuccessMessage('');

      const res = await apiClient.post('/skill-gap/analyze', {
        resumeId: targetResume._id,
        jobRoleId: selectedRoleId,
      });

      if (res.data?.success && res.data?.analysis) {
        setLatestAnalysis(res.data.analysis);
        setSuccessMessage('Skill gap analysis completed successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Skill gap analysis failed.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const selectedRole = jobRoles.find((r) => (r._id || r.id) === selectedRoleId);
  const activeResume = resumes[0];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748b' }}>Loading student career dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Notifications */}
      {successMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#065f46', fontWeight: '500' }}>
          {successMessage}
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontWeight: '500' }}>
          {error}
        </div>
      )}

      {/* TOP BANNER / STUDENT HERO */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: '#ffffff',
          marginBottom: '28px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Student Career Control Center
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Welcome, {user?.name || 'Student'}!
            </h1>
            <p style={{ color: '#c7d2fe', fontSize: '1rem', maxWidth: '600px' }}>
              {profile?.headline || 'Aspiring Software Engineer • Track your skills, close your gaps, and follow your career roadmap.'}
            </p>
          </div>

          {/* Target Role Selector in Hero */}
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '18px 20px', borderRadius: '12px', minWidth: '280px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <label htmlFor="heroRoleSelect" style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe', fontWeight: '700', marginBottom: '6px' }}>
              🎯 Target Job Role
            </label>
            <select
              id="heroRoleSelect"
              value={selectedRoleId}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#ffffff',
                color: '#1e1b4b',
                outline: 'none',
              }}
            >
              {jobRoles.map((role) => (
                <option key={role._id || role.id} value={role._id || role.id}>
                  {role.title} ({role.department})
                </option>
              ))}
            </select>
            {selectedRole && (
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#e0e7ff', display: 'flex', justifyContent: 'space-between' }}>
                <span>Demand: <strong>{selectedRole.industryDemand || 'High'}</strong></span>
                <span>Req. Skills: <strong>{selectedRole.requiredSkills?.length || 0}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* METRIC STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          icon="🎯"
          label="Skill Match"
          value={latestAnalysis ? `${latestAnalysis.overallMatchPercentage}%` : 'N/A'}
          subtext={latestAnalysis ? 'Aligned with target role' : 'Run analysis below'}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatCard
          icon="⚡"
          label="Skill Gap"
          value={latestAnalysis ? `${latestAnalysis.overallGapPercentage}%` : 'N/A'}
          subtext={latestAnalysis ? 'Gaps to bridge' : 'Run analysis below'}
          color="#dc2626"
          bg="#fef2f2"
        />
        <StatCard
          icon="📄"
          label="Resumes Uploaded"
          value={resumes.length}
          subtext={activeResume ? `${activeResume.extractionStatus}` : 'No resume uploaded'}
          color="#4f46e5"
          bg="#eef2ff"
        />
        <StatCard
          icon="🗺️"
          label="Roadmap Progress"
          value={latestRoadmap ? `${latestRoadmap.overallProgress ?? latestRoadmap.progressPercentage ?? 0}%` : '0%'}
          subtext={latestRoadmap ? `${latestRoadmap.status || 'Active'}` : 'Generate roadmap below'}
          color="#7c3aed"
          bg="#f5f3ff"
        />
      </div>

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* LEFT COLUMN: Skill Overview & Visualizations */}
        <div>
          <div className="card" style={{ height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                Skill Gap Overview
              </h2>
              <Link to="/skill-gap" style={{ fontSize: '0.82rem', color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
                Full Analysis →
              </Link>
            </div>

            {latestAnalysis ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <MatchGapGauge
                    matchPercentage={latestAnalysis.overallMatchPercentage}
                    gapPercentage={latestAnalysis.overallGapPercentage}
                    size={180}
                  />
                </div>

                {/* Category Breakdown */}
                {latestAnalysis.categoryBreakdown && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                      Competency by Category
                    </span>
                    <CategoryBreakdownChart categoryBreakdown={latestAnalysis.categoryBreakdown} />
                  </div>
                )}

                {/* Quick Gap Breakdown Chips */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                    <span><strong>Matched:</strong> {latestAnalysis.matchedCount ?? latestAnalysis.matchedSkills?.length ?? 0}</span>
                    <span><strong>Partial:</strong> {latestAnalysis.partialCount ?? latestAnalysis.partiallyMatchedSkills?.length ?? 0}</span>
                    <span><strong>Missing:</strong> {latestAnalysis.missingCount ?? latestAnalysis.missingSkills?.length ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                  No skill-gap analysis completed yet for this target role.
                </p>
                <button
                  type="button"
                  onClick={handleQuickRunAnalysis}
                  disabled={runningAnalysis || resumes.length === 0}
                  className="btn"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  {runningAnalysis ? 'Analyzing...' : 'Run Skill Gap Analysis'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Roadmap & Immediate Next Steps */}
        <div>
          <div className="card" style={{ height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                Personalized Learning Roadmap
              </h2>
              <Link to="/roadmap" style={{ fontSize: '0.82rem', color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
                View Full Roadmap →
              </Link>
            </div>

            {latestRoadmap ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>
                      {latestRoadmap.title}
                    </span>
                    <span className="badge badge-primary">{latestRoadmap.status || 'Active'}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {latestRoadmap.estimatedDurationWeeks || 8} weeks • {latestRoadmap.weeklyHoursCommitment || 15} hrs/wk • {latestRoadmap.milestones?.length || 0} stages
                  </p>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <ProgressBar
                    progress={latestRoadmap.overallProgress ?? latestRoadmap.progressPercentage ?? 0}
                    color="#4f46e5"
                    height={10}
                    showLabel={true}
                  />
                </div>

                {/* Stages List Preview */}
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Milestone Stages:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {latestRoadmap.milestones?.slice(0, 3).map((ms, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#1e293b' }}>
                          Stage {ms.milestoneNumber || idx + 1}: {ms.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {ms.targetWeeks} • {ms.learningModules?.length || 0} modules
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          backgroundColor: ms.status === 'COMPLETED' ? '#ecfdf5' : '#f1f5f9',
                          color: ms.status === 'COMPLETED' ? '#065f46' : '#64748b',
                        }}
                      >
                        {ms.status || 'NOT_STARTED'}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/roadmap"
                  className="btn"
                  style={{ width: '100%', textDecoration: 'none', textAlign: 'center', padding: '10px', fontSize: '0.9rem' }}
                >
                  Continue Learning Path →
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Generate your personalized step-by-step roadmap to start learning.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/roadmap', { state: { analysisId: latestAnalysis?.id || latestAnalysis?._id } })}
                  className="btn"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  Generate Roadmap →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK WORKFLOW CARDS (RESUME, GAP, ROADMAP, PROFILE) */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
        Quick Workflow Actions
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Card 1: Resume Upload / Ingestion */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '12px' }}>
            📄
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Resume Ingestion
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '14px' }}>
            {resumes.length > 0
              ? `${resumes.length} resume(s) uploaded. Extraction: ${activeResume?.extractionStatus}.`
              : 'Upload your PDF or DOCX resume to extract competencies.'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/resumes" className="btn" style={{ padding: '6px 14px', fontSize: '0.82rem', textDecoration: 'none', background: '#059669' }}>
              Manage Resumes
            </Link>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                fontSize: '0.82rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                background: '#ffffff',
                color: '#334155',
                fontWeight: '500',
              }}
            >
              {uploadingResume ? 'Uploading...' : 'Quick Upload'}
              <input type="file" accept=".pdf,.docx" onChange={handleQuickUpload} style={{ display: 'none' }} disabled={uploadingResume} />
            </label>
          </div>
        </div>

        {/* Card 2: Skill Gap Engine */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '12px' }}>
            ⚡
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Skill Gap Engine
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '14px' }}>
            Evaluate your extracted skills against {selectedRole?.title || 'target job role'} with normalized matching.
          </p>
          <Link to="/skill-gap" className="btn" style={{ padding: '6px 14px', fontSize: '0.82rem', textDecoration: 'none', background: '#2563eb' }}>
            Evaluate Skill Gap →
          </Link>
        </div>

        {/* Card 3: Career Roadmap */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '12px' }}>
            🗺️
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Learning Roadmap
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '14px' }}>
            {latestRoadmap
              ? `${latestRoadmap.overallProgress ?? 0}% completed • ${latestRoadmap.milestones?.length || 0} stages`
              : 'Generate an ordered curriculum with projects and resources.'}
          </p>
          <Link to="/roadmap" className="btn" style={{ padding: '6px 14px', fontSize: '0.82rem', textDecoration: 'none', background: '#7c3aed' }}>
            {latestRoadmap ? 'View Roadmap →' : 'Create Roadmap →'}
          </Link>
        </div>

        {/* Card 4: Student Profile */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '12px' }}>
            👤
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Student Profile
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '14px' }}>
            Configure professional bio, social links, verified skills, and career preferences.
          </p>
          <Link to="/profile" className="btn" style={{ padding: '6px 14px', fontSize: '0.82rem', textDecoration: 'none' }}>
            Edit Profile →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
