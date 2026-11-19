'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiGet, apiPost } from '@/lib/api';
import { resolveParam } from '@/lib/paramUtils';
import BrandLogo from '@/components/common/BrandLogo';
import {
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineBriefcase,
  HiOutlineMail,
  HiOutlineOfficeBuilding,
  HiArrowRight,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineLogin,
} from 'react-icons/hi';

// ── Password Strength ─────────────────────────────────────────────────

const passwordRules = [
  { key: 'length',    label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter (A–Z)',  test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'One lowercase letter (a–z)',  test: (p) => /[a-z]/.test(p) },
  { key: 'number',    label: 'One number (0–9)',            test: (p) => /[0-9]/.test(p) },
  { key: 'special',   label: 'One special character (!@#$)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: 1, label: 'Very weak',   color: '#ef4444' };
  if (passed === 2) return { score: 2, label: 'Weak',        color: '#f97316' };
  if (passed === 3) return { score: 3, label: 'Fair',        color: '#eab308' };
  if (passed === 4) return { score: 4, label: 'Strong',      color: '#299A49' };
  return                     { score: 5, label: 'Very strong', color: '#1F7A3A' };
}

function SkeletonField() {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-24 rounded-md bg-slate-200 animate-pulse" />
      <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const rawToken = resolveParam(params?.token, 'invitation');
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';
  const hasToken = Boolean(token && token !== '_');

  // Verification states: 'loading' | 'valid' | 'expired' | 'used' | 'invalid'
  const [inviteState, setInviteState] = useState(hasToken ? 'loading' : 'invalid');
  const [inviteData, setInviteData] = useState(null);
  const [stateMessage, setStateMessage] = useState(
    hasToken ? '' : 'Invitation token is missing or invalid.'
  );

  // Expired -> request new invitation state
  const [requestingNew, setRequestingNew] = useState(false);
  const [renewalSent, setRenewalSent] = useState(false);

  // Registration form
  const [form, setForm] = useState({
    name: '',
    collegeName: '',
    designation: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Verify token on mount (strictly read-only)
  useEffect(() => {
    if (!hasToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet(`/public/invitations/verify/${encodeURIComponent(token)}`);
        if (cancelled) return;
        if (res?.valid && res?.state === 'valid' && res?.data) {
          setInviteState('valid');
          setInviteData(res.data);
          if (res.data.collegeName) {
            setForm((f) => ({ ...f, collegeName: res.data.collegeName }));
          }
        } else {
          const nextState = ['expired', 'used', 'invalid'].includes(res?.state) ? res.state : 'invalid';
          setInviteState(nextState);
          setStateMessage(res?.message || 'This invitation link is invalid.');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err?.response?.data?.message || err.message || 'Invalid invitation link.';
        const serverState = err?.response?.data?.state;
        if (['expired', 'used', 'invalid'].includes(serverState)) {
          setInviteState(serverState);
        } else if (msg.toLowerCase().includes('expir')) {
          setInviteState('expired');
        } else if (msg.toLowerCase().includes('used') || msg.toLowerCase().includes('accepted')) {
          setInviteState('used');
        } else {
          setInviteState('invalid');
        }
        setStateMessage(msg);
      }
    })();
    return () => { cancelled = true; };
  }, [hasToken, token]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const errors = {
    name:            touched.name && form.name.trim().length < 2                      ? 'Full name must be at least 2 characters' : '',
    designation:     touched.designation && !form.designation.trim()                  ? 'Designation is required' : '',
    password:        touched.password && form.password.length < 8                     ? 'Password must be at least 8 characters' : '',
    confirmPassword: touched.confirmPassword && form.password !== form.confirmPassword ? 'Passwords do not match' : '',
  };

  const strength = getStrength(form.password);

  const handleRequestNewInvitation = async () => {
    setRequestingNew(true);
    try {
      const res = await apiPost('/public/invitations/request-new', { token });
      setRenewalSent(true);
      toast.success(res?.message || 'Request sent to CollegesHub administration.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request. Please contact support@collegeshub.org.');
    } finally {
      setRequestingNew(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, designation: true, password: true, confirmPassword: true });

    if (form.name.trim().length < 2)         return setSubmitError('Please enter your full name (at least 2 characters).');
    if (!form.designation.trim())            return setSubmitError('Please select your designation.');
    if (form.password.length < 8)            return setSubmitError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setSubmitError('Passwords do not match.');

    setSubmitting(true);
    setSubmitError('');

    try {
      const data = await apiPost('/public/invitations/accept', {
        token,
        name:        form.name.trim(),
        collegeName: form.collegeName.trim() || undefined,
        designation: form.designation.trim(),
        password:    form.password,
      });

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to accept invitation');
      }

      if (data.data?.user && data.token) {
        localStorage.setItem('academix_token', data.token);
        localStorage.setItem('academix_user', JSON.stringify(data.data.user));
        try {
          const { useAuthStore } = await import('@/store/authStore');
          useAuthStore.setState({
            user: data.data.user,
            loading: false,
          });
        } catch {
          // store initializes from localStorage on next mount
        }
      }

      toast.success('Welcome to CollegesHub! Your 14-day free trial has started.');
      router.push('/onboarding');
    } catch (err) {
      const serverState = err?.response?.data?.state;
      const msg = err?.response?.data?.message || err.message || 'Failed to accept invitation';
      if (serverState === 'used' || serverState === 'expired') {
        setInviteState(serverState);
        setStateMessage(msg);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#0E2238]">
      {/* ── Left branding panel (CollegesHub Blue + Green) ───────── */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[480px] flex-shrink-0 flex-col relative overflow-hidden bg-[#061E3D] text-white border-r border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[#0A4D94]/40 to-transparent" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#299A49]/15 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <div className="mb-14 cursor-pointer" onClick={() => router.push('/')}>
            <BrandLogo variant="horizontal" theme="dark" size="md" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex-1"
          >
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              Your institution is joining{' '}
              <span className="text-[#3DBE63]">CollegesHub</span>
            </h1>
            <p className="text-sm text-white/70 leading-relaxed mb-10 max-w-xs">
              Create your administrator account and start exploring with a full 14-day free trial — no plan locked upfront.
            </p>

            {[
              { icon: HiOutlineShieldCheck, text: 'Official email verified through your single-use invitation link' },
              { icon: HiOutlineSparkles,    text: 'Automatic 14-day free trial — pick your plan anytime before it ends' },
              { icon: HiOutlineCheckCircle, text: 'Guided setup for your college profile, academics, staff & students' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16 + i * 0.08 }}
                className="flex items-start gap-3 mb-5"
              >
                <div className="w-8 h-8 rounded-xl bg-[#0A4D94]/60 border border-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} className="text-[#3DBE63]" />
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{text}</p>
              </motion.div>
            ))}

            <div className="mt-8 p-4 rounded-2xl border border-[#299A49]/35 bg-[#299A49]/10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#3DBE63] mb-1">
                14-Day Free Trial Included
              </p>
              <p className="text-xs text-white/80 leading-relaxed">
                Start immediately with zero upfront payment. Choose your plan and billing term whenever you are ready.
              </p>
            </div>
          </motion.div>

          {inviteState === 'valid' && inviteData?.expiresAt && (
            <div className="flex items-center gap-2 text-xs text-white/60 mt-8">
              <HiOutlineClock size={14} />
              <span>
                Invitation expires{' '}
                {new Date(inviteData.expiresAt).toLocaleDateString('en-PK', {
                  timeZone: 'Asia/Karachi',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 min-h-screen">
        <div className="lg:hidden mb-8 cursor-pointer" onClick={() => router.push('/')}>
          <BrandLogo variant="horizontal" theme="light" size="md" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[460px] bg-white border border-[#DDE6F0] rounded-2xl shadow-xl overflow-hidden"
        >
          {/* ── LOADING ── */}
          {inviteState === 'loading' && (
            <div className="p-8 space-y-5">
              <div className="h-5 w-1/3 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-8 w-2/3 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
              <div className="h-11 rounded-xl bg-[#0A4D94]/15 animate-pulse" />
            </div>
          )}

          {/* ── EXPIRED STATE ── */}
          {inviteState === 'expired' && (
            <div className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-amber-50 border border-amber-200">
                <HiOutlineClock size={30} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0E2238] mb-2">Invitation Link Expired</h2>
                <p className="text-sm text-[#52657C] leading-relaxed">
                  {stateMessage || 'This invitation link has expired. Request a new invitation and our team will send you a fresh link.'}
                </p>
              </div>

              {!renewalSent ? (
                <button
                  type="button"
                  onClick={handleRequestNewInvitation}
                  disabled={requestingNew}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-sm font-bold shadow-md transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {requestingNew ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Request…
                    </>
                  ) : (
                    <>
                      <HiOutlineRefresh size={17} />
                      Request a New Invitation
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left flex items-start gap-2.5">
                  <HiOutlineCheckCircle size={20} className="text-[#299A49] shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <strong>Request received!</strong> We have notified the CollegesHub Super Admin team. Check your inbox once your new link is issued.
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-2.5 px-4 rounded-xl border border-[#DDE6F0] text-sm font-semibold text-[#52657C] hover:text-[#0E2238] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          )}

          {/* ── ALREADY USED STATE ── */}
          {inviteState === 'used' && (
            <div className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-emerald-50 border border-emerald-200">
                <HiOutlineCheckCircle size={30} className="text-[#299A49]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0E2238] mb-2">Invitation Already Used</h2>
                <p className="text-sm text-[#52657C] leading-relaxed">
                  {stateMessage || 'This invitation link has already been used to set up your institution account.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
              >
                <HiOutlineLogin size={17} />
                Go to Login
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-2.5 px-4 rounded-xl border border-[#DDE6F0] text-sm font-semibold text-[#52657C] hover:text-[#0E2238] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          )}

          {/* ── INVALID / REVOKED STATE ── */}
          {inviteState === 'invalid' && (
            <div className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-red-50 border border-red-200">
                <HiOutlineXCircle size={30} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0E2238] mb-2">Invalid Invitation Link</h2>
                <p className="text-sm text-[#52657C] leading-relaxed">
                  {stateMessage || 'This invitation link is invalid, incomplete, or has been cancelled.'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#DDE6F0] text-xs text-[#52657C] leading-relaxed">
                Need help? Contact{' '}
                <a href="mailto:support@collegeshub.org" className="font-semibold text-[#0A4D94] underline">
                  support@collegeshub.org
                </a>{' '}
                to receive a valid invitation.
              </div>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-2.5 px-4 rounded-xl border border-[#DDE6F0] text-sm font-semibold text-[#52657C] hover:text-[#0E2238] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          )}

          {/* ── VALID REGISTRATION FORM ── */}
          {inviteState === 'valid' && inviteData && (
            <div className="p-7 sm:p-8">
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-3 bg-[#299A49]/10 text-[#1F7A3A] border border-[#299A49]/25">
                  <HiOutlineSparkles size={13} /> 14-Day Free Trial Included
                </span>
                <h2 className="text-xl font-extrabold text-[#0E2238] tracking-tight">Create your admin account</h2>
                <p className="text-xs text-[#52657C] mt-1">
                  Accept your CollegesHub invitation and launch your 14-day free trial workspace.
                </p>
              </div>

              {/* Locked email */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F4F7FB] border border-[#DDE6F0] mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#0A4D94]/10 flex items-center justify-center flex-shrink-0">
                  <HiOutlineMail size={16} className="text-[#0A4D94]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#52657C] uppercase tracking-wider">Invited Email</p>
                  <p className="text-sm font-semibold text-[#0E2238] truncate mt-0.5">{inviteData.email}</p>
                </div>
                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#1F7A3A] bg-[#299A49]/10 border border-[#299A49]/25 px-2 py-0.5 rounded-full">
                  <HiOutlineCheckCircle size={11} /> Verified
                </span>
              </div>

              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 mb-5 overflow-hidden"
                  >
                    <HiOutlineExclamationCircle size={16} className="flex-shrink-0" />
                    <span>{submitError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#52657C] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={form.name}
                      onChange={set('name')}
                      onBlur={blur('name')}
                      placeholder="e.g. Dr. Farrukh Ali"
                      className={`w-full h-11 pl-10 pr-4 rounded-xl bg-white border text-sm text-[#0E2238] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0A4D94]/20 ${
                        errors.name ? 'border-red-400 focus:border-red-500' : 'border-[#DDE6F0] focus:border-[#0A4D94]'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <HiOutlineExclamationCircle size={12} />{errors.name}
                    </p>
                  )}
                </div>

                {/* Institution Name (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-[#52657C] mb-1.5">
                    Institution / College Name
                  </label>
                  <div className="relative">
                    <HiOutlineOfficeBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={form.collegeName}
                      onChange={set('collegeName')}
                      placeholder="e.g. Superior College of Science"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#DDE6F0] focus:border-[#0A4D94] focus:ring-2 focus:ring-[#0A4D94]/20 text-sm text-[#0E2238] placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-[#52657C] mb-1.5">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <HiOutlineBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      value={form.designation}
                      onChange={set('designation')}
                      onBlur={blur('designation')}
                      className={`w-full h-11 pl-10 pr-4 rounded-xl bg-white border text-sm text-[#0E2238] outline-none focus:ring-2 focus:ring-[#0A4D94]/20 ${
                        errors.designation ? 'border-red-400 focus:border-red-500' : 'border-[#DDE6F0] focus:border-[#0A4D94]'
                      }`}
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
                  {errors.designation && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <HiOutlineExclamationCircle size={12} />{errors.designation}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#52657C] mb-1.5">
                    Set Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      onBlur={blur('password')}
                      placeholder="Create a secure password"
                      className={`w-full h-11 pl-10 pr-10 rounded-xl bg-white border text-sm text-[#0E2238] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0A4D94]/20 ${
                        errors.password ? 'border-red-400 focus:border-red-500' : 'border-[#DDE6F0] focus:border-[#0A4D94]'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0E2238] transition-colors cursor-pointer"
                    >
                      {showPass ? <HiOutlineEyeOff size={17} /> : <HiOutlineEye size={17} />}
                    </button>
                  </div>

                  {form.password && (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div
                            key={n}
                            className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{ background: n <= strength.score ? strength.color : '#E2E8F0' }}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold" style={{ color: strength.color }}>
                        {strength.label}
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {passwordRules.map((rule) => {
                          const ok = rule.test(form.password);
                          return (
                            <div key={rule.key} className="flex items-center gap-1.5">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                {ok ? (
                                  <HiOutlineCheckCircle size={11} className="text-[#299A49]" />
                                ) : (
                                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                                )}
                              </div>
                              <span className={`text-[11px] ${ok ? 'text-[#1F7A3A] font-medium' : 'text-[#52657C]'}`}>
                                {rule.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <HiOutlineExclamationCircle size={12} />{errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#52657C] mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      onBlur={blur('confirmPassword')}
                      placeholder="Re-enter password"
                      className={`w-full h-11 pl-10 pr-10 rounded-xl bg-white border text-sm text-[#0E2238] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0A4D94]/20 ${
                        errors.confirmPassword
                          ? 'border-red-400 focus:border-red-500'
                          : form.confirmPassword && form.password === form.confirmPassword
                          ? 'border-[#299A49]'
                          : 'border-[#DDE6F0] focus:border-[#0A4D94]'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0E2238] transition-colors cursor-pointer"
                    >
                      {showConfirm ? <HiOutlineEyeOff size={17} /> : <HiOutlineEye size={17} />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <p className="text-[11px] text-[#1F7A3A] mt-1 flex items-center gap-1">
                      <HiOutlineCheckCircle size={12} /> Passwords match
                    </p>
                  )}
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <HiOutlineExclamationCircle size={12} />{errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-sm font-bold shadow-lg shadow-[#0A4D94]/20 transition-colors mt-2 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up workspace…
                    </>
                  ) : (
                    <>
                      Accept Invitation &amp; Start 14-Day Trial <HiArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </motion.div>

        <p className="text-[11px] text-[#52657C] mt-6 text-center">
          © {new Date().getFullYear()} CollegesHub · Secure Onboarding Portal
        </p>
      </div>
    </div>
  );
}
