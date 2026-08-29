import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { auth } from '../../config/firebase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.1 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.4 0-9.9-3.6-11.3-8.6l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C37 39.1 44 34 44 24c0-1.3-.2-2.7-.4-3.9z"/></svg>
);

const AcademixLogo = ({ size = 52 }) => (
  <img src="/logo.svg" alt="Academix" style={{ width: size, height: size, objectFit: 'contain' }} />
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false); // false | 'email' | 'code' | 'reset'
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pcs'); // 'pcs' | 'vgc'
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roleRedirects = {
    superAdmin: '/super-admin',
    admin: '/admin',
    principal: '/principal',
    registrar: '/registrar',
    accountant: '/accountant',
    teacher: '/teacher',
    student: '/student',
    employee: '/employee'
  };

  const handleSubmit = async (e, directEmail, directPassword) => {
    if (e && e.preventDefault) e.preventDefault();
    const finalEmail = directEmail || email;
    const finalPassword = directPassword || password;
    if (!finalEmail || !finalPassword) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const userData = await login(finalEmail, finalPassword);
      toast.success(`Welcome back, ${userData.name}!`);
      navigate(roleRedirects[userData.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (em, pw) => {
    setEmail(em);
    setPassword(pw);
    
    // Auto-login instantly using direct parameters to bypass React state asynchronous updates
    handleSubmit(null, em, pw);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const userData = await loginWithGoogle();
      toast.success(`Welcome, ${userData.name}!`);
      navigate(roleRedirects[userData.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google sign-in failed';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotSendCode = async () => {
    if (!resetEmail) return toast.error('Enter your email');
    setLoading(true);
    try {
      await api.post('/profile/forgot-password', { email: resetEmail });
      toast.success('Reset code sent to your email');
      setForgotMode('code');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword) return toast.error('Fill all fields');
    if (newPassword.length < 6) return toast.error('Min 6 characters');
    setLoading(true);
    try {
      await api.post('/profile/reset-password', { email: resetEmail, code: resetCode, newPassword });
      toast.success('Password reset! You can now login.');
      setForgotMode(false); setResetEmail(''); setResetCode(''); setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const quickBtnStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '40px 20px',
      gap: '40px',
      position: 'relative',
      overflowY: 'auto',
    }}>
      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-5%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AcademixLogo size={52} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color:'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1, marginTop: '8px' }}>Academix</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '6px' }}>Smart Campus Management System</p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color:'var(--text-primary)', marginBottom: '4px' }}>Sign in</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '22px' }}>Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color:'var(--text-secondary)', marginBottom: '6px' }}>
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineMail style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} size={16} />
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '34px' }}
                  placeholder="email or username"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color:'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineLockClosed style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} size={16} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '34px', paddingRight: '36px' }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                >
                  {showPass ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px', fontSize: '14px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopcolor:'var(--text-primary)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>

            {/* Forgot Password Link */}
            <button type="button" onClick={() => { setForgotMode('email'); setResetEmail(email); }}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 11, cursor: 'pointer', textAlign: 'center', fontWeight: 600 }}>
              Forgot Password?
            </button>
          </form>

          {/* Divider */}
          {mounted && auth && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              {/* Google Sign-In */}
              <button
                id="google-signin"
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                style={{
                  width: '100%', padding: '11px', borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-3)',
                  color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
              >
                {googleLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '14px', height: '14px', border: '2px solid var(--color-muted)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Signing in...
                  </span>
                ) : (
                  <><GoogleIcon /> Sign in with Google</>
                )}
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color:'var(--text-tertiary)', marginTop: '20px' }}>
          © 2026 Academix · All rights reserved
        </p>
      </div>

      {/* Quick Login Dashboard Panel */}
      <div className="glass-card animate-slide-up" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>⚡ Quick Testing Dashboard</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>Click any role to log in instantly (auto-submits)</p>
        </div>

        {/* College Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--color-surface-3)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('pcs')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'pcs' ? 'var(--color-surface-1)' : 'transparent',
              color: activeTab === 'pcs' ? 'var(--text-primary)' : 'var(--color-muted)',
              fontWeight: activeTab === 'pcs' ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Punjab College (PCS)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vgc')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'vgc' ? 'var(--color-surface-1)' : 'transparent',
              color: activeTab === 'vgc' ? 'var(--text-primary)' : 'var(--color-muted)',
              fontWeight: activeTab === 'vgc' ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Vital Group (VGC)
          </button>
        </div>

        {/* Buttons Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {activeTab === 'pcs' ? (
            <>
              {/* Central / Platform Roles */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Platform Core
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('superadmin@academix.io', 'super@123')}
                    style={quickBtnStyle}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#f43f5e', fontSize: '12px' }}>🔴 Super Admin</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>superadmin@academix.io</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* College Admin Roles */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  PCS Administration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['College Admin', 'admin@pcs.edu.pk', 'admin@123'],
                    ['Principal', 'principal@pcs.edu.pk', 'principal@123'],
                    ['Registrar', 'registrar@pcs.edu.pk', 'registrar@123'],
                    ['Accountant', 'accounts@pcs.edu.pk', 'accounts@123'],
                  ].map(([role, em, pw]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickLogin(em, pw)}
                      style={quickBtnStyle}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '11px' }}>{role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Teachers & Staff */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  PCS Staff
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Teacher (Nadia)', 'nadia@pcs.edu.pk', 'teacher@123'],
                    ['Teacher (Asad)', 'asad@pcs.edu.pk', 'teacher@123'],
                    ['Teacher (Hira)', 'hira@pcs.edu.pk', 'teacher@123'],
                    ['Teacher 4', 'teacher4@pcs.edu.pk', 'teacher@123'],
                    ['Teacher 5', 'teacher5@pcs.edu.pk', 'teacher@123'],
                    ['Employee (Guard)', 'security@pcs.edu.pk', 'employee@123'],
                  ].map(([role, em, pw]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickLogin(em, pw)}
                      style={quickBtnStyle}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Students (1-5) */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  PCS Students (1-5)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Student 1 (Ali)', 'ali@student.pcs.edu.pk', 'student@123'],
                    ['Student 2 (Sara)', 'sara@student.pcs.edu.pk', 'student@123'],
                    ['Student 3 (Usman)', 'usman@student.pcs.edu.pk', 'student@123'],
                    ['Student 4 (Fatima)', 'fatima@student.pcs.edu.pk', 'student@123'],
                    ['Student 5 (Hamza)', 'hamza@student.pcs.edu.pk', 'student@123'],
                  ].map(([role, em, pw]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickLogin(em, pw)}
                      style={quickBtnStyle}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '11px' }}>{role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* VGC Administrators */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  VGC Administration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['College Admin', 'admin@vital.com', 'abc123'],
                    ['Principal', 'principal@vital.com', 'abc123'],
                    ['Registrar', 'registrar@vital.com', 'abc123'],
                    ['Accountant', 'accountant@vital.com', 'abc123'],
                  ].map(([role, em, pw]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickLogin(em, pw)}
                      style={quickBtnStyle}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#a855f7'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '11px' }}>{role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{em}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* VGC Teachers (1-5) */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  VGC Teachers (1-5)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Teacher 1', 'teacher1@vital.com', 'abc123'],
                    ['Teacher 2', 'teacher2@vital.com', 'abc123'],
                    ['Teacher 3', 'teacher3@vital.com', 'abc123'],
                    ['Teacher 4', 'teacher4@vital.com', 'abc123'],
                    ['Teacher 5', 'teacher5@vital.com', 'abc123'],
                  ].map(([role, em, pw]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickLogin(em, pw)}
                      style={quickBtnStyle}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#a855f7'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>{em}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* VGC Employees (1-2) */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  VGC Employees (1-2)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Employee 1', 'employee1@vital.com', 'abc123'],
                    ['Employee 2', 'employee2@vital.com', 'abc123'],
                  ].map(([role, em, pw]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickLogin(em, pw)}
                      style={quickBtnStyle}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#a855f7'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px' }}>{role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>{em}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* VGC Students (1-5) */}
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  VGC Students (1-5)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Student 1', 'student1@vital.com', 'abc123'],
                    ['Student 2', 'student2@vital.com', 'abc123'],
                    ['Student 3', 'student3@vital.com', 'abc123'],
                    ['Student 4', 'student4@vital.com', 'abc123'],
                    ['Student 5', 'student5@vital.com', 'abc123'],
                  ].map(([role, em, pw]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleQuickLogin(em, pw)}
                      style={quickBtnStyle}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#a855f7'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    >
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '11px' }}>{role}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>{em}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20
        }}>
          <div className="glass-card animate-slide-up" style={{ padding: 28, maxWidth: 400, width: '100%' }}>
            <button onClick={() => { setForgotMode(false); setResetEmail(''); setResetCode(''); setNewPassword(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#818cf8', fontSize: 11, cursor: 'pointer', fontWeight: 600, marginBottom: 16 }}>
              <HiOutlineArrowLeft size={14} /> Back to login
            </button>

            {forgotMode === 'email' && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, color:'var(--text-primary)', marginBottom: 6 }}>🔐 Forgot Password</h2>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 18 }}>Enter your email to receive a reset code</p>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color:'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="input-field" placeholder="your@email.com" />
                </div>
                <button onClick={handleForgotSendCode} disabled={loading} className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </>
            )}

            {forgotMode === 'code' && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, color:'var(--text-primary)', marginBottom: 6 }}>📧 Enter Code</h2>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 18 }}>A 6-digit code was sent to <b style={{ color: '#818cf8' }}>{resetEmail}</b></p>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color:'var(--text-secondary)', marginBottom: 6 }}>Verification Code</label>
                  <input value={resetCode} onChange={e => setResetCode(e.target.value)} className="input-field"
                    placeholder="000000" maxLength={6}
                    style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color:'var(--text-secondary)', marginBottom: 6 }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="Min 6 characters" style={{ paddingRight: '36px' }} />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      {showNewPass ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                    </button>
                  </div>
                </div>
                <button onClick={handleResetPassword} disabled={loading} className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button onClick={handleForgotSendCode} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: 11, cursor: 'pointer', marginTop: 10, width: '100%', textAlign: 'center' }}>
                  Didn't receive? Resend code
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
