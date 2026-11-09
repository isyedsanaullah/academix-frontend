'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ROOT_DOMAIN } from '@/lib/host';
import { normalizeSlug } from '@/lib/reservedSlugs';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineOfficeBuilding,
  HiOutlineLibrary,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const INSTITUTION_TEMPLATES = [
  {
    id: 'academic',
    name: 'Standard Academic College',
    desc: 'General intermediate & degree college with core attendance, exams, timetables, and fee vouchers.',
    icon: HiOutlineAcademicCap,
    recommendedPlan: 'standard',
    badge: 'Popular',
    features: [
      'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
      'sessions', 'attendance', 'timetable', 'exams-results', 'certificates',
      'announcements', 'fees', 'entry-system', 'visitors', 'employees', 'analytics-reports'
    ],
  },
  {
    id: 'medical',
    name: 'Medical & Healthcare Institute',
    desc: 'Clinical sciences institute with student QR gate verification, practical rotas, and fee vouchers.',
    icon: HiOutlineOfficeBuilding,
    recommendedPlan: 'standard',
    badge: 'Specialized',
    features: [
      'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
      'sessions', 'attendance', 'timetable', 'exams-results', 'certificates',
      'announcements', 'fees', 'entry-system', 'visitors', 'employees', 'analytics-reports'
    ],
  },
  {
    id: 'stem',
    name: 'STEM & Technology Campus',
    desc: 'Cutting-edge engineering and computer science college with complete AI suite and online admissions.',
    icon: HiOutlineSparkles,
    recommendedPlan: 'premium',
    badge: 'AI-Powered',
    features: [
      'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
      'sessions', 'attendance', 'timetable', 'exams-results', 'certificates',
      'announcements', 'fees', 'entry-system', 'visitors', 'employees', 'analytics-reports',
      'ai-chat', 'ai-generators', 'ai-study-assistant', 'ai-paper-generator'
    ],
  },
  {
    id: 'university',
    name: 'University & Enterprise Multi-Campus',
    desc: 'Comprehensive multi-faculty university with full platform capabilities, multi-campus, and enterprise controls.',
    icon: HiOutlineLibrary,
    recommendedPlan: 'enterprise',
    badge: 'Full Suite',
    features: [
      'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
      'sessions', 'attendance', 'timetable', 'exams-results', 'certificates',
      'announcements', 'fees', 'entry-system', 'visitors', 'employees', 'analytics-reports',
      'ai-chat', 'ai-generators', 'ai-study-assistant', 'ai-paper-generator', 'advanced'
    ],
  },
];

const FEATURE_CATEGORIES = [
  {
    title: 'Core Academics & Admissions',
    features: [
      { id: 'core-academic', name: 'Core Academic Structure' },
      { id: 'students', name: 'Student Records & Enrollment' },
      { id: 'teachers', name: 'Faculty & Teacher Directory' },
      { id: 'subjects', name: 'Curriculum & Subjects' },
      { id: 'classes', name: 'Classes & Sections' },
      { id: 'sessions', name: 'Academic Sessions & Batches' },
    ],
  },
  {
    title: 'Campus Operations & Gate Security',
    features: [
      { id: 'attendance', name: 'Daily Attendance & QR Scanning' },
      { id: 'timetable', name: 'Timetable & Class Schedules' },
      { id: 'entry-system', name: 'Gate Logging & Entry Passes' },
      { id: 'visitors', name: 'Visitor Badges & Logs' },
      { id: 'employees', name: 'Staff & Employee Directory' },
      { id: 'announcements', name: 'Announcements & SMS/Email' },
    ],
  },
  {
    title: 'Examinations & Grading',
    features: [
      { id: 'exams-results', name: 'Exam Sheets & Result Cards' },
      { id: 'certificates', name: 'Character & Degree Certificates' },
      { id: 'analytics-reports', name: 'Academic Reports & Analytics' },
    ],
  },
  {
    title: 'Finance & Student Fees',
    features: [
      { id: 'fees', name: 'Fee Vouchers & Ledger Tracking' },
      { id: 'canteen', name: 'Campus Canteen & POS' },
    ],
  },
  {
    title: 'AI Intelligence & Generators',
    features: [
      { id: 'ai-chat', name: 'Academix AI Chat Assistant' },
      { id: 'ai-generators', name: 'AI Quiz & MCQ Generator' },
      { id: 'ai-study-assistant', name: 'AI Notes & Study Assistant' },
      { id: 'ai-paper-generator', name: 'AI Exam Paper Generator' },
    ],
  },
];

