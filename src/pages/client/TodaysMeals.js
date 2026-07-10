import React, { useState, useEffect, useCallback } from 'react';
import { mealAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, ChevronDown, ChevronUp, Salad, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateMealPlanPDF } from '../../utils/generateMealPlanPDF';
import { format } from 'date-fns';

const MEAL_ICONS = { EARLY_MORNING: '🌄', BREAKFAST: '🌅', MID_MORNING: '🍎', LUNCH: '☀️', EVENING_SNACK: '🌤️', DINNER: '🌙', BEDTIME: '🛏️' };
const MEAL_LABELS = { EARLY_MORNING: 'Early Morning', BREAKFAST: 'Breakfast', MID_MORNING: 'Mid Morning', LUNCH: 'Lunch', EVENING_SNACK: 'Evening Snack', DINNER: 'Dinner', BEDTIME: 'Bedtime' };
const MEAL_TIMES = { EARLY_MORNING: '6:00 AM', BREAKFAST: '8:00 AM', MID_MORNING: '11:00 AM', LUNCH: '1:00 PM', EVENING_SNACK: '5:00 PM', DINNER: '8:00 PM', BEDTIME: '10:00 PM' };

export default function TodaysMeals() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState({});
  const [deviationOpen, setDeviationOpen] = useState({});
  const [deviationText, setDeviationText] = useState({});
  const [submittingDeviation, setSubmittingDeviation] = useState({});

  const downloadPDF = async () => {
    if (!plan) return;
    setDownloading(true);
    try {
      generateMealPlanPDF(plan, user?.fullName || 'Client', 'Your Dietitian');
      addToast('PDF downloaded!', 'success');
    } catch (e) {
      addToast('Failed to generate PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await mealAPI.getToday();
      setPlan(res.data);
      const exp = {};
      (res.data.meals || []).forEach(m => { if (!m.completed) exp[m.id] = true; });
      setExpanded(exp);
    } catch (e) {
      if (e.response?.status !== 404) addToast('Failed to load meal plan', 'error');
    } finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const completeMeal = async (mealId, mealType) => {
    setCompleting(p => ({ ...p, [mealId]: true }));
    try {
      await mealAPI.completeMeal(mealId);
      addToast(`${MEAL_LABELS[mealType] || 'Meal'} marked as complete!`, 'success');
      await load();
    } catch {
      addToast('Failed to mark meal complete', 'error');
    } finally { setCompleting(p => ({ ...p, [mealId]: false })); }
  };

  const submitDeviation = async (mealId) => {
    const note = (deviationText[mealId] || '').trim();
    if (!note) { addToast('Write what you actually ate first', 'error'); return; }
    setSubmittingDeviation(p => ({ ...p, [mealId]: true }));
    try {
      await mealAPI.reportDeviation(mealId, note);
      addToast('Sent to your dietitian for review', 'success');
      setDeviationOpen(p => ({ ...p, [mealId]: false }));
      await load();
    } catch (e) {
      addToast(e.response?.data?.error || 'Failed to send update', 'error');
    } finally { setSubmittingDeviation(p => ({ ...p, [mealId]: false })); }
  };

  if (loading) return <div className="loading-spinner" />;

  const completed = plan?.meals?.filter(m => m.completed).length || 0;
  const total = plan?.meals?.length || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Today's Meal Plan</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {plan && (
          <button onClick={downloadPDF} disabled={downloading} className="btn btn-primary btn-sm">
            <Download size={15} /> {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        )}
      </div>

      {!plan ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Salad size={48} /></div>
            <div className="empty-state-title">No meal plan for today</div>
            <div className="empty-state-desc">Your dietitian hasn't assigned a meal plan yet. Check back later!</div>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', border: 'none', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Daily Progress</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{completed} / {total} <span style={{ fontSize: 16, opacity: 0.75 }}>meals completed</span></div>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Cal', value: `${plan.totalCalories || 0}`, unit: 'kcal' },
                  { label: 'Protein', value: `${(plan.totalProtein || 0).toFixed(0)}`, unit: 'g' },
                  { label: 'Carbs', value: `${(plan.totalCarbs || 0).toFixed(0)}`, unit: 'g' },
                  { label: 'Fat', value: `${(plan.totalFat || 0).toFixed(0)}`, unit: 'g' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}<span style={{ fontSize: 13, opacity: 0.75 }}> {s.unit}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                <span>Completion</span><span>{pct}%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'white', borderRadius: 4, transition: 'width 1s ease' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plan.meals?.map(meal => (
              <div key={meal.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(p => ({ ...p, [meal.id]: !p[meal.id] }))}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: meal.completed ? '#F0FDF4' : 'white', borderBottom: expanded[meal.id] ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{MEAL_ICONS[meal.mealType] || '🍽️'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{MEAL_LABELS[meal.mealType] || meal.mealType}</span>
                        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>({MEAL_TIMES[meal.mealType]})</span>
                        {meal.completed && <span className="badge badge-green">✓ Done</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{meal.mealName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {[
                        { v: (meal.actualCalories ?? meal.totalCalories) || 0, u: 'kcal', c: '#2563EB' },
                        { v: `${((meal.actualProtein ?? meal.totalProtein) || 0).toFixed(0)}g`, u: 'P', c: '#22C55E' },
                        { v: `${((meal.actualCarbs ?? meal.totalCarbs) || 0).toFixed(0)}g`, u: 'C', c: '#F59E0B' },
                        { v: `${((meal.actualFat ?? meal.totalFat) || 0).toFixed(0)}g`, u: 'F', c: '#EF4444' },
                      ].map((n, i) => (
                        <span key={i} style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                          <span style={{ fontWeight: 700, color: n.c }}>{n.v}</span>
                          <span style={{ color: '#94A3B8', marginLeft: 2 }}>{n.u}</span>
                        </span>
                      ))}
                    </div>
                    {expanded[meal.id] ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                  </div>
                </div>

                {expanded[meal.id] && (
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Food Items</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {meal.foodItems?.map(fi => (
                          <div key={fi.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{fi.foodName}</div>
                              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{fi.quantity} {fi.quantityUnit}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 14 }}>
                              {[
                                { v: `${fi.calories || 0}`, u: 'kcal', c: '#2563EB' },
                                { v: `${(fi.protein || 0).toFixed(1)}g`, u: 'P', c: '#22C55E' },
                                { v: `${(fi.carbohydrates || 0).toFixed(1)}g`, u: 'C', c: '#F59E0B' },
                                { v: `${(fi.fat || 0).toFixed(1)}g`, u: 'F', c: '#EF4444' },
                              ].map((n, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: n.c, fontFamily: 'JetBrains Mono, monospace' }}>{n.v}</div>
                                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{n.u}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16, padding: 14, background: meal.hasDeviation ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${meal.hasDeviation ? '#FDE68A' : '#E2E8F0'}`, borderRadius: 10 }}>
                      {meal.hasDeviation ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>What you actually ate</div>
                            {meal.deviationReviewed ? (
                              <span className="badge badge-green">✓ Reviewed by dietitian</span>
                            ) : (
                              <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>Pending review</span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: '#475569', marginBottom: deviationOpen[meal.id] ? 10 : 0 }}>{meal.clientNote}</div>
                          {meal.deviationReviewed && (
                            <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginTop: 6 }}>
                              Nutrition updated: {meal.actualCalories ?? 0} kcal · P {(meal.actualProtein || 0).toFixed(0)}g · C {(meal.actualCarbs || 0).toFixed(0)}g · F {(meal.actualFat || 0).toFixed(0)}g
                            </div>
                          )}
                          {!deviationOpen[meal.id] ? (
                            <button className="btn btn-sm" style={{ marginTop: 10, background: 'white', border: '1px solid #E2E8F0' }}
                              onClick={() => { setDeviationOpen(p => ({ ...p, [meal.id]: true })); setDeviationText(p => ({ ...p, [meal.id]: meal.clientNote || '' })); }}>
                              Update what you ate
                            </button>
                          ) : (
                            <div style={{ marginTop: 4 }}>
                              <textarea className="form-input" rows={2} style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                                value={deviationText[meal.id] || ''} onChange={e => setDeviationText(p => ({ ...p, [meal.id]: e.target.value }))}
                                placeholder="E.g. Had 2 idlis and chutney instead of the oats bowl" />
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button className="btn btn-accent btn-sm" disabled={submittingDeviation[meal.id]} onClick={() => submitDeviation(meal.id)}>
                                  {submittingDeviation[meal.id] ? 'Sending...' : 'Send to dietitian'}
                                </button>
                                <button className="btn btn-sm" style={{ background: 'white', border: '1px solid #E2E8F0' }} onClick={() => setDeviationOpen(p => ({ ...p, [meal.id]: false }))}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : !deviationOpen[meal.id] ? (
                        <button className="btn btn-sm" style={{ background: 'white', border: '1px solid #E2E8F0' }}
                          onClick={() => setDeviationOpen(p => ({ ...p, [meal.id]: true }))}>
                          Ate something different from the plan?
                        </button>
                      ) : (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Tell your dietitian what you actually had</div>
                          <textarea className="form-input" rows={2} style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                            value={deviationText[meal.id] || ''} onChange={e => setDeviationText(p => ({ ...p, [meal.id]: e.target.value }))}
                            placeholder="E.g. Had 2 idlis and chutney instead of the oats bowl" />
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button className="btn btn-accent btn-sm" disabled={submittingDeviation[meal.id]} onClick={() => submitDeviation(meal.id)}>
                              {submittingDeviation[meal.id] ? 'Sending...' : 'Send to dietitian'}
                            </button>
                            <button className="btn btn-sm" style={{ background: 'white', border: '1px solid #E2E8F0' }} onClick={() => setDeviationOpen(p => ({ ...p, [meal.id]: false }))}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!meal.completed ? (
                      <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => completeMeal(meal.id, meal.mealType)} disabled={completing[meal.id]}>
                        <CheckCircle2 size={16} />
                        {completing[meal.id] ? 'Marking...' : `Mark ${MEAL_LABELS[meal.mealType]} as Complete`}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#DCFCE7', borderRadius: 8, color: '#16A34A', fontSize: 14, fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> Completed — Nutrition logged!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
