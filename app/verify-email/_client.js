'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const RESEND_COOLDOWN_SECS = 60;

/** Get auth token from localStorage */
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('academix_token');
}

/** Authed axios call */
function authAxios() {
  const token = getToken();
  return axios.create({
    baseURL: API,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

export default function VerifyEmailClient() {
  const router = useRouter();

  // 6 individual digit boxes
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);     // seconds remaining
  const [errorMsg, setErrorMsg] = useState('');
  const [locked, setLocked] = useState(false);     // true after rate limit lockout

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Redirect to login if no token
  useEffect(() => {
    if (!getToken()) { router.replace('/login'); }
  }, [router]);

  // Focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Digit input handlers ──────────────────────────────────────────────────
  function handleDigitChange(index, value) {
    // Allow only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setErrorMsg('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const fullCode = [...next].join('');
      if (fullCode.length === 6) submitCode(fullCode);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    setErrorMsg('');
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();

    if (pasted.length === 6) submitCode(pasted);
  }

  // ── Submit code ───────────────────────────────────────────────────────────
  const submitCode = useCallback(async (code) => {
    if (submitting || locked) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await authAxios().post('/auth/verify-email', { code });
      toast.success('Email verified! Setting up your workspace...');

      // Update cached user
      try {
        const stored = JSON.parse(localStorage.getItem('academix_user') || '{}');
        stored.emailVerified = true;
        localStorage.setItem('academix_user', JSON.stringify(stored));
      } catch { /* ignore */ }

      router.push('/onboarding');
    } catch (err) {
      const data = err.response?.data || {};
      const errCode = data.code;

      if (errCode === 'WRONG_CODE') {
        setErrorMsg('That code is incorrect. Please check your email and try again.');
        // Shake and clear
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else if (errCode === 'CODE_EXPIRED') {
        setErrorMsg('Your code has expired. Click "Resend" below to get a new one.');
        setDigits(['', '', '', '', '', '']);
      } else if (errCode === 'NO_CODE') {
        setErrorMsg('No code found. Please request a new code below.');
      } else if (err.response?.status === 429) {
        setLocked(true);
        setErrorMsg('Too many attempts. Please wait before trying again.');
      } else {
        setErrorMsg(data.message || 'Verification failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, locked, router]);

  function handleFormSubmit(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) { setErrorMsg('Please enter all 6 digits.'); return; }
    submitCode(code);
  }

  // ── Resend code ───────────────────────────────────────────────────────────
  async function handleResend() {
    if (resending || cooldown > 0 || locked) return;
    setResending(true);
    setErrorMsg('');

    try {
      await authAxios().post('/auth/resend-verification');
      toast.success('A new verification code has been sent!');
      setCooldown(RESEND_COOLDOWN_SECS);
      setLocked(false);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      const data = err.response?.data || {};
      if (data.code === 'COOLDOWN') {
        setCooldown(data.waitSeconds || RESEND_COOLDOWN_SECS);
        setErrorMsg(`Please wait ${data.waitSeconds || 60} seconds before requesting a new code.`);
      } else if (data.code === 'RATE_LIMITED') {
        setLocked(true);
        setErrorMsg('Too many resend requests. Please try again in an hour.');
      } else {
        setErrorMsg(data.message || 'Failed to resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const codeComplete = digits.every(d => d !== '');

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
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-10">
        <div className="w-full sm:max-w-md bg-[#131c2e] sm:rounded-2xl border-0 sm:border border-white/8
          shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#299A49]/30 border border-[#299A49]/50 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#299A49]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs text-white/30 hidden sm:inline line-through">Create Account</span>
            </div>
            <div className="flex-1 h-px bg-brand-blue/40" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">2</div>
              <span className="text-xs text-white/60 hidden sm:inline">Verify Email</span>
            </div>
            <div className="flex-1 h-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">3</div>
              <span className="text-xs text-white/30 hidden sm:inline">Set Up College</span>
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white text-center mb-1">Check your email</h1>
          <p className="text-sm text-white/50 text-center mb-7 leading-relaxed">
            We sent a 6-digit verification code to your email address. Enter it below to continue.
          </p>

          <form onSubmit={handleFormSubmit} noValidate>
            {/* 6-box code input */}
            <div
              className="flex gap-2 sm:gap-3 justify-center mb-6"
              onPaste={handlePaste}
              aria-label="Verification code input"
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => (inputRefs.current[i] = el)}
                  id={`code-digit-${i}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={submitting || locked}
                  aria-label={`Digit ${i + 1} of 6`}
                  className={`
                    w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl border-2
                    bg-white/5 text-white outline-none transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errorMsg ? 'border-red-500/60 bg-red-500/5' : ''}
                    ${!errorMsg && digit ? 'border-brand-blue bg-brand-blue/10' : ''}
                    ${!errorMsg && !digit ? 'border-white/15 focus:border-brand-blue focus:bg-brand-blue/5' : ''}
                    focus:ring-2 focus:ring-brand-blue/20
                  `}
                />
              ))}
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-400 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || locked || !codeComplete}
              className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white font-semibold text-sm transition-all duration-200
                shadow-[0_4px_20px_rgba(10,77,148,0.4)] hover:shadow-[0_6px_24px_rgba(10,77,148,0.5)]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verifying…
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          {/* Resend section */}
          <div className="flex items-center justify-center gap-2 mt-5 text-sm">
            <span className="text-white/40">Didn't receive the code?</span>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0 || locked}
              className="text-[#299A49] font-semibold hover:text-[#3DBE63] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label={cooldown > 0 ? `Resend available in ${cooldown} seconds` : 'Resend verification code'}
            >
              {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>

          <p className="text-center text-xs text-white/25 mt-5">
            Codes expire after 15 minutes. Maximum 5 codes per hour.
          </p>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-white/25">
        © {new Date().getFullYear()} Collegeshub.org · All rights reserved
      </footer>
    </div>
  );
}
