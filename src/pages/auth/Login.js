import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const countdownRef = useRef(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'expired';

  const isLocked = lockedSeconds > 0;
  useEffect(() => {
    if (!isLocked) { clearInterval(countdownRef.current); return; }
    countdownRef.current = setInterval(() => {
      setLockedSeconds(s => {
        if (s <= 1) { clearInterval(countdownRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [isLocked]);

  const formatCountdown = (s) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60), r = s % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockedSeconds > 0) return;
    setLoading(true); setError('');
    try {
      const res = await authAPI.login(form.email, form.password);
      login(res.data);
      navigate(res.data.role === 'DIETITIAN' ? '/dietitian' : '/client', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.locked) {
        setLockedSeconds(Math.ceil(data.secondsRemaining || 60));
        setError(data.error);
      } else {
        setError(data?.error || 'Invalid email or password. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      setForgotMsg('A password reset link has been sent to your email. Please check your inbox (and spam folder).');
    } catch {
      setForgotError('Something went wrong. Please try again later.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo"><img src="/logo.png" alt="Nutrivya" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
          <span className="login-brand-name">Nutrivya</span>
        </div>
        <h1 className="login-tagline">Your personalized<br />nutrition journey<br />starts here.</h1>
        <p className="login-desc">Track meals, monitor progress, and achieve your health goals with expert dietitian guidance.</p>
        <div className="login-features">
          {['🥗 Personalized meal plans', '📊 Real-time nutrition tracking', '💪 Progress monitoring', '🔔 Smart health alerts'].map(f => (
            <div key={f} className="login-feature">{f}</div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          {!forgotMode ? (
            <>
              <h2 className="login-title">Welcome back</h2>
              <p className="login-subtitle">Sign in to your nutrition dashboard</p>
              {sessionExpired && !error && <div className="alert alert-warning">Your session has expired. Please sign in again.</div>}
              {error && (
                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {lockedSeconds > 0 && <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
                  <span>
                    {error}
                    {lockedSeconds > 0 && (
                      <strong style={{ display: 'block', marginTop: 4 }}>Try again in {formatCountdown(lockedSeconds)}</strong>
                    )}
                  </span>
                </div>
              )}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input type="email" className="form-input input-with-icon" placeholder="you@example.com"
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={lockedSeconds > 0} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} className="form-input input-with-icon input-with-icon-right"
                      placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} disabled={lockedSeconds > 0} required />
                    <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <button type="button" onClick={() => setForgotMode(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || lockedSeconds > 0}>
                  {lockedSeconds > 0 ? `Locked — try again in ${formatCountdown(lockedSeconds)}` : loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="login-note">
                Don't have an account? Contact your dietitian to get access.
              </div>
            </>
          ) : (
            <>
              <h2 className="login-title">Reset Password</h2>
              <p className="login-subtitle">Enter your email to receive reset instructions</p>
              {forgotMsg ? (
                <>
                  <div className="alert alert-success">{forgotMsg}</div>
                  <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
                    onClick={() => { setForgotMsg(''); setForgotEmail(''); setForgotError(''); }}>
                    Try a different email
                  </button>
                </>
              ) : (
                <form onSubmit={handleForgot}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-wrapper">
                      <Mail size={16} className="input-icon" />
                      <input type="email" className="form-input input-with-icon" placeholder="you@example.com"
                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                    </div>
                  </div>
                  {forgotError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{forgotError}</div>}
                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }} disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
              <button onClick={() => { setForgotMode(false); setForgotMsg(''); setForgotEmail(''); setForgotError(''); }}
                className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                ← Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
