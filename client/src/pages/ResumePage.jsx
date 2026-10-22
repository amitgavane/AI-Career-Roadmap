import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';

export const ResumePage = () => {
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [activeResumeDetails, setActiveResumeDetails] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch list of resumes
  const fetchResumes = async (selectLatest = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/resumes');
      if (res.data?.resumes) {
        setResumes(res.data.resumes);
        if (res.data.resumes.length > 0) {
          const targetId = selectLatest ? res.data.resumes[0]._id : (selectedResumeId || res.data.resumes[0]._id);
          setSelectedResumeId(targetId);
          fetchResumeDetails(targetId);
        } else {
          setActiveResumeDetails(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch resumes.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single resume with extracted text and AI entities
  const fetchResumeDetails = async (resumeId) => {
    if (!resumeId) return;
    try {
      setError(null);
      const res = await apiClient.get(`/resumes/${resumeId}`);
      if (res.data?.resume) {
        setActiveResumeDetails(res.data.resume);
      }
    } catch (err) {
      console.warn('Failed to load resume details:', err.message);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleSelectResume = (id) => {
    setSelectedResumeId(id);
    fetchResumeDetails(id);
  };

  // Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage('');

    // Client-side validations consistent with Phase 4
    const allowedExtensions = ['.pdf', '.docx'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setError('Unsupported file type. Only PDF (.pdf) and Word (.docx) documents are allowed.');
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum allowed resume file size is 5 MB.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('resume', file);

      const res = await apiClient.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success && res.data?.resume) {
        setSuccessMessage(`Resume "${file.name}" uploaded and sanitized successfully!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchResumes(true);
      } else {
        setError(res.data?.message || 'Failed to upload resume.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload resume document.');
    } finally {
      setUploading(false);
    }
  };

  // Trigger Phase 5 AI Entity Extraction
  const handleTriggerAiExtraction = async (resumeId) => {
    if (!resumeId) return;
    try {
      setExtracting(true);
      setError(null);
      setSuccessMessage('');

      const res = await apiClient.post(`/resumes/${resumeId}/extract`);
      if (res.data?.success) {
        setSuccessMessage('AI skill & entity extraction completed successfully!');
        await fetchResumeDetails(resumeId);
        await fetchResumes();
      } else {
        setError(res.data?.message || 'AI extraction failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AI entity extraction error.');
    } finally {
      setExtracting(false);
    }
  };

  // Delete resume handler
  const handleDeleteResume = async (resumeId, originalName) => {
    if (!window.confirm(`Are you sure you want to delete "${originalName}"?`)) return;
    try {
      setError(null);
      setSuccessMessage('');
      const res = await apiClient.delete(`/resumes/${resumeId}`);
      if (res.data?.success) {
        setSuccessMessage(`Resume "${originalName}" deleted successfully.`);
        if (selectedResumeId === resumeId) {
          setSelectedResumeId(null);
          setActiveResumeDetails(null);
        }
        await fetchResumes(true);
      } else {
        setError(res.data?.message || 'Failed to delete resume.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error deleting resume document.');
    }
  };

  const [showRawText, setShowRawText] = useState(false);
  const aiData = activeResumeDetails?.aiExtractedData;

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>
          Resume Ingestion & AI Entity Extraction
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
          Upload your resume document (PDF or DOCX). Our extraction service parses text and identifies technical competencies.
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

      {/* Upload Dropzone Card */}
      <div className="card" style={{ marginBottom: '24px', textAlign: 'center', border: '2px dashed #cbd5e1', padding: '36px 20px', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 14px auto' }}>
          ⬆️
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
          Select or drop your resume file
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
          Accepted formats: <strong>.pdf</strong> or <strong>.docx</strong> (Maximum size: 5 MB)
        </p>

        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn"
          style={{ padding: '10px 24px', fontSize: '0.95rem', fontWeight: '600' }}
        >
          {uploading ? 'Processing & Extracting Text...' : 'Choose File to Upload'}
        </button>
      </div>

      {/* Resumes List & Details Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px auto' }} />
          <p style={{ color: '#64748b' }}>Loading candidate resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#64748b', fontSize: '1rem', fontStyle: 'italic' }}>
            No resumes uploaded yet. Upload a PDF or Word resume above to begin skill gap analysis.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Resumes Repository */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '14px', color: '#1e293b' }}>
              Your Uploaded Documents ({resumes.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {resumes.map((r) => {
                const isSelected = r._id === selectedResumeId;
                return (
                  <div
                    key={r._id}
                    onClick={() => handleSelectResume(r._id)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: `1px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                      backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 4px rgba(79, 70, 229, 0.1)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem', color: isSelected ? '#3730a3' : '#1e293b', wordBreak: 'break-all' }}>
                        {r.originalName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          backgroundColor: r.extractionStatus === 'completed' ? '#ecfdf5' : '#fffbeb',
                          color: r.extractionStatus === 'completed' ? '#065f46' : '#92400e',
                          border: `1px solid ${r.extractionStatus === 'completed' ? '#a7f3d0' : '#fde68a'}`,
                        }}
                      >
                        {r.extractionStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>{(r.fileSize / 1024).toFixed(1)} KB • {new Date(r.createdAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResume(r._id, r.originalName);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '2px 6px',
                        }}
                        title="Delete resume"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Resume Extracted Data */}
          <div>
            {activeResumeDetails && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                      {activeResumeDetails.originalName}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Extraction Status: <strong>{activeResumeDetails.extractionStatus}</strong>
                      {activeResumeDetails.aiModelUsed && ` • Model: ${activeResumeDetails.aiModelUsed}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowRawText(!showRawText)}
                      className="btn"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                    >
                      {showRawText ? 'Hide Text' : 'View Extracted Text'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerAiExtraction(activeResumeDetails.id || activeResumeDetails._id)}
                      disabled={extracting}
                      className="btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        background: activeResumeDetails.extractionStatus === 'completed' ? '#4f46e5' : '#059669',
                      }}
                    >
                      {extracting ? 'Extracting with Gemini AI...' : activeResumeDetails.extractionStatus === 'completed' ? 'Re-extract Entities' : 'Extract Skills with AI'}
                    </button>
                  </div>
                </div>

                {/* Collapsible Raw Text View */}
                {showRawText && (
                  <div style={{ marginBottom: '20px', padding: '14px', background: '#0f172a', borderRadius: '8px', color: '#f8fafc', fontSize: '0.8rem', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {activeResumeDetails.rawText || 'No text extracted.'}
                  </div>
                )}

                {/* AI Extracted Entities Breakdown */}
                {activeResumeDetails.extractionStatus !== 'completed' ? (
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '14px' }}>
                      Text extraction complete ({activeResumeDetails.rawText ? activeResumeDetails.rawText.split(/\s+/).length : 0} words). Click <strong>"Extract Skills with AI"</strong> to classify programming languages, frameworks, databases, and tools.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTriggerAiExtraction(activeResumeDetails.id || activeResumeDetails._id)}
                      disabled={extracting}
                      className="btn"
                      style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                    >
                      Run AI Entity Extraction
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* General Skills */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        General Skills & Competencies ({aiData?.skills?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {aiData?.skills?.length ? (
                          aiData.skills.map((skill, idx) => (
                            <span key={idx} style={{ padding: '3px 10px', background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500' }}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                        )}
                      </div>
                    </div>

                    {/* Programming Languages */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Programming Languages ({aiData?.programmingLanguages?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {aiData?.programmingLanguages?.length ? (
                          aiData.programmingLanguages.map((lang, idx) => (
                            <span key={idx} className="badge badge-primary">{lang}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                        )}
                      </div>
                    </div>

                    {/* Frameworks */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Frameworks & Libraries ({aiData?.frameworks?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {aiData?.frameworks?.length ? (
                          aiData.frameworks.map((fw, idx) => (
                            <span key={idx} style={{ padding: '3px 10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                              {fw}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                        )}
                      </div>
                    </div>

                    {/* Databases */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Databases ({aiData?.databases?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {aiData?.databases?.length ? (
                          aiData.databases.map((db, idx) => (
                            <span key={idx} style={{ padding: '3px 10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                              {db}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                        )}
                      </div>
                    </div>

                    {/* Tools */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Tools & Technologies ({aiData?.tools?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {aiData?.tools?.length ? (
                          aiData.tools.map((tool, idx) => (
                            <span key={idx} style={{ padding: '3px 10px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500' }}>
                              {tool}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                        )}
                      </div>
                    </div>

                    {/* Projects Highlight */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Projects ({aiData?.projects?.length || 0})
                      </span>
                      {aiData?.projects && aiData.projects.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aiData.projects.map((proj, pIdx) => (
                            <div key={pIdx} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>{proj.name || proj.title}</div>
                              {proj.description && <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>{proj.description}</p>}
                              {proj.technologies && proj.technologies.length > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#4f46e5', marginTop: '4px' }}>
                                  Tech: {proj.technologies.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                      )}
                    </div>

                    {/* Education */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Education ({aiData?.education?.length || 0})
                      </span>
                      {aiData?.education && aiData.education.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aiData.education.map((edu, eIdx) => (
                            <div key={eIdx} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>
                                {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                {edu.institution} {edu.startYear || edu.endYear ? `(${[edu.startYear, edu.endYear].filter(Boolean).join(' - ')})` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                      )}
                    </div>

                    {/* Experience */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Experience ({aiData?.experience?.length || 0})
                      </span>
                      {aiData?.experience && aiData.experience.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aiData.experience.map((exp, xIdx) => (
                            <div key={xIdx} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>{exp.role}</div>
                              <div style={{ fontSize: '0.82rem', color: '#4f46e5' }}>{exp.company}</div>
                              {exp.description && <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>{exp.description}</p>}
                              {exp.technologies && exp.technologies.length > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                  Technologies: {exp.technologies.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                      )}
                    </div>

                    {/* Certifications */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Certifications ({aiData?.certifications?.length || 0})
                      </span>
                      {aiData?.certifications && aiData.certifications.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aiData.certifications.map((cert, cIdx) => (
                            <div key={cIdx} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.88rem', color: '#1e293b' }}>{cert.name}</span>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{cert.issuer} {cert.year ? `(${cert.year})` : ''}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumePage;
