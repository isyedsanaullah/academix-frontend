'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import axios from 'axios';
import { resolveParam } from '@/lib/paramUtils';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── CSS injected once ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fadeSlideIn  { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:none} }
  @keyframes fadeSlideBack{ from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:none} }
  @keyframes spinRing     { to{stroke-dashoffset:-440} }
  @keyframes floatDot     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes pulseBg      { 0%,100%{opacity:.06} 50%{opacity:.13} }
  @keyframes beamSweep    {
    0%  {transform:translateX(-200%) rotate(-25deg);opacity:0}
    15% {opacity:.06}
    85% {opacity:.06}
    100%{transform:translateX(200%) rotate(-25deg);opacity:0}
  }
  @keyframes googlePulse  { 0%,100%{box-shadow:0 0 0 0 rgba(66,133,244,.0)} 50%{box-shadow:0 0 0 8px rgba(66,133,244,.12)} }
  .step-in   { animation: fadeSlideIn   .3s ease both }
  .step-back { animation: fadeSlideBack .3s ease both }
  .spin-ring { animation: spinRing 1.4s linear infinite }
  .float-dot { animation: floatDot 3s ease-in-out infinite }
  .pulse-bg  { animation: pulseBg  5s ease-in-out infinite }
  .beam      { animation: beamSweep 10s ease-in-out infinite }
  .google-pulse { animation: googlePulse 2s ease-in-out infinite }
