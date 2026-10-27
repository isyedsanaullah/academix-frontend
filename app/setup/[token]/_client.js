'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

// Password strength calculator
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { score, label: 'Good', color: '#3b82f6' };
  return { score, label: 'Strong', color: '#22c55e' };
}

export default function SetupClient({ token }) {
  const router = useRouter();

  // Invite state
  const [inviteState, setInviteState] = useState('loading'); // loading | valid | expired | used | revoked | invalid
  const [inviteData, setInviteData] = useState(null); // { collegeName, slug, email }

  // Form state
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = getPasswordStrength(password);

  // Load invite on mount
  useEffect(() => {
    if (!token) { setInviteState('invalid'); return; }

    (async () => {
      try {
        const res = await axios.get(`${API}/public/invites/${token}`);
        if (res.data.valid) {
          setInviteState('valid');
          setInviteData(res.data.data);
        } else {
          setInviteState(res.data.reason || 'invalid');
        }
      } catch (err) {
        const reason = err.response?.data?.reason;
        setInviteState(reason || 'invalid');
      }
    })();
  }, [token]);

  function validate() {
    const errors = {};
    if (!fullName.trim() || fullName.trim().length < 2) errors.fullName = 'Full name is required (min 2 characters).';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await axios.post(`${API}/public/invites/${token}/accept`, {
        fullName: fullName.trim(),
        password,
        confirmPassword
      });

      const { token: authToken, data } = res.data;

      // Persist session token (same key as the rest of the app)
      localStorage.setItem('academix_token', authToken);
      localStorage.setItem('academix_user', JSON.stringify(data));

      toast.success('Account created! Redirecting to email verification...');
      router.push('/verify-email');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      const reason = err.response?.data?.reason;
      if (reason === 'used') {
        setInviteState('used');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── State screens ─────────────────────────────────────────────────────────
  if (inviteState === 'loading') {
    return (
      <OnboardingShell title="Verifying your invitation...">
        <div className="flex flex-col items-center gap-6 py-10">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/50">Checking your invite link…</p>
        </div>
      </OnboardingShell>
    );
  }

  if (inviteState !== 'valid') {
    const stateInfo = {
      expired: {
        icon: '⏰',
        title: 'Invitation Expired',
        desc: 'This invite link has expired. Please ask your Collegeshub contact to send a new invitation.'
      },
      used: {
        icon: '✅',
        title: 'Invitation Already Used',
        desc: 'This invite link has already been used to create an account. If you need help logging in, use the login page or contact support.'
      },
      revoked: {
        icon: '🚫',
        title: 'Invitation Revoked',
        desc: 'This invite link has been revoked. Please contact Collegeshub support for assistance.'
      },
      invalid: {
        icon: '❓',
        title: 'Invalid Invitation',
        desc: 'This invite link is invalid or does not exist. Please check the link in your email or contact support.'
      }
    };
    const info = stateInfo[inviteState] || stateInfo.invalid;

    return (
      <OnboardingShell title={info.title}>
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className="text-6xl">{info.icon}</div>
          <h2 className="text-xl font-semibold text-white">{info.title}</h2>
          <p className="text-sm text-white/60 max-w-sm leading-relaxed">{info.desc}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <a
              href="mailto:support@collegeshub.org"
              className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-semibold transition-colors"
            >
              Contact Support
            </a>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors border border-white/10"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // ── Valid invite — account creation form ─────────────────────────────────
  return (
    <OnboardingShell
      collegeName={inviteData?.collegeName}
      title={`Set up your ${inviteData?.collegeName || 'College'} admin account`}
    >
      <p className="text-sm text-white/50 mb-6">
        You've been invited to manage <strong className="text-white/80">{inviteData?.collegeName}</strong> on Collegeshub.
        Create your secure admin account below.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Email (read-only, from invite) */}
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm cursor-not-allowed select-none">
            {inviteData?.email}
          </div>
          <p className="text-xs text-white/30 mt-1">This is the email address from your invitation and cannot be changed.</p>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="setup-name" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="setup-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={e => { setFullName(e.target.value); setFieldErrors(p => ({ ...p, fullName: '' })); }}
            placeholder="Your full name"
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white text-sm outline-none
              placeholder:text-white/25 transition-colors
              focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20
              ${fieldErrors.fullName ? 'border-red-500/70' : 'border-white/10'}`}
            aria-describedby={fieldErrors.fullName ? 'name-error' : undefined}
          />
          {fieldErrors.fullName && (
            <p id="name-error" className="text-xs text-red-400 mt-1">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="setup-password" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
            Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="setup-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
              placeholder="At least 8 characters"
              className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-xl text-white text-sm outline-none
                placeholder:text-white/25 transition-colors
                focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20
                ${fieldErrors.password ? 'border-red-500/70' : 'border-white/10'}`}
              aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength bar */}
          {password && (
            <div className="mt-2 flex items-center gap-2" aria-label={`Password strength: ${strength.label}`}>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i <= Math.ceil(strength.score * 4 / 5) ? strength.color : 'rgba(255,255,255,0.08)' }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}

          {fieldErrors.password ? (
            <p id="password-error" className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
          ) : (
            <p id="password-hint" className="text-xs text-white/30 mt-1">
              Use letters, numbers, and symbols for a stronger password.
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="setup-confirm" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
            Confirm Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="setup-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: '' })); }}
              placeholder="Repeat your password"
              className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-xl text-white text-sm outline-none
                placeholder:text-white/25 transition-colors
                focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20
                ${fieldErrors.confirmPassword ? 'border-red-500/70' : 'border-white/10'}`}
              aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p id="confirm-error" className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed
            text-white font-semibold text-sm transition-all duration-200 mt-2
            shadow-[0_4px_20px_rgba(10,77,148,0.4)] hover:shadow-[0_6px_24px_rgba(10,77,148,0.5)]"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating your account…
            </span>
          ) : (
            'Create Account & Continue'
          )}
        </button>
      </form>

      <p className="text-center text-xs text-white/30 mt-6">
        By creating an account you agree to the{' '}
        <Link href="/terms" className="text-brand-green hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy-policy" className="text-brand-green hover:underline">Privacy Policy</Link>.
      </p>
    </OnboardingShell>
  );
}

/**
 * Shared onboarding layout wrapper — no sidebar, centered card, mobile edge-to-edge.
 */
function OnboardingShell({ title, collegeName, children }) {
  return (
    <div className="min-h-screen bg-[#0b111e] flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0A4D94] to-[#299A49] flex items-center justify-center text-white font-bold text-lg select-none">
          C
        </div>
        <span className="text-white font-bold text-lg tracking-tight">
          Collegeshub<span className="text-[#299A49]">.org</span>
        </span>
        {collegeName && (
          <>
            <span className="text-white/20 mx-1">·</span>
            <span className="text-sm text-white/50">{collegeName}</span>
          </>
        )}
      </header>

      {/* Card */}
      <main className="flex-1 flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-10">
        <div className="w-full sm:max-w-md bg-[#131c2e] sm:rounded-2xl border-0 sm:border border-white/8
          shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">1</div>
              <span className="text-xs text-white/60 hidden sm:inline">Create Account</span>
            </div>
            <div className="flex-1 h-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">2</div>
              <span className="text-xs text-white/30 hidden sm:inline">Verify Email</span>
            </div>
            <div className="flex-1 h-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">3</div>
              <span className="text-xs text-white/30 hidden sm:inline">Set Up College</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white mb-1 leading-tight">{title}</h1>

          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-white/25">
        © {new Date().getFullYear()} Collegeshub.org · All rights reserved
      </footer>
    </div>
  );
}
