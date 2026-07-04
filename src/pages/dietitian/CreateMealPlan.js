import React, { useState, useEffect, useMemo } from 'react';
import { mealAPI, clientAPI, foodAPI } from '../../services/api';
import { calcNutritionForUnit, SUPPORTED_UNITS } from '../../utils/unitConversion';
import AddFoodModal from '../../components/shared/AddFoodModal';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Search, ChevronRight, ChevronLeft, CheckCircle2, Copy } from 'lucide-react';

const MEAL_TYPES = [
  { key: 'EARLY_MORNING', label: 'Early Morning', icon: '🌄' },
  { key: 'BREAKFAST',     label: 'Breakfast',     icon: '🌅' },
  { key: 'MID_MORNING',   label: 'Mid Morning',   icon: '🍎' },
  { key: 'LUNCH',         label: 'Lunch',         icon: '☀️' },
  { key: 'EVENING_SNACK', label: 'Evening Snack', icon: '🌤️' },
  { key: 'DINNER',        label: 'Dinner',        icon: '🌙' },
];

const EMPTY_MEAL  = (type) => ({ mealType: type.key, mealName: type.label, foodItems: [] });
const EMPTY_FOOD  = ()     => ({ foodId: '', foodName: '', quantity: 100, quantityUnit: 'g', calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
const STEPS = ['Client & Plan Info', 'Add Meals & Foods', 'Review & Save'];

export default function CreateMealPlan() {
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodsError, setFoodsError] = useState(false);
  const [foodSearch, setFoodSearch] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingPlans, setExistingPlans] = useState([]);
  const [addFoodTarget, setAddFoodTarget] = useState(null); // { mealIdx, fiIdx, name }

  const [meta, setMeta] = useState({
    clientId: '', planName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetCalories: '', targetProtein: '', targetCarbs: '',
    targetFat: '', targetFiber: '', targetWater: '',
  });
  const [meals, setMeals] = useState(MEAL_TYPES.map(EMPTY_MEAL));

  useEffect(() => {
    clientAPI.getMyClients()
      .then(r => setClients(r.data || []))
      .catch(() => {});
    foodAPI.getAll()
      .then(r => setFoods(r.data || []))
      .catch(() => setFoodsError(true));
  }, []);

  // Load existing plans when client changes (for duplicate feature)
  useEffect(() => {
    if (!meta.clientId) { setExistingPlans([]); return; }
    mealAPI.getClientPlans(meta.clientId)
      .then(r => setExistingPlans(r.data || []))
      .catch(() => setExistingPlans([]));
  }, [meta.clientId]);

  // Live nutrition totals
  const totals = useMemo(() => meals.reduce((acc, meal) => {
    meal.foodItems.forEach(fi => {
      acc.calories += fi.calories || 0;
      acc.protein  += fi.protein  || 0;
      acc.carbs    += fi.carbohydrates || 0;
      acc.fat      += fi.fat      || 0;
      acc.fiber    += fi.fiber    || 0;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }), [meals]);

  const addFoodItem = (mealIdx) => {
    setMeals(prev => {
      const next = [...prev];
      next[mealIdx] = { ...next[mealIdx], foodItems: [...next[mealIdx].foodItems, EMPTY_FOOD()] };
      return next;
    });
  };

  const removeFoodItem = (mealIdx, fiIdx) => {
    setMeals(prev => {
      const next = [...prev];
      next[mealIdx] = { ...next[mealIdx], foodItems: next[mealIdx].foodItems.filter((_, i) => i !== fiIdx) };
      return next;
    });
  };

  const updateFoodItem = (mealIdx, fiIdx, field, val) => {
    setMeals(prev => {
      const next = [...prev];
      const items = [...next[mealIdx].foodItems];
      const updated = { ...items[fiIdx], [field]: val };

      // Recalculate nutrition whenever quantity OR unit changes, using the
      // food's actual per-100g base values + the correct gram-equivalent for the unit.
      if ((field === 'quantity' || field === 'quantityUnit') && updated._foodBase) {
        const qty  = field === 'quantity' ? val : updated.quantity;
        const unit = field === 'quantityUnit' ? val : updated.quantityUnit;
        const nutrition = calcNutritionForUnit(updated._foodBase, qty, unit);
        Object.assign(updated, nutrition);
      }

      items[fiIdx] = updated;
      next[mealIdx] = { ...next[mealIdx], foodItems: items };
      return next;
    });
  };

  const selectFood = (mealIdx, fiIdx, food) => {
    setMeals(prev => {
      const next = [...prev];
      const items = [...next[mealIdx].foodItems];
      const existing = items[fiIdx];
      // Default to the food's natural serving unit if it's one of our supported units, else grams
      const unit = SUPPORTED_UNITS.includes(food.servingUnit) ? food.servingUnit : (existing.quantityUnit || 'g');
      const qty = existing.quantity || 100;
      const nutrition = calcNutritionForUnit(food, qty, unit);
      items[fiIdx] = {
        ...existing,
        foodId: food.id,
        foodName: food.foodName,
        quantityUnit: unit,
        _foodBase: food, // store the full food record for recalculation on qty/unit change
        ...nutrition,
      };
      next[mealIdx] = { ...next[mealIdx], foodItems: items };
      return next;
    });
    setFoodSearch(p => ({ ...p, [`${mealIdx}-${fiIdx}`]: '' }));
  };

  // Duplicate from existing plan
  const duplicatePlan = (plan) => {
    if (!plan || !plan.meals) return;
    const newMeals = MEAL_TYPES.map(type => {
      const existing = plan.meals.find(m => m.mealType === type.key);
      if (!existing) return EMPTY_MEAL(type);
      return {
        mealType: type.key,
        mealName: existing.mealName || type.label,
        foodItems: (existing.foodItems || []).map(fi => ({
          foodId: fi.foodId || '',
          foodName: fi.foodName || '',
          quantity: fi.quantity || 100,
          quantityUnit: fi.quantityUnit || 'g',
          calories: fi.calories || 0,
          protein: fi.protein || 0,
          carbohydrates: fi.carbohydrates || 0,
          fat: fi.fat || 0,
          fiber: fi.fiber || 0,
        })),
      };
    });
    setMeals(newMeals);
    setMeta(p => ({ ...p, planName: `Copy of ${plan.planName || 'Plan'}` }));
    addToast('Plan copied! Edit meals as needed.', 'info');
    setStep(1);
  };

  const handleSave = async () => {
    if (!meta.clientId) { addToast('Please select a client', 'error'); return; }
    if (!meta.planName.trim()) { addToast('Please enter a plan name', 'error'); return; }
    if (meta.planName.length > 255) { addToast('Plan name is too long', 'error'); return; }
    const hasFoods = meals.some(m => m.foodItems.length > 0);
    if (!hasFoods) { addToast('Add at least one food item', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        clientId: parseInt(meta.clientId),
        planName: meta.planName.trim(),
        startDate: meta.startDate,
        endDate: meta.endDate || null,
        targetCalories: meta.targetCalories ? parseFloat(meta.targetCalories) : null,
        targetProtein:  meta.targetProtein  ? parseFloat(meta.targetProtein)  : null,
        targetCarbs:    meta.targetCarbs    ? parseFloat(meta.targetCarbs)    : null,
        targetFat:      meta.targetFat      ? parseFloat(meta.targetFat)      : null,
        targetFiber:    meta.targetFiber    ? parseFloat(meta.targetFiber)    : null,
        targetWater:    meta.targetWater    ? parseFloat(meta.targetWater)    : null,
        meals: meals.filter(m => m.foodItems.length > 0).map(m => ({
          mealType: m.mealType, mealName: m.mealName,
          foodItems: m.foodItems.map(fi => ({
            foodId: fi.foodId || null,
            foodName: fi.foodName,
            quantity: fi.quantity,
            quantityUnit: fi.quantityUnit,
            calories: fi.calories,
            protein: fi.protein,
            carbohydrates: fi.carbohydrates,
            fat: fi.fat,
            fiber: fi.fiber,
          })),
        })),
      };
      await mealAPI.create(payload);
      setSaved(true);
      addToast('Meal plan created successfully!', 'success');
    } catch (e) {
      addToast(e.response?.data?.error || 'Failed to create meal plan', 'error');
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setMeta({ clientId: '', planName: '', startDate: new Date().toISOString().split('T')[0], endDate: '', targetCalories: '', targetProtein: '', targetCarbs: '', targetFat: '', targetFiber: '', targetWater: '' });
    setMeals(MEAL_TYPES.map(EMPTY_MEAL));
    setStep(0); setSaved(false);
  };

  const NutritionBar = ({ label, val, target, color }) => {
    const pct = target ? Math.min((val / target) * 100, 100) : 0;
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color }}>{Math.round(val)}{target ? ` / ${target}` : ''}</span>
        </div>
        {target > 0 && <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3 }}><div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} /></div>}
      </div>
    );
  };

  if (saved) return (
    <div className="card" style={{ textAlign: 'center', padding: 60 }}>
      <CheckCircle2 size={56} color="#22C55E" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Meal Plan Created!</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>The plan has been assigned to your client.</p>
      <button className="btn btn-primary" onClick={resetForm}><Plus size={16} /> Create Another</button>
    </div>
  );

  const selectedClient = clients.find(c => String(c.user?.id ?? c.id) === String(meta.clientId));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Create Meal Plan</h1>
        <p className="page-subtitle">Build a personalised nutrition plan step by step</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', marginBottom: 28, flexWrap: 'wrap', gap: 8 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: i <= step ? '#2563EB' : '#E2E8F0', color: i <= step ? 'white' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: i === step ? '#2563EB' : i < step ? 'var(--text-secondary)' : '#94A3B8', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, minWidth: 20, height: 1, background: i < step ? '#2563EB' : 'var(--border)', margin: '0 8px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: Client & Plan Info ── */}
      {step === 0 && (
        <div className="card">
          <h3 className="section-title">Client & Plan Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Client *</label>
              <select className="form-input" value={meta.clientId} onChange={e => setMeta(p => ({ ...p, clientId: e.target.value }))}>
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.user?.id ?? c.id} value={c.user?.id ?? c.id}>{c.user?.fullName ?? c.fullName ?? '(no name)'}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Plan Name *</label>
              <input className="form-input" placeholder="e.g. Weight Loss Week 1" maxLength={255} value={meta.planName} onChange={e => setMeta(p => ({ ...p, planName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={meta.startDate} onChange={e => setMeta(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date (optional)</label>
              <input className="form-input" type="date" value={meta.endDate} onChange={e => setMeta(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>

          {/* Duplicate from existing plan */}
          {meta.clientId && existingPlans.length > 0 && (
            <div style={{ marginBottom: 20, padding: 14, background: '#F0F6FF', border: '1px solid #BFDBFE', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Copy size={15} color="#2563EB" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>Copy from an existing plan</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {existingPlans.slice(0, 5).map(plan => (
                  <button key={plan.id} onClick={() => duplicatePlan(plan)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
                    <Copy size={12} /> {plan.planName || 'Unnamed Plan'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Targets (optional)</div>
          <div className="grid-3">
            {[
              { key: 'targetCalories', label: 'Calories (kcal)' }, { key: 'targetProtein', label: 'Protein (g)' },
              { key: 'targetCarbs', label: 'Carbs (g)' }, { key: 'targetFat', label: 'Fat (g)' },
              { key: 'targetFiber', label: 'Fiber (g)' }, { key: 'targetWater', label: 'Water (ml)' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input className="form-input" type="number" placeholder="—" value={meta[f.key]} onChange={e => setMeta(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => {
              if (!meta.clientId || !meta.planName.trim()) { addToast('Please fill in client and plan name', 'error'); return; }
              setStep(1);
            }}>
              Next: Add Meals <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Meals & Foods ── */}
      {step === 1 && (
        <div>
          {/* Live nutrition totals bar */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 8 }}>Plan Totals:</span>
            {[
              { label: 'Cal',    val: totals.calories, target: meta.targetCalories, color: '#2563EB', unit: 'kcal' },
              { label: 'Protein',val: totals.protein,  target: meta.targetProtein,  color: '#22C55E', unit: 'g'    },
              { label: 'Carbs',  val: totals.carbs,    target: meta.targetCarbs,    color: '#F59E0B', unit: 'g'    },
              { label: 'Fat',    val: totals.fat,      target: meta.targetFat,      color: '#EF4444', unit: 'g'    },
              { label: 'Fiber',  val: totals.fiber,    target: meta.targetFiber,    color: '#8B5CF6', unit: 'g'    },
            ].map(n => (
              <div key={n.label} style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{n.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: n.color, fontFamily: 'var(--font-mono)' }}>
                  {Math.round(n.val)}
                  {n.target && <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>/{n.target}{n.unit}</span>}
                </div>
                {parseFloat(n.target) > 0 && (
                  <div style={{ height: 3, background: '#F1F5F9', borderRadius: 2, marginTop: 3 }}>
                    <div style={{ width: `${Math.min((n.val / parseFloat(n.target)) * 100, 100)}%`, height: '100%', background: n.color, borderRadius: 2 }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {foodsError && (
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              ⚠️ Couldn't load the food database. You can still type food names manually and enter nutrition values.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setAddFoodTarget({ mealIdx: null, fiIdx: null, name: '' })}>
              <Plus size={14} /> Add New Food to Database
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MEAL_TYPES.map((mealType, mealIdx) => {
              const meal = meals[mealIdx];
              const mealCal = Math.round(meal.foodItems.reduce((s, fi) => s + (fi.calories || 0), 0));
              return (
                <div key={mealType.key} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{mealType.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{mealType.label}</div>
                        {mealCal > 0 && <div style={{ fontSize: 12, color: '#2563EB', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{mealCal} kcal</div>}
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => addFoodItem(mealIdx)}>
                      <Plus size={14} /> Add Food
                    </button>
                  </div>

                  {meal.foodItems.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', border: '1.5px dashed #E2E8F0', borderRadius: 8, color: '#94A3B8', fontSize: 13 }}>
                      No foods added — click "Add Food" to start
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {meal.foodItems.map((fi, fiIdx) => {
                        const searchKey = `${mealIdx}-${fiIdx}`;
                        const query = foodSearch[searchKey] || '';
                        const filtered = !foodsError && query.length >= 2
                          ? foods.filter(f => f.foodName?.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
                          : [];
                        return (
                          <div key={fiIdx} style={{ padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <div style={{ flex: 2, minWidth: 160, position: 'relative' }}>
                                <label className="form-label">Food Name</label>
                                <div className="input-wrapper">
                                  <Search size={14} className="input-icon" />
                                  <input className="form-input input-with-icon"
                                    placeholder={foodsError ? 'Type food name...' : 'Search food...'}
                                    value={fi.foodId ? fi.foodName : query}
                                    onChange={e => {
                                      if (fi.foodId) {
                                        updateFoodItem(mealIdx, fiIdx, 'foodId', '');
                                        updateFoodItem(mealIdx, fiIdx, 'foodName', e.target.value);
                                      }
                                      setFoodSearch(p => ({ ...p, [searchKey]: e.target.value }));
                                    }}
                                  />
                                </div>
                                {filtered.length > 0 && !fi.foodId && (
                                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, boxShadow: 'var(--shadow-md)', maxHeight: 220, overflowY: 'auto' }}>
                                    {filtered.map(f => (
                                      <div key={f.id} onClick={() => selectFood(mealIdx, fiIdx, f)}
                                        style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F1F5F9' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                        <div style={{ fontWeight: 600 }}>{f.foodName}</div>
                                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{f.caloriesPer100g} kcal / 100g</div>
                                      </div>
                                    ))}
                                    <div onClick={() => setAddFoodTarget({ mealIdx, fiIdx, name: query })}
                                      style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 600, background: '#F0F6FF' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                                      onMouseLeave={e => e.currentTarget.style.background = '#F0F6FF'}>
                                      <Plus size={13} /> Can't find "{query}"? Add it as a new food
                                    </div>
                                  </div>
                                )}
                                {filtered.length === 0 && !fi.foodId && query.length >= 2 && (
                                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, boxShadow: 'var(--shadow-md)' }}>
                                    <div onClick={() => setAddFoodTarget({ mealIdx, fiIdx, name: query })}
                                      style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 600, background: '#F0F6FF' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                                      onMouseLeave={e => e.currentTarget.style.background = '#F0F6FF'}>
                                      <Plus size={13} /> No match. Add "{query}" as a new food
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div style={{ width: 90 }}>
                                <label className="form-label">Qty</label>
                                <input className="form-input" type="number" value={fi.quantity} onChange={e => updateFoodItem(mealIdx, fiIdx, 'quantity', parseFloat(e.target.value) || 0)} />
                              </div>
                              <div style={{ width: 80 }}>
                                <label className="form-label">Unit</label>
                                <select className="form-input" value={fi.quantityUnit} onChange={e => updateFoodItem(mealIdx, fiIdx, 'quantityUnit', e.target.value)}>
                                  {SUPPORTED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                              <div style={{ flex: 1, minWidth: 70 }}>
                                <label className="form-label">Cal</label>
                                <input className="form-input" type="number" value={fi.calories} onChange={e => updateFoodItem(mealIdx, fiIdx, 'calories', parseFloat(e.target.value) || 0)} />
                              </div>
                              <div style={{ flex: 1, minWidth: 70 }}>
                                <label className="form-label">Protein</label>
                                <input className="form-input" type="number" step="0.1" value={fi.protein} onChange={e => updateFoodItem(mealIdx, fiIdx, 'protein', parseFloat(e.target.value) || 0)} />
                              </div>
                              <div style={{ flex: 1, minWidth: 70 }}>
                                <label className="form-label">Carbs</label>
                                <input className="form-input" type="number" step="0.1" value={fi.carbohydrates} onChange={e => updateFoodItem(mealIdx, fiIdx, 'carbohydrates', parseFloat(e.target.value) || 0)} />
                              </div>
                              <div style={{ flex: 1, minWidth: 70 }}>
                                <label className="form-label">Fat</label>
                                <input className="form-input" type="number" step="0.1" value={fi.fat} onChange={e => updateFoodItem(mealIdx, fiIdx, 'fat', parseFloat(e.target.value) || 0)} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                                <button onClick={() => removeFoodItem(mealIdx, fiIdx)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 7, width: 34, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#DC2626' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(0)}><ChevronLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Review Plan <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review & Save ── */}
      {step === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">Plan Summary</h3>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>CLIENT</span><div style={{ fontWeight: 700, marginTop: 2 }}>{selectedClient?.user?.fullName ?? selectedClient?.fullName ?? '—'}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>PLAN NAME</span><div style={{ fontWeight: 700, marginTop: 2 }}>{meta.planName}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>START DATE</span><div style={{ fontWeight: 700, marginTop: 2 }}>{meta.startDate}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>END DATE</span><div style={{ fontWeight: 700, marginTop: 2 }}>{meta.endDate || 'Open-ended'}</div></div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Total Nutrition</div>
              <div className="grid-3">
                {[
                  { label: 'Calories', val: totals.calories, target: meta.targetCalories, color: '#2563EB' },
                  { label: 'Protein',  val: totals.protein,  target: meta.targetProtein,  color: '#22C55E' },
                  { label: 'Carbs',    val: totals.carbs,    target: meta.targetCarbs,    color: '#F59E0B' },
                  { label: 'Fat',      val: totals.fat,      target: meta.targetFat,      color: '#EF4444' },
                  { label: 'Fiber',    val: totals.fiber,    target: meta.targetFiber,    color: '#8B5CF6' },
                ].map(n => (
                  <NutritionBar key={n.label} label={n.label} val={n.val} target={parseFloat(n.target) || 0} color={n.color} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {meals.filter(m => m.foodItems.length > 0).length} meal(s) · {meals.reduce((a, m) => a + m.foodItems.length, 0)} food items
            </div>
          </div>

          {meals.filter(m => m.foodItems.length > 0).map((meal, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{MEAL_TYPES.find(t => t.key === meal.mealType)?.icon}</span>
                <span style={{ fontWeight: 700 }}>{meal.mealName}</span>
                <span style={{ fontSize: 12, color: '#2563EB', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                  {Math.round(meal.foodItems.reduce((a, fi) => a + (fi.calories || 0), 0))} kcal
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {meal.foodItems.map((fi, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--bg-gray)', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontWeight: 500 }}>{fi.foodName || '—'} <span style={{ color: '#94A3B8' }}>({fi.quantity}{fi.quantityUnit})</span></span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 12 }}>
                      {Math.round(fi.calories)}kcal · P:{fi.protein}g · C:{fi.carbohydrates}g · F:{fi.fat}g
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back to Edit</button>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
              <CheckCircle2 size={17} /> {saving ? 'Saving...' : 'Create Meal Plan'}
            </button>
          </div>
        </div>
      )}

      {addFoodTarget && (
        <AddFoodModal
          initialName={addFoodTarget.name}
          onClose={() => setAddFoodTarget(null)}
          onCreated={(newFood) => {
            // Add to local foods list so it's instantly searchable for the rest of this session
            setFoods(prev => [...prev, newFood]);
            // If this was triggered from a specific food row, auto-select it there too
            if (addFoodTarget.mealIdx !== null && addFoodTarget.fiIdx !== null) {
              selectFood(addFoodTarget.mealIdx, addFoodTarget.fiIdx, newFood);
            }
            addToast(`"${newFood.foodName}" added to the food database!`, 'success');
            setAddFoodTarget(null);
          }}
        />
      )}
    </div>
  );
}
