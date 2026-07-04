import React from 'react';
export default function NutrientBar({ label, consumed, target, unit = 'g', color = '#2563EB' }) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const over = target > 0 && consumed > target;
  return (
    <div className="nutrient-bar">
      <div className="nutrient-bar-header">
        <span className="nutrient-bar-label">{label}</span>
        <span className="nutrient-bar-value" style={{ color: over ? '#DC2626' : undefined }}>
          {typeof consumed === 'number' ? (consumed % 1 === 0 ? consumed : consumed.toFixed(1)) : 0}{unit}
          <span style={{ color: '#94A3B8' }}> / {target || '—'}{unit}</span>
        </span>
      </div>
      <div className="nutrient-bar-track">
        <div className="nutrient-bar-fill"
          style={{ width: `${pct}%`, background: over ? '#EF4444' : color }} />
      </div>
    </div>
  );
}