export default function ApproveRequestStudio({
  request,
  onBack,
  onSuccess,
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [collegeName, setCollegeName] = useState(request?.collegeName || '');
  const [slug, setSlug] = useState(normalizeSlug(request?.collegeName) || 'college');
  const [slugStatus, setSlugStatus] = useState(null); // 'checking' | 'available' | 'unavailable'
  const [slugError, setSlugError] = useState('');
  const [adminEmail, setAdminEmail] = useState(request?.adminEmail || '');
  const [selectedTemplate, setSelectedTemplate] = useState('academic');
  const [plan, setPlan] = useState((request?.selectedPlan || 'standard').toLowerCase());
  const [features, setFeatures] = useState(INSTITUTION_TEMPLATES[0].features);
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState(() =>
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      if (!slug || slug.length < 3) {
        if (isMounted) {
          setSlugStatus('unavailable');
          setSlugError('Subdomain must be at least 3 characters');
        }
        return;
      }
      try {
        if (!isMounted) return;
        setSlugStatus('checking');
        setSlugError('');
        const res = await api.get(`/super-admin/slugs/check?slug=${encodeURIComponent(slug)}`);
        if (isMounted) {
          if (res.data?.available) {
            setSlugStatus('available');
            setSlugError('');
          } else {
            setSlugStatus('unavailable');
            setSlugError(res.data?.reason || 'Subdomain is not available');
          }
        }
      } catch (err) {
        if (isMounted) {
          setSlugStatus('unavailable');
          setSlugError(err.response?.data?.message || 'Could not verify subdomain');
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [slug]);

  const handleSlugInput = (val) => {
    const cleaned = normalizeSlug(val);
    setSlug(cleaned);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setPlan(template.recommendedPlan);
    setFeatures(template.features);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleToggleFeature = (featId) => {
    setFeatures((prev) =>
      prev.includes(featId) ? prev.filter((f) => f !== featId) : [...prev, featId]
    );
  };

  const handleSubmitProvision = async () => {
    if (slugStatus !== 'available') {
      toast.error('Please resolve the subdomain slug before provisioning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/super-admin/subscription-requests/${request.id}/approve`, {
        collegeName: collegeName.trim(),
        slug: slug.trim(),
        adminEmail: adminEmail.trim(),
        plan,
        features,
        startsAt,
        expiresAt,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'College provisioned successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve and provision workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Identity & Domain' },
    { num: 2, label: 'Institution Template' },
    { num: 3, label: 'Plan & Capabilities' },
    { num: 4, label: 'Provision' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Top Navigation & Phase Breadcrumbs ── */}
      <div className="card p-5 border border-s-subtle shadow-widget flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-2xl bg-b-depth2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-stroke2 transition cursor-pointer"
            title="Back to Subscription Requests"
          >
            <HiOutlineArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-h6 font-bold text-t-primary">
              Approve & Provision Institution
            </h2>
            <p className="text-caption text-t-secondary">
              Reviewing application for <strong className="text-t-primary">{request?.collegeName}</strong>
            </p>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {STEPS.map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (s.num < step) setStep(s.num);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-caption font-semibold transition cursor-pointer ${
                  step === s.num
                    ? 'bg-primary-01 text-white shadow-depth'
                    : step > s.num
                    ? 'bg-[#00a656]/15 text-[#00a656] border border-[#00a656]/25'
                    : 'bg-b-depth2 text-t-tertiary border border-s-subtle'
                }`}
              >
                <span>{step > s.num ? '✓' : s.num}</span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <span className="text-t-tertiary text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── PHASE 1: Subdomain & Campus Identity ── */}
      {step === 1 && (
        <div className="card p-6 border border-s-subtle shadow-widget space-y-6">
          <div>
            <h3 className="text-h6 font-bold text-t-primary">Campus Identity & Subdomain</h3>
            <p className="text-caption text-t-secondary">
              Configure the unique institutional subdomain routing on Hostinger edge DNS
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="text-caption font-semibold text-t-primary block mb-1.5">
                Institution Legal / Display Name *
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Faisalabad Model College"
                className="w-full text-caption p-3 rounded-2xl bg-b-surface2 border border-s-stroke2 text-t-primary outline-none focus:border-primary-01 transition"
              />
            </div>

            <div>
              <label className="text-caption font-semibold text-t-primary block mb-1.5">
                Hostinger Subdomain Routing *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugInput(e.target.value)}
                  placeholder="e.g. fmc"
                  className="flex-1 text-caption font-mono lowercase p-3 rounded-2xl bg-b-surface2 border border-s-stroke2 text-t-primary outline-none focus:border-primary-01 transition"
                />
                <span className="text-caption font-mono text-t-secondary px-3 py-3 rounded-2xl bg-b-depth2 border border-s-subtle">
                  .{ROOT_DOMAIN}
                </span>
              </div>

              {/* Status Notice */}
              <div className="mt-2 text-caption">
                {slugStatus === 'checking' && (
                  <span className="flex items-center gap-1.5 text-t-secondary font-mono">
                    <HiOutlineRefresh className="size-3.5 animate-spin text-primary-01" />
                    Checking Hostinger DNS availability…
                  </span>
                )}
                {slugStatus === 'available' && (
                  <span className="flex items-center gap-1.5 text-[#00a656] font-semibold">
                    <HiOutlineCheckCircle className="size-4" />
                    Subdomain available! Live URL: https://{slug}.{ROOT_DOMAIN}
                  </span>
                )}
                {slugStatus === 'unavailable' && (
                  <span className="text-rose-500 font-semibold block">
                    ✕ {slugError}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-caption font-semibold text-t-primary block mb-1.5">
                College Administrator Email *
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@college.edu.pk"
                className="w-full text-caption p-3 rounded-2xl bg-b-surface2 border border-s-stroke2 text-t-primary outline-none focus:border-primary-01 transition"
              />
              <p className="text-[11px] text-t-secondary mt-1">
                The single-use 7-day provisioning invite token will be dispatched to this address.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-s-subtle">
            <button
              type="button"
              disabled={slugStatus !== 'available' || !collegeName.trim() || !adminEmail.trim()}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-caption font-bold bg-primary-01 hover:bg-primary-01/90 disabled:opacity-50 text-white shadow-depth transition cursor-pointer"
            >
              <span>Next: Select Template</span>
              <HiOutlineArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 2: Select From Institutional Templates ── */}
      {step === 2 && (
        <div className="card p-6 border border-s-subtle shadow-widget space-y-6">
          <div>
            <h3 className="text-h6 font-bold text-t-primary">Choose Institutional Template</h3>
            <p className="text-caption text-t-secondary">
              Select a pre-configured template optimized for the applicant&apos;s institution type
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSTITUTION_TEMPLATES.map((tmpl) => {
              const IconComp = tmpl.icon;
              const isSelected = selectedTemplate === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative space-y-3 ${
                    isSelected
                      ? 'bg-b-surface2 border-primary-01 ring-2 ring-primary-01/30 shadow-widget'
                      : 'bg-b-surface2/60 border-s-subtle hover:bg-b-surface2 hover:border-s-stroke2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-primary-01 text-white'
                            : 'bg-b-depth2 text-t-secondary'
                        }`}
                      >
                        <IconComp size={22} />
                      </div>
                      <div>
                        <h4 className="text-sub-title-1 font-bold text-t-primary">{tmpl.name}</h4>
                        <span className="text-[11px] font-mono font-semibold text-primary-01 uppercase">
                          Recommended Tier: {tmpl.recommendedPlan}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-b-depth2 text-t-secondary border border-s-subtle">
                      {tmpl.badge}
                    </span>
                  </div>

                  <p className="text-caption text-t-secondary leading-relaxed">
                    {tmpl.desc}
                  </p>

                  <div className="pt-2 border-t border-s-subtle flex items-center justify-between text-caption">
                    <span className="text-t-tertiary">
                      {tmpl.features.length} modules enabled
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isSelected ? 'text-primary-01' : 'text-t-secondary'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Select Template →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-s-subtle">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-2xl text-caption font-semibold bg-b-depth2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-subtle transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-caption font-bold bg-primary-01 hover:bg-primary-01/90 text-white shadow-depth transition cursor-pointer"
            >
              <span>Next: Customize Capabilities</span>
              <HiOutlineArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 3: Plan & Feature Matrix Customization ── */}
      {step === 3 && (
        <div className="card p-6 border border-s-subtle shadow-widget space-y-6">
          <div>
            <h3 className="text-h6 font-bold text-t-primary">Plan & Feature Matrix</h3>
            <p className="text-caption text-t-secondary">
              Fine-tune the subscription tier and toggle specific capability modules
            </p>
          </div>

          {/* Tier Selection */}
          <div className="space-y-2">
            <label className="text-caption font-semibold text-t-primary block">
              Baseline Platform Tier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['starter', 'standard', 'premium', 'enterprise'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                    plan === p
                      ? 'bg-b-surface2 border-primary-01 ring-2 ring-primary-01/30 text-primary-01 font-bold'
                      : 'bg-b-depth2 border-s-subtle text-t-secondary hover:text-t-primary'
                  }`}
                >
                  <span className="capitalize block text-sub-title-2">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-caption font-semibold text-t-primary block mb-1.5">
                Term Start Date
              </label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full text-caption p-3 rounded-2xl bg-b-surface2 border border-s-stroke2 text-t-primary outline-none focus:border-primary-01 transition font-mono"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-t-primary block mb-1.5">
                Term Expiry Date
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full text-caption p-3 rounded-2xl bg-b-surface2 border border-s-stroke2 text-t-primary outline-none focus:border-primary-01 transition font-mono"
              />
            </div>
          </div>

          {/* Category Feature Toggles */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-caption font-semibold text-t-primary">
                Enabled Capability Modules ({features.length} active)
              </label>
            </div>

            <div className="space-y-4">
              {FEATURE_CATEGORIES.map((cat) => (
                <div key={cat.title} className="p-4 rounded-2xl bg-b-depth2 border border-s-subtle space-y-3">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-t-tertiary">
                    {cat.title}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {cat.features.map((feat) => {
                      const isChecked = features.includes(feat.id);
                      return (
                        <label
                          key={feat.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-caption transition cursor-pointer select-none ${
                            isChecked
                              ? 'bg-b-surface2 border-primary-01/30 text-t-primary font-semibold'
                              : 'bg-b-surface2/40 border-s-subtle text-t-secondary'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFeature(feat.id)}
                            className="rounded text-primary-01 focus:ring-primary-01"
                          />
                          <span className="truncate">{feat.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-s-subtle">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-2xl text-caption font-semibold bg-b-depth2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-subtle transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-caption font-bold bg-primary-01 hover:bg-primary-01/90 text-white shadow-depth transition cursor-pointer"
            >
              <span>Next: Review & Provision</span>
              <HiOutlineArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 4: Summary & Provision Confirmation ── */}
      {step === 4 && (
        <div className="card p-6 border border-s-subtle shadow-widget space-y-6">
          <div>
            <h3 className="text-h6 font-bold text-t-primary">Provisioning Summary</h3>
            <p className="text-caption text-t-secondary">
              Review workspace parameters before provisioning the database and dispatching the setup invite
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-b-depth2 border border-s-subtle space-y-4 max-w-2xl">
            <div className="flex items-center justify-between border-b border-s-subtle pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-t-tertiary block">
                  Institution Name
                </span>
                <span className="text-sub-title-1 font-bold text-t-primary mt-0.5 block">
                  {collegeName}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-primary-01 text-white capitalize">
                {plan} Plan
              </span>
            </div>

            <div className="space-y-2.5 text-caption">
              <div className="flex justify-between py-1 border-b border-s-subtle">
                <span className="text-t-secondary">Hostinger Subdomain:</span>
                <strong className="text-primary-01 font-mono">
                  https://{slug}.{ROOT_DOMAIN}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-s-subtle">
                <span className="text-t-secondary">Administrator Email:</span>
                <strong className="text-t-primary font-mono">{adminEmail}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-s-subtle">
                <span className="text-t-secondary">Selected Template:</span>
                <strong className="text-t-primary capitalize">{selectedTemplate}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-s-subtle">
                <span className="text-t-secondary">Active Capabilities:</span>
                <strong className="text-t-primary">{features.length} Modules</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-t-secondary">Subscription Term:</span>
                <strong className="text-t-primary font-mono">
                  {startsAt} to {expiresAt}
                </strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#00a656]/10 border border-[#00a656]/20 text-caption text-t-secondary leading-relaxed max-w-2xl">
            Upon confirmation, the platform creates the institutional workspace with <strong className="text-t-primary">pending_setup</strong> status and immediately sends an automated 7-day onboarding invitation link to <strong className="text-t-primary font-mono">{adminEmail}</strong>.
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-s-subtle max-w-2xl">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-2xl text-caption font-semibold bg-b-depth2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-subtle transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitProvision}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-caption font-bold bg-[#00a656] hover:bg-[#00a656]/90 disabled:opacity-50 text-white shadow-depth transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Workspace…</span>
                </>
              ) : (
                <>
                  <HiOutlineShieldCheck size={16} />
                  <span>Confirm & Provision College</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

