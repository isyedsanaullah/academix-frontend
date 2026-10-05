import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dynamic from 'next/dynamic';

const Lottie = dynamic(
  () => import('lottie-react').then((mod) => ({ default: mod.Lottie || mod.default })),
  { ssr: false }
);
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLightningBolt,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { auth } from '../../config/firebase';
import QuickAccessDashboard from './QuickAccessDashboard';
import loaderAnimation from '../../logo/loader.json';

// Logo component using Lottie animation
const AnimatedLogo = () => {
  const lottieRef = useRef(null);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <div className="relative w-full max-w-lg aspect-square">
        {/* Animated gradient orb background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent animate-pulse-slow" />

        {/* Lottie Animation */}
        <div className="relative z-10 w-full h-full">
          <Lottie
            lottieRef={lottieRef}
            src={loaderAnimation}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice',
            }}
          />
        </div>

        {/* Bottom decorative text */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/60 text-sm font-light tracking-wider animate-fade-in-up">
            Empowering Education Through Innovation
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={`dot-indicator-${i}`}
                className="w-1.5 h-1.5 rounded-full bg-white/30"
                style={{
                  animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Static logo for the form side (small version)
const AcademixLogo = ({ size = 52 }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <img
      src="/logo.svg"
      alt="Academix"
      className="w-full h-full object-contain"
    />
  </div>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.1 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.4 0-9.9-3.6-11.3-8.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C37 39.1 44 34 44 24c0-1.3-.2-2.7-.4-3.9z" />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pcs');
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
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

  // If not mounted, return minimal placeholder to prevent layout shift
  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-[#0a0e14]" />;
  }

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 dark:from-[#0a0e14] dark:via-[#0d1117] dark:to-[#0d1117]">
      {/* Split layout container - no overflow */}
      <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden">

        {/* LEFT SIDE - Lottie Animation (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden">
          {/* Decorative background patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          </div>

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Lottie Animation */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
            <AnimatedLogo />
          </div>

          {/* Bottom right decorative text */}
          <div className="absolute bottom-8 right-12 z-10 text-right">
            <p className="text-white/30 text-xs font-light tracking-widest uppercase">
              Academix v2.0
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="flex-1 lg:w-1/2 h-full overflow-y-auto flex flex-col p-4 md:p-6 lg:p-8">
          <div className="w-full max-w-md mx-auto my-auto py-6 md:py-8">
            {/* Logo - visible on all screens */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8 lg:mb-10">
              <div className="flex items-center gap-2.5">
                <AcademixLogo size={44} />
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Academix
                  </h1>
                  <p className="text-[10px] text-white/60 dark:text-white/30 font-medium tracking-widest uppercase hidden sm:block">
                    Smart Campus
                  </p>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white/80 dark:bg-[#161b22]/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-none border border-slate-200/60 dark:border-white/[0.06] p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
                  Sign in to your account to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-white/60 mb-1.5 uppercase tracking-wider">
                    Email or Username
                  </label>
                  <div className={`relative transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 rounded-xl' : ''
                    }`}>
                    <HiOutlineMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-white/30'
                      }`} size={18} />
                    <input
                      id="login-email"
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none transition"
                      placeholder="Enter your email or username"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/60 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setForgotMode('email'); setResetEmail(email); }}
                      className="text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 rounded-xl' : ''
                    }`}>
                    <HiOutlineLockClosed className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-white/30'
                      }`} size={18} />
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none transition"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition"
                    >
                      {showPass ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-600 dark:hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/50 dark:shadow-indigo-500/20 hover:shadow-indigo-300/50 dark:hover:shadow-indigo-500/30 transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              {/* Divider + Google */}
              {mounted && auth && (
                <>
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
                    <span className="text-xs font-medium text-slate-400 dark:text-white/20 uppercase tracking-wider">
                      or continue with
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
                  </div>

                  <button
                    id="google-signin"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full py-2.5 px-4 bg-white dark:bg-[#0d1117] hover:bg-slate-50 dark:hover:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm font-semibold text-slate-700 dark:text-white/80 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-white/[0.12]"
                  >
                    {googleLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-300 dark:border-white/20 border-t-indigo-500 rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <><GoogleIcon /> Sign in with Google</>
                    )}
                  </button>
                </>
              )}

              {/* Sign up link - mobile only */}
              <p className="text-center text-xs text-white/60 dark:text-white/30 mt-6 lg:hidden">
                New to Academix? <button className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-semibold transition">Contact admin</button>
              </p>
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] text-white/60 dark:text-white/20 mt-6 font-medium tracking-wide hidden lg:block">
              © 2026 Academix · All rights reserved
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Button */}
      <button
        onClick={() => setShowQuickAccess(!showQuickAccess)}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-600 dark:hover:to-indigo-500 text-white border-none flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-200/50 dark:shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 z-[100]"
        title="Quick Testing Dashboard"
      >
        <HiOutlineLightningBolt size={20} />
      </button>

      {/* Quick Access Panel */}
      {showQuickAccess && (
        <div className="fixed bottom-20 right-6 z-[100] max-w-[90vw] sm:max-w-sm">
          <QuickAccessDashboard
            handleQuickLogin={handleQuickLogin}
            quickBtnStyle={quickBtnStyle}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease-out]">
            <button
              onClick={() => { setForgotMode(false); setResetEmail(''); setResetCode(''); setNewPassword(''); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition mb-5"
            >
              <HiOutlineArrowLeft size={16} /> Back to login
            </button>

            {forgotMode === 'email' && (
              <>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h2>
                <p className="text-sm text-slate-500 dark:text-white/40 mt-1 mb-5">
                  Enter your email address and we'll send you a verification code.
                </p>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-white/60 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/30 focus:border-indigo-500 dark:focus:border-indigo-400/30 transition"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
                <button
                  onClick={handleForgotSendCode}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/50 dark:shadow-indigo-500/20"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </>
            )}

            {forgotMode === 'code' && (
              <>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verify & Reset</h2>
                <p className="text-sm text-slate-500 dark:text-white/40 mt-1 mb-5">
                  Enter the 6-digit code sent to <span className="text-indigo-500 dark:text-indigo-400 font-semibold">{resetEmail}</span>
                </p>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-white/60 mb-1.5 uppercase tracking-wider">
                    Verification Code
                  </label>
                  <input
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-xl text-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/30 focus:border-indigo-500 dark:focus:border-indigo-400/30 transition text-center tracking-[0.3em] font-bold"
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-white/60 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 pr-12 py-2.5 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/30 focus:border-indigo-500 dark:focus:border-indigo-400/30 transition"
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition"
                    >
                      {showNewPass ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/50 dark:shadow-indigo-500/20"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={handleForgotSendCode}
                  className="w-full text-center text-sm text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50 transition mt-3 font-medium"
                >
                  Didn't receive? Resend code
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom animations via style tag */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse 4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        /* Scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        .dark .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #2d3748;
        }
      `}</style>
    </div>
  );
};

export default Login;