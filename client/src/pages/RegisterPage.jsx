import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Full name cannot exceed 100 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setSubmitting(true);
    const result = await register(
      formData.name.trim(),
      formData.email.trim(),
      formData.password
    );
    setSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      if (result.errors) {
        setValidationErrors(result.errors);
      }
      setApiError(result.error || 'Registration failed. Please review your details.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '1.3rem' }}>
            AI
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Create student account
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px' }}>
            Start analyzing skill gaps and generate personalized learning roadmaps
          </p>
        </div>

        {/* Global API Error Alert */}
        {apiError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
            <span style={{ color: '#b91c1c', fontSize: '0.9rem', fontWeight: '500' }}>{apiError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Alex Morgan"
              value={formData.name}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                border: `1px solid ${validationErrors.name ? '#ef4444' : '#cbd5e1'}`,
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {validationErrors.name && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="student@btech.edu"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                border: `1px solid ${validationErrors.email ? '#ef4444' : '#cbd5e1'}`,
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {validationErrors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Password (min. 6 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                border: `1px solid ${validationErrors.password ? '#ef4444' : '#cbd5e1'}`,
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {validationErrors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.95rem',
                border: `1px solid ${validationErrors.confirmPassword ? '#ef4444' : '#cbd5e1'}`,
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {validationErrors.confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn"
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Switch to Login */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
