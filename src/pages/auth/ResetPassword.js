import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import './Login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo"><img src="/logo.png" alt="Nutrivya" style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
          <span className="login-brand-name">Nutrivya</span>
        </div>
        <h1 className="login-tagline">Set your new<br />password and<br />get back on track.</h1>
        <p className="login-desc">Choose a strong password to keep your account secure.</p>
        <div className="login-features">
          {['🔒 Secure password encryption', '⏱ Links expire in 1 hour', '✅ Instant access after reset', '🛡 Your data stays safe'].map(f => (
            <div key={f} className="login-feature">{f}</div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          {success ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <CheckCircle size={52} style={{ color: 'var(--success)', marginBottom: 12 }} />
                <h2 className="login-title" style={{ marginBottom: 8 }}>Password Reset!</h2>
                <p className="login-subtitle">Your password has been updated successfully. You can now log in with your new password.</p>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </>
          ) : (
            <>
              <h2 className="login-title">Reset Password</h2>
              <p className="login-subtitle">Enter your new password below</p>

              {!token ? (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <AlertCircle size={40} style={{ color: 'var(--danger)', marginBottom: 12 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                    This reset link is invalid or has expired.
                  </p>
                  <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => navigate('/login')}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="input-wrapper">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="form-input input-with-icon input-with-icon-right"
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                      <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-wrapper">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className="form-input input-with-icon input-with-icon-right"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button type="button" className="input-icon-right" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                  <button type="submit" className="btn btn-primary btn-lg"
                    style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                    disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>

                  <button type="button" className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => navigate('/login')}>
                    ← Back to Login
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