`;

// Step labels — 3 steps now (no OTP/verify: Google already verifies email)
const STEPS = ['Your Name', 'Sign in with Google', 'Complete'];

// ─── Main component ───────────────────────────────────────────────────────────
export default function SetupClient({ token: rawToken }) {
  const router = useRouter();
  const token  = resolveParam(rawToken, 'setup');

  // Invite state
  const [inviteState, setInviteState] = useState('loading');
  const [inviteData,  setInviteData]  = useState(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [errors,   setErrors]   = useState({});

  // Wizard
  const [step,       setStep]       = useState(1);
  const [dir,        setDir]        = useState('fwd');
  const [submitting, setSubmitting] = useState(false);

  // Google sign-in state
  const [googleUser,   setGoogleUser]   = useState(null); // { displayName, email, photoURL }
  const [googleError,  setGoogleError]  = useState('');

  // Auth token lives in ref (persists across re-renders; also written to localStorage)
  const authTokenRef = useRef(null);

  // ── Validate invite ─────────────────────────────────────────────────────
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
        setInviteState(err.response?.data?.reason || 'invalid');
      }
    })();
  }, [token]);

  // ── Navigation ──────────────────────────────────────────────────────────
  function goTo(n) {
    setDir(n > step ? 'fwd' : 'back');
    setStep(n);
  }

  // ── Step 1: Name validation ─────────────────────────────────────────────
  function handleStep1() {
    const e = {};
    if (!fullName.trim() || fullName.trim().length < 2)
      e.fullName = 'Full name must be at least 2 characters.';
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    goTo(2);
  }

  // ── Step 2: Google sign-in → create account ─────────────────────────────
  async function handleGoogleSignIn() {
    if (submitting) return;
    if (!auth || !googleProvider) {
      setGoogleError('Google sign-in is not configured. Please contact support.');
      return;
    }
    setGoogleError('');
    setSubmitting(true);
    try {
      // Sign out any previous Google session first to allow account picker
      try { await signOut(auth); } catch {}

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Store Google user info for display
      setGoogleUser({
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      });

      // Call backend: accept invite with Google token
      const res = await axios.post(`${API}/public/invites/${token}/accept-google`, {
        idToken,
        fullName: fullName.trim(),
      });

      const data      = res.data.data;
      const authToken = data.token;
      authTokenRef.current = authToken;
      localStorage.setItem('academix_token', authToken);
      localStorage.setItem('academix_user',  JSON.stringify(data));

      goTo(3);
      // Redirect to onboarding after brief success screen
      setTimeout(() => router.push('/onboarding'), 2000);

    } catch (err) {
      // Firebase popup errors
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setGoogleError('Sign-in cancelled. Click the button to try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setGoogleError('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setGoogleError('Network error. Please check your connection and try again.');
      } else {
        // Backend API errors
        const reason = err.response?.data?.reason;
        const msg    = err.response?.data?.message || 'Something went wrong. Please try again.';
        if (reason === 'used') {
          setInviteState('used');
        } else {
          setGoogleError(msg);
        }
      }
      setGoogleUser(null);
    } finally {
      setSubmitting(false);
    }
  }

  // ── STATE: loading ───────────────────────────────────────────────────────
  if (inviteState === 'loading') return (
    <Shell>
      <div className="flex flex-col items-center justify-center gap-5 h-full min-h-[300px]">
        <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="26" stroke="#0A4D94" strokeWidth="5" strokeDasharray="88 76" strokeLinecap="round" className="spin-ring"/>
          <circle cx="32" cy="32" r="14" stroke="#289A49" strokeWidth="3.5" strokeDasharray="44 44" strokeLinecap="round" style={{animationDirection:'reverse'}} className="spin-ring"/>
        </svg>
        <p className="text-white/50 text-sm tracking-wide">Verifying your invitation…</p>
      </div>
    </Shell>
  );

  // ── STATE: invalid / expired / used / revoked ────────────────────────────
  if (inviteState !== 'valid') {
    const MAP = {
      expired: { color:'#f59e0b', title:'Invitation Expired',  desc:'This invite link has expired. Ask your CollegesHub contact to resend a new one.' },
      used:    { color:'#289A49', title:'Already Activated',   desc:'This invite was already used to create an account. Head to the login page to sign in.' },
      revoked: { color:'#ef4444', title:'Invitation Revoked',  desc:'This invite has been revoked. Contact CollegesHub support for a new one.' },
      invalid: { color:'#94a3b8', title:'Invalid Invitation',  desc:'This link is invalid or does not exist. Check the link in your email.' },
    };
    const info = MAP[inviteState] || MAP.invalid;
    const iconPath = {
      expired: 'M28 16v14l8 6',
      used:    'M18 28l8 8 14-16',
      revoked: 'M20 20l16 16M36 20L20 36',
      invalid: 'M28 20v12M28 36v2',
    }[inviteState] || 'M28 20v12M28 36v2';

    return (
      <Shell>
        <div className="flex flex-col items-center gap-6 py-6 text-center h-full justify-center">
          <div style={{filter:`drop-shadow(0 0 20px ${info.color}55)`}}>
            <svg width="64" height="64" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="26" stroke={info.color} strokeWidth="2.5"/>
              <path d={iconPath} stroke={info.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{info.title}</h2>
            <p className="text-sm text-white/50 max-w-xs mx-auto leading-relaxed">{info.desc}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="mailto:support@collegeshub.org"
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{background:'linear-gradient(135deg,#1565C0,#0A4D94)',boxShadow:'0 4px 16px rgba(10,77,148,0.4)'}}>
              Contact Support
            </a>
            <Link href="/login"
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium border border-white/10 transition-all">
              Go to Login
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ── STATE: Step 3 success ────────────────────────────────────────────────
  if (step === 3) return (
    <Shell>
      <div className="flex flex-col items-center gap-6 py-8 text-center step-in h-full justify-center">
        <div style={{filter:'drop-shadow(0 0 24px #289A4966)'}}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#289A49" strokeWidth="2.5"/>
            <path d="M24 40l12 12 22-24" stroke="#289A49" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-sm text-white/50">Account created. Opening your workspace…</p>
        </div>
        {googleUser?.photoURL && (
          <img src={googleUser.photoURL} alt="" className="w-12 h-12 rounded-full ring-2 ring-green-500/40"/>
        )}
        <div className="flex gap-2 mt-2">
          {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{animationDelay:`${i*.15}s`}}/>)}
        </div>
      </div>
    </Shell>
  );

  // ── WIZARD ───────────────────────────────────────────────────────────────
  const animClass = dir === 'fwd' ? 'step-in' : 'step-back';

  return (
    <Shell collegeName={inviteData?.collegeName} step={step}>

      {/* ── Step 1: Name ── */}
      {step === 1 && (
        <div className={`flex flex-col h-full ${animClass}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-semibold self-start"
            style={{background:'rgba(40,154,73,.12)',border:'1px solid rgba(40,154,73,.25)',color:'#4ade80'}}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
            Invitation Valid
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">Welcome aboard!</h1>
          <p className="text-white/45 mb-8 leading-relaxed">
            You've been invited to manage{' '}
            <strong className="text-white/75">{inviteData?.collegeName}</strong>{' '}
            on CollegesHub. Let's start with your name.
          </p>

          {/* Email locked */}
          <div className="mb-6">
            <Label>Email Address</Label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/35 text-sm select-none"
              style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
              <span className="truncate flex-1">{inviteData?.email}</span>
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full"
                style={{background:'rgba(40,154,73,.15)',color:'#4ade80',border:'1px solid rgba(40,154,73,.2)'}}>
                Admin Invite
              </span>
            </div>
          </div>

          <div className="mb-8">
            <Label required>Full Name</Label>
            <TextInput
              id="setup-name" autoFocus
              value={fullName}
              onChange={e => { setFullName(e.target.value); setErrors(p=>({...p,fullName:''})); }}
              placeholder="Your full legal name"
              autoComplete="name"
              error={errors.fullName}
              onKeyDown={e => e.key === 'Enter' && handleStep1()}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>}
            />
            {errors.fullName && <ErrMsg>{errors.fullName}</ErrMsg>}
          </div>

          <div className="mt-auto">
            <PrimaryBtn onClick={handleStep1}>Continue</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── Step 2: Google Sign-In ── */}
      {step === 2 && (
        <div className={`flex flex-col h-full ${animClass}`}>
          <BackBtn onClick={() => goTo(1)}/>

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Sign in with Google</h1>
          <p className="text-white/45 mb-8 leading-relaxed">
            Use any Google account to securely verify your identity. Your account email will stay{' '}
            <strong className="text-white/70">{inviteData?.email}</strong>.
          </p>

          {/* Google account info pill (after sign-in attempt) */}
          {googleUser && !googleError && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-6"
              style={{background:'rgba(40,154,73,.08)',border:'1px solid rgba(40,154,73,.2)'}}>
              {googleUser.photoURL
                ? <img src={googleUser.photoURL} alt="" className="w-9 h-9 rounded-full shrink-0"/>
                : <div className="w-9 h-9 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0 text-sm font-bold text-white">
                    {(googleUser.displayName||'G')[0]}
                  </div>
              }
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{googleUser.displayName}</p>
                <p className="text-xs text-white/40 truncate">{googleUser.email}</p>
              </div>
              <svg className="shrink-0 w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
              </svg>
            </div>
          )}

          {/* Google error */}
          {googleError && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-6"
              style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)'}}>
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm text-red-400">{googleError}</p>
            </div>
          )}

          {/* Main Google button */}
          <div className="mt-auto flex flex-col gap-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm text-gray-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: submitting ? '#e8eaed' : 'white',
                boxShadow: submitting ? 'none' : '0 2px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="text-gray-500">Connecting…</span>
                </>
              ) : (
                <>
                  {/* Google "G" SVG logo */}
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Info note */}
            <div className="flex items-start gap-2 text-[11px] text-white/30 leading-relaxed">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
              </svg>
              You can use any Google account — it doesn't have to match the invited email.
              Your CollegesHub account email will remain <strong className="text-white/40">{inviteData?.email}</strong>.
            </div>

            <p className="text-center text-[11px] text-white/20">
              By continuing you agree to our{' '}
              <Link href="/terms" className="text-[#289A49] hover:underline">Terms</Link>{' '}and{' '}
              <Link href="/privacy-policy" className="text-[#289A49] hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ─── Micro-components ────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}
