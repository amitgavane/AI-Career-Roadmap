import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { ProgressBar, StatCard, PriorityBadge } from '../components/SkillVisualizations';

export const RoadmapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(location.state?.analysisId || '');
  const [weeklyCommitment, setWeeklyCommitment] = useState(15);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('milestones'); // 'milestones' | 'modules' | 'skills'

  // Fetch student's existing roadmaps and analyses
  const fetchData = async () => {
    try {
      setLoadingInitial(true);
      setError(null);

      const [roadmapsRes, analysesRes] = await Promise.all([
        apiClient.get('/roadmaps'),
        apiClient.get('/skill-gap/my'),
      ]);

      const roadmapList = roadmapsRes.data?.roadmaps || [];
      const analysisList = analysesRes.data?.analyses || [];

      setRoadmaps(roadmapList);
      setAnalyses(analysisList);

      // If state passed an analysisId, check if a roadmap already exists for it
      if (location.state?.analysisId) {
        setSelectedAnalysisId(location.state.analysisId);
        const match = roadmapList.find(
          (r) => (r.analysisId?._id || r.analysisId || r.skillGapAnalysisId) === location.state.analysisId
        );
        if (match) {
          setActiveRoadmap(match);
        } else if (roadmapList.length > 0) {
          setActiveRoadmap(roadmapList[0]);
        }
      } else if (roadmapList.length > 0) {
        setActiveRoadmap(roadmapList[0]);
      } else if (analysisList.length > 0) {
        setSelectedAnalysisId(analysisList[0].id || analysisList[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load career roadmaps.');
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate roadmap action
  const handleGenerateRoadmap = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAnalysisId) {
      setError('Please select a completed Skill Gap Analysis to generate your personalized roadmap.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setSuccessMessage('');

      const res = await apiClient.post('/roadmaps/generate', {
        skillGapAnalysisId: selectedAnalysisId,
        weeklyHoursCommitment: Number(weeklyCommitment) || 15,
      });

      const generated = res.data?.roadmap || res.data?.data?.roadmap;
      if (res.data?.success && generated) {
        setActiveRoadmap(generated);

        const isExisting = Boolean(res.data?.isExisting || res.data?.data?.isExisting);
        if (isExisting) {
          setSuccessMessage('Loaded your existing personalized career roadmap for this analysis.');
        } else {
          setSuccessMessage('Personalized learning roadmap generated successfully!');
        }

        // Refresh roadmaps list
        const refreshListRes = await apiClient.get('/roadmaps');
        if (refreshListRes.data?.roadmaps) {
          setRoadmaps(refreshListRes.data.roadmaps);
        }
      } else {
        setError(res.data?.message || 'Failed to generate roadmap.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error generating career roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  // Switch active roadmap
  const handleSelectRoadmap = async (roadmapId) => {
    try {
      setError(null);
      const res = await apiClient.get(`/roadmaps/${roadmapId}`);
      if (res.data?.roadmap) {
        setActiveRoadmap(res.data.roadmap);
      }
    } catch (err) {
      setError('Failed to load roadmap details.');
    }
  };

  // Update progress for a module or milestone using PATCH /api/roadmaps/:id/progress
  const handleUpdateProgress = async ({ milestoneIndex, moduleIndex, status, progress }) => {
    if (!activeRoadmap) return;
    try {
      setUpdatingProgress(true);
      const payload = { status, progress };
      if (typeof milestoneIndex === 'number') payload.milestoneIndex = milestoneIndex;
      if (typeof moduleIndex === 'number') payload.moduleIndex = moduleIndex;

      const res = await apiClient.patch(`/roadmaps/${activeRoadmap.id || activeRoadmap._id}/progress`, payload);
      if (res.data?.success && res.data?.roadmap) {
        setActiveRoadmap(res.data.roadmap);
        // Also update in list
        setRoadmaps((prev) =>
          prev.map((r) => (r.id === res.data.roadmap.id ? res.data.roadmap : r))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update progress.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  if (loadingInitial) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748b' }}>Loading your personalized career roadmaps...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>
          Personalized Career Roadmap & Learning Path
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
          Follow step-by-step prerequisite stages, verified learning resources, and hands-on milestone projects tailored to your target job role.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#065f46', fontWeight: '500' }}>
          {successMessage}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontWeight: '500' }}>
          {error}
        </div>
      )}

      {/* Roadmap Generator / Switcher Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'end' }}>
          {/* Analysis Selection */}
          <div>
            <label htmlFor="analysisSelect" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Base Skill Gap Analysis
            </label>
            {analyses.length === 0 ? (
              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', color: '#b91c1c' }}>
                No skill gap analyses found. <Link to="/skill-gap" style={{ color: '#4f46e5', fontWeight: '600' }}>Run an analysis first</Link>.
              </div>
            ) : (
              <select
                id="analysisSelect"
                value={selectedAnalysisId}
                onChange={(e) => setSelectedAnalysisId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
              >
                {analyses.map((a) => (
                  <option key={a.id || a._id} value={a.id || a._id}>
                    {a.targetRole?.title || 'Target Role'} ({a.overallMatchPercentage}% Match • {a.missingCount ?? a.missingSkills?.length ?? 0} Gaps)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Weekly Hours Input */}
          <div>
            <label htmlFor="weeklyHours" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Weekly Commitment (Hours/Week)
            </label>
            <input
              id="weeklyHours"
              type="number"
              min="5"
              max="40"
              value={weeklyCommitment}
              onChange={(e) => setWeeklyCommitment(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Generate Action Button */}
          <div>
            <button
              type="button"
              onClick={handleGenerateRoadmap}
              disabled={generating || analyses.length === 0}
              className="btn"
              style={{ width: '100%', padding: '11px 20px', fontSize: '0.95rem', fontWeight: '600' }}
            >
              {generating ? 'Generating Learning Modules...' : 'Generate / Load Roadmap'}
            </button>
          </div>
        </div>

        {/* Existing Roadmaps Quick Switcher Chips */}
        {roadmaps.length > 1 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Saved Roadmaps ({roadmaps.length}):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {roadmaps.map((r) => {
                const isSelected = (activeRoadmap?.id || activeRoadmap?._id) === (r.id || r._id);
                return (
                  <button
                    key={r.id || r._id}
                    type="button"
                    onClick={() => handleSelectRoadmap(r.id || r._id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                      backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                      color: isSelected ? '#3730a3' : '#334155',
                      fontWeight: isSelected ? '600' : '400',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    {r.targetRole?.title || r.title} • {r.overallProgress ?? r.progressPercentage ?? 0}%
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Roadmap Display */}
      {activeRoadmap ? (
        <div>
          {/* Roadmap Header Summary Card */}
          <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', marginBottom: '8px' }}>
                  {activeRoadmap.status || 'NOT_STARTED'}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '6px' }}>
                  {activeRoadmap.title}
                </h2>
                <p style={{ color: '#c7d2fe', fontSize: '0.92rem', maxWidth: '750px', marginTop: '4px' }}>
                  {activeRoadmap.description || 'Custom tailored learning path to master required competencies and prepare for employment.'}
                </p>
              </div>

              {/* Progress Box */}
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '12px', textAlign: 'center', minWidth: '160px' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe', fontWeight: '600' }}>
                  Overall Progress
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2, marginTop: '4px' }}>
                  {activeRoadmap.overallProgress ?? activeRoadmap.progressPercentage ?? 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#e0e7ff', marginTop: '4px' }}>
                  {activeRoadmap.completedMilestonesCount || 0} / {activeRoadmap.milestones?.length || 0} Stages Completed
                </div>
              </div>
            </div>

            {/* Metrics Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#c7d2fe' }}>Duration: </span>
                <strong>{activeRoadmap.estimatedDurationWeeks || 8} Weeks</strong>
              </div>
              <div>
                <span style={{ color: '#c7d2fe' }}>Weekly Study: </span>
                <strong>{activeRoadmap.weeklyHoursCommitment || 15} hrs/week</strong>
              </div>
              <div>
                <span style={{ color: '#c7d2fe' }}>Total Effort: </span>
                <strong>{activeRoadmap.totalEstimatedHours || 0} hrs</strong>
              </div>
              <div>
                <span style={{ color: '#c7d2fe' }}>Prioritized Skills: </span>
                <strong>{activeRoadmap.prioritizedSkills?.length || 0}</strong>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '16px' }}>
              <ProgressBar
                progress={activeRoadmap.overallProgress ?? activeRoadmap.progressPercentage ?? 0}
                color="#10b981"
                height={8}
                showLabel={false}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('milestones')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'milestones' ? '700' : '500',
                color: activeTab === 'milestones' ? '#4f46e5' : '#64748b',
                borderBottom: activeTab === 'milestones' ? '2px solid #4f46e5' : 'none',
                cursor: 'pointer',
              }}
            >
              Stages & Milestones ({activeRoadmap.milestones?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'modules' ? '700' : '500',
                color: activeTab === 'modules' ? '#4f46e5' : '#64748b',
                borderBottom: activeTab === 'modules' ? '2px solid #4f46e5' : 'none',
                cursor: 'pointer',
              }}
            >
              All Learning Modules ({activeRoadmap.modules?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('skills')}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'skills' ? '700' : '500',
                color: activeTab === 'skills' ? '#4f46e5' : '#64748b',
                borderBottom: activeTab === 'skills' ? '2px solid #4f46e5' : 'none',
                cursor: 'pointer',
              }}
            >
              Prioritized Skills ({activeRoadmap.prioritizedSkills?.length || 0})
            </button>
          </div>

          {/* TAB 1: STAGES & MILESTONES */}
          {activeTab === 'milestones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {activeRoadmap.milestones?.map((milestone, mIdx) => {
                const project = milestone.milestoneProject || milestone.practicalProject;
                const isMilestoneCompleted = milestone.status === 'COMPLETED' || milestone.progress === 100;

                return (
                  <div
                    key={mIdx}
                    className="card"
                    style={{
                      borderLeft: `5px solid ${isMilestoneCompleted ? '#10b981' : milestone.status === 'IN_PROGRESS' ? '#4f46e5' : '#cbd5e1'}`,
                      position: 'relative',
                    }}
                  >
                    {/* Stage Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Stage {milestone.milestoneNumber || mIdx + 1} • {milestone.targetWeeks}
                          </span>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: isMilestoneCompleted ? '#ecfdf5' : '#f1f5f9',
                              color: isMilestoneCompleted ? '#065f46' : '#475569',
                              border: `1px solid ${isMilestoneCompleted ? '#a7f3d0' : '#cbd5e1'}`,
                            }}
                          >
                            {milestone.status || 'NOT_STARTED'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                          {milestone.title}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                          {milestone.objective}
                        </p>
                      </div>

                      {/* Milestone Quick Status Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={milestone.status || 'NOT_STARTED'}
                          disabled={updatingProgress}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            const newProg = newStatus === 'COMPLETED' ? 100 : newStatus === 'IN_PROGRESS' ? 50 : 0;
                            handleUpdateProgress({ milestoneIndex: mIdx, status: newStatus, progress: newProg });
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Skills Covered in Stage */}
                    {milestone.skillsCovered && milestone.skillsCovered.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                          Skills Covered:
                        </span>
                        {milestone.skillsCovered.map((sk, sIdx) => (
                          <span key={sIdx} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Learning Modules inside Stage */}
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        📚 Learning Modules ({milestone.learningModules?.length || 0})
                      </h4>

                      {milestone.learningModules?.map((mod, modIdx) => (
                        <div
                          key={modIdx}
                          style={{
                            padding: '16px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>
                                  {mod.title}
                                </span>
                                {mod.skill && (
                                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: '#e0e7ff', color: '#3730a3', fontWeight: '600' }}>
                                    {mod.skill}
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                                <strong>Objective:</strong> {mod.objective || mod.description}
                              </p>
                            </div>

                            {/* Module Progress Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                ⏱️ {mod.estimatedHours || 4} hrs
                              </span>
                              <select
                                value={mod.status || 'NOT_STARTED'}
                                disabled={updatingProgress}
                                onChange={(e) => {
                                  const nStatus = e.target.value;
                                  const nProg = nStatus === 'COMPLETED' ? 100 : nStatus === 'IN_PROGRESS' ? 50 : 0;
                                  handleUpdateProgress({ milestoneIndex: mIdx, moduleIndex: modIdx, status: nStatus, progress: nProg });
                                }}
                                style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                              >
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                            </div>
                          </div>

                          {/* Prerequisites Tags */}
                          {mod.prerequisites && mod.prerequisites.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                              <span>Prerequisites: </span>
                              {mod.prerequisites.map((p, pIdx) => (
                                <span key={pIdx} style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', fontSize: '0.75rem' }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Topics List */}
                          {mod.topics && mod.topics.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Key Topics:</span>
                              <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                                {mod.topics.map((top, tIdx) => (
                                  <li key={tIdx}>{top}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Practice Tasks */}
                          {mod.practiceTasks && mod.practiceTasks.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Practice Tasks:</span>
                              <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                                {mod.practiceTasks.map((task, kIdx) => (
                                  <li key={kIdx}>{task}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Learning Resources */}
                          {mod.resources && mod.resources.length > 0 && (
                            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Verified Resources:</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                {mod.resources.map((res, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '4px 10px',
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      textDecoration: 'none',
                                      fontSize: '0.78rem',
                                      color: '#4f46e5',
                                    }}
                                  >
                                    <span>🔗</span>
                                    <span>{res.title || res.platform || 'Resource'}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({res.type || 'docs'})</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Milestone Project */}
                    {project && (
                      <div style={{ marginTop: '20px', padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🚀</span> Practical Milestone Project: {project.title}
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>
                              {project.difficulty || 'Intermediate'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              ⏱️ {project.estimatedHours || 10} hrs
                            </span>
                          </div>
                        </div>

                        {project.description && (
                          <p style={{ fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '10px' }}>
                            {project.description}
                          </p>
                        )}

                        {project.deliverables && project.deliverables.length > 0 && (
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e40af' }}>Expected Deliverables:</span>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', color: '#1e3a8a', marginTop: '2px' }}>
                              {project.deliverables.map((del, dIdx) => (
                                <li key={dIdx}>{del}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ALL LEARNING MODULES (FLAT VIEW) */}
          {activeTab === 'modules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeRoadmap.modules?.map((mod, idx) => (
                <div key={idx} className="card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4f46e5' }}>Module {idx + 1}</span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{mod.title}</h3>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px' }}>
                        {mod.objective || mod.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{mod.estimatedHours || 4} hours</span>
                      <select
                        value={mod.status || 'NOT_STARTED'}
                        disabled={updatingProgress}
                        onChange={(e) => {
                          const nStatus = e.target.value;
                          const nProg = nStatus === 'COMPLETED' ? 100 : nStatus === 'IN_PROGRESS' ? 50 : 0;
                          handleUpdateProgress({ moduleIndex: idx, status: nStatus, progress: nProg });
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>

                  {mod.topics && mod.topics.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
                      <strong>Topics: </strong> {mod.topics.join(' • ')}
                    </div>
                  )}

                  {mod.resources && mod.resources.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {mod.resources.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '4px 10px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.78rem',
                            color: '#4f46e5',
                          }}
                        >
                          🔗 {res.title || res.platform || 'Resource'} ({res.type || 'docs'})
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PRIORITIZED SKILLS TABLE */}
          {activeTab === 'skills' && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: '#0f172a' }}>
                Skills Prioritization Matrix
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' }}>
                Skills ranked by prerequisite dependency order and industry demand weight.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Rank</th>
                      <th style={{ padding: '10px' }}>Skill</th>
                      <th style={{ padding: '10px' }}>Importance</th>
                      <th style={{ padding: '10px' }}>Weight</th>
                      <th style={{ padding: '10px' }}>Match Type</th>
                      <th style={{ padding: '10px' }}>Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRoadmap.prioritizedSkills?.map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontWeight: '700', color: '#4f46e5' }}>#{s.priorityRank || idx + 1}</td>
                        <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{s.skill}</td>
                        <td style={{ padding: '10px' }}><PriorityBadge importance={s.importance} /></td>
                        <td style={{ padding: '10px' }}>{s.weight}/5</td>
                        <td style={{ padding: '10px', textTransform: 'capitalize' }}>
                          <span style={{ color: s.matchType === 'partial' ? '#d97706' : '#dc2626', fontWeight: '600' }}>
                            {s.matchType}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', fontSize: '0.82rem' }}>{s.reason || 'Curriculum module target'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗺️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            No Career Roadmap Selected
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 20px auto' }}>
            Select an existing Skill Gap Analysis above and click <strong>"Generate / Load Roadmap"</strong> to view your step-by-step learning journey.
          </p>
          <Link to="/skill-gap" className="btn" style={{ textDecoration: 'none' }}>
            Go to Skill Gap Analysis →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
