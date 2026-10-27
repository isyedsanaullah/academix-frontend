'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineSupport,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineBadgeCheck
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
  const { login, logout, user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [hostType, setHostType] = useState('root');
  const [tenantSlug, setTenantSlug] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tenant profile state
  const [tenantProfile, setTenantProfile] = useState(null);
  const [tenantNotFound, setTenantNotFound] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hType = getHostType(window.location.hostname);
      const slug = getTenantSlug(window.location.hostname);
      setHostType(hType);
      setTenantSlug(slug);

      if (hType === 'tenant' && slug) {
        setTenantLoading(true);
        api.get(`/public/tenant/${slug}`)
          .then(res => {
            if (res.data?.success) {
              setTenantProfile(res.data.data);
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

  // 1. Root Host: Handle Code Resolution
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      return toast.error('Please enter your institution or portal code.');
    }

    setLoading(true);
    try {
      const res = await api.post('/public/resolve-code', { code: code.trim() });
      if (res.data?.success) {
        if (res.data.type === 'super-admin') {
          toast.success('Routing to Super Admin Portal...');
          window.location.href = buildAdminUrl('/login');
        } else if (res.data.type === 'college' && res.data.slug) {
          toast.success(`Routing to ${res.data.slug.toUpperCase()} portal...`);
          window.location.href = buildTenantUrl(res.data.slug, '/login');
        } else {
          toast.error('Invalid code. Please check with your institution administrator.');
        }
      }
    } catch (err) {
      toast.error('Invalid code. Please check with your institution administrator.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Admin & Tenant Hosts: Handle Standard Credentials Login
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return toast.error('Please enter email/username and password');
    }

    setLoading(true);
    try {
      const userData = await login(email.trim(), password);

      // Super Admin boundary check
      if (hostType === 'admin') {
        if (userData.role !== 'superAdmin') {
          logout();
          toast.error('Access denied: This host is strictly reserved for Super Administrators.');
          return;
        }
        toast.success(`Welcome back, ${userData.name}!`);
        router.push('/super-admin');
        return;
      }

      // Tenant boundary check
      if (hostType === 'tenant') {
        if (userData.role === 'superAdmin') {
          logout();
          toast.error('Super Administrators must sign in through admin.collegeshub.org');
          window.location.href = buildAdminUrl('/login');
          return;
        }

        const userSlug = userData.college?.slug || userData.college?.code?.toLowerCase();
        if (tenantSlug && userSlug && userSlug !== tenantSlug.toLowerCase()) {
          logout();
          toast.error(`Access denied: Your credentials belong to ${userSlug.toUpperCase()}.`);
          window.location.href = buildTenantUrl(userSlug, '/login');
          return;
        }

        toast.success(`Welcome to ${tenantProfile?.name || 'College Portal'}, ${userData.name}!`);
        router.push(roleRedirects[userData.role] || '/');
        return;
      }

      // Fallback
      router.push(roleRedirects[userData.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Invalid credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-card" />;
  }

  // ─── Case A: Tenant Not Found ─────────────────────────────────────────────
  if (hostType === 'tenant' && tenantNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-page text-fg">
        <div className="card max-w-md w-full p-8 text-center space-y-4 shadow-xl">
          <HiOutlineExclamationCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-bold">Institution Not Found</h1>
          <p className="text-sm text-muted">
            The subdomain <strong className="text-fg">{tenantSlug}</strong> does not correspond to an active institution on Collegeshub.
          </p>
          <div className="pt-2">
            <a
              href={`https://${ROOT_DOMAIN}/college`}
              className="btn-primary w-full text-sm py-2.5 inline-block text-center"
            >
              Browse College Directory
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Case B: Root Host (Code Entry) ───────────────────────────────────────
  if (hostType === 'root') {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-page text-fg p-4 md:p-8">
        {/* Top Header */}
        <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A4D94] to-[#299A49] flex items-center justify-center text-white font-black text-xl shadow-md">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight text-fg">
              Collegeshub<span className="text-[#299A49]">.org</span>
            </span>
          </div>
          <a href="/" className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
            <HiOutlineHome className="w-4 h-4" /> Home
          </a>
        </div>

        {/* Center Card */}
        <div className="max-w-md w-full mx-auto my-12">
          <div className="card p-6 md:p-8 space-y-6 shadow-2xl border border-line">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <HiOutlineKey className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-fg">Portal Sign-in</h1>
              <p className="text-xs text-muted leading-relaxed">
                Enter your unique institution code (e.g. <span className="font-semibold text-fg">fmc</span>) or platform code to access your campus portal.
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label htmlFor="portal-code" className={labelCls}>Institution or Portal Code</label>
                <div className="relative">
                  <HiOutlineOfficeBuilding className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                  <input
                    id="portal-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. fmc, pcs"
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                    className={`${inputBase} pl-11 py-3 text-base uppercase font-semibold`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className={`${btnPrimary} py-3`}
              >
                {loading ? 'Validating...' : (
                  <>
                    <span>Continue to Portal</span>
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-line pt-4 text-center text-xs text-muted space-y-1">
              <p>Don&apos;t know your institution code?</p>
              <a href="/college" className="text-primary hover:underline font-semibold block">
                Search the College Directory &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} Collegeshub.org &bull; Secure Multi-Tenant Architecture
        </div>
      </div>
    );
  }

  // ─── Case C: Admin Host or Tenant Subdomain (Standard Login) ───────────────
  const isSuperAdminHost = hostType === 'admin';
  const collegeLogo = tenantProfile?.logo || null;
  const collegeName = isSuperAdminHost ? 'Collegeshub Platform' : (tenantProfile?.name || `${tenantSlug?.toUpperCase()} Portal`);
  const collegeTagline = isSuperAdminHost
    ? 'Super Administrator Control Center'
    : (tenantProfile?.tagline || 'Student & Faculty Campus Portal');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-page text-fg p-4 md:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          {collegeLogo ? (
            <img src={collegeLogo} alt={collegeName} className="w-10 h-10 object-contain rounded-lg border border-line" />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md ${
              isSuperAdminHost ? 'bg-indigo-600' : 'bg-gradient-to-br from-[#0A4D94] to-[#299A49]'
            }`}>
              {isSuperAdminHost ? 'A' : (tenantSlug ? tenantSlug.charAt(0).toUpperCase() : 'C')}
            </div>
          )}
          <div>
            <span className="font-extrabold text-base tracking-tight text-fg block">{collegeName}</span>
            <span className="text-[11px] text-muted block">{collegeTagline}</span>
          </div>
        </div>
        <a href="/" className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
          <HiOutlineHome className="w-4 h-4" /> Home
        </a>
      </div>

      {/* Center Form */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="card p-6 md:p-8 space-y-6 shadow-2xl border border-line">
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-3 ${
              isSuperAdminHost ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <HiOutlineShieldCheck className="w-4 h-4" />
              {isSuperAdminHost ? 'Super Admin Authentication' : 'Campus Sign-in'}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-fg">Welcome back</h1>
            <p className="text-xs text-muted mt-1">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className={labelCls}>Email or Username</label>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email or username"
                  autoFocus
                  autoComplete="username"
                  className={`${inputBase} pl-11 py-3 text-sm`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className={labelCls}>Password</label>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className={`${inputBase} pl-11 pr-11 py-3 text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className={`${btnPrimary} py-3 mt-2`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {!isSuperAdminHost && (
            <div className="border-t border-line pt-4 text-center text-xs text-muted">
              <span>Need help accessing your student or faculty account? </span>
              <span className="font-semibold text-fg">Contact your college registrar office.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} Collegeshub.org &bull; {collegeName}
      </div>
    </div>
  );
}