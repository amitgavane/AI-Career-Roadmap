import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [availableRoles, setAvailableRoles] = useState([]);

  // Form State
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [targetRoleId, setTargetRoleId] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');
  const [skillsList, setSkillsList] = useState([]);

  const fetchProfileAndRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Profile
      const profileRes = await apiClient.get('/profile');
      if (profileRes.data?.profile) {
        const p = profileRes.data.profile;
        setHeadline(p.headline || '');
        setBio(p.profileMetadata?.bio || '');
        setPortfolioUrl(p.profileMetadata?.portfolioUrl || '');
        setGithubUrl(p.profileMetadata?.githubUrl || '');
        setLinkedinUrl(p.profileMetadata?.linkedinUrl || '');
        setTargetRoleId(p.targetRoleId?._id || p.targetRoleId || '');
        setSkillsList(Array.isArray(p.skills) ? p.skills : []);
      }

      // Fetch Available Job Roles for Target Role Selector
      try {
        const rolesRes = await apiClient.get('/skill-gap/roles');
        if (rolesRes.data?.roles) {
          setAvailableRoles(rolesRes.data.roles);
        }
      } catch (roleErr) {
        console.warn('Could not load job roles list:', roleErr.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRoles();
  }, []);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const exists = skillsList.some(
      (s) => (s.name || s.skillName || '').toLowerCase() === newSkillName.trim().toLowerCase()
    );

    if (exists) {
      setError(`Skill '${newSkillName.trim()}' is already in your skills list.`);
      return;
    }

    setSkillsList([
      ...skillsList,
      {
        name: newSkillName.trim(),
        proficiencyLevel: newSkillProficiency,
      },
    ]);
    setNewSkillName('');
    setError(null);
  };

  const handleRemoveSkill = (skillNameToRemove) => {
    setSkillsList(skillsList.filter((s) => (s.name || s.skillName) !== skillNameToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const payload = {
        headline: headline.trim(),
        profileMetadata: {
          bio: bio.trim(),
          portfolioUrl: portfolioUrl.trim(),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
        },
        skills: skillsList.map((s) => ({
          name: s.name || s.skillName,
          proficiencyLevel: s.proficiencyLevel || s.proficiency || 'intermediate',
        })),
      };

      if (targetRoleId) {
        payload.targetRoleId = targetRoleId;
      }

      const res = await apiClient.patch('/profile', payload);

      if (res.data?.success) {
        setSuccessMessage('Student profile updated successfully!');
        if (refreshUser) refreshUser();
      } else {
        setError(res.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748b' }}>Loading your student profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>
          Student Profile
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
          Manage your personal information, career target, and verified technical skills.
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

      {/* Account Info Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.35rem' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>
              {user?.name}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              {user?.email} • <span className="badge badge-primary">{user?.role || 'student'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
            Professional Headline & Career Target
          </h3>

          {/* Headline */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="headline" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Professional Headline
            </label>
            <input
              id="headline"
              type="text"
              placeholder="e.g. Aspiring Full-Stack Software Engineer | Final Year B.Tech CSE"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Target Job Role */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="targetRoleId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Target Job Role
            </label>
            <select
              id="targetRoleId"
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value="">-- Select Target Career Role --</option>
              {availableRoles.map((role) => (
                <option key={role._id || role.id} value={role._id || role.id}>
                  {role.title} ({role.department})
                </option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="bio" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Personal Bio / Summary
            </label>
            <textarea
              id="bio"
              rows="3"
              placeholder="Brief summary of your academic background, passions, and career aspirations..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Professional Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="githubUrl" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                GitHub Profile URL
              </label>
              <input
                id="githubUrl"
                type="url"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label htmlFor="linkedinUrl" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                LinkedIn Profile URL
              </label>
              <input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label htmlFor="portfolioUrl" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Portfolio Website
              </label>
              <input
                id="portfolioUrl"
                type="url"
                placeholder="https://myportfolio.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Technical Skills Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
            Known Technical Skills
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' }}>
            List skills you already possess. These will be taken into account when evaluating career skill gaps.
          </p>

          {/* Existing Skills Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {skillsList.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No technical skills added yet. Add skills below or upload your resume in Phase 9.
              </p>
            ) : (
              skillsList.map((skill) => {
                const sName = skill.name || skill.skillName;
                const sProf = skill.proficiencyLevel || skill.proficiency || 'intermediate';
                return (
                  <div
                    key={sName}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '20px',
                      fontSize: '0.88rem',
                    }}
                  >
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{sName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({sProf})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: '1rem',
                        lineHeight: '1',
                        padding: '0 2px',
                      }}
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Skill Inputs */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g. React, Python, Docker"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              style={{
                flex: '1',
                minWidth: '180px',
                padding: '8px 12px',
                fontSize: '0.9rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
              }}
            />
            <select
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '0.9rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              type="button"
              onClick={handleAddSkill}
              className="btn"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              + Add Skill
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn"
            style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: '600' }}
          >
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
