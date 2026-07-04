import React from 'react';

const pulse = {
  background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: 8,
};

export function SkeletonBox({ width = '100%', height = 20, style = {} }) {
  return <div style={{ ...pulse, width, height, ...style }} />;
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonBox height={18} width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} height={14} width={i % 2 === 0 ? '100%' : '70%'} />
      ))}
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid-4" style={{ marginBottom: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <SkeletonBox height={12} width="60%" style={{ marginBottom: 10 }} />
          <SkeletonBox height={32} width="50%" style={{ marginBottom: 8 }} />
          <SkeletonBox height={10} width="80%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="card">
      <SkeletonBox height={16} width="30%" style={{ marginBottom: 20 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
          <SkeletonBox width={36} height={36} style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
            <SkeletonBox height={14} width="25%" />
            <SkeletonBox height={14} width="15%" />
            <SkeletonBox height={14} width="20%" />
            <SkeletonBox height={14} width="15%" />
          </div>
        </div>
      ))}
    </div>
  );
}
