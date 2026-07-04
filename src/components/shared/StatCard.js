import React from 'react';
export default function StatCard({ label, value, unit = '', sub, icon, color = '#2563EB', bg }) {
  return (
    <div className="stat-card card-hover">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value" style={{ color }}>
            {value}
            {unit && <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', marginLeft: 4 }}>{unit}</span>}
          </div>
          {sub && <div className="stat-card-sub">{sub}</div>}
        </div>
        {icon && (
          <div style={{ width: 44, height: 44, borderRadius: 12, background: bg || `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
