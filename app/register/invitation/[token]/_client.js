'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineCheckCircle,
  HiOutlineExclamationCircle, HiOutlineLockClosed, HiOutlineUser,
  HiOutlineBriefcase, HiOutlineMail, HiArrowRight, HiOutlineEye,
  HiOutlineEyeOff, HiOutlineSparkles, HiOutlineClock, HiOutlineX
} from 'react-icons/hi';

// ── Password Strength ─────────────────────────────────────────────────

const passwordRules = [
  { key: 'length',    label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter (A–Z)',   test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'One lowercase letter (a–z)',   test: (p) => /[a-z]/.test(p) },
  { key: 'number',    label: 'One number (0–9)',             test: (p) => /[0-9]/.test(p) },
  { key: 'special',   label: 'One special character (!@#$)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: 1, label: 'Very weak',  color: '#ef4444' };
  if (passed === 2) return { score: 2, label: 'Weak',      color: '#f97316' };
  if (passed === 3) return { score: 3, label: 'Fair',      color: '#eab308' };
  if (passed === 4) return { score: 4, label: 'Strong',    color: '#22c55e' };
  return                     { score: 5, label: 'Very strong', color: '#10b981' };
}

// ── Plan display helpers ──────────────────────────────────────────────

const PLAN_META = {
  basic:      { label: 'Basic',      icon: '⚡', color: '#64748b', glow: 'rgba(100,116,139,0.15)' },
  standard:   { label: 'Standard',   icon: '🚀', color: '#6366f1', glow: 'rgba(99,102,241,0.15)' },
  premium:    { label: 'Premium',    icon: '💎', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  enterprise: { label: 'Enterprise', icon: '🏢', color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
};

// ── Skeleton Loader ───────────────────────────────────────────────────

function SkeletonField() {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-24 rounded-md bg-white/[0.05] animate-pulse" />
      <div className="h-11 rounded-xl bg-white/[0.04] animate-pulse" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function AcceptInvitationPage() {
  const params  = useParams();
  const router  = useRouter();
  const token   = params.token;

  // Token verification
  const [verifying,   setVerifying]   = useState(true);
  const [inviteData,  setInviteData]  = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [isExpired,   setIsExpired]   = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', designation: '', password: '', confirmPassword: ''
  });
  const [touched,     setTouched]     = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Verify token on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!token) { setVerifying(false); return; }
    (async () => {
      try {
        const res  = await fetch(`/api/public/invitations/verify/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setIsExpired(data.message?.toLowerCase().includes('expir'));
          throw new Error(data.message || 'Invalid invitation link');
        }
        setInviteData(data.data);
      } catch (err) {
        setVerifyError(err.message);
      } finally {
        setVerifying(false);
      }
    })();
  }, [token]);

  // ── Field helpers ─────────────────────────────────────────────────
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const errors = {
    name:            touched.name && !form.name.trim()                                    ? 'Full name is required' : '',
    designation:     touched.designation && !form.designation.trim()                      ? 'Designation is required' : '',
    password:        touched.password && form.password.length < 8                         ? 'Password must be at least 8 characters' : '',
    confirmPassword: touched.confirmPassword && form.password !== form.confirmPassword     ? 'Passwords do not match' : '',
  };

  const strength = getStrength(form.password);

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields
    setTouched({ name: true, designation: true, password: true, confirmPassword: true });

    if (!form.name.trim())                        return setSubmitError('Please enter your full name.');
    if (!form.designation.trim())                 return setSubmitError('Please enter your designation.');
    if (form.password.length < 8)                 return setSubmitError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword)   return setSubmitError('Passwords do not match.');

    setSubmitting(true);
    setSubmitError('');

    try {
      const res  = await fetch('/api/public/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name:        form.name.trim(),
          designation: form.designation.trim(),
          password:    form.password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to accept invitation');

      // Persist auth
      if (data.data?.user) {
        try {
          const { useAuthStore } = await import('@/store/authStore');
          useAuthStore.setState({
            user: data.data.user, token: data.token, isAuthenticated: true
          });
        } catch { /* store may not be loaded yet */ }
        localStorage.setItem('academix_user',  JSON.stringify(data.data.user));
        localStorage.setItem('academix_token', data.token);
      }

      toast.success('Welcome to Academix! Setting up your workspace…');
      router.push('/onboarding');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Plan meta ─────────────────────────────────────────────────────
  const plan = inviteData ? (PLAN_META[inviteData.planId?.toLowerCase()] || PLAN_META.basic) : null;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#04070d] flex">

      {/* ── Left branding panel (lg+) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col relative overflow-hidden bg-[#06090f] border-r border-white/[0.05]">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-600/10 to-transparent" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-violet-600/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-16 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
              <HiOutlineAcademicCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-base font-extrabold text-white leading-none">Academix</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Education Management</p>
            </div>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              Your institution<br />is joining <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Academix</span>
            </h1>
            <p className="text-sm text-white/40 leading-relaxed mb-10 max-w-xs">
              Complete your admin account setup and activate your college workspace in minutes.
            </p>

            {/* Benefits */}
            {[
              { icon: HiOutlineShieldCheck, text: 'Your email ownership was verified through this invitation link' },
              { icon: HiOutlineSparkles,    text: 'Your workspace will be provisioned instantly after setup' },
              { icon: HiOutlineCheckCircle, text: 'Onboard your team and programs in a guided 4-step wizard' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.08 }}
                className="flex items-start gap-3 mb-5"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} className="text-indigo-400" />
                </div>
                <p className="text-sm text-white/55 leading-relaxed">{text}</p>
              </motion.div>
            ))}

            {/* Plan badge */}
            {plan && !verifying && inviteData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-8 p-4 rounded-2xl border"
                style={{ borderColor: `${plan.color}22`, background: plan.glow }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: plan.color }}>
                  Subscription Plan
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{plan.icon}</span>
                  <span className="text-lg font-extrabold text-white">{plan.label}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Footer note */}
          {inviteData?.expiresAt && (
            <div className="flex items-center gap-2 text-xs text-white/25 mt-8">
              <HiOutlineClock size={14} />
              <span>Invitation expires {new Date(inviteData.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 min-h-screen">

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden flex items-center gap-3 mb-8 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <HiOutlineAcademicCap size={18} className="text-white" />
          </div>
          <span className="text-base font-extrabold text-white">Academix</span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] bg-[#0d1117] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden"
        >

          {/* ── LOADING SKELETON ─── */}
          {verifying && (
            <div className="p-8 space-y-5">
              <div className="h-5 w-1/3 rounded-lg bg-white/[0.05] animate-pulse" />
              <div className="h-8 w-2/3 rounded-lg bg-white/[0.05] animate-pulse" />
              <div className="h-11 rounded-xl bg-white/[0.04] animate-pulse" />
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
              <div className="h-11 rounded-xl bg-indigo-500/10 animate-pulse" />
            </div>
          )}

          {/* ── ERROR STATE ─── */}
          {!verifying && verifyError && (
            <div className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border"
                style={{ background: isExpired ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', borderColor: isExpired ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)' }}>
                {isExpired
                  ? <HiOutlineClock size={28} className="text-amber-400" />
                  : <HiOutlineX size={28} className="text-red-400" />}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white mb-2">
                  {isExpired ? 'Invitation Expired' : 'Invalid Invitation'}
                </h2>
                <p className="text-sm text-white/45 leading-relaxed">
                  {isExpired
                    ? 'This invitation link has expired. Please contact your Super Admin to request a new invitation.'
                    : verifyError}
                </p>
              </div>
              {isExpired && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-left">
                  <p className="text-xs text-amber-400/80 font-medium leading-relaxed">
                    📧 Ask your administrator to open the Super Admin panel → Colleges → Invitations and click <strong>"Resend"</strong> to issue a fresh invitation.
                  </p>
                </div>
              )}
              <button onClick={() => router.push('/')} className="btn-secondary w-full justify-center py-2.5 text-sm">
                Return to Homepage
              </button>
            </div>
          )}

          {/* ── FORM ─── */}
          {!verifying && inviteData && (
            <div className="p-7 sm:p-8">
              {/* Header */}
              <div className="mb-6">
                {plan && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-3 border"
                    style={{ color: plan.color, borderColor: `${plan.color}30`, background: `${plan.color}10` }}
                  >
                    {plan.icon} {plan.label} Plan
                  </span>
                )}
                <h2 className="text-xl font-extrabold text-white tracking-tight">Create your admin account</h2>
                <p className="text-xs text-white/40 mt-1.5">Accept the invitation and activate your college workspace</p>
              </div>

              {/* Locked email */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0a0f17] border border-white/[0.06] mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <HiOutlineMail size={15} className="text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Invited Email</p>
                  <p className="text-sm font-semibold text-white/85 truncate mt-0.5">{inviteData.email}</p>
                </div>
                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <HiOutlineCheckCircle size={10} /> Verified
                </span>
              </div>

              {/* Global error */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400 flex items-center gap-2 mb-5 overflow-hidden"
                  >
                    <HiOutlineExclamationCircle size={15} className="flex-shrink-0" />
                    {submitError}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                    <input
                      type="text" value={form.name}
                      onChange={set('name')} onBlur={blur('name')}
                      placeholder="e.g. Dr. Farrukh Ali"
                      className={`input-field pl-9 ${errors.name ? 'border-red-500/50 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.name && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><HiOutlineExclamationCircle size={11} />{errors.name}</p>}
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Designation <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <HiOutlineBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                    <select
                      value={form.designation}
                      onChange={set('designation')} onBlur={blur('designation')}
                      className={`input-field pl-9 ${errors.designation ? 'border-red-500/50' : ''}`}
                    >
                      <option value="">Select your role…</option>
                      <option value="Principal">Principal</option>
                      <option value="Campus Director">Campus Director</option>
                      <option value="Admin Manager">Admin Manager</option>
                      <option value="Vice Principal">Vice Principal</option>
                      <option value="Registrar">Registrar</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.designation && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><HiOutlineExclamationCircle size={11} />{errors.designation}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Set Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')} onBlur={blur('password')}
                      placeholder="Create a secure password"
                      className={`input-field pl-9 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPass ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: n <= strength.score ? strength.color : 'rgba(255,255,255,0.07)' }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold" style={{ color: strength.color }}>
                        {strength.label}
                      </p>
                      {/* Requirements checklist */}
                      <div className="grid grid-cols-1 gap-1">
                        {passwordRules.map(rule => {
                          const ok = rule.test(form.password);
                          return (
                            <div key={rule.key} className="flex items-center gap-1.5">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${ok ? 'bg-emerald-500/20' : 'bg-white/[0.05]'}`}>
                                {ok
                                  ? <HiOutlineCheckCircle size={10} className="text-emerald-400" />
                                  : <div className="w-1 h-1 rounded-full bg-white/20" />}
                              </div>
                              <span className={`text-[11px] transition-colors ${ok ? 'text-emerald-400' : 'text-white/30'}`}>{rule.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {errors.password && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><HiOutlineExclamationCircle size={11} />{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')} onBlur={blur('confirmPassword')}
                      placeholder="Re-enter password"
                      className={`input-field pl-9 pr-10 ${errors.confirmPassword ? 'border-red-500/50' : (form.confirmPassword && form.password === form.confirmPassword ? 'border-emerald-500/40' : '')}`}
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showConfirm ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><HiOutlineCheckCircle size={11} /> Passwords match</p>
                  )}
                  {errors.confirmPassword && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><HiOutlineExclamationCircle size={11} />{errors.confirmPassword}</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-xl shadow-indigo-600/25 mt-2"
                >
                  {submitting
                    ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Setting up workspace…</>)
                    : (<>Accept Invitation &amp; Start Onboarding <HiArrowRight size={16} /></>)}
                </button>
              </form>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-[11px] text-white/20 mt-6 text-center">
          © {new Date().getFullYear()} Academix · Secure Onboarding Portal
        </p>
      </div>
    </div>
  );
}
