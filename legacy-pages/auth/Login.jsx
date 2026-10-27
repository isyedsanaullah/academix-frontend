'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlineBadgeCheck,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineGlobeAlt
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getHostType, getTenantSlug, buildAdminUrl, buildTenantUrl, ROOT_DOMAIN } from '@/lib/host';

const inputBase =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-card text-sm text-slate-900 dark:text-fg placeholder:text-slate-400 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-muted';
const btnPrimary =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60';

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

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [hostType, setHostType] = useState('root');
  const [tenantSlug, setTenantSlug] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step in root flow: 'code' -> 'credentials' (after slide animation)
  const [step, setStep] = useState('code');

  // Resolved college data for slide card
  const [resolvedCollege, setResolvedCollege] = useState(null);

  // Tenant profile state (when on a subdomain)
  const [tenantProfile, setTenantProfile] = useState(null);
  const [tenantNotFound, setTenantNotFound] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);

  // Auto-resolve college code if ?code= URL param is present (e.g. from public profile login button)
  useEffect(() => {
    const urlCode = searchParams?.get('code');
    if (!urlCode) return;

    const cleanCode = urlCode.trim();
    if (!cleanCode) return;

    setCode(cleanCode.toUpperCase());
    setLoading(true);

    // Super admin shortcut codes
    if (['superadmin', 'admin', 'collegeshub'].includes(cleanCode.toLowerCase())) {
      setResolvedCollege({
        name: 'Collegeshub Platform Administration',
        tagline: 'Super Administrator Control Center',
        code: 'SUPER-ADMIN',
        isSuperAdmin: true
      });
      setStep('credentials');
      setLoading(false);
      return;
    }

    api.post('/public/resolve-code', { code: cleanCode })
      .then(res => {
        if (res.data?.success) {
          if (res.data.type === 'super-admin') {
            setResolvedCollege({
              name: 'Collegeshub Platform Administration',
              tagline: 'Super Administrator Control Center',
              code: 'SUPER-ADMIN',
              isSuperAdmin: true
            });
            setStep('credentials');
          } else if (res.data.type === 'college') {
            const col = res.data.college || {
              slug: res.data.slug,
              code: cleanCode.toUpperCase(),
              name: `${res.data.slug?.toUpperCase()} College`,
              tagline: 'Campus Portal'
            };
            setResolvedCollege(col);
            setTenantSlug(col.slug || res.data.slug);
            setStep('credentials');
          }
        }
      })
      .catch(() => {
        // Silently fail — user will see code form and can re-enter
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hType = getHostType(window.location.hostname);
      const slug = getTenantSlug(window.location.hostname);
      setHostType(hType);
      setTenantSlug(slug);

      // On tenant subdomain or admin host, start directly in credentials step
      if (hType === 'admin' || hType === 'tenant') {
        setStep('credentials');
      }

      if (hType === 'tenant' && slug) {
        setTenantLoading(true);
        api.get(`/public/tenant/${slug}`)
          .then(res => {
            if (res.data?.success) {
              setTenantProfile(res.data.data);
              setResolvedCollege(res.data.data);
            } else {
              setTenantNotFound(true);
            }
          })
          .catch(() => {
            setTenantNotFound(true);
          })
          .finally(() => {
            setTenantLoading(false);
          });
      }
    }
  }, []);

  // ─── 1. Resolve Institute Code ──────────────────────────────────────────────
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      return toast.error('Please enter your institution or portal code.');
    }

    setLoading(true);
    try {
      // Super admin shortcut
      if (cleanCode.toLowerCase() === 'superadmin' || cleanCode.toLowerCase() === 'admin' || cleanCode.toLowerCase() === 'collegeshub') {
        setResolvedCollege({
          name: 'Collegeshub Platform Administration',
          tagline: 'Super Administrator Control Center',
          code: 'SUPER-ADMIN',
          isSuperAdmin: true
        });
        setStep('credentials');
        toast.success('Super Admin mode unlocked');
        return;
      }

      const res = await api.post('/public/resolve-code', { code: cleanCode });
      if (res.data?.success) {
        if (res.data.type === 'super-admin') {
          setResolvedCollege({
            name: 'Collegeshub Platform Administration',
            tagline: 'Super Administrator Control Center',
            code: 'SUPER-ADMIN',
            isSuperAdmin: true
          });
          setStep('credentials');
          toast.success('Super Admin mode unlocked');
        } else if (res.data.type === 'college') {
          const col = res.data.college || {
            slug: res.data.slug,
            code: cleanCode.toUpperCase(),
            name: `${res.data.slug.toUpperCase()} College`,
            tagline: 'Campus Portal'
          };
          setResolvedCollege(col);
          setTenantSlug(col.slug || res.data.slug);
          setStep('credentials');
          toast.success(`Connected to ${col.name}!`);
        } else {
          toast.error('Invalid institution code. Please check your college short code.');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid institution code. Please check your code or search directory.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── 2. Handle Credentials Submit ──────────────────────────────────────────
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return toast.error('Please enter email/username and password');
    }

    setLoading(true);
    try {
      const userData = await login(email.trim(), password);

      // Super admin checks
      if (resolvedCollege?.isSuperAdmin || hostType === 'admin') {
        if (userData.role !== 'superAdmin') {
          logout();
          toast.error('Access denied: Strictly reserved for Super Administrators.');
          return;
        }
        toast.success(`Welcome back, ${userData.name}!`);
        router.push('/super-admin');
        return;
      }

      // College User login
      const collegeDisplayName = resolvedCollege?.name || tenantProfile?.name || 'College';
      toast.success(`Welcome back to ${collegeDisplayName}, ${userData.name}!`);
      router.push(roleRedirects[userData.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Invalid credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // ─── Case: Subdomain Tenant Not Found ───────────────────────────────────────
  if (hostType === 'tenant' && tenantNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <HiOutlineExclamationCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-bold">Institution Not Found</h1>
          <p className="text-sm text-slate-400">
            The subdomain <strong className="text-white">{tenantSlug}</strong> does not correspond to an active institution on Collegeshub.
          </p>
          <div className="pt-2">
            <a
              href={`https://${ROOT_DOMAIN}/college`}
              className="btn-primary w-full text-sm py-2.5 inline-block text-center rounded-xl bg-primary text-white font-semibold"
            >
              Browse College Directory
            </a>
          </div>
        </div>
      </div>
    );
  }

  const activeCollege = resolvedCollege || tenantProfile;
  const isSuperAdmin = activeCollege?.isSuperAdmin || hostType === 'admin';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="w-full px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A4D94] to-[#299A49] flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              Collegeshub<span className="text-[#299A49]">.org</span>
            </span>
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCode('superadmin');
                setResolvedCollege({
                  name: 'Collegeshub Platform Administration',
                  tagline: 'Super Administrator Control Center',
                  code: 'SUPER-ADMIN',
                  isSuperAdmin: true
                });
                setStep('credentials');
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all font-semibold"
            >
              Super Admin Sign-in
            </button>
            <a
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <HiOutlineHome className="w-3.5 h-3.5" /> Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Container: Split 2-Column on PC */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[580px]">

          {/* ════════ LEFT COLUMN: Brand or College Card with Cover & Map Overlay ════════ */}
          <div className="relative p-8 md:p-10 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 bg-gradient-to-br from-[#081528] via-[#0b1b36] to-[#072418]">
            
            {/* If a college is resolved and we are on credentials step: show cover photo + map overlay */}
            {step === 'credentials' && activeCollege && !isSuperAdmin ? (
              <div className="absolute inset-0 z-0">
                {activeCollege.coverPhoto ? (
                  <img
                    src={activeCollege.coverPhoto}
                    alt={activeCollege.name}
                    className="w-full h-full object-cover opacity-25"
                  />
                ) : (
                  <div
                    className="w-full h-full opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(#299A49 1px, transparent 1px), radial-gradient(#0A4D94 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                      backgroundPosition: '0 0, 12px 12px'
                    }}
                  />
                )}
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 to-transparent" />
              </div>
            ) : (
              /* Default background glow for root/superadmin */
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#0A4D94]/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#299A49]/20 blur-3xl" />
              </div>
            )}

            {/* Top Row inside Left Column */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/10 backdrop-blur-md">
                <HiOutlineBadgeCheck className="w-4 h-4 text-[#299A49]" />
                {isSuperAdmin ? 'Platform Control' : activeCollege ? 'Verified Campus Portal' : 'Smart Campus Cloud'}
              </span>

              {step === 'credentials' && hostType === 'root' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('code');
                    setResolvedCollege(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                >
                  <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Change Code
                </button>
              )}
            </div>

            {/* Center Content in Left Column */}
            <div className="relative z-10 my-8 space-y-5">
              {step === 'credentials' && activeCollege && !isSuperAdmin ? (
                /* Dynamic College Branding with Circle Logo & Cover & Contact */
                <div className="space-y-4 animate-in fade-in slide-in-from-left duration-300">
                  <div className="flex items-center gap-4">
                    {activeCollege.logo ? (
                      <div className="w-20 h-20 rounded-full p-1 bg-white/10 border-2 border-[#299A49] shadow-xl overflow-hidden shrink-0 backdrop-blur-md">
                        <img
                          src={activeCollege.logo}
                          alt={activeCollege.name}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A4D94] to-[#299A49] border-2 border-white/20 shadow-xl flex items-center justify-center text-white text-3xl font-black shrink-0">
                        {activeCollege.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-black text-white leading-tight">
                        {activeCollege.name}
                      </h2>
                      <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                        Code: {activeCollege.code || tenantSlug?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {activeCollege.tagline && (
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                      &ldquo;{activeCollege.tagline}&rdquo;
                    </p>
                  )}

                  {/* College Contact & Location Badge */}
                  <div className="pt-2 space-y-2 text-xs text-slate-300">
                    {(activeCollege.address || activeCollege.city) && (
                      <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                        <HiOutlineLocationMarker className="w-4 h-4 text-[#299A49] shrink-0 mt-0.5" />
                        <span>{[activeCollege.address, activeCollege.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeCollege.phone && (
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                          <HiOutlinePhone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{activeCollege.phone}</span>
                        </div>
                      )}
                      {activeCollege.email && (
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                          <HiOutlineMail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{activeCollege.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : isSuperAdmin ? (
                /* Super Admin Branding */
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-3xl font-black shadow-lg">
                    <HiOutlineShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    Platform Control
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                    Centralized multi-tenant supervision, college provisioning, subscriptions, and platform telemetry.
                  </p>
                </div>
              ) : (
                /* Default Left Content (When entering code) */
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#299A49] text-2xl font-black shadow-lg">
                    <HiOutlineOfficeBuilding className="w-7 h-7" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                    One Portal for All Your Campus Needs
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                    Enter your institution code to connect to your college database, verify credentials, and access attendance, fees, exams, and LMS.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Admissions', 'Academics', 'Attendance', 'Fees', 'Exams', 'AI Tutor'].map((feat) => (
                      <span key={feat} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer inside Left Column */}
            <div className="relative z-10 text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Collegeshub.org &bull; Secure Multi-Tenant Cloud
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: Sliding Forms (Code -> Credentials) ════════ */}
          <div className="p-8 md:p-10 flex flex-col justify-center relative bg-slate-900">
            
            {/* ─── FORM A: Institute Code Form (Slides left on submit) ─── */}
            {step === 'code' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                    <HiOutlineKey className="w-3.5 h-3.5" />
                    Step 1 of 2: Institution Code
                  </span>
                  <h1 className="text-2xl font-black tracking-tight text-white">Find Your Institution</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your short college code (e.g. <span className="font-semibold text-white">fmc</span>, <span className="font-semibold text-white">pcs</span>) to open the login screen.
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="portal-code" className={labelCls}>Institution Code</label>
                    <div className="relative">
                      <HiOutlineOfficeBuilding className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        id="portal-code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. fmc, pcs, superadmin"
                        autoFocus
                        spellCheck={false}
                        autoCapitalize="none"
                        className={`${inputBase} pl-11 py-3 text-base uppercase font-bold text-white bg-slate-950 border-slate-700`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className={`${btnPrimary} py-3 mt-1 bg-gradient-to-r from-[#0A4D94] to-[#299A49]`}
                  >
                    {loading ? 'Verifying Institution...' : (
                      <>
                        <span>Continue</span>
                        <HiOutlineArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400 space-y-1.5">
                  <p>Don&apos;t know your institution code?</p>
                  <a href="/college" className="text-primary hover:underline font-semibold block">
                    Search the College Directory &rarr;
                  </a>
                </div>
              </div>
            ) : (
              /* ─── FORM B: Credentials Form (Slides in from right) ─── */
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      isSuperAdmin
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                      {isSuperAdmin ? 'Super Administrator Access' : 'Sign-in Credentials'}
                    </span>

                    {hostType === 'root' && (
                      <button
                        type="button"
                        onClick={() => setStep('code')}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight text-white">Welcome back</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSuperAdmin
                      ? 'Enter your Super Admin credentials to enter the platform console.'
                      : `Sign in with your ${activeCollege?.name || 'College'} account.`}
                  </p>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className={labelCls}>Email or Username</label>
                    <div className="relative">
                      <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        id="login-email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email or username"
                        autoFocus
                        autoComplete="username"
                        className={`${inputBase} pl-11 py-3 text-sm text-white bg-slate-950 border-slate-700`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" className={labelCls}>Password</label>
                    <div className="relative">
                      <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        id="login-password"
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        autoComplete="current-password"
                        className={`${inputBase} pl-11 pr-11 py-3 text-sm text-white bg-slate-950 border-slate-700`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !password}
                    className={`${btnPrimary} py-3 mt-2 bg-gradient-to-r from-[#0A4D94] to-[#299A49]`}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                {!isSuperAdmin && (
                  <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
                    Need help accessing your student or faculty account?{' '}
                    <span className="font-semibold text-slate-200">Contact your college registrar office.</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 border-t border-slate-800/60">
        Collegeshub Multi-Tenant System &bull; High Availability Cloud
      </footer>
    </div>
  );
}