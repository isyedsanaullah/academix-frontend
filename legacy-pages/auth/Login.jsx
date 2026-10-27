'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
  HiOutlinePhone
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getHostType, getTenantSlug, buildAdminUrl, buildTenantUrl, ROOT_DOMAIN } from '@/lib/host';
import LoginArt from './LoginArt.jsx';

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

const FEATURES = ['Admissions', 'Academics', 'Attendance', 'Fees', 'Exams', 'AI Tutor'];

// The inactive slide is hidden from keyboard + screen readers once it has slid out of view.
const panelStyle = (active) => ({
  visibility: active ? 'visible' : 'hidden',
  transition: `visibility 0s linear ${active ? '0s' : '.45s'}`
});

const Spinner = () => (
  <span
    className="login-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent"
    aria-hidden="true"
  />
);

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

  // Presentation-only refs (focus after slide, error shake)
  const codeRef = useRef(null);
  const emailRef = useRef(null);
  const shakeRef = useRef(null);

  const shake = () => {
    const el = shakeRef.current;
    if (!el) return;
    el.classList.remove('login-shake');
    void el.offsetWidth;
    el.classList.add('login-shake');
  };

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

  // Move focus to the visible field after each slide
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      const el = step === 'code' ? codeRef.current : emailRef.current;
      el?.focus({ preventScroll: true });
    }, 120);
    return () => clearTimeout(t);
  }, [step, mounted]);

  // ─── 1. Resolve Institute Code ──────────────────────────────────────────────
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      shake();
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
          shake();
          toast.error('Invalid institution code. Please check your college short code.');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid institution code. Please check your code or search directory.';
      shake();
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── 2. Handle Credentials Submit ──────────────────────────────────────────
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      shake();
      return toast.error('Please enter email/username and password');
    }

    setLoading(true);
    try {
      // Pass the expected college ID to the backend for server-side validation.
      // Only send it when a specific college was resolved (not super-admin, not subdomain).
      const expectedCollegeId =
        resolvedCollege && !resolvedCollege.isSuperAdmin && hostType === 'root'
          ? (resolvedCollege.id || null)
          : null;

      const userData = await login(email.trim(), password, expectedCollegeId);


      // ── Guard A: Super-admin portal path ──────────────────────────────────
      if (resolvedCollege?.isSuperAdmin || hostType === 'admin') {
        if (userData.role !== 'superAdmin') {
          logout();
          shake();
          toast.error('Access denied: Strictly reserved for Super Administrators.');
          return;
        }
        toast.success(`Welcome back, ${userData.name}!`);
        router.push('/super-admin');
        return;
      }

      // ── Guard B: Block Super Admin from logging in via a college code ─────
      // If we resolved a specific college (not super-admin) but the account is superAdmin,
      // reject — superAdmin must use the dedicated super-admin portal.
      if (userData.role === 'superAdmin') {
        logout();
        shake();
        toast.error('Access denied: Please use the Super Admin portal to sign in.');
        return;
      }

      // ── Guard C: Block cross-college login ───────────────────────────────
      // If a specific college was resolved via code, the authenticated user MUST
      // belong to that exact college. Compare IDs.
      if (resolvedCollege?.id && userData.college_id) {
        if (userData.college_id !== resolvedCollege.id) {
          logout();
          shake();
          toast.error('Access denied: Your account does not belong to this institution.');
          return;
        }
      }

      // ── Guard D: Block users with no college from logging in via college code ─
      // (e.g. a super admin account that somehow passed guard B)
      if (resolvedCollege && !resolvedCollege.isSuperAdmin && !userData.college_id) {
        logout();
        shake();
        toast.error('Access denied: Your account is not associated with any institution.');
        return;
      }

      // College User login — all checks passed
      const collegeDisplayName = resolvedCollege?.name || tenantProfile?.name || 'College';
      toast.success(`Welcome back to ${collegeDisplayName}, ${userData.name}!`);
      router.push(roleRedirects[userData.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Invalid credentials.';
      shake();
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-dvh bg-app" />;
  }

  // ─── Case: Subdomain Tenant Not Found ───────────────────────────────────────
  if (hostType === 'tenant' && tenantNotFound) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app p-4">
        <div className="card login-slide-in flex w-full max-w-md flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bad/10 text-bad">
            <HiOutlineExclamationCircle size={26} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-fg">Institution Not Found</h1>
          <p className="text-sm text-fg-muted">
            The subdomain <strong className="break-all font-semibold text-fg">{tenantSlug}</strong> does not correspond to an active institution on Collegeshub.
          </p>
          <a href={`https://${ROOT_DOMAIN}/college`} className="btn-primary mt-2 w-full">
            Browse College Directory
          </a>
        </div>
      </div>
    );
  }

  const activeCollege = resolvedCollege || tenantProfile;
  const isSuperAdmin = activeCollege?.isSuperAdmin || hostType === 'admin';
  const onCredentials = step === 'credentials';
  const showSuper = onCredentials && isSuperAdmin;
  const showCollege = onCredentials && activeCollege && !isSuperAdmin;
  const showTenantSkeleton = hostType === 'tenant' && tenantLoading && !activeCollege;
  const eyebrow = showSuper ? 'Platform Control' : showCollege ? 'Verified Campus Portal' : 'Smart Campus Cloud';
  const leftMode = showTenantSkeleton ? 'skeleton' : showCollege ? 'college' : showSuper ? 'super' : 'default';

  return (
    <div className="grid min-h-dvh bg-app text-fg selection:bg-accent-soft lg:h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">

      {/* ════════ LEFT: animated brand panel (desktop only) ════════ */}
      {/* This panel is always dark (the artwork is drawn for a dark background), so it uses
          fixed white-on-dark text instead of theme tokens. */}
      <aside
        className="relative hidden overflow-hidden bg-gradient-to-br from-brand-blue-900 via-surface-900 to-surface-950 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:p-10 xl:p-12"
        aria-label="Collegeshub overview"
      >
        {/* Backdrop layers */}
        {showCollege && activeCollege.coverPhoto && (
          <img
            src={activeCollege.coverPhoto}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}
        <div className="login-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-blue-500/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-brand-green-600/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" aria-hidden="true" />

        {/* Animated artwork */}
        <div
          className="pointer-events-none absolute inset-0 flex items-start justify-end pl-16 pr-0 pb-52 pt-6 xl:pl-20"
          aria-hidden="true"
        >
          <LoginArt className="h-full w-full max-w-[600px]" />
        </div>

        {/* Top row */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5 rounded-lg">
            <Image src="/logo-mark.svg" alt="" width={36} height={34} priority />
            <span className="text-lg font-extrabold tracking-tight">
              Collegeshub<span className="text-brand-green-500">.org</span>
            </span>
          </a>

          {onCredentials && hostType === 'root' && (
            <button
              type="button"
              onClick={() => {
                setStep('code');
                setResolvedCollege(null);
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <HiOutlineArrowLeft size={14} aria-hidden="true" /> Change Code
            </button>
          )}
        </div>

        {/* Bottom content */}
        <div className="relative z-10 mt-auto flex flex-col gap-5">
          <div key={leftMode} className="login-fade-up flex flex-col gap-4" style={{ '--delay': '.05s' }}>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <HiOutlineBadgeCheck size={16} className="text-brand-green-500" aria-hidden="true" />
              {eyebrow}
            </span>

            {leftMode === 'skeleton' && (
              <div className="space-y-3" aria-busy="true">
                <div className="h-7 w-56 animate-pulse rounded-lg bg-white/10" />
                <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-white/10" />
                <div className="h-4 w-48 animate-pulse rounded-lg bg-white/10" />
              </div>
            )}

            {leftMode === 'college' && (
              <>
                <div className="flex items-center gap-4">
                  {activeCollege.logo ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-brand-green-500 bg-white/10 p-0.5 shadow-xl backdrop-blur-md">
                      <img
                        src={activeCollege.logo}
                        alt={activeCollege.name}
                        className="h-full w-full rounded-full bg-white object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-brand-blue-700 to-brand-green-600 text-2xl font-black shadow-xl">
                      {activeCollege.name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 break-words text-2xl font-bold leading-tight">
                      {activeCollege.name}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold text-brand-green-500">
                      Code: {activeCollege.code || tenantSlug?.toUpperCase()}
                    </p>
                  </div>
                </div>

                {activeCollege.tagline && (
                  <p className="text-sm italic leading-relaxed text-white/75">
                    &ldquo;{activeCollege.tagline}&rdquo;
                  </p>
                )}

                <div className="space-y-2 text-xs text-white/80">
                  {(activeCollege.address || activeCollege.city) && (
                    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
                      <HiOutlineLocationMarker size={16} className="mt-0.5 shrink-0 text-brand-green-500" aria-hidden="true" />
                      <span className="min-w-0 break-words">{[activeCollege.address, activeCollege.city].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                    {activeCollege.phone && (
                      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
                        <HiOutlinePhone size={14} className="shrink-0 text-brand-blue-400" aria-hidden="true" />
                        <span className="truncate">{activeCollege.phone}</span>
                      </div>
                    )}
                    {activeCollege.email && (
                      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
                        <HiOutlineMail size={14} className="shrink-0 text-brand-blue-400" aria-hidden="true" />
                        <span className="truncate">{activeCollege.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {leftMode === 'super' && (
              <>
                <h2 className="text-3xl font-bold tracking-tight xl:text-4xl">Platform Control</h2>
                <p className="max-w-md text-sm leading-relaxed text-white/70">
                  Centralized multi-tenant supervision, college provisioning, subscriptions, and platform telemetry.
                </p>
              </>
            )}

            {leftMode === 'default' && (
              <>
                <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
                  One Portal for All Your Campus Needs
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-white/70">
                  Enter your institution code to connect to your college database, verify credentials, and access attendance, fees, exams, and LMS.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {FEATURES.map((feat, i) => (
                    <li
                      key={feat}
                      className="login-fade-up rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80"
                      style={{ '--delay': `${0.15 + i * 0.07}s` }}
                    >
                      {feat}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Collegeshub.org &bull; Secure Multi-Tenant Cloud
          </p>
        </div>
      </aside>

      {/* ════════ RIGHT: sliding forms ════════ */}
      <section className="relative flex flex-col overflow-y-auto bg-card">
        <div className="brand-rail" aria-hidden="true" />

        {/* Mobile / tablet brand strip (the artwork panel is desktop only) */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-brand-blue-900 to-surface-950 px-4 py-3 text-white sm:px-6 lg:hidden">
          <a href="/" className="flex items-center gap-2.5 rounded-lg">
            <Image src="/logo-mark.svg" alt="" width={32} height={30} priority />
            <span className="text-base font-extrabold tracking-tight">
              Collegeshub<span className="text-brand-green-500">.org</span>
            </span>
          </a>
          <a
            href="/"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <HiOutlineHome size={14} aria-hidden="true" /> Home
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-4 sm:px-8">
          <div className="login-slide-in w-full max-w-[420px]">

            {/* Step progress (only when the code step exists) */}
            {hostType === 'root' && (
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex flex-1 gap-1.5"
                  role="progressbar"
                  aria-label="Sign-in progress"
                  aria-valuemin={1}
                  aria-valuemax={2}
                  aria-valuenow={onCredentials ? 2 : 1}
                >
                  <span className="h-1 flex-1 rounded-full bg-accent" />
                  <span className={`h-1 flex-1 rounded-full transition-colors duration-500 ${onCredentials ? 'bg-accent' : 'bg-card-3'}`} />
                </div>
                <span className="text-xs font-semibold tabular-nums text-fg-muted">{onCredentials ? 2 : 1} / 2</span>
              </div>
            )}

            <div ref={shakeRef}>
              <div className="overflow-hidden">
                <div
                  className="flex w-[200%] transition-transform duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)]"
                  style={{ transform: onCredentials ? 'translateX(-50%)' : 'translateX(0)' }}
                >

                  {/* ─── Slide A: institution code ─── */}
                  <div
                    className="w-1/2 shrink-0 px-1.5 py-1.5"
                    style={panelStyle(!onCredentials)}
                    aria-hidden={onCredentials}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2.5">
                        <span className="badge badge-primary w-fit">
                          <HiOutlineKey size={13} aria-hidden="true" />
                          Step 1 of 2: Institution Code
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">Find Your Institution</h1>
                        <p className="text-sm leading-relaxed text-fg-muted">
                          Enter your institution&apos;s short code to open the login screen.
                        </p>
                      </div>

                      <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
                        <div>
                          <label htmlFor="portal-code" className="field-label">Institution Code</label>
                          <div className="relative">
                            <HiOutlineOfficeBuilding
                              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-faint"
                              aria-hidden="true"
                            />
                            <input
                              id="portal-code"
                              ref={codeRef}
                              type="text"
                              value={code}
                              onChange={(e) => setCode(e.target.value)}
                              placeholder="Enter institution code"
                              spellCheck={false}
                              autoCapitalize="none"
                              autoComplete="off"
                              className="input-field min-h-12 pl-10 font-semibold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !code.trim()}
                          className="btn-primary min-h-12 w-full"
                        >
                          {loading ? (
                            <>
                              <Spinner />
                              <span>Verifying Institution...</span>
                            </>
                          ) : (
                            <>
                              <span>Continue</span>
                              <HiOutlineArrowRight size={16} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </form>

                      <hr className="divider" />
                      <div className="flex flex-col items-center gap-1 text-center text-xs text-fg-muted">
                        <p>Don&apos;t know your institution code?</p>
                        <a href="/college" className="font-semibold text-accent hover:underline">
                          Search the College Directory &rarr;
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* ─── Slide B: credentials ─── */}
                  <div
                    className="w-1/2 shrink-0 px-1.5 py-1.5"
                    style={panelStyle(onCredentials)}
                    aria-hidden={!onCredentials}
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="badge badge-primary">
                            <HiOutlineShieldCheck size={13} aria-hidden="true" />
                            {isSuperAdmin ? 'Super Administrator Access' : 'Sign-in Credentials'}
                          </span>

                          {hostType === 'root' && (
                            <button
                              type="button"
                              onClick={() => setStep('code')}
                              className="btn-ghost btn-sm"
                            >
                              <HiOutlineArrowLeft size={14} aria-hidden="true" /> Back
                            </button>
                          )}
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">Welcome back</h1>
                        <p className="text-sm leading-relaxed text-fg-muted">
                          {isSuperAdmin
                            ? 'Enter your Super Admin credentials to enter the platform console.'
                            : `Sign in with your ${activeCollege?.name || 'College'} account.`}
                        </p>
                      </div>

                      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
                        <div>
                          <label htmlFor="login-email" className="field-label">Email or Username</label>
                          <div className="relative">
                            <HiOutlineMail
                              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-faint"
                              aria-hidden="true"
                            />
                            <input
                              id="login-email"
                              ref={emailRef}
                              type="text"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter email or username"
                              autoComplete="username"
                              className="input-field min-h-12 pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="login-password" className="field-label">Password</label>
                          <div className="relative">
                            <HiOutlineLockClosed
                              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-faint"
                              aria-hidden="true"
                            />
                            <input
                              id="login-password"
                              type={showPass ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter password"
                              autoComplete="current-password"
                              className="input-field min-h-12 pl-10 pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass(!showPass)}
                              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-fg-faint transition hover:bg-card-2 hover:text-fg"
                              aria-label={showPass ? 'Hide password' : 'Show password'}
                              aria-pressed={showPass}
                            >
                              {showPass ? <HiOutlineEyeOff size={18} aria-hidden="true" /> : <HiOutlineEye size={18} aria-hidden="true" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !email.trim() || !password}
                          className="btn-primary mt-1 min-h-12 w-full"
                        >
                          {loading ? (
                            <>
                              <Spinner />
                              <span>Authenticating...</span>
                            </>
                          ) : (
                            <span>Sign In</span>
                          )}
                        </button>
                      </form>

                      {!isSuperAdmin && (
                        <>
                          <hr className="divider" />
                          <p className="text-center text-xs leading-relaxed text-fg-muted">
                            Need help accessing your student or faculty account?{' '}
                            <span className="font-semibold text-fg">Contact your college registrar office.</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-line px-4 py-3 text-center text-xs text-fg-faint">
          Collegeshub Multi-Tenant System &bull; High Availability Cloud
        </footer>
      </section>
    </div>
  );
}