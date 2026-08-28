'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ImageUploadField from '@/components/ImageUploadField';
import {
  HiOutlineAcademicCap, HiOutlineCheckCircle, HiOutlineOfficeBuilding,
  HiOutlineBookOpen, HiOutlineUserGroup, HiOutlineSparkles, HiArrowRight,
  HiArrowLeft, HiOutlinePlus, HiOutlineTrash, HiOutlineMail,
  HiOutlineExclamationCircle, HiOutlineGlobe, HiOutlinePhone,
  HiOutlineLocationMarker, HiOutlineIdentification, HiOutlineLink,
  HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineRefresh,
  HiOutlineBadgeCheck, HiOutlineChevronRight,
} from 'react-icons/hi';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, key: 'profile',  title: 'College Profile',  desc: 'Branding, contact & visuals',  icon: HiOutlineOfficeBuilding },
  { id: 2, key: 'academic', title: 'Academic Setup',   desc: 'Programs & admissions',        icon: HiOutlineBookOpen       },
  { id: 3, key: 'staff',    title: 'Staff Accounts',   desc: 'Team & roles — optional',      icon: HiOutlineUserGroup      },
  { id: 4, key: 'review',   title: 'Review & Publish', desc: 'Launch your workspace',        icon: HiOutlineSparkles       },
];

const PROVINCES = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'ICT'];
const STAFF_ROLES = ['registrar', 'accountant', 'principal', 'vice_principal', 'teacher', 'employee'];

// ─── Micro Components ─────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-indigo-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        {desc && <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function FormGroup({ label, required, helper, error, counter, maxLen, value, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-semibold text-white/50">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {maxLen && (
          <span className={`text-[10px] font-mono ${(value?.length || 0) > maxLen * 0.9 ? 'text-amber-400' : 'text-white/25'}`}>
            {value?.length || 0}/{maxLen}
          </span>
        )}
      </div>
      {children}
      {helper && !error && <p className="text-[11px] text-white/25 mt-1">{helper}</p>}
      {error  && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><HiOutlineExclamationCircle size={11} />{error}</p>}
    </div>
  );
}

function SocialInput({ icon, placeholder, value, onChange }) {
  return (
    <div className="relative">
      <HiOutlineLink className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
      <input
        type="url" value={value} onChange={onChange}
        placeholder={placeholder}
        className="input-field pl-8 text-xs"
      />
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <FormGroup label={label} required>
      <div className="relative">
        <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
        <input
          type={show ? 'text' : 'password'} value={value} onChange={onChange}
          placeholder={placeholder || 'Enter password'}
          className="input-field pl-8 pr-9 text-xs"
        />
        <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
          {show ? <HiOutlineEyeOff size={15} /> : <HiOutlineEye size={15} />}
        </button>
      </div>
    </FormGroup>
  );
}

// ─── Step Indicator Sidebar ───────────────────────────────────────────────────

function StepSidebar({ currentStep, onNavigate }) {
  return (
    <nav className="w-60 flex-shrink-0 hidden lg:flex flex-col gap-1.5 pt-2">
      {STEPS.map((s) => {
        const done    = currentStep > s.id;
        const active  = currentStep === s.id;
        const Icon    = s.icon;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => done && onNavigate(s.id)}
            disabled={!done && !active}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
              ${active  ? 'bg-indigo-500/12 border border-indigo-500/25' : ''}
              ${done    ? 'hover:bg-white/[0.03] cursor-pointer border border-transparent' : 'border border-transparent'}
              ${!done && !active ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            <div className={`
              w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all
              ${active ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-600/30' : done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.05] text-white/30'}
            `}>
              {done ? <HiOutlineCheckCircle size={15} /> : s.id}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-white/40'}`}>
                {s.title}
              </p>
              <p className="text-[10px] text-white/25 truncate mt-0.5">{s.desc}</p>
            </div>
            {done && <HiOutlineCheckCircle size={13} className="text-emerald-400 ml-auto flex-shrink-0" />}
          </button>
        );
      })}

      {/* Security note */}
      <div className="mt-6 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <p className="text-[10px] text-white/25 leading-relaxed">
          🔒 Your progress is automatically saved to the server after each step so you can resume from any device.
        </p>
      </div>
    </nav>
  );
}

// ─── Mobile stepper bar ───────────────────────────────────────────────────────

