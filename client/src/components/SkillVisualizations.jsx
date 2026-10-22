import React from 'react';

/**
 * Circular / Radial Gauge for Match % vs Gap %
 */
export const MatchGapGauge = ({ matchPercentage = 0, gapPercentage = 100, size = 180 }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const matchStrokeDashoffset = circumference - (matchPercentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle (Gap) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#fee2e2"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground circle (Match) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={matchPercentage >= 70 ? '#10b981' : matchPercentage >= 40 ? '#6366f1' : '#f59e0b'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={matchStrokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
            {matchPercentage}%
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>
            Role Match
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: matchPercentage >= 70 ? '#10b981' : matchPercentage >= 40 ? '#6366f1' : '#f59e0b' }} />
          <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '500' }}>Matched ({matchPercentage}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '500' }}>Gap ({gapPercentage}%)</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Category Breakdown Horizontal Bars
 */
export const CategoryBreakdownChart = ({ categoryBreakdown = {} }) => {
  const labels = {
    programmingLanguages: 'Programming Languages',
    frameworks: 'Frameworks & Libraries',
    databases: 'Databases & Storage',
    tools: 'Developer Tools',
    devops: 'DevOps & Cloud',
    softSkills: 'Soft Skills',
    other: 'General Engineering',
  };

  const categories = Object.keys(categoryBreakdown).filter((key) => labels[key]);

  if (categories.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No category breakdown available.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {categories.map((key) => {
        const percentage = Math.min(100, Math.max(0, categoryBreakdown[key] || 0));
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: '#334155' }}>{labels[key]}</span>
              <span style={{ fontWeight: '700', color: percentage >= 70 ? '#059669' : percentage >= 40 ? '#4f46e5' : '#d97706' }}>
                {percentage}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: percentage >= 70 ? '#10b981' : percentage >= 40 ? '#6366f1' : '#f59e0b',
                  borderRadius: '9999px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Quick Metric Stat Card
 */
export const StatCard = ({ icon, label, value, subtext, color = '#4f46e5', bg = '#eef2ff' }) => {
  return (
    <div className="card" style={{ marginBottom: 0, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: bg,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
          {value}
        </div>
        {subtext && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{subtext}</div>}
      </div>
    </div>
  );
};

/**
 * Priority Pill Badge
 */
export const PriorityBadge = ({ importance = 'important' }) => {
  const styles = {
    critical: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', label: 'Critical' },
    important: { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', label: 'Important' },
    good_to_have: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'Good to Have' },
  };

  const config = styles[importance] || styles.important;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '0.72rem',
        fontWeight: '700',
        borderRadius: '9999px',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {config.label}
    </span>
  );
};

/**
 * Priority Distribution Chart (Critical / Important / Good to Have)
 */
export const PriorityDistributionChart = ({ missingSkills = [] }) => {
  const counts = {
    critical: missingSkills.filter((s) => s.importance === 'critical').length,
    important: missingSkills.filter((s) => s.importance === 'important' || !s.importance).length,
    good_to_have: missingSkills.filter((s) => s.importance === 'good_to_have').length,
  };

  const total = missingSkills.length || 1;
  const pCritical = Math.round((counts.critical / total) * 100);
  const pImportant = Math.round((counts.important / total) * 100);
  const pGood = Math.round((counts.good_to_have / total) * 100);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', backgroundColor: '#e2e8f0', marginBottom: '10px' }}>
        {counts.critical > 0 && (
          <div style={{ width: `${pCritical}%`, backgroundColor: '#ef4444', transition: 'width 0.4s ease' }} title={`Critical: ${counts.critical}`} />
        )}
        {counts.important > 0 && (
          <div style={{ width: `${pImportant}%`, backgroundColor: '#4f46e5', transition: 'width 0.4s ease' }} title={`Important: ${counts.important}`} />
        )}
        {counts.good_to_have > 0 && (
          <div style={{ width: `${pGood}%`, backgroundColor: '#94a3b8', transition: 'width 0.4s ease' }} title={`Good to Have: ${counts.good_to_have}`} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          Critical: {counts.critical}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
          Important: {counts.important}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
          Good to Have: {counts.good_to_have}
        </span>
      </div>
    </div>
  );
};

/**
 * Reusable Progress Bar with label
 */
export const ProgressBar = ({ progress = 0, color = '#4f46e5', height = 10, showLabel = true }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px', fontWeight: '600' }}>
          <span style={{ color: '#475569' }}>Completion</span>
          <span style={{ color: color }}>{clamped}%</span>
        </div>
      )}
      <div style={{ width: '100%', height: `${height}px`, backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '9999px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
};

export default {
  MatchGapGauge,
  CategoryBreakdownChart,
  StatCard,
  PriorityBadge,
  PriorityDistributionChart,
  ProgressBar,
};
