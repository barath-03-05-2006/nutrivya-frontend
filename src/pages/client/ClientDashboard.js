import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI } from '../../services/api';
import NutrientBar from '../../components/shared/NutrientBar';
import { CalorieChart, ProteinChart } from '../../components/charts/Charts';
import { SkeletonStatGrid, SkeletonCard } from '../../components/shared/Skeleton';
import { useToast } from '../../context/ToastContext';
import { Flame, Droplets, CheckCircle, UtensilsCrossed, Plus, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, subDays } from 'date-fns';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [water, setWater] = useState('');
  const [waterLoading, setWaterLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const load = useCallback(async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const [d, w] = await Promise.all([
        analyticsAPI.getMyDaily(dateStr),
        analyticsAPI.getMyWeekly(weekStart),
      ]);
      setDaily(d.data);
      setWeekly(w.data);
    } catch (e) {
      const msg = e.isNetworkError
        ? "Can't reach the server. Is the backend running?"
        : 'Failed to load dashboard data';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(currentDate); }, [currentDate, load]);

  const goDay = (dir) => {
    const next = dir === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    if (next > new Date()) return;
    setLoading(true);
    setCurrentDate(next);
  };

  const addWater = async () => {
    if (!water) return;
    const amount = parseFloat(water);
    setWaterLoading(true);
    try {
      await analyticsAPI.logWater({ waterAmount: amount, date: format(currentDate, 'yyyy-MM-dd') });
      setWater('');
      addToast('Water intake logged!', 'success');
      // Optimistic update so the UI reflects the new total instantly,
      // even if the backend/DB has a brief read-after-write delay.
      setDaily(prev => prev ? { ...prev, waterIntake: (prev.waterIntake || 0) + amount } : prev);
      load(currentDate); // still reconcile with the server in the background
    } catch {
      addToast('Failed to log water', 'error');
    } finally {
      setWaterLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div>
      <div className="page-header">
        <div style={{ height: 32, width: 260, background: '#F1F5F9', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 16, width: 180, background: '#F1F5F9', borderRadius: 6 }} />
      </div>
      <SkeletonStatGrid count={4} />
      <div className="grid-2" style={{ gap: 20 }}>
        <SkeletonCard rows={5} />
        <SkeletonCard rows={5} />
      </div>
    </div>
  );

  const d = daily || {};
  const calPct = d.targetCalories ? Math.min((d.caloriesConsumed / d.targetCalories) * 100, 100) : 0;
  const compliance = d.mealsAssigned > 0 ? Math.round((d.mealsCompleted / d.mealsAssigned) * 100) : 0;

  const weekDays = weekly?.dailyBreakdown?.map(day => ({
    date: day.date ? format(new Date(day.date), 'EEE') : '',
    calories: day.caloriesConsumed || 0,
    target: day.targetCalories || 2000,
    protein: day.proteinConsumed || 0,
  })) || [];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">{isToday ? `${greeting}, ${user?.fullName?.split(' ')[0]} 👋` : `Viewing Past Day`}</h1>
          <p className="page-subtitle">Nutrition summary for {format(currentDate, 'EEEE, MMMM d')}</p>
        </div>
        {/* Date navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px' }}>
          <button onClick={() => goDay('prev')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', padding: 4 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 80, textAlign: 'center' }}>
            {isToday ? 'Today' : format(currentDate, 'MMM d')}
          </span>
          <button onClick={() => goDay('next')} disabled={isToday} style={{ background: 'none', border: 'none', cursor: isToday ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: isToday ? 'var(--text-muted)' : 'var(--text-secondary)', padding: 4 }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {!isToday && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          Viewing data for {format(currentDate, 'MMMM d, yyyy')}. <button onClick={() => { setLoading(true); setCurrentDate(new Date()); }} style={{ background: 'none', border: 'none', color: '#92400E', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Back to today</button>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Calories Today', value: d.caloriesConsumed || 0, unit: 'kcal', sub: `Target: ${d.targetCalories || 2000} kcal`, icon: <Flame size={20} />, color: '#2563EB', bg: '#DBEAFE', pct: calPct },
          { label: 'Protein', value: `${(d.proteinConsumed || 0).toFixed(0)}`, unit: 'g', sub: `Target: ${d.targetProtein || 150}g`, icon: <TrendingUp size={20} />, color: '#22C55E', bg: '#DCFCE7' },
          { label: 'Water Intake', value: `${(d.waterIntake || 0).toFixed(0)}`, unit: 'ml', sub: `Target: ${d.targetWater || 3000}ml`, icon: <Droplets size={20} />, color: '#0EA5E9', bg: '#E0F2FE' },
          { label: 'Meals Done', value: `${d.mealsCompleted || 0}/${d.mealsAssigned || 0}`, sub: `${compliance}% compliance`, icon: <CheckCircle size={20} />, color: compliance >= 70 ? '#22C55E' : '#F59E0B', bg: compliance >= 70 ? '#DCFCE7' : '#FEF9C3' },
        ].map(s => (
          <div key={s.label} className="stat-card card-hover" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value} {s.unit && <span style={{ fontSize: 14, color: '#94A3B8' }}>{s.unit}</span>}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
              <div style={{ width: 42, height: 42, background: s.bg, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
            {s.pct !== undefined && (
              <>
                <div style={{ marginTop: 12, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{s.pct.toFixed(0)}% of target</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 className="section-title">Nutrients</h3>
          <NutrientBar label="Calories" consumed={d.caloriesConsumed || 0} target={d.targetCalories || 2000} unit=" kcal" color="#2563EB" />
          <NutrientBar label="Protein" consumed={d.proteinConsumed || 0} target={d.targetProtein || 150} color="#22C55E" />
          <NutrientBar label="Carbs" consumed={d.carbsConsumed || 0} target={d.targetCarbs || 200} color="#F59E0B" />
          <NutrientBar label="Fat" consumed={d.fatConsumed || 0} target={d.targetFat || 65} color="#EF4444" />
          <NutrientBar label="Fiber" consumed={d.fiberConsumed || 0} target={d.targetFiber || 30} color="#8B5CF6" />
        </div>

        <div className="card">
          <h3 className="section-title">Log Water</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="form-input" type="number" placeholder="Amount in ml" value={water} onChange={e => setWater(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={addWater} disabled={waterLoading || !water}>
              {waterLoading ? '...' : <><Plus size={16} /> Log</>}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[150, 250, 350, 500].map(ml => (
              <button key={ml} onClick={() => setWater(String(ml))} className="btn btn-ghost btn-sm">{ml}ml</button>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#E0F2FE', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#0369A1', fontWeight: 600, marginBottom: 4 }}>Today's Water</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0EA5E9' }}>
              {(d.waterIntake || 0).toFixed(0)} <span style={{ fontSize: 14, opacity: 0.7 }}>/ {d.targetWater || 3000} ml</span>
            </div>
            <div style={{ marginTop: 8, height: 6, background: 'rgba(14,165,233,0.2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min((d.waterIntake || 0) / (d.targetWater || 3000) * 100, 100)}%`, height: '100%', background: '#0EA5E9', borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link to="/client/meals" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              <UtensilsCrossed size={15} /> View Today's Meals
            </Link>
          </div>
        </div>
      </div>

      {weekDays.length > 0 && (
        <div className="grid-2" style={{ gap: 20 }}>
          <div className="card">
            <h3 className="section-title">Weekly Calories</h3>
            <CalorieChart data={weekDays} />
          </div>
          <div className="card">
            <h3 className="section-title">Weekly Protein</h3>
            <ProteinChart data={weekDays} />
          </div>
        </div>
      )}
    </div>
  );
}
