import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, alertAPI, digestAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SkeletonStatGrid, SkeletonTable } from '../../components/shared/Skeleton';
import { Users, Bell, TrendingUp, Activity, TrendingDown, ArrowRight, Mail } from 'lucide-react';

export default function DietitianDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState([]);
  const [sendingDigest, setSendingDigest] = useState(false);
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const sendDigest = async () => {
    setSendingDigest(true);
    try {
      await digestAPI.sendMyDigest();
      addToast('Weekly digest sent to your email!', 'success');
    } catch { addToast('Failed to send digest', 'error'); }
    finally { setSendingDigest(false); }
  };

  useEffect(() => {
    Promise.all([analyticsAPI.getAllClientsOverview(), alertAPI.getAll()])
      .then(([ov, al]) => { setOverview(ov.data || []); setAlerts((al.data || []).filter(a => !a.read)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avgCompliance = overview.length ? (overview.reduce((a, c) => a + (c.complianceRate || 0), 0) / overview.length).toFixed(0) : 0;
  const activeClients = overview.filter(c => c.complianceRate > 0).length;
  const unreadAlerts = alerts.length;

  if (loading) return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ height: 28, width: 280, background: '#F1F5F9', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 16, width: 200, background: '#F1F5F9', borderRadius: 6 }} />
      </div>
      <SkeletonStatGrid count={4} />
      <SkeletonTable rows={5} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's how your clients are doing today</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={sendDigest} disabled={sendingDigest} className="btn btn-outline btn-sm" title="Send weekly client report to your email">
            <Mail size={15} /> {sendingDigest ? 'Sending...' : 'Send Weekly Report'}
          </button>
          <Link to="/dietitian/create-meal-plan" className="btn btn-primary">
            <TrendingUp size={16} /> Create Meal Plan
          </Link>
        </div>
      </div>

      {unreadAlerts > 0 && (
        <Link to="/dietitian/alerts" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Bell size={16} color="#92400E" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>You have {unreadAlerts} unread alert{unreadAlerts > 1 ? 's' : ''} requiring attention</span>
            </div>
            <ArrowRight size={16} color="#92400E" />
          </div>
        </Link>
      )}

      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Clients', value: overview.length, icon: <Users size={20} />, color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Active Clients', value: activeClients, icon: <Activity size={20} />, color: '#22C55E', bg: '#DCFCE7' },
          { label: 'Avg Compliance', value: `${avgCompliance}%`, icon: <TrendingUp size={20} />, color: '#F59E0B', bg: '#FEF9C3' },
          { label: 'Unread Alerts', value: unreadAlerts, icon: <Bell size={20} />, color: unreadAlerts > 0 ? '#EF4444' : '#94A3B8', bg: unreadAlerts > 0 ? '#FEE2E2' : '#F1F5F9' },
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

      {overview.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <div className="empty-state-title">No clients yet</div>
            <div className="empty-state-desc">Add your first client to start tracking their nutrition progress.</div>
            <Link to="/dietitian/manage-clients" className="btn btn-primary" style={{ marginTop: 16 }}><Users size={15} /> Add First Client</Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 className="section-title" style={{ margin: 0 }}>Client Overview</h3>
            <Link to="/dietitian/clients" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Weight</th>
                  <th>Change</th>
                  <th>Compliance</th>
                  <th>Avg Cal</th>
                  <th>Avg Protein</th>
                </tr>
              </thead>
              <tbody>
                {overview.slice(0, 8).map(c => {
                  const compliance = c.complianceRate || 0;
                  return (
                    <tr key={c.clientId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                            {c.clientName?.charAt(0)}
                          </div>
                          <Link to={`/dietitian/clients/${c.clientId}`} style={{ fontWeight: 600, color: '#2563EB', textDecoration: 'none', fontSize: 14 }}>{c.clientName}</Link>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.currentWeight ? `${c.currentWeight} kg` : '—'}</td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: c.weightChange < 0 ? '#DCFCE7' : '#FEE2E2' }}>
                          {c.weightChange < 0 ? <TrendingDown size={13} color="#22C55E" /> : <TrendingUp size={13} color="#EF4444" />}
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.weightChange < 0 ? '#22C55E' : '#EF4444', fontFamily: 'var(--font-mono)' }}>
                            {c.weightChange != null ? (c.weightChange > 0 ? `+${c.weightChange.toFixed(1)}` : c.weightChange.toFixed(1)) : '—'} kg
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, minWidth: 60, overflow: 'hidden' }}>
                            <div style={{ width: `${compliance}%`, height: '100%', background: compliance >= 70 ? '#22C55E' : compliance >= 40 ? '#F59E0B' : '#EF4444', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: compliance >= 70 ? '#22C55E' : '#F59E0B', minWidth: 36 }}>{compliance.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#2563EB', fontWeight: 600 }}>{(c.avgDailyCalories || 0).toFixed(0)} kcal</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#22C55E', fontWeight: 600 }}>{(c.avgDailyProtein || 0).toFixed(0)} g</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