function ErrMsg({ children }) {
  return (
    <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 8.5a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.25a.75.75 0 01-1.5 0v-2a.75.75 0 011.5 0v2z"/>
      </svg>
      {children}
    </p>
  );
}
function FieldIcon({ children }) {
  return <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">{children}</div>;
}
function TextInput({ id, autoFocus, value, onChange, placeholder, autoComplete, error, onKeyDown, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {icon && <FieldIcon>{icon}</FieldIcon>}
      <input id={id} type="text" autoFocus={autoFocus}
        value={value} onChange={onChange} placeholder={placeholder}
        autoComplete={autoComplete} onKeyDown={onKeyDown}
        className="w-full py-3 rounded-xl text-white text-sm outline-none transition-all placeholder:text-white/20"
        style={{
          paddingLeft: icon ? '2.75rem' : '1rem',
          paddingRight: '1rem',
          background: 'rgba(255,255,255,.04)',
          border: `1px solid ${error ? '#ef4444' : focused ? 'rgba(10,77,148,.8)' : 'rgba(255,255,255,.1)'}`,
        }}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      />
    </div>
  );
}
function PrimaryBtn({ children, onClick, loading, disabled, type='button' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading||disabled}
      className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
      style={{background:'linear-gradient(135deg,#1565C0 0%,#0A4D94 50%,#063b75 100%)',boxShadow:'0 4px 24px rgba(10,77,148,.5)'}}>
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"/>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {children}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {children}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12"/>
          </svg>
        </span>
      )}
    </button>
  );
}
function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 mb-6 group transition-colors">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="group-hover:-translate-x-0.5 transition-transform">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5 5-5M18 12H6"/>
      </svg>
      Back
    </button>
  );
}

// ─── Step bar ─────────────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, idx) => {
        const n = idx + 1;
        const active = n === step, done = n < step;
        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                style={{
                  background: active ? 'linear-gradient(135deg,#1565C0,#0A4D94)' : done ? '#289A49' : 'rgba(255,255,255,.07)',
                  color: (active||done) ? 'white' : 'rgba(255,255,255,.3)',
                  boxShadow: active ? '0 0 0 4px rgba(10,77,148,.3)' : 'none',
                }}>
                {done
                  ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                  : n}
              </div>
              <span className="text-[9px] font-medium hidden sm:block text-center max-w-[56px] leading-tight"
                style={{color: active?'rgba(255,255,255,.75)':'rgba(255,255,255,.25)'}}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 mx-2 mb-4">
                <div className="h-px w-full transition-all duration-700"
                  style={{background: done ? '#289A49' : 'rgba(255,255,255,.08)'}}/>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Full-page shell ──────────────────────────────────────────────────────────
