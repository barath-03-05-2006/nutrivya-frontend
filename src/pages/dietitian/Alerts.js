import React, { useState, useEffect } from 'react';
import { alertAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Bell, CheckCheck, Utensils, Activity, TrendingDown, AlertTriangle, RefreshCw, PenLine } from 'lucide-react';
import { format } from 'date-fns';

const ALERT_CONFIG = {
  MISSED_MEALS:   { color: '#F59E0B', bg: '#FEF9C3', border: '#FDE047', icon: <Utensils size={16} />,      label: 'Missed Meals' },
  LOW_PROTEIN:    { color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5', icon: <Activity size={16} />,      label: 'Low Protein' },
  LOW_CALORIES:   { color: '#F59E0B', bg: '#FEF9C3', border: '#FDE047', icon: <TrendingDown size={16} />,  label: 'Low Calories' },
  LOW_COMPLIANCE: { color: '#8B5CF6', bg: '#EDE9FE', border: '#C4B5FD', icon: <AlertTriangle size={16} />, label: 'Low Compliance' },
  DIET_DEVIATION: { color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE', icon: <PenLine size={16} />,       label: 'Diet Deviation' },
};

export default function Alerts() {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const load = async () => {
    setLoading(true);
    try {
      const res = await alertAPI.getAll();
      setAlerts(res.data || []);
    } catch { addToast('Failed to load alerts', 'error'); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await alertAPI.markRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch { addToast('Failed to mark alert as read', 'error'); }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await alertAPI.markAllRead();
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      setConfirmMarkAll(false);
      addToast(`${unreadCount} alert${unreadCount > 1 ? 's' : ''} marked as read`, 'success');
    } catch { addToast('Failed to mark all as read', 'error'); }
    finally { setMarkingAll(false); }
  };

  const triggerAlerts = async () => {
    setTriggering(true);
    try {
      await alertAPI.triggerAlerts();
      addToast('Alert checks ran successfully!', 'success');
      await load();
    } catch { addToast('Failed to trigger alerts', 'error'); }
    finally { setTriggering(false); }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const filtered = filter === 'all' ? alerts
    : filter === 'unread' ? alerts.filter(a => !a.read)
    : alerts.filter(a => a.alertType === filter);

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={triggerAlerts} disabled={triggering}>
            <RefreshCw size={14} style={{ animation: triggering ? 'spin 1s linear infinite' : 'none' }} />
            {triggering ? 'Checking...' : 'Run Alert Checks'}
          </button>

          {/* Mark All Read with confirm */}
          {unreadCount > 0 && !confirmMarkAll && (
            <button className="btn btn-outline btn-sm" onClick={() => setConfirmMarkAll(true)}>
              <CheckCheck size={15} /> Mark All Read
            </button>
          )}
          {confirmMarkAll && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '5px 10px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Mark all {unreadCount} as read?</span>
              <button onClick={markAllRead} disabled={markingAll} className="btn btn-warning btn-sm" style={{ padding: '3px 10px', fontSize: 12 }}>
                {markingAll ? '...' : 'Yes'}
              </button>
              <button onClick={() => setConfirmMarkAll(false)} className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: 12 }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'MISSED_MEALS', label: 'Missed Meals' },
          { id: 'LOW_PROTEIN', label: 'Low Protein' },
          { id: 'LOW_CALORIES', label: 'Low Calories' },
          { id: 'LOW_COMPLIANCE', label: 'Low Compliance' },
          { id: 'DIET_DEVIATION', label: 'Diet Deviation' },
        ].map(f => (
          <button key={f.id} className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Bell size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="empty-state-title">No alerts</div>
            <div className="empty-state-desc">
              {filter === 'unread' ? 'All caught up — no unread alerts.' : 'All clients are on track! Run alert checks to refresh.'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(alert => {
            const cfg = ALERT_CONFIG[alert.alertType] || { color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE', icon: <Bell size={16} />, label: 'Alert' };
            const isRead = alert.read === true;
            return (
              <div key={alert.id} style={{ padding: '16px 20px', borderRadius: 12, background: isRead ? 'white' : cfg.bg, border: `1px solid ${isRead ? '#E2E8F0' : cfg.border}`, opacity: isRead ? 0.7 : 1, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: isRead ? '#F1F5F9' : cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                        {!isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />}
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>for <strong style={{ color: '#475569' }}>{alert.client?.fullName || 'Client'}</strong></span>
                      </div>
                      <div style={{ fontSize: 14, color: '#0F172A', marginBottom: 4 }}>{alert.message}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{alert.createdAt ? format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a') : ''}</div>
                    </div>
                  </div>
                  {!isRead && (
                    <button className="btn btn-ghost btn-sm" onClick={() => markRead(alert.id)}>Mark Read</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
