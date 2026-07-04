import React, { useState } from 'react';
import { foodAPI } from '../../services/api';
import { SUPPORTED_UNITS } from '../../utils/unitConversion';
import { X, Save } from 'lucide-react';

const CATEGORIES = [
  'Grains', 'Protein', 'Legumes', 'Dairy', 'Fruits', 'Vegetables',
  'Nuts', 'Oils', 'Fish', 'Supplements', 'Spreads', 'Sweeteners',
  'Beverages', 'Snacks', 'South Indian', 'Custom',
];

const NON_GRAM_UNITS = SUPPORTED_UNITS.filter(u => u !== 'g' && u !== 'ml');

/**
 * Modal that lets a dietitian add a brand-new food to the database with full
 * nutrition values (per 100g) plus optional gram-equivalents for non-gram units
 * (piece, cup, bowl, katori, tbsp, tsp). Once saved it's searchable everywhere.
 *
 * @param {string} initialName - pre-fills the food name (e.g. from the search box that found nothing)
 * @param {function} onClose - called to dismiss the modal
 * @param {function} onCreated - called with the new food object once successfully saved
 */
export default function AddFoodModal({ initialName = '', onClose, onCreated }) {
  const [form, setForm] = useState({
    foodName: initialName,
    category: 'Custom',
    caloriesPer100g: '',
    proteinPer100g: '',
    carbsPer100g: '',
    fatPer100g: '',
    fiberPer100g: '',
  });
  const [unitOverrides, setUnitOverrides] = useState({}); // { piece: '50', tbsp: '15' }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const updateUnit = (unit, val) => setUnitOverrides(p => ({ ...p, [unit]: val }));

  const handleSave = async () => {
    setError('');
    if (!form.foodName.trim()) { setError('Food name is required.'); return; }
    if (!form.caloriesPer100g) { setError('Calories (per 100g) is required.'); return; }

    setSaving(true);
    try {
      const overrideStr = Object.entries(unitOverrides)
        .filter(([, v]) => v && parseFloat(v) > 0)
        .map(([unit, v]) => `${unit}:${v}`)
        .join(',');

      const payload = {
        foodName: form.foodName.trim(),
        category: form.category,
        servingSize: '100',
        servingUnit: 'g',
        caloriesPer100g: parseFloat(form.caloriesPer100g) || 0,
        proteinPer100g: parseFloat(form.proteinPer100g) || 0,
        carbsPer100g: parseFloat(form.carbsPer100g) || 0,
        fatPer100g: parseFloat(form.fatPer100g) || 0,
        fiberPer100g: parseFloat(form.fiberPer100g) || 0,
        unitGramsOverride: overrideStr || null,
      };

      const res = await foodAPI.create(payload);
      onCreated(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add food. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'white', borderRadius: '16px 16px 0 0' }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Add New Food</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>This food will be saved permanently and searchable next time</p>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Food Name *</label>
            <input className="form-input" placeholder="e.g. Ragi Dosa, Sabudana Khichdi..." maxLength={100}
              value={form.foodName} onChange={e => update('foodName', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => update('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginTop: 8, marginBottom: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Nutrition per 100g *
          </div>
          <div className="grid-3" style={{ marginBottom: 8 }}>
            <div className="form-group">
              <label className="form-label">Calories (kcal) *</label>
              <input className="form-input" type="number" placeholder="e.g. 150" value={form.caloriesPer100g} onChange={e => update('caloriesPer100g', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Protein (g)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 5" value={form.proteinPer100g} onChange={e => update('proteinPer100g', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Carbs (g)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 25" value={form.carbsPer100g} onChange={e => update('carbsPer100g', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fat (g)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 3" value={form.fatPer100g} onChange={e => update('fatPer100g', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fiber (g)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 2" value={form.fiberPer100g} onChange={e => update('fiberPer100g', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 12, marginBottom: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Unit Conversions (optional)
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 12 }}>
            How many grams is 1 of each unit? Leave blank to use default estimates.
          </p>
          <div className="grid-3">
            {NON_GRAM_UNITS.map(unit => (
              <div key={unit} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">1 {unit} = ___ g</label>
                <input className="form-input" type="number" placeholder="—" value={unitOverrides[unit] || ''} onChange={e => updateUnit(unit, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)', position: 'sticky', bottom: 0, background: 'white' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            <Save size={15} /> {saving ? 'Saving...' : 'Save Food'}
          </button>
        </div>
      </div>
    </div>
  );
}
