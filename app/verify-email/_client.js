'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('academix_token');
}
function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('academix_user') || '{}');
    // Handle both shapes: { email, ... } and { data: { email, ... } }
    return raw?.data || raw;
  } catch { return {}; }
}
function authed() {
  const tok = getToken();
  return axios.create({
    baseURL: API,
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
  });
}

// ─── Animated background (desktop only) ──────────────────────────────────────
function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes pulseRingV { 0%,100%{transform:scale(1);opacity:0.06;}50%{transform:scale(1.08);opacity:0.12;} }
        @keyframes shimmerPathV { 0%{stroke-dashoffset:800;}100%{stroke-dashoffset:0;} }
        @keyframes beamMoveV {
          0%{transform:translateX(-60%) translateY(10%) rotate(-30deg);opacity:0;}
          20%{opacity:0.07;}80%{opacity:0.07;}
          100%{transform:translateX(60%) translateY(-10%) rotate(-30deg);opacity:0;}
        }
        @keyframes dotPulseV { 0%,100%{r:2;opacity:0.3;}50%{r:4;opacity:0.8;} }
        .vpr { animation: pulseRingV 6s ease-in-out infinite; }
        .vsp { animation: shimmerPathV 4s linear infinite; }
        .vbm { animation: beamMoveV 12s ease-in-out infinite; }
        .vdp { animation: dotPulseV 3s ease-in-out infinite; }
      `}</style>
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden z-0">
        <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="vgA" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#0A4D94" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="vgB" cx="80%" cy="30%" r="40%">
              <stop offset="0%" stopColor="#289A49" stopOpacity="0.10"/>
              <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#vgA)"/>
          <rect width="100%" height="100%" fill="url(#vgB)"/>
          {[160,260,360].map((r,i) => (
            <circle key={i} cx="720" cy="450" r={r}
              fill="none" stroke="#0A4D94" strokeWidth="1" opacity="0.07"
              className="vpr" style={{ animationDelay:`${i*1.5}s` }}/>
          ))}
          {Array.from({length:10}).map((_,row) =>
            Array.from({length:14}).map((_,col) => (
              <circle key={`${row}-${col}`}
                cx={col*110+30} cy={row*90+30} r="2"
                fill="#0A4D94" opacity="0.15" className="vdp"
                style={{ animationDelay:`${(row+col)*0.25}s` }}/>
            ))
          )}
          <rect x="-200" y="0" width="280" height="900" fill="white" opacity="0.02"
            className="vbm" style={{ transformOrigin:'center center' }}/>
          <path d="M0,450 Q360,200 720,450 Q1080,700 1440,450"
            fill="none" stroke="#0A4D94" strokeWidth="1.5"
            strokeDasharray="600 1200" opacity="0.09"
            className="vsp" style={{ animationDuration:'10s' }}/>
        </svg>
      </div>
    </>
  );
}

// ─── Logomark ────────────────────────────────────────────────────────────────
function LogoMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" fill="none">
      <defs>
        <linearGradient id="vlgB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1565C0"/><stop offset="100%" stopColor="#0A4D94"/>
        </linearGradient>
        <linearGradient id="vlgG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E7D32"/><stop offset="100%" stopColor="#289A49"/>
        </linearGradient>
      </defs>
      <path d="M110 20 C155 20 192 55 196 100 C200 148 165 185 118 190 C70 195 30 160 26 113 C22 64 58 25 110 20Z"
        fill="none" stroke="url(#vlgB)" strokeWidth="18" strokeLinecap="round" strokeDasharray="360 60"/>
      <rect x="72" y="68" width="20" height="84" rx="4" fill="url(#vlgG)"/>
      <rect x="128" y="68" width="20" height="84" rx="4" fill="url(#vlgG)"/>
      <rect x="72" y="100" width="76" height="20" rx="4" fill="url(#vlgG)"/>
      <polygon points="110,52 148,72 110,88 72,72" fill="url(#vlgB)" opacity="0.9"/>
      <rect x="148" y="72" width="3" height="24" rx="1.5" fill="url(#vlgB)" opacity="0.8"/>
      <circle cx="149.5" cy="98" r="5" fill="url(#vlgG)"/>
    </svg>
  );
}

// ─── Step bar ────────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Create Account', 'Verify Email', 'Set Up College'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const active = num === step;
        const done   = num < step;
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                style={{
                  background: active ? 'linear-gradient(135deg,#1565C0,#0A4D94)' : done ? '#289A49' : 'rgba(255,255,255,0.06)',
                  color: (active || done) ? 'white' : 'rgba(255,255,255,0.3)',
                  boxShadow: active ? '0 0 0 4px rgba(10,77,148,0.25)' : 'none',
                }}>
                {done
                  ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                  : num}
              </div>
              <span className="text-[9px] font-medium hidden sm:block leading-tight text-center max-w-[60px]"
                style={{ color: active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)' }}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-2 mb-4">
                <div className="h-px w-full transition-all duration-700"
                  style={{ background: done ? '#289A49' : 'rgba(255,255,255,0.08)' }}/>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VerifyEmailClient() {
  const router = useRouter();
  const user   = typeof window !== 'undefined' ? getUser() : {};

  const [digits,      setDigits]      = useState(['','','','','','']);
  const inputRefs = useRef([]);

  const [verifying,   setVerifying]   = useState(false);
  const [resending,   setResending]   = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [cooldown,    setCooldown]    = useState(0);
  const [rateLocked,  setRateLocked]  = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [success,     setSuccess]     = useState(false);

  // Redirect if no token
  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  // Focus first box
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // ── Digit handlers ─────────────────────────────────────────────────────
  function handleDigitChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    setErrorMsg('');
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && index === 5 && next.join('').length === 6) submitCode(next.join(''));
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits]; next[index - 1] = ''; setDigits(next);
      }
    } else if (e.key === 'ArrowLeft'  && index > 0) inputRefs.current[index - 1]?.focus();
    else if  (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
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

  // ── Submit OTP ─────────────────────────────────────────────────────────
  const submitCode = useCallback(async (code) => {
    if (verifying || rateLocked) return;
    setVerifying(true);
    setErrorMsg('');
    try {
      await authed().post('/auth/verify-email', { code });
      try {
        const stored = JSON.parse(localStorage.getItem('academix_user') || '{}');
        stored.emailVerified = true;
        localStorage.setItem('academix_user', JSON.stringify(stored));
      } catch {}
      setSuccess(true);
      toast.success('Email verified! Setting up your workspace…');
      setTimeout(() => router.push('/onboarding'), 1600);
    } catch (err) {
      const data    = err.response?.data || {};
      const errCode = data.code;
      if (errCode === 'WRONG_CODE') {
        setErrorMsg('Incorrect code. Please check your email and try again.');
        setDigits(['','','','','','']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else if (errCode === 'CODE_EXPIRED') {
        setErrorMsg('Your code has expired. Click "Resend" below to get a new one.');
        setDigits(['','','','','','']);
      } else if (errCode === 'NO_CODE') {
        setErrorMsg('No active code found. Please request a new code below.');
      } else if (err.response?.status === 401) {
        setErrorMsg('Session expired. Please log in again.');
      } else if (err.response?.status === 429) {
        setRateLocked(true);
        setErrorMsg('Too many attempts. Please wait before trying again.');
      } else {
        setErrorMsg(data.message || 'Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  }, [verifying, rateLocked, router]);

  function handleFormSubmit(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) { setErrorMsg('Please enter all 6 digits.'); return; }
    submitCode(code);
  }

  // ── Resend with exponential cooldown ───────────────────────────────────
  async function handleResend() {
    if (resending || cooldown > 0 || rateLocked) return;
    setResending(true);
    setErrorMsg('');
    try {
      await authed().post('/auth/resend-verification');
      const newCount = resendCount + 1;
      setResendCount(newCount);
      // 30s → 60s → 120s → 240s → max 600s
      const nextCooldown = Math.min(30 * Math.pow(2, newCount - 1), 600);
      setCooldown(nextCooldown);
      setRateLocked(false);
      setDigits(['','','','','','']);
      toast.success('New verification code sent!');
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      const data = err.response?.data || {};
      if (data.code === 'COOLDOWN') {
        setCooldown(data.waitSeconds || 60);
        setErrorMsg('Please wait before requesting another code.');
      } else if (data.code === 'RATE_LIMITED') {
        setRateLocked(true);
        setErrorMsg('Too many resend requests. Please try again in an hour.');
      } else if (err.response?.status === 401) {
        setErrorMsg('Session expired. Please log in again.');
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        setErrorMsg(data.message || 'Failed to resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  }

  const codeComplete = digits.every(d => d !== '');
  const maxCooldown  = resendCount > 0 ? Math.min(30 * Math.pow(2, resendCount - 1), 600) : 30;
  const cooldownPct  = cooldown > 0 ? (cooldown / maxCooldown) * 100 : 0;

  // ── Success overlay ────────────────────────────────────────────────────
  if (success) {
    return (
      <PageShell>
        <StepBar step={2}/>
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <div style={{ filter:'drop-shadow(0 0 20px #289A4966)' }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" stroke="#289A49" strokeWidth="2.5"/>
              <path d="M22 36l10 10 20-20" stroke="#289A49" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-sm text-white/50">Setting up your workspace…</p>
          </div>
          <div className="flex gap-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-bounce"
                style={{ animationDelay:`${i*0.15}s` }}/>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <StepBar step={2}/>

      {/* Back to login */}
      <button type="button" onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors mb-6 group">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="group-hover:-translate-x-0.5 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5 5-5M18 12H6"/>
        </svg>
        Back
      </button>

      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background:'rgba(10,77,148,0.12)', border:'1px solid rgba(10,77,148,0.25)' }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4d8fd6" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
          </svg>
        </div>
      </div>

      <h1 className="text-xl font-bold text-white text-center mb-1">Check your email</h1>
      <p className="text-sm text-white/45 text-center mb-7 leading-relaxed">
        We sent a 6-digit verification code to{' '}
        <span className="text-white/70 font-medium">{user?.email || 'your email'}</span>.
        Enter it below to continue.
      </p>

      <form onSubmit={handleFormSubmit} noValidate>
        {/* 6 digit inputs */}
        <div className="flex gap-2 sm:gap-3 justify-center mb-5" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={verifying || rateLocked || success}
              aria-label={`Digit ${i+1} of 6`}
              className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl border-2
                text-white outline-none transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: errorMsg
                  ? 'rgba(239,68,68,0.6)'
                  : digit
                    ? 'rgba(10,77,148,0.8)'
                    : 'rgba(255,255,255,0.12)',
                background: errorMsg
                  ? 'rgba(239,68,68,0.05)'
                  : digit
                    ? 'rgba(10,77,148,0.1)'
                    : 'rgba(255,255,255,0.04)',
              }}
            />
          ))}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-4"
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <p className="text-sm text-red-400 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Submit */}
        <button type="submit"
          disabled={verifying || rateLocked || !codeComplete}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
          style={{
            background:'linear-gradient(135deg, #1565C0 0%, #0A4D94 50%, #063b75 100%)',
            boxShadow:'0 4px 24px rgba(10,77,148,0.5)',
          }}>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"/>
          {verifying ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Verifying…
            </span>
          ) : 'Verify Email'}
        </button>
      </form>

      {/* Resend section */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-white/40">Didn't receive the code?</span>
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0 || rateLocked}
            className="font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: cooldown > 0 || resending ? 'rgba(255,255,255,0.3)' : '#289A49' }}
            aria-label={cooldown > 0 ? `Resend available in ${cooldown} seconds` : 'Resend verification code'}>
            {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>

        {/* Cooldown progress bar */}
        {cooldown > 0 && (
          <div className="mt-3 mx-auto max-w-[220px]">
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width:`${cooldownPct}%`, background:'rgba(40,154,73,0.6)' }}/>
            </div>
            {resendCount > 1 && (
              <p className="text-[10px] text-white/25 mt-1.5">
                Cooldown grows with each resend to prevent spam.
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] text-white/20 mt-3">
          Codes expire after 15 minutes · Max 5 codes per hour
        </p>
      </div>
    </PageShell>
  );
}

// ─── Page shell matching setup page design ───────────────────────────────────
function PageShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#080f1d' }}>
      <AnimatedBackground/>

      {/* Header */}
      <header className="relative z-10 w-full px-6 lg:px-10 py-5 flex items-center justify-between"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(8px)', background:'rgba(8,15,29,0.8)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo-horizontal.svg" alt="CollegesHub" className="h-7 hidden sm:block"
            onError={e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }}/>
          <div className="sm:hidden flex items-center gap-2">
            <LogoMark size={30}/>
            <span className="text-white font-bold text-base tracking-tight">
              Colleges<span style={{color:'#289A49'}}>Hub</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
          </svg>
          <span>256-bit SSL</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-6 sm:p-8"
            style={{
              background:'rgba(15,24,42,0.9)',
              border:'1px solid rgba(255,255,255,0.07)',
              boxShadow:'0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(10,77,148,0.1)',
              backdropFilter:'blur(16px)',
            }}>
            {children}
          </div>
          <p className="text-center text-[11px] text-white/20 mt-4">
            © {new Date().getFullYear()} CollegesHub.org ·{' '}
            <Link href="/privacy-policy" className="hover:text-white/40 transition-colors">Privacy</Link>
            {' '}·{' '}
            <Link href="/terms" className="hover:text-white/40 transition-colors">Terms</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
