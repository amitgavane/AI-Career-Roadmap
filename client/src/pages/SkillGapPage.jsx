import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { MatchGapGauge, CategoryBreakdownChart, StatCard, PriorityBadge, PriorityDistributionChart } from '../components/SkillVisualizations';

export const SkillGapPage = () => {
  const navigate = useNavigate();

  const [jobRoles, setJobRoles] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Load available roles and uploaded resumes
  const fetchData = async () => {
    try {
      setLoadingInitial(true);
      setError(null);

      const [rolesRes, resumesRes] = await Promise.all([
        apiClient.get('/skill-gap/roles'),
        apiClient.get('/resumes'),
      ]);

      if (rolesRes.data?.roles) {
        setJobRoles(rolesRes.data.roles);
        if (rolesRes.data.roles.length > 0) {
          setSelectedRoleId(rolesRes.data.roles[0]._id || rolesRes.data.roles[0].id);
        }
      }

      if (resumesRes.data?.resumes) {
        setResumes(resumesRes.data.resumes);
        // Default to first completed resume if available
        const completedResume = resumesRes.data.resumes.find((r) => r.extractionStatus === 'completed');
        if (completedResume) {
          setSelectedResumeId(completedResume._id);
        } else if (resumesRes.data.resumes.length > 0) {
          setSelectedResumeId(resumesRes.data.resumes[0]._id);
        }
      }

      // Check if user already has past analyses
      try {
        const pastRes = await apiClient.get('/skill-gap/my');
        if (pastRes.data?.analyses && pastRes.data.analyses.length > 0) {
          setAnalysisResult(pastRes.data.analyses[0]);
        }
      } catch (pastErr) {
        console.warn('No previous analyses found:', pastErr.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to initialize skill gap analysis.');
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run skill gap analysis
  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !selectedRoleId) {
      setError('Please select both a resume and a target job role.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      const res = await apiClient.post('/skill-gap/analyze', {
        resumeId: selectedResumeId,
        jobRoleId: selectedRoleId,
      });

      if (res.data?.success && res.data?.analysis) {
        setAnalysisResult(res.data.analysis);
      } else {
        setError(res.data?.message || 'Skill gap analysis failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error executing skill gap analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedRole = jobRoles.find((r) => (r._id || r.id) === selectedRoleId);
  const selectedResume = resumes.find((r) => r._id === selectedResumeId);

  if (loadingInitial) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748b' }}>Loading available roles & candidate documents...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>
          Skill Gap Analysis Engine
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
          Evaluate your extracted competencies against target industry roles using semantic skill normalization.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontWeight: '500' }}>
          {error}
        </div>
      )}

      {/* Selection Control Panel */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <form onSubmit={handleRunAnalysis}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Resume Selector */}
            <div>
              <label htmlFor="resumeSelect" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                1. Select Evaluated Resume
              </label>
              {resumes.length === 0 ? (
                <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', color: '#b91c1c' }}>
                  No resumes uploaded. Please upload a resume first.
                </div>
              ) : (
                <select
                  id="resumeSelect"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.originalName} ({r.extractionStatus})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Job Role Selector */}
            <div>
              <label htmlFor="roleSelect" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                2. Select Target Job Role
              </label>
              <select
                id="roleSelect"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
              >
                {jobRoles.map((role) => (
                  <option key={role._id || role.id} value={role._id || role.id}>
                    {role.title} ({role.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Role Metadata Card */}
          {selectedRole && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b' }}>
                  {selectedRole.title}
                </span>
                <span className="badge badge-primary">{selectedRole.industryDemand || 'High'} Demand</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                {selectedRole.description || 'Target engineering job role requirements.'}
              </p>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '6px' }}>
                Level: {selectedRole.typicalExperienceLevel || 'Entry Level / Fresher'} • Skills Evaluated: {selectedRole.requiredSkills?.length || 0}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={analyzing || resumes.length === 0}
              className="btn"
              style={{ padding: '11px 28px', fontSize: '0.95rem', fontWeight: '600' }}
            >
              {analyzing ? 'Evaluating Skill Gap Matrix...' : 'Run Skill Gap Analysis'}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Result Display */}
      {analysisResult ? (
        <div>
          {/* Top Level Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              icon="🎯"
              label="Role Match"
              value={`${analysisResult.overallMatchPercentage}%`}
              subtext="Normalized skill alignment"
              color="#059669"
              bg="#ecfdf5"
            />
            <StatCard
              icon="⚡"
              label="Skill Gap"
              value={`${analysisResult.overallGapPercentage}%`}
              subtext="Deficiencies to bridge"
              color="#dc2626"
              bg="#fef2f2"
            />
            <StatCard
              icon="✓"
              label="Skills Matched"
              value={analysisResult.matchedCount ?? analysisResult.matchedSkills?.length ?? 0}
              subtext="Fully possessed skills"
              color="#2563eb"
              bg="#eff6ff"
            />
            <StatCard
              icon="🔄"
              label="Partial Skills"
              value={analysisResult.partialCount ?? analysisResult.partiallyMatchedSkills?.length ?? 0}
              subtext="Transferable foundational skills"
              color="#d97706"
              bg="#fffbeb"
            />
            <StatCard
              icon="⚠️"
              label="Missing Skills"
              value={analysisResult.missingCount ?? analysisResult.missingSkills?.length ?? 0}
              subtext="High priority learning targets"
              color="#7c3aed"
              bg="#f5f3ff"
            />
          </div>

          {/* Visualizations Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Match vs Gap Radial Gauge */}
            <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
                Overall Role Readiness
              </h3>
              <MatchGapGauge
                matchPercentage={analysisResult.overallMatchPercentage}
                gapPercentage={analysisResult.overallGapPercentage}
                size={190}
              />
            </div>

            {/* Category Breakdown Chart */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
                Competency by Technology Category
              </h3>
              <CategoryBreakdownChart categoryBreakdown={analysisResult.categoryBreakdown} />
            </div>
          </div>

          {/* Roadmap Generation Call-to-Action */}
          <div style={{ background: 'linear-gradient(135deg, #312e81, #4338ca)', borderRadius: '12px', padding: '24px', color: '#ffffff', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>
                Ready to bridge your {analysisResult.missingCount || analysisResult.missingSkills?.length || 0} skill gaps?
              </h3>
              <p style={{ color: '#c7d2fe', fontSize: '0.9rem', margin: 0 }}>
                Generate your personalized, prerequisite-ordered learning roadmap now.
              </p>
            </div>
            <button
              onClick={() => navigate('/roadmap', { state: { analysisId: analysisResult.id || analysisResult._id } })}
              className="btn"
              style={{ backgroundColor: '#ffffff', color: '#312e81', fontWeight: '700', padding: '12px 24px', fontSize: '0.95rem' }}
            >
              Generate Personalized Roadmap →
            </button>
          </div>

          {/* Detailed Skill Classification Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Missing Skills (Highest Priority) */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> Missing Skills ({analysisResult.missingSkills?.length || 0})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ranked by Weight & Priority</span>
              </div>

              {analysisResult.missingSkills?.length === 0 ? (
                <p style={{ color: '#059669', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No missing skills found. You satisfy all core role requirements!
                </p>
              ) : (
                <>
                  <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#fff5f5', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Skill Gap Priority Distribution:
                    </span>
                    <PriorityDistributionChart missingSkills={analysisResult.missingSkills} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {analysisResult.missingSkills?.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fff5f5',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#991b1b' }}>
                            {s.skillName || s.skill}
                          </span>
                          <PriorityBadge importance={s.importance} />
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
                          {s.reasoning || s.reason || `Required skill with weight ${s.weight}/5.`}
                        </p>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #fee2e2', paddingTop: '8px', marginTop: '6px' }}>
                        <span>Weight: {s.weight}/5</span>
                        <span>Priority Rank: #{s.priorityRank || idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
              )}
            </div>

            {/* Partially Matched Skills */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3730a3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔄</span> Partially Matched Skills ({analysisResult.partiallyMatchedSkills?.length || 0})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Transferable Knowledge Available</span>
              </div>

              {analysisResult.partiallyMatchedSkills?.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No partial matches detected.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {analysisResult.partiallyMatchedSkills?.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #c7d2fe',
                        backgroundColor: '#f5f7ff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#3730a3' }}>
                          {s.targetSkill || s.skill}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4f46e5' }}>
                          {Math.round((s.similarityScore || 0.7) * 100)}% Match
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '8px' }}>
                        {s.recommendationNote || `Found related skill '${s.candidateSkillFound}'.`}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Candidate Skill: <strong>{s.candidateSkillFound}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fully Matched Skills */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span> Fully Matched Skills ({analysisResult.matchedSkills?.length || 0})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified Competencies</span>
              </div>

              {analysisResult.matchedSkills?.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No exact matches found. Review missing skills above.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {analysisResult.matchedSkills?.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#065f46', fontSize: '0.9rem' }}>
                        {s.skillName || s.skill}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '8px' }}>
                        {s.matchType || 'exact'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            No Skill Gap Analysis Performed Yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 20px auto' }}>
            Select your uploaded resume and target job role above, then click <strong>"Run Skill Gap Analysis"</strong> to generate your readiness metrics.
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillGapPage;
