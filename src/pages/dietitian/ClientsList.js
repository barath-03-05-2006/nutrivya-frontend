import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Users, Search, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable } from '../../components/shared/Skeleton';

const PAGE_SIZE = 10;

export default function ClientsList() {
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const load = async () => {
    try {
      const res = await analyticsAPI.getAllClientsOverview();
      setClients(res.data || []);
    } catch { addToast('Failed to load clients', 'error'); }
    finally { setLoading(false); }
  };

  const filtered = clients.filter(c =>
    c.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when search changes
  const handleSearch = (val) => { setSearch(val); setPage(1); };

  if (loading) return (
    <div>
      <div className="page-header">
        <div style={{ height: 28, width: 200, background: '#F1F5F9', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 16, width: 140, background: '#F1F5F9', borderRadius: 6 }} />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Client Overview</h1>
        <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? 's' : ''} under your care</p>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div className="input-wrapper">
          <Search size={16} className="input-icon" />
          <input className="form-input input-with-icon" placeholder="Search clients by name..."
            value={search} onChange={e => handleSearch(e.target.value)} />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <div className="empty-state-title">{search ? 'No clients match your search' : 'No clients yet'}</div>
            <div className="empty-state-desc">{search ? 'Try a different name.' : 'Add clients from the Manage Clients page.'}</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginated.map(c => (
              <div key={c.clientId} className="card card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                      {c.clientName?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{c.clientName}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span className="badge badge-blue">{c.currentWeight ? `${c.currentWeight} kg` : 'No weight'}</span>
                        <span className={`badge ${c.complianceRate >= 70 ? 'badge-green' : 'badge-yellow'}`}>{Math.round(c.complianceRate || 0)}% compliance</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { label: 'Avg Cal', value: Math.round(c.avgDailyCalories || 0), unit: 'kcal', color: '#2563EB' },
                      { label: 'Protein', value: Math.round(c.avgDailyProtein || 0), unit: 'g', color: '#22C55E' },
                      { label: 'Carbs', value: Math.round(c.avgDailyCarbs || 0), unit: 'g', color: '#F59E0B' },
                      { label: 'Water', value: Math.round(c.waterIntakeAvg || 0), unit: 'ml', color: '#0EA5E9' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}<span style={{ fontSize: 11, opacity: 0.7 }}> {s.unit}</span></div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: c.weightChange < 0 ? '#DCFCE7' : '#FEE2E2' }}>
                      {c.weightChange < 0 ? <TrendingDown size={14} color="#22C55E" /> : <TrendingUp size={14} color="#EF4444" />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.weightChange < 0 ? '#22C55E' : '#EF4444', fontFamily: 'JetBrains Mono, monospace' }}>
                        {c.weightChange != null ? (c.weightChange > 0 ? `+${c.weightChange.toFixed(1)}` : c.weightChange.toFixed(1)) : '—'} kg
                      </span>
                    </div>
                    <Link to={`/dietitian/clients/${c.clientId}`} className="btn btn-primary btn-sm">View Profile</Link>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(c.complianceRate || 0, 100)}%`, height: '100%', background: c.complianceRate >= 70 ? '#22C55E' : '#F59E0B', borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '12px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} clients
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm">
                  <ChevronLeft size={15} /> Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ minWidth: 34 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm">
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
