'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
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

// Google SVG logo
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

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
  const { login, logout, loginWithGoogle, complete2FASession } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [hostType, setHostType] = useState('root');
  const [tenantSlug, setTenantSlug] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 2FA states ('none' | 'enroll' | 'validate' | 'recover' | 'email-otp')
  const [twoFaMode, setTwoFaMode] = useState('none');
  const [enrollToken, setEnrollToken] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [twoFaSetupData, setTwoFaSetupData] = useState(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailSentTo, setEmailSentTo] = useState('');
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);

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

  // Live TOTP cycle timer (30-second window countdown)
  useEffect(() => {
    if (twoFaMode !== 'validate' && twoFaMode !== 'enroll') return;
    const updateTotp = () => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTotpSecondsLeft(sec);
    };
    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [twoFaMode]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Email OTP resend cooldown timer
  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailResendCooldown]);

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

  // ─── Helper: Finalize post-login routing & guards ──────────────────────────
  const finalizeAuthenticatedRoute = (userData) => {
    // ── Guard A: Super-admin portal path ──────────────────────────────────
    if (resolvedCollege?.isSuperAdmin || hostType === 'admin') {
      if (userData.role !== 'superAdmin') {
        logout();
        shake();
        toast.error('Access denied: Strictly reserved for Super Administrators.');
        return;
      }
      toast.success(`Welcome back, ${userData.name || 'Super Admin'}!`);
      router.push('/super-admin');
      return;
    }

    // ── Guard B: Block Super Admin from logging in via a college code ─────
    if (userData.role === 'superAdmin') {
      logout();
      shake();
      toast.error('Access denied: Please use the Super Admin portal to sign in.');
      return;
    }

    // ── Guard C: Block cross-college login ───────────────────────────────
    if (resolvedCollege?.id && userData.college_id) {
      if (userData.college_id !== resolvedCollege.id) {
        logout();
        shake();
        toast.error('Access denied: Your account does not belong to this institution.');
        return;
      }
    }

    // ── Guard D: Block users with no college from logging in via college code ─
    if (resolvedCollege && !resolvedCollege.isSuperAdmin && !userData.college_id && !userData.college) {
      logout();
      shake();
      toast.error('Access denied: Your account is not associated with any institution.');
      return;
    }

    const collegeDisplayName = resolvedCollege?.name || tenantProfile?.name || 'College';
    toast.success(`Welcome back to ${collegeDisplayName}, ${userData.name}!`);
    router.push(roleRedirects[userData.role] || '/');
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
      const expectedCollegeId =
        resolvedCollege && !resolvedCollege.isSuperAdmin && hostType === 'root'
          ? (resolvedCollege.id || null)
          : null;

      const userData = await login(email.trim(), password, expectedCollegeId);

      // Phase 9A: Mandatory 2FA Enrollment flow
      if (userData?.requires2FAEnrollment && userData?.enrollToken) {
        setEnrollToken(userData.enrollToken);
        setTwoFaCode('');
        const setupRes = await api.post(
          '/auth/2fa/setup',
          {},
          { headers: { Authorization: `Bearer ${userData.enrollToken}` } }
        );
        if (setupRes.data?.success) {
          setTwoFaSetupData(setupRes.data);
          setTwoFaMode('enroll');
          toast(userData.message || 'Please complete Two-Factor Authentication setup.');
        }
        return;
      }

      // Phase 9A: 2FA OTP Validation flow
      if (userData?.requires2FA && userData?.preAuthToken) {
        setPreAuthToken(userData.preAuthToken);
        setTwoFaCode('');
        setBackupCode('');
        setTwoFaMode('validate');
        toast(userData.message || 'Enter your 6-digit authenticator code.');
        return;
      }

      finalizeAuthenticatedRoute(userData);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Invalid credentials.';
      shake();
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── 2B. Handle 2FA Enrollment Verification (/auth/2fa/verify) ─────────────
  const handleEnroll2FAVerify = async (e) => {
    e.preventDefault();
    const clean = twoFaCode.replace(/\s+/g, '');
    if (clean.length !== 6) {
      shake();
      return toast.error('Please enter the 6-digit code from your authenticator app');
    }
    setLoading(true);
    try {
      const res = await api.post(
        '/auth/2fa/verify',
        { code: clean },
        { headers: { Authorization: `Bearer ${enrollToken}` } }
      );
      if (res.data?.success && res.data?.token) {
        const userData = await complete2FASession(res.data.token);
        toast.success('Two-factor authentication enabled!');
        finalizeAuthenticatedRoute(userData);
      }
    } catch (err) {
      shake();
      toast.error(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 2C. Handle 2FA Login Code Validation (/auth/2fa/validate) ─────────────
  const handleValidate2FA = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      shake();
      return toast.error(`Account is temporarily locked. Please wait ${Math.ceil(lockoutSeconds / 60)} more minutes.`);
    }
    const clean = twoFaCode.replace(/\s+/g, '');
    if (clean.length !== 6) {
      shake();
      return toast.error('Please enter your 6-digit authenticator code');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/validate', {
        preAuthToken,
        code: clean,
      });
      if (res.data?.success && res.data?.token) {
        setAttemptsRemaining(null);
        setLockoutSeconds(0);
        const userData = await complete2FASession(res.data.token, res.data.user);
        finalizeAuthenticatedRoute(userData);
      }
    } catch (err) {
      shake();
      const data = err.response?.data || {};
      if (data.attemptsRemaining !== undefined) {
        setAttemptsRemaining(data.attemptsRemaining);
      }
      if (data.lockedUntil || data.lockedMinutes || data.remainingMs) {
        const ms = data.remainingMs || (data.lockedMinutes ? data.lockedMinutes * 60 * 1000 : 30 * 60 * 1000);
        setLockoutSeconds(Math.ceil(ms / 1000));
      }
      toast.error(data.message || 'Invalid 6-digit code');
    } finally {
      setLoading(false);
    }
  };

  // ─── 2D. Handle 2FA Email OTP Dispatch (/auth/2fa/email-otp) ───────────────
  const handleRequestEmailOtp = async () => {
    if (loading || emailResendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/email-otp', { preAuthToken });
      if (res.data?.success) {
        setEmailSentTo(res.data.maskedEmail || email || 'your email');
        setEmailResendCooldown(60);
        setEmailOtpCode('');
        setTwoFaMode('email-otp');
        toast.success(res.data.message || 'Verification code sent to your email!');
      }
    } catch (err) {
      shake();
      toast.error(err.response?.data?.message || 'Failed to send email verification code');
    } finally {
      setLoading(false);
    }
  };

  // ─── 2E. Handle 2FA Email OTP Verification (/auth/2fa/verify-email-otp) ─────
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    const clean = emailOtpCode.replace(/\s+/g, '');
    if (clean.length !== 6) {
      shake();
      return toast.error('Please enter the 6-digit code sent to your email');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/verify-email-otp', {
        preAuthToken,
        code: clean,
      });
      if (res.data?.success && res.data?.token) {
        setAttemptsRemaining(null);
        setLockoutSeconds(0);
        const userData = await complete2FASession(res.data.token, res.data.user);
        toast.success('Email identity verified!');
        finalizeAuthenticatedRoute(userData);
      }
    } catch (err) {
      shake();
      const data = err.response?.data || {};
      if (data.attemptsRemaining !== undefined) {
        setAttemptsRemaining(data.attemptsRemaining);
      }
      toast.error(data.message || 'Invalid email verification code');
    } finally {
      setLoading(false);
    }
  };

  // ─── 2D. Handle 2FA Backup Code Recovery (/auth/2fa/recover) ───────────────
  const handleRecover2FA = async (e) => {
    e.preventDefault();
    const clean = backupCode.trim();
    if (!clean) {
      shake();
      return toast.error('Please enter a 10-character backup code');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/recover', {
        preAuthToken,
        backupCode: clean,
      });
      if (res.data?.success && res.data?.token) {
        const userData = await complete2FASession(res.data.token, res.data.user);
        finalizeAuthenticatedRoute(userData);
      }
    } catch (err) {
      shake();
      toast.error(err.response?.data?.message || 'Invalid backup code');
    } finally {
      setLoading(false);
    }
  };

  // ─── 3. Google Login ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (googleLoading || loading) return;
    if (!loginWithGoogle) {
      return toast.error('Google sign-in is not available. Please use email/password.');
    }
    setGoogleLoading(true);
    try {
      const userData = await loginWithGoogle();

      // Super-admin guard
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

      // Block superAdmin via college portal
      if (userData.role === 'superAdmin') {
        logout();
        shake();
        toast.error('Access denied: Please use the Super Admin portal to sign in.');
        return;
      }

      // Cross-college guard
      if (resolvedCollege?.id && userData.college_id) {
        if (userData.college_id !== resolvedCollege.id) {
          logout();
          shake();
          toast.error('Access denied: Your Google account is not linked to this institution.');
          return;
        }
      }

      const collegeDisplayName = resolvedCollege?.name || tenantProfile?.name || 'College';
      toast.success(`Welcome back to ${collegeDisplayName}, ${userData.name}!`);

      // If college is still in onboarding, redirect admin there
      if (userData.college?.status === 'onboarding' && userData.role === 'admin') {
        router.push('/onboarding');
        return;
      }

      router.push(roleRedirects[userData.role] || '/');
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed — silent
      } else if (code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups for this site and try again.');
      } else if (code === 'auth/network-request-failed') {
        toast.error('Network error. Check your connection and try again.');
      } else if (code === 'auth/unauthorized-domain') {
        toast.error('Google sign-in not configured for this domain. Contact support.');
      } else {
        const msg = err.response?.data?.message || err.message || 'Google sign-in failed.';
        shake();
        toast.error(msg);
      }
    } finally {
      setGoogleLoading(false);
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

                  {/* ─── Slide B: credentials & 2FA ─── */}
                  <div
                    className="w-1/2 shrink-0 px-1.5 py-1.5"
                    style={panelStyle(onCredentials)}
                    aria-hidden={!onCredentials}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="badge badge-primary">
                            <HiOutlineShieldCheck size={13} aria-hidden="true" />
                            {twoFaMode === 'enroll'
                              ? 'Mandatory 2FA Setup'
                              : twoFaMode !== 'none'
                                ? 'Two-Factor Verification'
                                : isSuperAdmin
                                  ? 'Super Administrator Access'
                                  : 'Sign-in Credentials'}
                          </span>

                          {(hostType === 'root' || twoFaMode !== 'none') && (
                            <button
                              type="button"
                              onClick={() => {
                                if (twoFaMode !== 'none') {
                                  setTwoFaMode('none');
                                  setTwoFaSetupData(null);
                                  setTwoFaCode('');
                                  setBackupCode('');
                                } else {
                                  setStep('code');
                                }
                              }}
                              className="btn-ghost btn-sm"
                            >
                              <HiOutlineArrowLeft size={14} aria-hidden="true" /> Back
                            </button>
                          )}
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">
                          {twoFaMode === 'enroll'
                            ? 'Set Up Authenticator'
                            : twoFaMode === 'validate'
                              ? 'Two-Factor Verification'
                              : twoFaMode === 'email-otp'
                                ? 'Email Verification'
                                : twoFaMode === 'recover'
                                  ? 'Backup Code Recovery'
                                  : 'Welcome back'}
                        </h1>
                        <p className="text-sm leading-relaxed text-fg-muted">
                          {twoFaMode === 'enroll'
                            ? 'Scan the QR code below in Google Authenticator or Authy, then enter the 6-digit code to activate 2FA.'
                            : twoFaMode === 'validate'
                              ? 'Enter the 6-digit verification code from your authenticator app.'
                              : twoFaMode === 'email-otp'
                                ? `Enter the 6-digit verification code sent to ${emailSentTo || 'your email'}.`
                                : twoFaMode === 'recover'
                                  ? 'Enter one of your 10-character single-use backup recovery codes.'
                                  : isSuperAdmin
                                    ? 'Enter your Super Admin credentials to enter the platform console.'
                                    : `Sign in with your ${activeCollege?.name || 'College'} account.`}
                        </p>
                      </div>

                      {/* ── Mode 1: Mandatory 2FA Enrollment (QR + Secret + Verify) ── */}
                      {twoFaMode === 'enroll' && twoFaSetupData && (
                        <form onSubmit={handleEnroll2FAVerify} className="flex flex-col gap-4">
                          <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-card-2 p-4">
                            <div className="rounded-xl bg-white p-3 shadow-sm">
                              <QRCodeSVG value={twoFaSetupData.otpauthUrl || ''} size={148} />
                            </div>
                            <div className="w-full text-center">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                                Manual Setup Key
                              </p>
                              <code className="mt-1 block select-all rounded-lg border border-line bg-card px-2.5 py-1.5 font-mono text-xs font-bold tracking-wider text-fg">
                                {twoFaSetupData.secretBase32}
                              </code>
                            </div>
                          </div>

                          {Array.isArray(twoFaSetupData.backupCodes) && twoFaSetupData.backupCodes.length > 0 && (
                            <details className="rounded-xl border border-line bg-card-2 px-3.5 py-2.5 text-xs">
                              <summary className="cursor-pointer font-semibold text-fg">
                                View 10 Single-Use Backup Codes (Save these safely)
                              </summary>
                              <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[11px] text-fg-muted">
                                {twoFaSetupData.backupCodes.map((bc) => (
                                  <span key={bc} className="rounded bg-card px-2 py-1 select-all">
                                    {bc}
                                  </span>
                                ))}
                              </div>
                            </details>
                          )}

                          <div>
                            <div className="flex items-center justify-between text-xs text-fg-muted font-medium mb-1.5">
                              <label htmlFor="twofa-enroll-code" className="field-label mb-0">
                                6-Digit Authenticator Code
                              </label>
                              <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                                Refreshes in {totpSecondsLeft}s
                              </span>
                            </div>
                            <input
                              id="twofa-enroll-code"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={twoFaCode}
                              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              autoFocus
                              className="input-field min-h-12 text-center font-mono text-lg font-bold tracking-[0.35em]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading || twoFaCode.length !== 6}
                            className="btn-primary min-h-12 w-full"
                          >
                            {loading ? (
                              <>
                                <Spinner />
                                <span>Verifying &amp; Activating...</span>
                              </>
                            ) : (
                              <span>Verify &amp; Enter Console</span>
                            )}
                          </button>
                        </form>
                      )}

                      {/* ── Mode 2: 2FA 6-Digit Code Validation ── */}
                      {twoFaMode === 'validate' && (
                        <form onSubmit={handleValidate2FA} className="flex flex-col gap-4">
                          {/* Account Locked Alert */}
                          {lockoutSeconds > 0 && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
                              <HiOutlineLockClosed className="h-5 w-5 shrink-0 mt-0.5 text-red-500 animate-pulse" />
                              <div className="min-w-0">
                                <p className="font-bold text-sm">Account Temporarily Locked</p>
                                <p className="mt-0.5 text-xs opacity-90 leading-relaxed">
                                  Too many failed 2FA attempts. For your security, this account is locked for:
                                </p>
                                <p className="mt-1 font-mono text-base font-extrabold text-red-600 dark:text-red-400">
                                  {Math.floor(lockoutSeconds / 60)}m {String(lockoutSeconds % 60).padStart(2, '0')}s
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Warning for Remaining Attempts */}
                          {attemptsRemaining !== null && attemptsRemaining < 5 && lockoutSeconds <= 0 && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                              <HiOutlineExclamationCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                              <div className="min-w-0">
                                <p className="font-semibold">
                                  {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                                </p>
                                <p className="mt-0.5 text-[11px] opacity-90">
                                  After 5 consecutive failures, login will be locked for 30 minutes.
                                </p>
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between text-xs text-fg-muted font-medium mb-1.5">
                              <label htmlFor="twofa-validate-code" className="field-label mb-0">
                                6-Digit Authenticator Code
                              </label>
                              <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                                Refreshes in {totpSecondsLeft}s
                              </span>
                            </div>
                            <input
                              id="twofa-validate-code"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={twoFaCode}
                              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              autoFocus
                              disabled={lockoutSeconds > 0}
                              className="input-field min-h-12 text-center font-mono text-lg font-bold tracking-[0.35em] disabled:opacity-50"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading || twoFaCode.length !== 6 || lockoutSeconds > 0}
                            className="btn-primary min-h-12 w-full disabled:cursor-not-allowed"
                          >
                            {loading ? (
                              <>
                                <Spinner />
                                <span>Verifying...</span>
                              </>
                            ) : lockoutSeconds > 0 ? (
                              <span>Locked out ({Math.floor(lockoutSeconds / 60)}m {String(lockoutSeconds % 60).padStart(2, '0')}s)</span>
                            ) : (
                              <span>Verify &amp; Sign In</span>
                            )}
                          </button>

                          {/* Fallback & Alternative Verification Options */}
                          <div className="relative my-1">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-line" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                              <span className="bg-card px-2.5 text-fg-muted font-semibold">Or verify another way</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRequestEmailOtp}
                            disabled={loading}
                            className="btn-secondary min-h-11 w-full flex items-center justify-center gap-2 text-xs font-semibold"
                          >
                            <HiOutlineMail className="h-4 w-4 text-accent" />
                            <span>Send code to verified Email</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTwoFaMode('recover')}
                            className="text-center text-xs font-semibold text-accent hover:underline pt-1"
                          >
                            Lost device? Use a 10-character backup code &rarr;
                          </button>
                        </form>
                      )}

                      {/* ── Mode 2B: 2FA Email OTP Verification ── */}
                      {twoFaMode === 'email-otp' && (
                        <form onSubmit={handleVerifyEmailOtp} className="flex flex-col gap-4">
                          <div className="rounded-xl border border-line bg-card-2 p-3.5 text-center">
                            <p className="text-xs text-fg-muted">We sent a 6-digit verification code to:</p>
                            <p className="mt-1 font-semibold text-fg text-sm select-all">{emailSentTo || email}</p>
                          </div>

                          <div>
                            <label htmlFor="twofa-email-code" className="field-label">
                              6-Digit Email Code
                            </label>
                            <input
                              id="twofa-email-code"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={emailOtpCode}
                              onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              autoFocus
                              className="input-field min-h-12 text-center font-mono text-lg font-bold tracking-[0.35em]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading || emailOtpCode.length !== 6}
                            className="btn-primary min-h-12 w-full"
                          >
                            {loading ? (
                              <>
                                <Spinner />
                                <span>Verifying Code...</span>
                              </>
                            ) : (
                              <span>Verify Email Code &amp; Sign In</span>
                            )}
                          </button>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <button
                              type="button"
                              onClick={handleRequestEmailOtp}
                              disabled={loading || emailResendCooldown > 0}
                              className="font-semibold text-accent hover:underline disabled:opacity-50"
                            >
                              {emailResendCooldown > 0 ? `Resend code in ${emailResendCooldown}s` : 'Resend Email Code'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setTwoFaMode('validate')}
                              className="font-semibold text-fg-muted hover:text-fg hover:underline"
                            >
                              &larr; Use Authenticator App
                            </button>
                          </div>
                        </form>
                      )}

                      {/* ── Mode 3: 2FA Backup Code Recovery ── */}
                      {twoFaMode === 'recover' && (
                        <form onSubmit={handleRecover2FA} className="flex flex-col gap-4">
                          <div>
                            <label htmlFor="twofa-backup-code" className="field-label">
                              10-Character Backup Code
                            </label>
                            <input
                              id="twofa-backup-code"
                              type="text"
                              value={backupCode}
                              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                              placeholder="XXXXXXXXXX"
                              autoFocus
                              className="input-field min-h-12 text-center font-mono text-base font-bold tracking-widest uppercase"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading || !backupCode.trim()}
                            className="btn-primary min-h-12 w-full"
                          >
                            {loading ? (
                              <>
                                <Spinner />
                                <span>Recovering Access...</span>
                              </>
                            ) : (
                              <span>Verify Backup Code</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setTwoFaMode('validate')}
                            className="text-center text-xs font-semibold text-accent hover:underline"
                          >
                            &larr; Use 6-digit authenticator code instead
                          </button>
                        </form>
                      )}

                      {/* ── Default Mode: Username & Password Credentials ── */}
                      {twoFaMode === 'none' && (
                        <>
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
                              {/* Google Sign-In button — for admin accounts that use Google auth */}
                              <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={googleLoading || loading}
                                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-card-2 px-4 py-3 text-sm font-medium text-fg transition hover:bg-card-3 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {googleLoading ? (
                                  <>
                                    <Spinner />
                                    <span>Signing in with Google…</span>
                                  </>
                                ) : (
                                  <>
                                    <GoogleIcon />
                                    <span>Continue with Google</span>
                                  </>
                                )}
                              </button>
                              <p className="text-center text-xs leading-relaxed text-fg-muted">
                                Need help accessing your student or faculty account?{' '}
                                <span className="font-semibold text-fg">Contact your college registrar office.</span>
                              </p>
                            </>
                          )}
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