function MobileStepper({ currentStep }) {
  return (
    <div className="flex lg:hidden items-center gap-1 mb-6">
      {STEPS.map((s, i) => {
        const done   = currentStep > s.id;
        const active = currentStep === s.id;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold
              ${active ? 'bg-indigo-500 text-white' : done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-white/30'}
            `}>
              {done ? <HiOutlineCheckCircle size={12} /> : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 transition-all ${done ? 'bg-emerald-500/40' : 'bg-white/[0.07]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollegeOnboardingPage() {
  const router = useRouter();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentStep,   setCurrentStep]   = useState(1);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [hasUnsaved,    setHasUnsaved]    = useState(false);

  // ─── Step 1 state ─────────────────────────────────────────────────
  const [s1, setS1] = useState({
    name: '', code: '', tagline: '', about: '',
    logo: '', coverPhoto: '',
    address: '', city: '', province: '', country: 'Pakistan',
    phone: '', website: '', googleMap: '',
    socialLinks: { facebook: '', instagram: '', linkedin: '', twitter: '', youtube: '' },
  });

  // ─── Step 2 state ─────────────────────────────────────────────────
  const [s2, setS2] = useState({
    sessionTitle: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    admissionOpen: true,
    programs: [
      { name: 'FSc Pre-Medical',    description: 'Curriculum for aspiring medical professionals.' },
      { name: 'FSc Pre-Engineering',description: 'Mathematics and physical sciences for engineers.' },
      { name: 'ICS (Computer Science)', description: 'Software engineering, databases & algorithms.' },
    ],
  });

  // ─── Step 3 state ─────────────────────────────────────────────────
  const [staffList, setStaffList] = useState([]);
  const [newStaff,  setNewStaff]  = useState({ name: '', email: '', role: 'registrar', password: '' });

  // ─── Load server progress ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/colleges/onboarding/status');
        const data = await res.json();
        if (res.ok && data.data) {
          const c   = data.data;
          const cfg = c.settings || {};
          setCurrentStep(c.onboardingStep || 1);
          setS1({
            name:        c.name        || '',
            code:        c.code        || '',
            tagline:     cfg.tagline   || '',
            about:       cfg.about     || '',
            logo:        c.logo        || '',
            coverPhoto:  cfg.coverPhoto|| '',
            address:     c.address     || '',
            city:        c.city        || '',
            province:    cfg.province  || '',
            country:     cfg.country   || 'Pakistan',
            phone:       c.phone       || '',
            website:     c.website     || '',
            googleMap:   cfg.googleMap || '',
            socialLinks: cfg.socialLinks || { facebook: '', instagram: '', linkedin: '', twitter: '', youtube: '' },
          });
          if (cfg.programs?.length) setS2(prev => ({ ...prev, programs: cfg.programs }));
          if (c.onboardingStatus === 'completed') router.replace('/admin');
        }
      } catch { /* silent — user will start fresh */ }
      finally { setLoadingStatus(false); }
    })();
  }, [router]);

  // ─── Unsaved changes warning ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsaved) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  // ─── Field helpers ────────────────────────────────────────────────
  const setField = (field) => (e) => {
    setS1(prev => ({ ...prev, [field]: e.target.value }));
    setHasUnsaved(true);
  };
  const setSocial = (network) => (e) => {
    setS1(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [network]: e.target.value } }));
    setHasUnsaved(true);
  };

  // ─── Step 1 Validation ────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!s1.name.trim())              e.name = 'College name is required';
    if (!s1.code.trim())              e.code = 'Short code is required';
    if (s1.code.length > 8)           e.code = 'Short code must be 8 characters or fewer';
    if (s1.about.length > 1000)       e.about = 'About section exceeds 1000 characters';
    if (s1.tagline.length > 120)      e.tagline = 'Tagline must be 120 characters or fewer';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Save Step 1 ─────────────────────────────────────────────────
  const saveStep1 = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/colleges/onboarding/step-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s1),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      setHasUnsaved(false);
      toast.success('College profile saved!');
      setCurrentStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  // ─── Save Step 2 ─────────────────────────────────────────────────
  const saveStep2 = async (e) => {
    e.preventDefault();
    if (!s2.sessionTitle.trim()) return toast.error('Session title is required');
    if (s2.programs.length === 0) return toast.error('Add at least one program');
    setSaving(true);
    try {
      const res  = await fetch('/api/colleges/onboarding/step-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s2),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      setHasUnsaved(false);
      toast.success('Academic setup saved!');
      setCurrentStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  // ─── Save Step 3 ─────────────────────────────────────────────────
  const saveStep3 = async (skip = false) => {
    setSaving(true);
    try {
      const res  = await fetch('/api/colleges/onboarding/step-3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffList, skip }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      setHasUnsaved(false);
      toast.success(skip ? 'Skipped — you can add staff from the dashboard later.' : 'Staff accounts created!');
      setCurrentStep(4);
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  // ─── Complete Onboarding ──────────────────────────────────────────
  const completeOnboarding = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/colleges/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish');
      toast.success('🎉 College profile published! Redirecting to dashboard…');
      setTimeout(() => router.push('/admin'), 1800);
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  // ─── Program helpers ──────────────────────────────────────────────
  const addProgram = () => setS2(prev => ({
    ...prev, programs: [...prev.programs, { name: '', description: '' }]
  }));
  const updateProgram = (i, field, val) => setS2(prev => {
    const updated = [...prev.programs];
    updated[i] = { ...updated[i], [field]: val };
    return { ...prev, programs: updated };
  });
  const removeProgram = (i) => setS2(prev => ({
    ...prev, programs: prev.programs.filter((_, idx) => idx !== i)
  }));

  // ─── Staff helpers ────────────────────────────────────────────────
  const addStaffMember = () => {
    if (!newStaff.name.trim() || !newStaff.email.trim() || !newStaff.password) {
      return toast.error('Please fill in name, email and password');
    }
    setStaffList(prev => [...prev, { ...newStaff }]);
    setNewStaff({ name: '', email: '', role: 'registrar', password: '' });
    toast.success(`${newStaff.name} added to the list`);
  };
  const removeStaff = (i) => setStaffList(prev => prev.filter((_, idx) => idx !== i));

  // ─── Loading skeleton ─────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#04070d] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs text-white/35 font-medium">Restoring your onboarding progress…</p>
      </div>
    );
  }

  // ─── Page Layout ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#04070d] text-white">

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-[#06090f]/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <HiOutlineAcademicCap size={17} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-extrabold text-white leading-none">Academix</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">College Onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsaved && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-400/70 bg-amber-500/8 border border-amber-500/15 px-2.5 py-1 rounded-full">
                ● Unsaved changes
              </span>
            )}
            <span className="text-[11px] text-white/30 font-semibold bg-white/[0.04] px-3 py-1 rounded-full">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Mobile stepper */}
        <MobileStepper currentStep={currentStep} />

        {/* Content area */}
        <div className="flex gap-8">

          {/* Sidebar */}
          <StepSidebar currentStep={currentStep} onNavigate={setCurrentStep} />

          {/* Main panel */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">

              {/* ════════════════════════════════════════════════════
                  STEP 1: College Profile
              ════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
                  onSubmit={saveStep1}
                  className="space-y-6"
                >
                  <div className="mb-2">
                    <h2 className="text-xl font-extrabold text-white">College Profile &amp; Branding</h2>
                    <p className="text-xs text-white/35 mt-1">Set up your institution's public identity. This information will appear on your public profile page.</p>
                  </div>

                  {/* ── Branding ── */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <SectionHeading icon={HiOutlineIdentification} title="Branding" desc="Basic identity information" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FormGroup label="College Full Name" required error={errors.name}>
                          <input type="text" value={s1.name} onChange={setField('name')}
                            placeholder="e.g. Punjab College of Science"
                            className={`input-field ${errors.name ? 'border-red-500/50' : ''}`} />
                        </FormGroup>
                      </div>
                      <FormGroup label="Short Code" required error={errors.code} helper="Used in URLs and reports. Max 8 characters." value={s1.code} maxLen={8}>
                        <input type="text" value={s1.code}
                          onChange={e => { setS1(p => ({ ...p, code: e.target.value.toUpperCase() })); setHasUnsaved(true); }}
                          placeholder="e.g. PCS"
                          maxLength={8}
                          className={`input-field font-mono font-bold tracking-widest uppercase ${errors.code ? 'border-red-500/50' : ''}`} />
                      </FormGroup>
                      <FormGroup label="Tagline" error={errors.tagline} value={s1.tagline} maxLen={120}
                        helper="A short inspiring slogan for your college">
                        <input type="text" value={s1.tagline} onChange={setField('tagline')}
                          maxLength={120}
                          placeholder="e.g. Excellence in Education Since 1989"
                          className="input-field" />
                      </FormGroup>
                    </div>
                  </div>

                  {/* ── Images ── */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-6">
                    <SectionHeading icon={HiOutlineAcademicCap} title="Images" desc="College logo and cover photo" />
                    <ImageUploadField
                      label="College Logo"
                      helperText="Appears in the header, cards, and search results"
                      url={s1.logo}
                      setUrl={(v) => { setS1(p => ({ ...p, logo: v })); setHasUnsaved(true); }}
                      previewShape="square"
                    />
                    <div className="border-t border-white/[0.05]" />
                    <ImageUploadField
                      label="Cover Photo"
                      helperText="Full-width banner shown on your public college profile page"
                      url={s1.coverPhoto}
                      setUrl={(v) => { setS1(p => ({ ...p, coverPhoto: v })); setHasUnsaved(true); }}
                      previewShape="wide"
                    />
                  </div>

                  {/* ── About ── */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6">
                    <SectionHeading icon={HiOutlineBookOpen} title="About" desc="Describe your institution" />
                    <FormGroup label="About the College" error={errors.about} value={s1.about} maxLen={1000}
                      helper="Tell students and parents about your campus, facilities, vision, and values.">
                      <textarea rows={5} value={s1.about} onChange={setField('about')}
                        maxLength={1000}
                        placeholder="Founded in ..., our college is committed to providing..."
                        className={`input-field ${errors.about ? 'border-red-500/50' : ''}`} />
                    </FormGroup>
                  </div>

                  {/* ── Contact ── */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <SectionHeading icon={HiOutlinePhone} title="Contact &amp; Location" desc="How students and parents can reach you" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FormGroup label="Street Address">
                          <input type="text" value={s1.address} onChange={setField('address')}
                            placeholder="e.g. 12 Garden Town, Main Boulevard"
                            className="input-field" />
                        </FormGroup>
                      </div>
                      <FormGroup label="City">
                        <input type="text" value={s1.city} onChange={setField('city')}
                          placeholder="e.g. Lahore" className="input-field" />
                      </FormGroup>
                      <FormGroup label="Province / State">
                        <select value={s1.province} onChange={setField('province')} className="input-field">
                          <option value="">Select province…</option>
                          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </FormGroup>
                      <FormGroup label="Country">
                        <input type="text" value={s1.country} onChange={setField('country')}
                          className="input-field" />
                      </FormGroup>
                      <FormGroup label="Phone Number" helper="Include country code for international contacts">
                        <div className="relative">
                          <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                          <input type="tel" value={s1.phone} onChange={setField('phone')}
                            placeholder="e.g. +92 300 1234567"
                            className="input-field pl-8" />
                        </div>
                      </FormGroup>
                      <FormGroup label="Official Website">
                        <div className="relative">
                          <HiOutlineGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                          <input type="url" value={s1.website} onChange={setField('website')}
                            placeholder="https://yourcollege.edu.pk"
                            className="input-field pl-8" />
                        </div>
                      </FormGroup>
                    </div>
                  </div>

                  {/* ── Location / Map ── */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6">
                    <SectionHeading icon={HiOutlineLocationMarker} title="Location" desc="Google Maps embed URL" />
                    <FormGroup label="Google Maps Embed URL"
                      helper='Open Google Maps → Share → Embed a map → Copy the src="..." URL only'>
                      <input type="url" value={s1.googleMap} onChange={setField('googleMap')}
                        placeholder="https://www.google.com/maps/embed?pb=..."
                        className="input-field" />
                    </FormGroup>
                  </div>

                  {/* ── Social Links ── */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <SectionHeading icon={HiOutlineGlobe} title="Social Links" desc="Connect your college's social media pages" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/yourcollege' },
                        { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourcollege' },
                        { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/yourcollege' },
                        { key: 'twitter',   label: 'X (Twitter)',placeholder: 'https://x.com/yourcollege' },
                        { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourcollege' },
                      ].map(({ key, label, placeholder }) => (
                        <FormGroup key={key} label={label}>
                          <SocialInput value={s1.socialLinks[key]} placeholder={placeholder} onChange={setSocial(key)} icon={null} />
                        </FormGroup>
                      ))}
                    </div>
                  </div>

                  {/* Step 1 Footer */}
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-sm font-bold">
                      {saving
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                        : <>Save &amp; Continue to Academic Setup <HiArrowRight size={16} /></>}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ════════════════════════════════════════════════════
                  STEP 2: Academic Setup
              ════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
                  onSubmit={saveStep2}
                  className="space-y-6"
                >
                  <div className="mb-2">
                    <h2 className="text-xl font-extrabold text-white">Academic Setup</h2>
                    <p className="text-xs text-white/35 mt-1">Define the current academic session and offered programs.</p>
                  </div>

                  {/* Session */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <SectionHeading icon={HiOutlineBookOpen} title="Academic Session" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormGroup label="Session Title" required>
                        <input type="text" value={s2.sessionTitle}
                          onChange={e => setS2(p => ({ ...p, sessionTitle: e.target.value }))}
                          className="input-field font-bold" placeholder="2026-2027" />
                      </FormGroup>
                      <FormGroup label="Start Date">
                        <input type="date" value={s2.startDate}
                          onChange={e => setS2(p => ({ ...p, startDate: e.target.value }))}
                          className="input-field" />
                      </FormGroup>
                      <FormGroup label="End Date">
                        <input type="date" value={s2.endDate}
                          onChange={e => setS2(p => ({ ...p, endDate: e.target.value }))}
                          className="input-field" />
                      </FormGroup>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/50 block mb-2">Admission Status</label>
                      <div className="flex items-center gap-3">
                        {[true, false].map(val => (
                          <button
                            key={String(val)} type="button"
                            onClick={() => setS2(p => ({ ...p, admissionOpen: val }))}
                            className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all ${s2.admissionOpen === val
                              ? val ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/12 border-red-500/25 text-red-400'
                              : 'bg-white/[0.03] border-white/[0.08] text-white/30 hover:border-white/15'}`}
                          >
                            {val ? '✅ Open' : '🔒 Closed'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Programs */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <HiOutlineBadgeCheck size={16} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Offered Programs</p>
                          <p className="text-[11px] text-white/35">{s2.programs.length} program{s2.programs.length !== 1 ? 's' : ''} configured</p>
                        </div>
                      </div>
                      <button type="button" onClick={addProgram} className="btn-secondary py-1.5 px-3 text-xs">
                        <HiOutlinePlus size={14} /> Add Program
                      </button>
                    </div>

                    <div className="space-y-3">
                      {s2.programs.length === 0 && (
                        <div className="text-center py-8 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.07]">
                          <p className="text-sm text-white/30 font-medium">No programs added yet.</p>
                          <button type="button" onClick={addProgram}
                            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
                            + Add your first program
                          </button>
                        </div>
                      )}
                      {s2.programs.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-1">
                            {i + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input type="text" value={p.name}
                              onChange={e => updateProgram(i, 'name', e.target.value)}
                              placeholder="Program name (e.g. FSc Pre-Medical)"
                              className="input-field text-xs font-bold" />
                            <input type="text" value={p.description}
                              onChange={e => updateProgram(i, 'description', e.target.value)}
                              placeholder="Brief description…"
                              className="input-field text-xs" />
                          </div>
                          <button type="button" onClick={() => removeProgram(i)}
                            className="btn-danger py-1.5 px-2 flex-shrink-0">
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={() => setCurrentStep(1)} className="btn-secondary px-5 py-2.5 text-sm">
                      <HiArrowLeft size={15} /> Back
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-sm font-bold">
                      {saving
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                        : <>Save &amp; Continue <HiArrowRight size={16} /></>}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ════════════════════════════════════════════════════
                  STEP 3: Staff Accounts (Skippable)
              ════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="mb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-extrabold text-white">Staff Accounts</h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                        Optional Step
                      </span>
                    </div>
                    <p className="text-xs text-white/35">Create initial team accounts or skip now and manage staff from the dashboard later.</p>
                  </div>

                  {/* Add staff form */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                    <SectionHeading icon={HiOutlineUserGroup} title="Add Team Member" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormGroup label="Full Name" required>
                        <div className="relative">
                          <HiOutlineIdentification className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                          <input type="text" value={newStaff.name}
                            onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Mr. Asim Khan" className="input-field pl-8 text-sm" />
                        </div>
                      </FormGroup>
                      <FormGroup label="Email Address" required>
                        <div className="relative">
                          <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                          <input type="email" value={newStaff.email}
                            onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))}
                            placeholder="staff@yourcollege.edu.pk" className="input-field pl-8 text-sm" />
                        </div>
                      </FormGroup>
                      <FormGroup label="Role">
                        <select value={newStaff.role}
                          onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))}
                          className="input-field text-sm capitalize">
                          {STAFF_ROLES.map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                          ))}
                        </select>
                      </FormGroup>
                      <PasswordField label="Temporary Password"
                        value={newStaff.password}
                        onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))}
                        placeholder="Min. 6 characters" />
                    </div>
                    <button type="button" onClick={addStaffMember} className="btn-secondary py-2 px-4 text-sm">
                      <HiOutlinePlus size={15} /> Add to List
                    </button>
                  </div>

                  {/* Staff list */}
                  {staffList.length > 0 && (
                    <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 space-y-3">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
                        Accounts to Create ({staffList.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {staffList.map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{s.name}</p>
                              <p className="text-[11px] text-white/35 truncate mt-0.5">
                                {s.email} · <span className="text-indigo-400 font-semibold capitalize">{s.role.replace('_', ' ')}</span>
                              </p>
                            </div>
                            <button type="button" onClick={() => removeStaff(i)}
                              className="btn-danger py-1.5 px-2 ml-3 flex-shrink-0">
                              <HiOutlineTrash size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {staffList.length === 0 && (
                    <div className="p-5 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.07] text-center">
                      <p className="text-xs text-white/25">No staff members added yet. You can skip this step and add them from the dashboard.</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <button type="button" onClick={() => setCurrentStep(2)} className="btn-secondary px-5 py-2.5 text-sm">
                      <HiArrowLeft size={15} /> Back
                    </button>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => saveStep3(true)} disabled={saving}
                        className="btn-secondary px-5 py-2.5 text-sm">
                        Skip for Now
                      </button>
                      <button type="button" onClick={() => saveStep3(false)} disabled={saving}
                        className="btn-primary px-8 py-3 text-sm font-bold">
                        {saving
                          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                          : <>Save &amp; Continue <HiArrowRight size={16} /></>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════
                  STEP 4: Review & Publish
              ════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="mb-2">
                    <h2 className="text-xl font-extrabold text-white">Final Review &amp; Publish</h2>
                    <p className="text-xs text-white/35 mt-1">Review your setup before publishing your college workspace to the platform.</p>
                  </div>

                  {/* Profile summary card */}
                  <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Cover */}
                    <div className="relative h-28 bg-gradient-to-r from-indigo-600/20 to-violet-600/20">
                      {s1.coverPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s1.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/80 to-transparent" />
                    </div>

                    {/* Logo + Name */}
                    <div className="px-6 pb-6 relative">
                      <div className="w-16 h-16 rounded-2xl border-4 border-[#0d1117] overflow-hidden bg-indigo-500/10 flex items-center justify-center -mt-8 mb-3">
                        {s1.logo
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={s1.logo} alt="Logo" className="w-full h-full object-cover" />
                          : <span className="text-indigo-400 font-extrabold text-lg">{s1.code?.slice(0, 2)}</span>}
                      </div>
                      <h3 className="text-lg font-extrabold text-white">{s1.name || '—'}</h3>
                      <p className="text-xs text-white/40 mt-0.5">{s1.tagline}</p>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                        {[
                          { label: 'Programs',     value: s2.programs.length },
                          { label: 'Staff Accounts', value: staffList.length },
                          { label: 'City',          value: s1.city || '—' },
                          { label: 'Session',       value: s2.sessionTitle },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                            <p className="text-[10px] text-white/30 uppercase font-bold">{label}</p>
                            <p className="text-sm font-bold text-white mt-1 truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Programs list */}
                  {s2.programs.length > 0 && (
                    <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Offered Programs</p>
                      <div className="space-y-2">
                        {s2.programs.map((p, i) => (
                          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{p.name}</p>
                              {p.description && <p className="text-[11px] text-white/30 mt-0.5">{p.description}</p>}
                            </div>
                            <HiOutlineCheckCircle className="ml-auto text-emerald-400 flex-shrink-0" size={15} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Publish CTA */}
                  <div className="bg-gradient-to-br from-indigo-500/8 to-violet-600/8 border border-indigo-500/15 rounded-2xl p-6 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
                      <HiOutlineSparkles size={26} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Ready to launch?</h3>
                      <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                        Publishing will activate your college profile on the platform and notify the Super Admin.
                      </p>
                    </div>
                    <button
                      type="button" onClick={completeOnboarding} disabled={saving}
                      className="btn-primary px-10 py-3.5 text-sm font-extrabold shadow-2xl shadow-indigo-600/35 mx-auto"
                    >
                      {saving
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing…</>
                        : <>🎉 Publish College Profile &amp; Open Dashboard</>}
                    </button>
                  </div>

                  <div className="flex justify-start">
                    <button type="button" onClick={() => setCurrentStep(3)} className="btn-secondary px-5 py-2.5 text-sm">
                      <HiArrowLeft size={15} /> Back to Staff
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
