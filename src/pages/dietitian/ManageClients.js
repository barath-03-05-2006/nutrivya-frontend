import React, { useState, useEffect } from 'react';
import { clientAPI, authAPI } from '../../services/api';
import { UserPlus, Eye, EyeOff, Save, X, Users } from 'lucide-react';

export default function ManageClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', username: '', password: '', phoneNumber: '' });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await clientAPI.getMyClients();
      setClients(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await authAPI.register(form);
      setSuccess(`✓ Account created for ${form.fullName}. Login email: ${form.email}. Share the temporary password with them privately.`);
      setForm({ fullName: '', email: '', username: '', password: '', phoneNumber: '' });
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create client. Email may already be in use.');
    } finally { setSaving(false); }
  };

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Manage Clients</h1>
          <p className="page-subtitle">Create client login accounts — clients fill in their own details after logging in</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}>
          <UserPlus size={16} /> Add New Client
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>New Client Account</h3>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                Only login credentials needed here — the client fills in physical details & questionnaire after logging in.
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setError(''); }}>
              <X size={15} /> Cancel
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Priya Sharma" value={form.fullName} onChange={e => f('fullName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-input" placeholder="priya_sharma" value={form.username} onChange={e => f('username', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-input" placeholder="priya@email.com" value={form.email} onChange={e => f('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={e => f('phoneNumber', e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 360 }}>
              <label className="form-label">Password *</label>
              <div className="input-wrapper">
                <input type={showPass ? 'text' : 'password'} className="form-input input-with-icon-right"
                  placeholder="Set a temporary password" value={form.password}
                  onChange={e => f('password', e.target.value)} required />
                <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              💡 After creating the account, share the email and password with your client. They will fill in their physical details and health questionnaire after logging in.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                <Save size={15} />{saving ? 'Creating...' : 'Create Client Account'}
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="section-title" style={{ margin: 0 }}>All Clients ({clients.length})</h3>
        </div>

        {clients.length === 0 ? (
          <div className="empty-state">
            <Users size={40} className="empty-state-icon" />
            <div className="empty-state-title">No clients yet</div>
            <div className="empty-state-desc">Click "Add New Client" to create your first client account.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Client</th><th>Current Weight</th><th>Goal Weight</th><th>Cal Target</th><th>Protein Target</th><th>Profile Status</th></tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {c.user?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.user?.fullName}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>{c.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.currentWeight ? `${c.currentWeight} kg` : '—'}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.goalWeight ? `${c.goalWeight} kg` : '—'}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#2563EB' }}>{c.targetCalories || '—'} kcal</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#22C55E' }}>{c.targetProtein || '—'}g</span></td>
                    <td>
                      {c.currentWeight
                        ? <span className="badge badge-green">✓ Profile Complete</span>
                        : <span className="badge badge-yellow">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
