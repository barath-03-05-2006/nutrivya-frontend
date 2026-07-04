import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI, clientAPI, photoAPI } from '../../services/api';
import PhotoProgress from '../../components/shared/PhotoProgress';
import { WeightChart, ComplianceChart, CalorieChart } from '../../components/charts/Charts';
import { useToast } from '../../context/ToastContext';
import { format, startOfWeek } from 'date-fns';
import { Scale, TrendingDown, TrendingUp, Plus, MessageSquare } from 'lucide-react';

export default function ClientProgress() {
  const { addToast } = useToast();
  const [weightHistory, setWeightHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [profile, setProfile] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [newWeight, setNewWeight] = useState('');
  const [weightNote, setWeightNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const [wh, wr, pr, nt, ph] = await Promise.all([
        analyticsAPI.getMyWeightHistory(),
        analyticsAPI.getMyWeekly(weekStart),
        clientAPI.getMyProfile(),
        analyticsAPI.getMyNotes().catch(err => {
          console.error('Failed to load progress notes:', err);
          addToast('Could not load notes from your dietitian', 'error');
          return { data: [] };
        }),
        photoAPI.getMine().catch(() => ({ data: [] })),
      ]);
      setWeightHistory(wh.data || []);
      setWeekly(wr.data);
      setProfile(pr.data);
      setNotes(nt.data || []);
      setPhotos(ph.data || []);
    } catch (e) {
      addToast('Failed to load progress data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const logWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    setSaving(true);
    try {
      await analyticsAPI.logWeight({ weight: parseFloat(newWeight), date: format(new Date(), 'yyyy-MM-dd'), notes: weightNote });
      setNewWeight(''); setWeightNote('');
      addToast('Weight logged successfully!', 'success');
      load();
    } catch {
      addToast('Failed to log weight', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner" />;

  const weeklyWeights = [];
  const seen = new Set();
  weightHistory.forEach(w => {
    const weekKey = format(startOfWeek(new Date(w.logDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!seen.has(weekKey)) {
      seen.add(weekKey);
      weeklyWeights.push({ date: format(new Date(w.logDate), 'MMM d'), weight: w.weight });
    }
  });

  const latest = weightHistory[weightHistory.length - 1];
  const first = weightHistory[0];
  const change = latest && first ? (latest.weight - first.weight).toFixed(1) : null;
  const weekDays = weekly?.dailyBreakdown?.map(d => ({
    date: d.date ? format(new Date(d.date), 'EEE') : '',
    calories: d.caloriesConsumed || 0,
    target: d.targetCalories || 2000,
    compliance: d.complianceRate || 0,
  })) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Progress</h1>
        <p className="page-subtitle">Track your weight and weekly nutrition trends</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Current Weight', value: latest ? `${latest.weight} kg` : '—', icon: <Scale size={20} />, color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Goal Weight', value: profile?.goalWeight ? `${profile.goalWeight} kg` : '—', icon: <TrendingDown size={20} />, color: '#22C55E', bg: '#DCFCE7' },
          {
            label: 'Total Change', value: change ? `${change > 0 ? '+' : ''}${change} kg` : '—',
            icon: change < 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />,
            color: change < 0 ? '#22C55E' : change > 0 ? '#EF4444' : '#94A3B8',
            bg: change < 0 ? '#DCFCE7' : change > 0 ? '#FEE2E2' : '#F1F5F9',
          },
        ].map(s => (
          <div key={s.label} className="stat-card card-hover" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              </div>
              <div style={{ width: 42, height: 42, background: s.bg, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 className="section-title">Log Weight</h3>
          <form onSubmit={logWeight}>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 68.5" value={newWeight} onChange={e => setNewWeight(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" placeholder="e.g. After morning walk" value={weightNote} onChange={e => setWeightNote(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={16} /> {saving ? 'Logging...' : 'Log Weight'}
            </button>
          </form>

          {weightHistory.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Recent Logs</div>
              {weightHistory.slice(-5).reverse().map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-gray)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{format(new Date(w.logDate), 'MMM d, yyyy')}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#2563EB' }}>{w.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">Weight Trend</h3>
          {weeklyWeights.length > 1 ? (
            <WeightChart data={weeklyWeights} goalWeight={profile?.goalWeight} />
          ) : (
            <div className="empty-state">
              <Scale size={32} className="empty-state-icon" />
              <div className="empty-state-title">Not enough data yet</div>
              <div className="empty-state-desc">Log your weight regularly to see the trend chart here.</div>
            </div>
          )}
        </div>
      </div>

      {weekDays.length > 0 && (
        <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
          <div className="card">
            <h3 className="section-title">Weekly Calories</h3>
            <CalorieChart data={weekDays} />
          </div>
          <div className="card">
            <h3 className="section-title">Weekly Compliance</h3>
            <ComplianceChart data={weekDays} />
          </div>
        </div>
      )}

      {/* Notes from dietitian */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: '#DBEAFE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={18} color="#2563EB" />
          </div>
          <h3 className="section-title" style={{ margin: 0 }}>Notes from Your Dietitian</h3>
        </div>
        {notes.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="empty-state-title">No notes yet</div>
            <div className="empty-state-desc">Your dietitian hasn't left any progress notes yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map((n, i) => (
              <div key={i} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', borderLeft: '3px solid #2563EB' }}>
                <div style={{ fontSize: 14, color: '#0F172A', marginBottom: 6 }}>{n.note}</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{n.createdAt ? format(new Date(n.createdAt), 'MMM d, yyyy h:mm a') : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Progress Photos */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: '#EDE9FE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18 }}>📸</span>
          </div>
          <h3 className="section-title" style={{ margin: 0 }}>Progress Photos</h3>
        </div>
        <PhotoProgress
          canUpload={true}
          photos={photos}
          onRefresh={() => photoAPI.getMine().then(r => setPhotos(r.data || [])).catch(() => {})}
        />
      </div>
    </div>
  );
}
