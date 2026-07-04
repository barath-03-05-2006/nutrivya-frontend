import React, { useState, useEffect } from 'react';
import { mealAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { generateMealPlanPDF } from '../../utils/generateMealPlanPDF';
import { Download, Calendar, ChevronDown, ChevronUp, Salad } from 'lucide-react';
import { format } from 'date-fns';

const MEAL_LABELS = {
  EARLY_MORNING: '🌄 Early Morning', BREAKFAST: '🌅 Breakfast',
  MID_MORNING: '🍎 Mid Morning',    LUNCH: '☀️ Lunch',
  EVENING_SNACK: '🌤️ Evening Snack', DINNER: '🌙 Dinner',
};

export default function MyPlans() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    mealAPI.getMyPlans()
      .then(r => setPlans(r.data || []))
      .catch(() => addToast('Failed to load plans', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const downloadPDF = async (plan) => {
    setDownloading(p => ({ ...p, [plan.id]: true }));
    try {
      generateMealPlanPDF(plan, user?.fullName || 'Client', 'Your Dietitian');
      addToast('PDF downloaded!', 'success');
    } catch {
      addToast('Failed to generate PDF', 'error');
    } finally {
      setDownloading(p => ({ ...p, [plan.id]: false }));
    }
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Diet Plans</h1>
        <p className="page-subtitle">Download any plan as a PDF to view offline</p>
      </div>

      {plans.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Salad size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="empty-state-title">No plans yet</div>
            <div className="empty-state-desc">Your dietitian hasn't assigned any meal plans yet.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...plans].sort((a, b) => new Date(b.planDate) - new Date(a.planDate)).map(plan => {
            const isOpen = expanded[plan.id];
            const completed = plan.meals?.filter(m => m.completed).length || 0;
            const total = plan.meals?.length || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={plan.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Plan header */}
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: isOpen ? '#F0F6FF' : 'white', borderBottom: isOpen ? '1px solid #DBEAFE' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={18} color="white" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{plan.planName || 'Meal Plan'}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                        {plan.planDate ? format(new Date(plan.planDate), 'EEE, MMM d yyyy') : '—'}
                        {' · '}{total} meals
                        {' · '}<span style={{ color: pct >= 70 ? '#22C55E' : '#F59E0B', fontWeight: 600 }}>{pct}% done</span>
                      </div>
                    </div>
                  </div>

                  {/* Macros summary */}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { label: 'Cal',     value: Math.round(plan.totalCalories||0), unit: 'kcal', color: '#2563EB' },
                      { label: 'Protein', value: (plan.totalProtein||0).toFixed(0),  unit: 'g',    color: '#22C55E' },
                      { label: 'Carbs',   value: (plan.totalCarbs||0).toFixed(0),    unit: 'g',    color: '#F59E0B' },
                      { label: 'Fat',     value: (plan.totalFat||0).toFixed(0),      unit: 'g',    color: '#EF4444' },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{m.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: m.color, fontFamily: 'JetBrains Mono, monospace' }}>
                          {m.value}<span style={{ fontSize: 10, opacity: 0.7 }}>{m.unit}</span>
                        </div>
                      </div>
                    ))}

                    {/* Download PDF */}
                    <button
                      onClick={() => downloadPDF(plan)}
                      disabled={downloading[plan.id]}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Download size={14} />
                      {downloading[plan.id] ? 'Generating...' : 'Download PDF'}
                    </button>

                    {/* Expand toggle */}
                    <button onClick={() => toggle(plan.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Completion bar */}
                <div style={{ height: 4, background: '#F1F5F9' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#22C55E' : '#F59E0B', transition: 'width 1s ease' }} />
                </div>

                {/* Expanded meals preview */}
                {isOpen && (
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {plan.meals?.map(meal => (
                        <div key={meal.id} style={{ borderRadius: 10, border: `1px solid ${meal.completed ? '#BBF7D0' : '#E2E8F0'}`, overflow: 'hidden' }}>
                          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: meal.completed ? '#DCFCE7' : '#F8FAFC', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{MEAL_LABELS[meal.mealType] || meal.mealType}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>{Math.round(meal.totalCalories||0)} kcal</span>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: meal.completed ? '#22C55E' : '#E2E8F0', color: meal.completed ? 'white' : '#64748B' }}>
                                {meal.completed ? '✓ Done' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          {meal.foodItems?.length > 0 && (
                            <div style={{ padding: '8px 14px' }}>
                              {meal.foodItems.map((fi, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13, flexWrap: 'wrap', gap: 4 }}>
                                  <span style={{ fontWeight: 500 }}>{fi.foodName} <span style={{ color: '#94A3B8', fontSize: 12 }}>({fi.quantity}{fi.quantityUnit})</span></span>
                                  <span style={{ color: '#2563EB', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{Math.round(fi.calories||0)} kcal</span>
                                </div>
                              ))}
                            </div>
                          )}
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
  );
}
