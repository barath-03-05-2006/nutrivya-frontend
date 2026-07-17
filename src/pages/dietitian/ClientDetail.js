import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { analyticsAPI, clientAPI, mealAPI, photoAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import NutrientBar from '../../components/shared/NutrientBar';
import PhotoProgress from '../../components/shared/PhotoProgress';
import { WeightChart, CalorieChart, ProteinChart, ComplianceChart } from '../../components/charts/Charts';
import { format, startOfWeek } from 'date-fns';
import { MessageSquarePlus, Save, ChevronDown, ChevronUp, Utensils, Calendar, Trash2, Pencil, X, Check, BarChart2, Printer, PenLine } from 'lucide-react';

const TABS = ['Overview', 'Nutrition', 'Charts', 'Diet Plans', 'Details', 'Notes', 'Photos'];

const EmptyChart = ({ message }) => (
  <div className="empty-state" style={{ padding: '32px 16px' }}>
    <BarChart2 size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
    <div className="empty-state-title" style={{ fontSize: 14 }}>{message || 'No data yet'}</div>
    <div className="empty-state-desc" style={{ fontSize: 12 }}>Charts appear once the client starts logging meals</div>
  </div>
);

export default function ClientDetail() {
  const { clientId } = useParams();
  const { addToast } = useToast();
  const [overview, setOverview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState({ targetCalories: '', targetProtein: '', targetCarbs: '', targetFat: '', targetFiber: '', targetWater: '' });
  const [savingTargets, setSavingTargets] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [recalcItem, setRecalcItem] = useState(null);
  const [recalcForm, setRecalcForm] = useState({ calories: '', protein: '', carbs: '', fat: '', fiber: '' });
  const [savingRecalc, setSavingRecalc] = useState(false);

  const load = useCallback(async () => {
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const [ov, day, wk, wh, nt, pr, mp, ph] = await Promise.all([
        analyticsAPI.getClientOverview(clientId),
        analyticsAPI.getDaily(clientId, format(new Date(), 'yyyy-MM-dd')),
        analyticsAPI.getWeekly(clientId, weekStart),
        analyticsAPI.getWeightHistory(clientId),
        analyticsAPI.getNotes(clientId),
        clientAPI.getProfile(clientId).catch(() => ({ data: null })),
        mealAPI.getClientPlans(clientId).catch(() => ({ data: [] })),
        photoAPI.getClientPhotos(clientId).catch(() => ({ data: [] })),
      ]);
      setOverview(ov.data); setDaily(day.data); setWeekly(wk.data);
      setWeightHistory(wh.data || []); setNotes(nt.data || []); setProfile(pr.data);
      setMealPlans(mp.data || []);
      setPhotos(ph.data || []);
      if (pr.data) setTargets({
        targetCalories: pr.data.targetCalories || '', targetProtein: pr.data.targetProtein || '',
        targetCarbs: pr.data.targetCarbs || '', targetFat: pr.data.targetFat || '',
        targetFiber: pr.data.targetFiber || '', targetWater: pr.data.targetWater || '',
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await analyticsAPI.addNote(clientId, newNote.trim());
      setNewNote('');
      addToast('Note added!', 'success');
      const res = await analyticsAPI.getNotes(clientId);
      setNotes(res.data || []);
    } catch { addToast('Failed to add note', 'error'); }
  };

  const startEditNote = (n) => { setEditingNoteId(n.id); setEditNoteText(n.note); };
  const cancelEditNote = () => { setEditingNoteId(null); setEditNoteText(''); };

  const saveEditNote = async (noteId) => {
    if (!editNoteText.trim()) { addToast('Note cannot be empty', 'error'); return; }
    setSavingNote(true);
    try {
      await analyticsAPI.updateNote(noteId, editNoteText.trim());
      addToast('Note updated!', 'success');
      setEditingNoteId(null); setEditNoteText('');
      const res = await analyticsAPI.getNotes(clientId);
      setNotes(res.data || []);
    } catch { addToast('Failed to update note', 'error'); }
    finally { setSavingNote(false); }
  };

  const deleteNote = async (noteId) => {
    try {
      await analyticsAPI.deleteNote(noteId);
      addToast('Note deleted', 'success');
      setConfirmDeleteNote(null);
      const res = await analyticsAPI.getNotes(clientId);
      setNotes(res.data || []);
    } catch { addToast('Failed to delete note', 'error'); }
  };

  const saveTargets = async () => {
    setSavingTargets(true);
    try {
      const t = {};
      Object.entries(targets).forEach(([k, v]) => { if (v) t[k] = parseInt(v); });
      await clientAPI.setTargets(clientId, t);
      addToast('Targets saved!', 'success');
    } catch { addToast('Failed to save targets', 'error'); }
    finally { setSavingTargets(false); }
  };

  const deletePlan = async (planId) => {
    setDeletingPlan(planId);
    try {
      await mealAPI.delete(planId);
      setMealPlans(prev => prev.filter(p => p.id !== planId));
      setConfirmDelete(null);
      addToast('Meal plan deleted', 'success');
    } catch { addToast('Failed to delete plan', 'error'); }
    finally { setDeletingPlan(null); }
  };

  const savePlanName = async (planId) => {
    if (!editName.trim()) { addToast('Plan name cannot be empty', 'error'); return; }
    if (editName.trim().length > 255) { addToast('Plan name too long', 'error'); return; }
    try {
      await mealAPI.update(planId, { planName: editName.trim() });
      setMealPlans(prev => prev.map(p => p.id === planId ? { ...p, planName: editName.trim() } : p));
      setEditingPlan(null);
      addToast('Plan name updated!', 'success');
    } catch { addToast('Failed to update plan', 'error'); }
  };

  const openRecalc = (foodItem) => {
    setRecalcItem(foodItem.id);
    setRecalcForm({
      calories: foodItem.actualCalories ?? foodItem.calories ?? '',
      protein: foodItem.actualProtein ?? foodItem.protein ?? '',
      carbs: foodItem.actualCarbs ?? foodItem.carbohydrates ?? '',
      fat: foodItem.actualFat ?? foodItem.fat ?? '',
      fiber: foodItem.actualFiber ?? foodItem.fiber ?? '',
    });
  };

  const saveRecalc = async (foodItemId) => {
    setSavingRecalc(true);
    try {
      const payload = {
        calories: parseFloat(recalcForm.calories) || 0,
        protein: parseFloat(recalcForm.protein) || 0,
        carbs: parseFloat(recalcForm.carbs) || 0,
        fat: parseFloat(recalcForm.fat) || 0,
        fiber: parseFloat(recalcForm.fiber) || 0,
      };
      await mealAPI.updateFoodItemActualNutrition(foodItemId, payload);
      // Re-sync from the backend rather than hand-patching state: the plan-level totals shown in
      // the header and the Protein/Carbs/Fat/Fiber summary cards are computed server-side from
      // ALL meals, not just this one item, so a local patch would leave them stale.
      const refreshed = await mealAPI.getClientPlans(clientId).catch(() => null);
      if (refreshed) setMealPlans(refreshed.data || []);
      setRecalcItem(null);
      addToast('Nutrition recalculated and logged', 'success');
    } catch (e) {
      addToast(e.response?.data?.error || 'Failed to update nutrition', 'error');
    } finally { setSavingRecalc(false); }
  };

  if (loading) return <div className="loading-spinner" />;
  if (!overview) return <div className="card"><div className="empty-state"><div className="empty-state-title">Client not found</div></div></div>;

  const weekDays = weekly?.dailyBreakdown?.map(d => ({
    date: d.date ? format(new Date(d.date), 'EEE') : '',
    calories: d.caloriesConsumed || 0, target: d.targetCalories || 2000,
    protein: d.proteinConsumed || 0, compliance: d.complianceRate || 0,
  })) || [];
  const weightChartData = weightHistory.map(w => ({ date: w.logDate ? format(new Date(w.logDate), 'MMM d') : '', weight: w.weight }));
  const boolLabel = (v) => v === true ? 'Yes' : v === false ? 'No' : '—';
  const mealTypeLabel = { EARLY_MORNING: '🌄 Early Morning (6:00 AM)', BREAKFAST: '🌅 Breakfast (8:00 AM)', MID_MORNING: '🍎 Mid Morning (11:00 AM)', LUNCH: '☀️ Lunch (1:00 PM)', EVENING_SNACK: '🌤️ Evening Snack (5:00 PM)', DINNER: '🌙 Dinner (8:00 PM)', BEDTIME: '🛏️ Bedtime (10:00 PM)' };
  const hasChartData = weekDays.some(d => d.calories > 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22 }}>
            {overview.clientName?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{overview.clientName}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{overview.currentWeight ? `${overview.currentWeight} kg` : 'No weight'}</span>
              <span className={`badge ${overview.complianceRate >= 70 ? 'badge-green' : 'badge-yellow'}`}>{(overview.complianceRate || 0).toFixed(0)}% Compliance</span>
              {profile?.dietType && <span className="badge badge-gray">{profile.dietType}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar — scrollable on mobile with fade */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: 0, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent', color: tab === t ? '#2563EB' : '#94A3B8', fontWeight: tab === t ? 700 : 500, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font)', marginBottom: -1, transition: 'color 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
        {/* Right fade hint for mobile */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 1, width: 40, background: 'linear-gradient(to right, transparent, var(--bg))', pointerEvents: 'none' }} />
      </div>

      {tab === 'Overview' && (
        <div>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Current Weight', value: overview.currentWeight || '—', unit: 'kg', color: '#2563EB' },
              { label: 'Weight Change', value: overview.weightChange != null ? (overview.weightChange > 0 ? `+${overview.weightChange.toFixed(1)}` : overview.weightChange.toFixed(1)) : '—', unit: 'kg', color: overview.weightChange < 0 ? '#22C55E' : '#EF4444' },
              { label: 'Avg Daily Calories', value: Math.round(overview.avgDailyCalories || 0), unit: 'kcal', color: '#F59E0B' },
              { label: 'Avg Protein', value: Math.round(overview.avgDailyProtein || 0), unit: 'g', color: '#22C55E' },
              { label: 'Avg Carbs', value: Math.round(overview.avgDailyCarbs || 0), unit: 'g', color: '#F59E0B' },
              { label: 'Avg Fat', value: Math.round(overview.avgDailyFat || 0), unit: 'g', color: '#EF4444' },
              { label: 'Avg Water', value: Math.round(overview.waterIntakeAvg || 0), unit: 'ml', color: '#0EA5E9' },
              { label: 'Compliance', value: `${Math.round(overview.complianceRate || 0)}`, unit: '%', color: overview.complianceRate >= 70 ? '#22C55E' : '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value}<span style={{ fontSize: 13, color: '#94A3B8', marginLeft: 4 }}>{s.unit}</span></div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="section-title">Set Nutrition Targets</h3>
            <div className="grid-3" style={{ marginBottom: 16 }}>
              {[{ key: 'targetCalories', label: 'Calories (kcal)', color: '#2563EB' }, { key: 'targetProtein', label: 'Protein (g)', color: '#22C55E' }, { key: 'targetCarbs', label: 'Carbs (g)', color: '#F59E0B' }, { key: 'targetFat', label: 'Fat (g)', color: '#EF4444' }, { key: 'targetFiber', label: 'Fiber (g)', color: '#8B5CF6' }, { key: 'targetWater', label: 'Water (ml)', color: '#0EA5E9' }].map(t => (
                <div key={t.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: t.color }}>{t.label}</label>
                  <input type="number" className="form-input" value={targets[t.key]} onChange={e => setTargets(p => ({ ...p, [t.key]: e.target.value }))} placeholder="e.g. 2000" />
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={saveTargets} disabled={savingTargets}><Save size={15} />{savingTargets ? 'Saving...' : 'Save Targets'}</button>
          </div>
        </div>
      )}

      {tab === 'Nutrition' && daily && (
        <div className="grid-2">
          <div className="card">
            <h3 className="section-title">Today's Intake vs Target</h3>
            <NutrientBar label="Calories" consumed={daily.caloriesConsumed || 0} target={daily.targetCalories || 2000} unit=" kcal" color="#2563EB" />
            <NutrientBar label="Protein" consumed={daily.proteinConsumed || 0} target={daily.targetProtein || 150} color="#22C55E" />
            <NutrientBar label="Carbs" consumed={daily.carbsConsumed || 0} target={daily.targetCarbs || 200} color="#F59E0B" />
            <NutrientBar label="Fat" consumed={daily.fatConsumed || 0} target={daily.targetFat || 65} color="#EF4444" />
            <NutrientBar label="Fiber" consumed={daily.fiberConsumed || 0} target={daily.targetFiber || 30} color="#8B5CF6" />
            <NutrientBar label="Water" consumed={daily.waterIntake || 0} target={daily.targetWater || 3000} unit=" ml" color="#0EA5E9" />
          </div>
          <div className="card">
            <h3 className="section-title">Weekly Averages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weekly && [
                { label: 'Avg Calories', value: `${Math.round(weekly.avgCalories || 0)} kcal`, color: '#2563EB' },
                { label: 'Avg Protein', value: `${Math.round(weekly.avgProtein || 0)}g`, color: '#22C55E' },
                { label: 'Avg Carbs', value: `${Math.round(weekly.avgCarbs || 0)}g`, color: '#F59E0B' },
                { label: 'Avg Fat', value: `${Math.round(weekly.avgFat || 0)}g`, color: '#EF4444' },
                { label: 'Weekly Compliance', value: `${Math.round(weekly.weeklyCompliance || 0)}%`, color: (weekly.weeklyCompliance || 0) >= 70 ? '#22C55E' : '#F59E0B' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Charts' && (
        <div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card"><h3 className="section-title">Weight Progress</h3>{weightChartData.length > 1 ? <WeightChart data={weightChartData} goalWeight={overview.goalWeight} /> : <EmptyChart message="No weight history yet" />}</div>
            <div className="card"><h3 className="section-title">Calorie Trend</h3>{hasChartData ? <CalorieChart data={weekDays} /> : <EmptyChart message="No calorie data this week" />}</div>
          </div>
          <div className="grid-2">
            <div className="card"><h3 className="section-title">Protein Intake</h3>{hasChartData ? <ProteinChart data={weekDays} /> : <EmptyChart message="No protein data this week" />}</div>
            <div className="card"><h3 className="section-title">Compliance</h3>{hasChartData ? <ComplianceChart data={weekDays} /> : <EmptyChart message="No compliance data this week" />}</div>
          </div>
        </div>
      )}

      {tab === 'Diet Plans' && (
        <div>
          {mealPlans.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button onClick={() => window.print()} className="btn btn-ghost btn-sm no-print">
                <Printer size={14} /> Print Plan
              </button>
            </div>
          )}
          {mealPlans.length === 0 ? (
            <div className="card"><div className="empty-state"><Utensils size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} /><div className="empty-state-title">No Diet Plans Yet</div><div className="empty-state-desc">Create a meal plan for this client to see it here.</div></div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...mealPlans].sort((a, b) => new Date(b.planDate) - new Date(a.planDate)).map(plan => {
                const isOpen = expandedPlan === plan.id;
                const isEditing = editingPlan === plan.id;
                const isConfirmingDelete = confirmDelete === plan.id;
                return (
                  <div key={plan.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: isOpen ? '#F0F6FF' : 'white', borderBottom: isOpen ? '1px solid #DBEAFE' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }} onClick={() => !isEditing && setExpandedPlan(isOpen ? null : plan.id)}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Calendar size={17} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                              <input className="form-input" style={{ padding: '5px 10px', fontSize: 14, flex: 1, maxWidth: 280 }} value={editName} onChange={e => setEditName(e.target.value)} autoFocus maxLength={255} onKeyDown={e => { if (e.key === 'Enter') savePlanName(plan.id); if (e.key === 'Escape') setEditingPlan(null); }} />
                              <button onClick={() => savePlanName(plan.id)} style={{ background: '#DCFCE7', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#16A34A', display: 'flex', alignItems: 'center' }}><Check size={14} /></button>
                              <button onClick={() => setEditingPlan(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                            </div>
                          ) : (
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{plan.planName || 'Meal Plan'}</div>
                          )}
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{plan.planDate ? format(new Date(plan.planDate), 'EEE, MMM d yyyy') : '—'} · {plan.meals?.length || 0} meals</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'right', marginRight: 4 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>{plan.totalCalories || 0} <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>kcal</span></div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{plan.meals?.filter(m => m.completed).length || 0}/{plan.meals?.length || 0} done</div>
                        </div>
                        {!isEditing && (
                          <button onClick={() => { setEditingPlan(plan.id); setEditName(plan.planName || ''); setExpandedPlan(null); }} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#2563EB', display: 'flex', alignItems: 'center' }} title="Rename plan"><Pencil size={14} /></button>
                        )}
                        {!isConfirmingDelete ? (
                          <button onClick={() => setConfirmDelete(plan.id)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center' }} title="Delete plan"><Trash2 size={14} /></button>
                        ) : (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '4px 8px' }}>
                            <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Delete?</span>
                            <button onClick={() => deletePlan(plan.id)} disabled={deletingPlan === plan.id} style={{ background: '#DC2626', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 600 }}>{deletingPlan === plan.id ? '...' : 'Yes'}</button>
                            <button onClick={() => setConfirmDelete(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', color: '#475569', fontSize: 12 }}>No</button>
                          </div>
                        )}
                        <button onClick={() => setExpandedPlan(isOpen ? null : plan.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '4px 20px 20px' }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 0', borderBottom: '1px solid #F1F5F9', marginBottom: 16 }}>
                          {[{ label: 'Protein', value: `${(plan.totalProtein || 0).toFixed(1)}g`, color: '#22C55E' }, { label: 'Carbs', value: `${(plan.totalCarbs || 0).toFixed(1)}g`, color: '#F59E0B' }, { label: 'Fat', value: `${(plan.totalFat || 0).toFixed(1)}g`, color: '#EF4444' }, { label: 'Fiber', value: `${(plan.totalFiber || 0).toFixed(1)}g`, color: '#8B5CF6' }].map(m => (
                            <div key={m.label} style={{ flex: 1, minWidth: 70, background: '#F8FAFC', borderRadius: 8, padding: '8px 12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>{m.label}</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {plan.meals?.map(meal => (
                            <div key={meal.id} style={{ borderRadius: 10, border: `1px solid ${meal.completed ? '#BBF7D0' : '#E2E8F0'}`, overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: meal.completed ? '#DCFCE7' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{mealTypeLabel[meal.mealType] || meal.mealType}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {meal.hasDeviation && (
                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: meal.deviationReviewed ? '#DBEAFE' : '#FEF3C7', color: meal.deviationReviewed ? '#2563EB' : '#92400E', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <PenLine size={11} /> {meal.deviationReviewed ? 'Deviation reviewed' : 'Ate differently'}
                                    </span>
                                  )}
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>{(meal.actualCalories ?? meal.totalCalories) || 0} kcal</span>
                                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: meal.completed ? '#22C55E' : '#E2E8F0', color: meal.completed ? 'white' : '#64748B' }}>{meal.completed ? '✓ Done' : 'Pending'}</span>
                                </div>
                              </div>
                              {meal.foodItems?.length > 0 && (
                                <div style={{ padding: '8px 14px' }}>
                                  <div className="table-container">
                                    <table style={{ minWidth: 400 }}>
                                      <thead><tr><th>Food</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Cal</th><th style={{ textAlign: 'right' }}>P</th><th style={{ textAlign: 'right' }}>C</th><th style={{ textAlign: 'right' }}>F</th><th style={{ textAlign: 'right' }}>Fib</th></tr></thead>
                                      <tbody>
                                        {meal.foodItems.map((fi, idx) => (
                                          <tr key={idx}>
                                            <td style={{ fontWeight: 500 }}>
                                              {fi.foodName}
                                              {fi.hasDeviation && (
                                                <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 99, fontWeight: 600, background: fi.deviationReviewed ? '#DBEAFE' : '#FEF3C7', color: fi.deviationReviewed ? '#2563EB' : '#92400E' }}>
                                                  {fi.deviationReviewed ? 'reviewed' : 'ate differently'}
                                                </span>
                                              )}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#94A3B8' }}>{fi.quantity}{fi.quantityUnit}</td>
                                            <td style={{ textAlign: 'right', color: '#2563EB', fontWeight: 700 }}>{fi.calories}</td>
                                            <td style={{ textAlign: 'right', color: '#22C55E', fontWeight: 600 }}>{(fi.protein || 0).toFixed(1)}g</td>
                                            <td style={{ textAlign: 'right', color: '#F59E0B', fontWeight: 600 }}>{(fi.carbohydrates || 0).toFixed(1)}g</td>
                                            <td style={{ textAlign: 'right', color: '#EF4444', fontWeight: 600 }}>{(fi.fat || 0).toFixed(1)}g</td>
                                            <td style={{ textAlign: 'right', color: '#8B5CF6', fontWeight: 600 }}>{(fi.fiber || 0).toFixed(1)}g</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              {meal.foodItems?.filter(fi => fi.hasDeviation).map(fi => (
                                <div key={fi.id} style={{ margin: '0 14px 12px', padding: 12, background: fi.deviationReviewed ? '#F0F9FF' : '#FFFBEB', border: `1px solid ${fi.deviationReviewed ? '#BAE6FD' : '#FDE68A'}`, borderRadius: 8 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Client note — instead of {fi.foodName}</div>
                                  <div style={{ fontSize: 13, color: '#334155', marginBottom: 10 }}>{fi.clientNote}</div>

                                  {recalcItem === fi.id ? (
                                    <div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
                                        {[
                                          { key: 'calories', label: 'Cal' }, { key: 'protein', label: 'Protein (g)' },
                                          { key: 'carbs', label: 'Carbs (g)' }, { key: 'fat', label: 'Fat (g)' }, { key: 'fiber', label: 'Fiber (g)' },
                                        ].map(f => (
                                          <div key={f.key}>
                                            <label style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 2 }}>{f.label}</label>
                                            <input type="number" className="form-input" style={{ padding: '5px 8px', fontSize: 13 }}
                                              value={recalcForm[f.key]} onChange={e => setRecalcForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                          </div>
                                        ))}
                                      </div>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-accent btn-sm" disabled={savingRecalc} onClick={() => saveRecalc(fi.id)}>
                                          {savingRecalc ? 'Saving...' : 'Save & update log'}
                                        </button>
                                        <button className="btn btn-sm" style={{ background: 'white', border: '1px solid #E2E8F0' }} onClick={() => setRecalcItem(null)}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                      {fi.deviationReviewed ? (
                                        <div style={{ fontSize: 12, color: '#0369A1', fontWeight: 600 }}>
                                          Logged as {fi.actualCalories ?? 0} kcal · P {(fi.actualProtein || 0).toFixed(1)}g · C {(fi.actualCarbs || 0).toFixed(1)}g · F {(fi.actualFat || 0).toFixed(1)}g · Fib {(fi.actualFiber || 0).toFixed(1)}g
                                        </div>
                                      ) : <div />}
                                      <button className="btn btn-sm" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB' }} onClick={() => openRecalc(fi)}>
                                        <PenLine size={13} /> {fi.deviationReviewed ? 'Edit nutrition' : 'Recalculate nutrition'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'Details' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="section-title">Physical Details</h3>
            {[{ label: 'Age', value: profile?.age ? `${profile.age} years` : '—' }, { label: 'Gender', value: profile?.gender || '—' }, { label: 'Height', value: profile?.height ? `${profile.height} cm` : '—' }, { label: 'Current Weight', value: profile?.currentWeight ? `${profile.currentWeight} kg` : '—' }, { label: 'Goal Weight', value: profile?.goalWeight ? `${profile.goalWeight} kg` : '—' }, { label: 'BMI', value: profile?.height && profile?.currentWeight ? ((profile.currentWeight / Math.pow(profile.height / 100, 2)).toFixed(1)) : '—' }].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="section-title">Health Questionnaire</h3>
            {[{ label: 'Medical Diagnosis', value: boolLabel(profile?.medicalDiagnosis) }, { label: 'Regular Medicine', value: boolLabel(profile?.regularMedicine) }, { label: 'Past Medical History', value: boolLabel(profile?.pastMedicalHistory) }, { label: 'Medical Surgery', value: boolLabel(profile?.medicalSurgery) }, { label: 'Work Lifestyle', value: profile?.workLifestyle || '—' }, { label: 'Social Habits', value: profile?.socialHabits || '—' }, { label: 'Physical Activity', value: profile?.physicalActivityLevel || '—' }, { label: 'Supplements', value: boolLabel(profile?.supplements) }, { label: 'Diet Type', value: profile?.dietType || '—' }, { label: 'Food Allergy', value: profile?.foodAllergy === true ? `Yes${profile?.foodAllergyDetails ? ` — ${profile.foodAllergyDetails}` : ''}` : boolLabel(profile?.foodAllergy) }].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.value === 'Yes' ? '#EF4444' : r.value === 'No' ? '#22C55E' : '#0F172A' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Photos' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: '#EDE9FE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>📸</span>
            </div>
            <h3 className="section-title" style={{ margin: 0 }}>Progress Photos</h3>
          </div>
          <PhotoProgress
            canUpload={false}
            photos={photos}
            onRefresh={() => photoAPI.getClientPhotos(clientId).then(r => setPhotos(r.data || [])).catch(() => {})}
          />
        </div>
      )}

      {tab === 'Notes' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="section-title">Add Progress Note</h3>
            <form onSubmit={addNote} style={{ display: 'flex', gap: 10 }}>
              <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Write a progress note..." value={newNote} onChange={e => setNewNote(e.target.value)} maxLength={1000} required />
              <button type="submit" className="btn btn-primary"><MessageSquarePlus size={15} />Add</button>
            </form>
          </div>
          <div className="card">
            <h3 className="section-title">Progress Notes</h3>
            {notes.length === 0 ? <div className="empty-state"><div className="empty-state-title">No notes yet</div></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.map((n) => (
                  <div key={n.id} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', borderLeft: '3px solid #2563EB' }}>
                    {editingNoteId === n.id ? (
                      <div>
                        <input
                          type="text" className="form-input" style={{ marginBottom: 8 }}
                          value={editNoteText} onChange={e => setEditNoteText(e.target.value)}
                          maxLength={1000} autoFocus
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" disabled={savingNote} onClick={() => saveEditNote(n.id)}>
                            <Check size={13} /> Save
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={cancelEditNote}>
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, color: '#0F172A', marginBottom: 6, wordBreak: 'break-word' }}>{n.note}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>
                            {n.createdAt ? format(new Date(n.createdAt), 'MMM d, yyyy h:mm a') : ''}
                            {n.updatedAt && <span> · edited</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => startEditNote(n)} title="Edit note"
                            style={{ background: '#EFF6FF', border: 'none', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2563EB' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setConfirmDeleteNote(n.id)} title="Delete note"
                            style={{ background: '#FEE2E2', border: 'none', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#DC2626' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                    {confirmDeleteNote === n.id && (
                      <div style={{ marginTop: 10, padding: 10, background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                        <div style={{ fontSize: 13, color: '#991B1B', marginBottom: 8 }}>Delete this note? This can't be undone.</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm" style={{ background: '#DC2626', color: 'white', border: 'none' }} onClick={() => deleteNote(n.id)}>Delete</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteNote(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
