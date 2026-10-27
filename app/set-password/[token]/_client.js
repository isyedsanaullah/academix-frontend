'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function SetPasswordClient({ token }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setErrorStatus('Missing invitation token.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function checkToken() {
      try {
        const res = await axios.get(`${API}/public/set-password/${token}`);
        if (isMounted) {
          if (res.data?.success && res.data?.valid) {
            setInviteData(res.data.data);
          } else {
            setErrorStatus(res.data?.error || 'Invitation is invalid or has expired.');
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid or expired invitation link.';
          setErrorStatus(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Validation rules
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isValid = hasMinLength && passwordsMatch;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!hasMinLength) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/public/set-password/${token}`, {
        password
      });

      toast.success(res.data?.message || 'Password set successfully! Redirecting to login...');
      setTimeout(() => {
        router.push(res.data?.redirectUrl || '/login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to set password. Please try again.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b111e] flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0A4D94] to-[#299A49] flex items-center justify-center text-white font-bold text-lg select-none">
            C
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Collegeshub<span className="text-[#299A49]">.org</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Sign In
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#131c2e] rounded-2xl border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <svg className="w-10 h-10 animate-spin text-brand-blue mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h2 className="text-white font-semibold text-lg">Validating invitation...</h2>
              <p className="text-white/40 text-sm mt-1">Please wait a moment while we verify your secure link.</p>
            </div>
          ) : errorStatus ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Invitation Expired or Invalid</h1>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                {errorStatus}
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-xs text-white/50 mb-6">
                <span className="font-semibold text-white/70 block mb-1">What can I do?</span>
                Invitation links expire after 3 days or can only be used once. Please reach out to your college administrator to request a new invitation.
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div>
              {/* Active Invitation Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#299A49]/10 border border-[#299A49]/20 text-[#299A49] text-xs font-semibold uppercase tracking-wider mb-3">
                  Staff Invitation
                </div>
                <h1 className="text-2xl font-bold text-white mb-1.5">Set Your Password</h1>
                <p className="text-white/50 text-sm">
                  Welcome to <strong className="text-white">{inviteData?.college_name || 'Collegeshub'}</strong>! Set up your account password to get started.
                </p>
              </div>

              {/* User Info Capsule */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">{inviteData?.name}</div>
                  <div className="text-white/40 text-xs">{inviteData?.email}</div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-blue/20 text-brand-blue capitalize border border-brand-blue/30">
                  {inviteData?.role}
                </span>
              </div>

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div className="space-y-1.5 py-1">
                  <div className={`flex items-center gap-2 text-xs transition-colors ${hasMinLength ? 'text-[#299A49]' : 'text-white/40'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      {hasMinLength ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      ) : (
                        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth={2} />
                      )}
                    </svg>
                    <span>At least 8 characters long</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs transition-colors ${passwordsMatch ? 'text-[#299A49]' : 'text-white/40'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      {passwordsMatch ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      ) : (
                        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth={2} />
                      )}
                    </svg>
                    <span>Passwords match</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="w-full mt-2 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-[0_4px_20px_rgba(10,77,148,0.4)] flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Setting Password...
                    </>
                  ) : (
                    'Set Password & Complete Setup'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-white/25">
        © {new Date().getFullYear()} Collegeshub.org · All rights reserved
      </footer>
    </div>
  );
}