function Shell({ collegeName, step, children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{background:'#080f1d'}}>
      <style>{GLOBAL_CSS}</style>

      {/* Subtle full-page animated BG (desktop) */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="rg1" cx="15%" cy="50%" r="45%">
              <stop offset="0%" stopColor="#0A4D94" stopOpacity=".16"/>
              <stop offset="100%" stopColor="#0A4D94" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="rg2" cx="80%" cy="30%" r="40%">
              <stop offset="0%" stopColor="#289A49" stopOpacity=".10"/>
              <stop offset="100%" stopColor="#289A49" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#rg1)"/>
          <rect width="100%" height="100%" fill="url(#rg2)"/>
          {[160,260,360,460].map((r,i)=>(
            <circle key={i} cx="260" cy="450" r={r}
              fill="none" stroke="#0A4D94" strokeWidth="1" opacity=".07"
              className="pulse-bg" style={{animationDelay:`${i*1.4}s`}}/>
          ))}
          {Array.from({length:8}).map((_,row)=>
            Array.from({length:6}).map((_,col)=>(
              <circle key={`${row}-${col}`}
                cx={col*100+50} cy={row*110+60} r="2" fill="#0A4D94" opacity=".15"
                className="float-dot" style={{animationDelay:`${(row+col)*.4}s`}}/>
            ))
          )}
          <rect x="-100" y="0" width="200" height="900" fill="white" opacity=".025"
            className="beam" style={{transformOrigin:'center'}}/>
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 lg:px-12 py-5 flex items-center justify-between shrink-0"
        style={{borderBottom:'1px solid rgba(255,255,255,.05)',backdropFilter:'blur(10px)',background:'rgba(8,15,29,.85)'}}>
        <img src="/logo-horizontal.svg" alt="CollegesHub" className="h-7"/>
        {collegeName && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/>
            </svg>
            <span className="font-medium text-white/55">{collegeName}</span>
          </div>
        )}
      </header>

      {/* Main: two-column on desktop, single on mobile */}
      <main className="relative z-10 flex-1 flex">
        {/* Left: branding column (desktop only) */}
        <div className="hidden lg:flex flex-col justify-center px-16 xl:px-20 py-12 w-[420px] xl:w-[460px] shrink-0"
          style={{borderRight:'1px solid rgba(255,255,255,.05)'}}>
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{background:'linear-gradient(135deg,#0A4D94,#063b75)',boxShadow:'0 8px 32px rgba(10,77,148,.4)'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" opacity=".9">
                <path d="M12 3L1 9l4 2.18V15l7 4 7-4v-3.82L23 9 12 3zm0 2.27L19.5 9 12 12.72 4.5 9 12 5.27zM5 13.18v2.82l7 4 7-4v-2.82L12 16l-7-2.82z"/>
              </svg>
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold text-white leading-tight mb-3">
              Setting up<br/>
              <span style={{background:'linear-gradient(120deg,#4d8fd6,#289A49)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                your campus
              </span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed">
              The complete college management platform — attendance, results, admissions, AI tools and more.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mb-10">
            {[
              ['🎓','Student & Faculty Management'],
              ['📊','Real-time Analytics Dashboard'],
              ['🔒','Enterprise-grade Security'],
              ['🤖','Built-in AI Tools'],
              ['🌐','Your Own College Subdomain'],
            ].map(([icon,label])=>(
              <div key={label} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <span className="text-sm text-white/45">{label}</span>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-6"
            style={{borderTop:'1px solid rgba(255,255,255,.06)'}}>
            {[['500+','Institutions'],['99.9%','Uptime'],['24/7','Support']].map(([n,l])=>(
              <div key={l} className="text-center">
                <div className="text-base font-bold" style={{color:'#289A49'}}>{n}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: full-height form area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 xl:px-20 py-10">
            <div className="w-full max-w-lg">
              {step && step < 3 && <StepBar step={step}/>}
              {/* SSL badge */}
              <div className="flex items-center gap-1.5 mb-6 text-[11px] text-white/25">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
                256-bit SSL encrypted
              </div>
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="px-6 py-4 flex items-center justify-between text-[11px] text-white/20 shrink-0"
            style={{borderTop:'1px solid rgba(255,255,255,.04)'}}>
            <span>© {new Date().getFullYear()} CollegesHub.org</span>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-white/40 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/40 transition-colors">Terms</Link>
              <a href="mailto:support@collegeshub.org" className="hover:text-white/40 transition-colors">Support</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
