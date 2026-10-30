'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  HiOutlineOfficeBuilding,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
  HiOutlineLightningBolt,
  HiOutlineUsers,
  HiOutlineServer
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { apiGet, apiPost } from '@/lib/api';
import LoginArt from '@/legacy-pages/auth/LoginArt.jsx';

// Fallback plans if network is slow or offline
const FALLBACK_PLANS = [
  {
    id: 'basic',
    planId: 'basic',
    name: 'Basic Plan',
    description: 'Essential college management features for small institutions',
    price: { monthly: 0, yearly: 0, currency: 'PKR' },
    limits: { maxStudents: 500, maxStaff: 50, maxStorage: 1024 },
    features: ['students', 'teachers', 'subjects', 'attendance', 'timetable', 'notices', 'exams', 'results', 'certificates'],
    isAI: false
  },
  {
    id: 'standard',
    planId: 'standard',
    name: 'Standard Plan',
    description: 'Advanced management with fee tracking, analytics, and entry system',
    price: { monthly: 5000, yearly: 50000, currency: 'PKR' },
    limits: { maxStudents: 2000, maxStaff: 200, maxStorage: 5120 },
    features: ['entry-system', 'fees', 'analytics', 'reports', 'employees', 'visitors', 'canteen', 'advanced'],
    isAI: false
  },
  {
    id: 'premium',
    planId: 'premium',
    name: 'Premium AI Plan',
    description: 'Full-featured platform with AI-powered academic tools for modern education',
    price: { monthly: 15000, yearly: 150000, currency: 'PKR' },
    limits: { maxStudents: -1, maxStaff: -1, maxStorage: 20480 },
    features: ['ai-chat', 'ai-pdf-chat', 'ai-study-assistant', 'ai-paper-generator', 'ai-quiz-generator', 'ai-notes-generator'],
    isAI: true
  }
];

function formatFeature(feat) {
  return feat
    .replace(/^ai-/, 'AI ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function SubscriptionRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState('standard');

  const [formData, setFormData] = useState({
    collegeName: '',
    adminEmail: '',
    phone: '',
    studentCount: '',
    message: '',
    preferredContact: 'email'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch real plans from backend
  useEffect(() => {
    let mounted = true;
    apiGet('/public/subscription-plans')
      .then(d => {
        if (!mounted) return;
        if (d?.success && Array.isArray(d?.data) && d.data.length > 0) {
          setPlans(d.data);
        } else {
          setPlans(FALLBACK_PLANS);
        }
      })
      .catch(() => {
        if (mounted) setPlans(FALLBACK_PLANS);
      })
      .finally(() => {
        if (mounted) setPlansLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  // Sync plan selection from URL parameter if provided
  useEffect(() => {
    const planParam = searchParams?.get('plan');
    if (planParam) {
      setSelectedPlanId(planParam.toLowerCase());
    }
  }, [searchParams]);

  const activePlans = useMemo(() => (plans.length > 0 ? plans : FALLBACK_PLANS), [plans]);

  const currentPlan = useMemo(() => {
    return activePlans.find(p => (p.planId || p.id) === selectedPlanId) || activePlans[0] || FALLBACK_PLANS[1];
  }, [activePlans, selectedPlanId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.collegeName.trim()) {
      toast.error('College name is required');
      return false;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.adminEmail.trim() || !emailRe.test(formData.adminEmail)) {
      toast.error('A valid administrator email is required');
      return false;
    }

    const phoneRe = /^\+?[0-9\s\-]{7,15}$/;
    if (!formData.phone.trim() || !phoneRe.test(formData.phone)) {
      toast.error('A valid contact phone number is required');
      return false;
    }

    const students = parseInt(formData.studentCount, 10);
    if (isNaN(students) || students <= 0) {
      toast.error('Estimated student count must be a positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiPost('/public/subscription-request', {
        ...formData,
        selectedPlan: currentPlan.planId || currentPlan.id || selectedPlanId
      });

      if (response?.success) {
        setSuccess(true);
        toast.success(response.message || 'Subscription request submitted successfully!');
      } else {
        throw new Error(response?.message || 'Something went wrong');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Submission failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-app text-fg selection:bg-accent-soft lg:h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.05fr)]">

      {/* ════════ LEFT: Brand Artwork & Live Plan Showcase (Desktop Only) ════════ */}
      <aside
        className="relative hidden overflow-hidden bg-gradient-to-br from-brand-blue-900 via-surface-900 to-surface-950 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:p-10 xl:p-12"
        aria-label="Collegeshub subscription overview"
      >
        {/* Ambient background glows & grid */}
        <div className="login-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-blue-500/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-brand-green-600/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" aria-hidden="true" />

        {/* Animated artwork header */}
        <div
          className="pointer-events-none absolute inset-0 flex items-start justify-end pl-16 pr-0 pb-52 pt-6 xl:pl-20"
          aria-hidden="true"
        >
          <LoginArt className="h-full w-full max-w-[560px]" />
        </div>

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg">
            <Image src="/logo-mark.svg" alt="" width={36} height={34} priority />
            <span className="text-lg font-extrabold tracking-tight">
              Collegeshub<span className="text-brand-green-500">.org</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <HiOutlineHome size={14} aria-hidden="true" /> Back to Home
          </Link>
        </div>

        {/* Middle: Live Selected Plan Showcase */}
        <div className="relative z-10 mt-auto flex flex-col gap-5">
          <div className="login-fade-up flex flex-col gap-3" style={{ '--delay': '.05s' }}>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <HiOutlineBadgeCheck size={16} className="text-brand-green-500" aria-hidden="true" />
              Campus Provisioning
            </span>

            <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
              Transform Your College Operations
            </h2>
            <p className="max-w-md text-xs sm:text-sm leading-relaxed text-white/70">
              Deploy a dedicated, multi-tenant workspace tailored for admissions, academics, fee tracking, and smart portals.
            </p>
          </div>

          {/* Dynamic Plan Preview Card */}
          <div className="login-fade-up rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl shadow-2xl" style={{ '--delay': '.15s' }}>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-white">{currentPlan.name}</h3>
                  {currentPlan.isAI && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-green-500/20 border border-brand-green-500/30 px-2 py-0.5 text-[10px] font-bold text-brand-green-400">
                      <HiOutlineSparkles size={11} /> AI Engine
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-white/60 line-clamp-1">{currentPlan.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-extrabold text-white">
                  {currentPlan.price?.monthly ? `PKR ${currentPlan.price.monthly.toLocaleString()}` : 'Free'}
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-white/50">
                  {currentPlan.price?.monthly ? '/ month' : 'Community Tier'}
                </span>
              </div>
            </div>

            {/* Limits & Feature Highlights */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/80">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <HiOutlineUsers size={16} className="text-brand-blue-400 shrink-0" />
                <span className="truncate">
                  {currentPlan.limits?.maxStudents === -1 ? 'Unlimited Students' : `Up to ${currentPlan.limits?.maxStudents || 500} Students`}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <HiOutlineServer size={16} className="text-brand-green-500 shrink-0" />
                <span className="truncate">
                  {currentPlan.limits?.maxStorage ? `${Math.round(currentPlan.limits.maxStorage / 1024)}GB Storage` : 'Dedicated DB'}
                </span>
              </div>
            </div>

            {/* Feature Bullets */}
            {Array.isArray(currentPlan.features) && currentPlan.features.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {currentPlan.features.slice(0, 5).map((feat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/85"
                  >
                    <HiOutlineCheck size={12} className="text-brand-green-400" />
                    {formatFeature(feat)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="flex items-center gap-6 text-[11px] font-medium text-white/60">
            <span className="flex items-center gap-1.5"><HiOutlineShieldCheck size={15} className="text-brand-green-400" /> Isolated Data Vault</span>
            <span className="flex items-center gap-1.5"><HiOutlineLightningBolt size={15} className="text-brand-blue-400" /> 99.9% Cloud Uptime</span>
          </div>

          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Collegeshub.org &bull; Secure Multi-Tenant Cloud
          </p>
        </div>
      </aside>

      {/* ════════ RIGHT: Interactive Subscription Form ════════ */}
      <section className="relative flex flex-col overflow-y-auto bg-card">
        <div className="brand-rail" aria-hidden="true" />

        {/* Mobile / Tablet Brand Header */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-brand-blue-900 to-surface-950 px-4 py-3 text-white sm:px-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg">
            <Image src="/logo-mark.svg" alt="" width={32} height={30} priority />
            <span className="text-base font-extrabold tracking-tight">
              Collegeshub<span className="text-brand-green-500">.org</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <HiOutlineHome size={14} aria-hidden="true" /> Home
          </Link>
        </div>

        {/* Main Form Container */}
        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
          <div className="login-slide-in w-full max-w-[500px]">

            {success ? (
              <div className="text-center py-8 space-y-6 animate-fade-in rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 sm:p-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                  <HiOutlineCheckCircle size={36} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Request Submitted!</h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 max-w-md mx-auto leading-relaxed">
                    Thank you for requesting the <strong>{currentPlan.name}</strong> for <strong>{formData.collegeName}</strong>. Our provisioning team has received your details and will contact you at <strong>{formData.adminEmail}</strong> or <strong>{formData.phone}</strong> shortly to deploy your campus workspace.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => router.push('/')}
                    className="w-full sm:w-auto btn-primary py-2.5 px-6 text-xs font-bold"
                  >
                    Return to Homepage
                  </button>
                  <button
                    onClick={() => { setSuccess(false); setFormData({ collegeName: '', adminEmail: '', phone: '', studentCount: '', message: '', preferredContact: 'email' }); }}
                    className="w-full sm:w-auto btn-secondary py-2.5 px-5 text-xs font-semibold"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0A4D94]/10 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0A4D94] dark:text-brand-blue-400">
                      Step 1 of 1
                    </span>
                    <span className="text-xs text-slate-400 dark:text-white/40">&bull; Institution Request</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Request College Subscription
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-white/60">
                    Choose your plan and provide administrative details. Our engineers will set up your portal and databases.
                  </p>
                </div>

                {/* ── Real Plan Selector Cards ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70">
                      Select Subscription Tier *
                    </label>
                    {plansLoading && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <HiOutlineRefresh size={12} className="animate-spin" /> Loading plans...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {activePlans.map((plan) => {
                      const pid = plan.planId || plan.id;
                      const isSelected = pid === selectedPlanId;
                      const priceLabel = plan.price?.monthly
                        ? `PKR ${plan.price.monthly.toLocaleString()}/mo`
                        : 'Free Tier';

                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => setSelectedPlanId(pid)}
                          className={`relative flex flex-col justify-between rounded-xl p-3 text-left transition-all duration-200 border-2 ${
                            isSelected
                              ? 'border-[#0A4D94] bg-[#0A4D94]/[0.06] dark:border-brand-blue-400 dark:bg-brand-blue-500/10 shadow-sm'
                              : 'border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0A4D94] text-white dark:bg-brand-blue-400">
                              <HiOutlineCheck size={11} />
                            </span>
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{plan.name}</p>
                            <p className="mt-0.5 text-[11px] font-extrabold text-[#0A4D94] dark:text-brand-blue-400">
                              {priceLabel}
                            </p>
                          </div>
                          <p className="mt-2 text-[10px] text-slate-500 dark:text-white/50">
                            {plan.limits?.maxStudents === -1
                              ? 'Unlimited students'
                              : `${plan.limits?.maxStudents || 500} students`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Form Fields ── */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* College Name */}
                  <div>
                    <label htmlFor="collegeName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70 mb-1.5">
                      College / Institution Name *
                    </label>
                    <div className="relative">
                      <HiOutlineOfficeBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" size={17} />
                      <input
                        type="text"
                        id="collegeName"
                        name="collegeName"
                        value={formData.collegeName}
                        onChange={handleChange}
                        placeholder="e.g. Punjab College of Science"
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121b2b] pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Grid: Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="adminEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70 mb-1.5">
                        Administrator Email *
                      </label>
                      <div className="relative">
                        <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" size={17} />
                        <input
                          type="email"
                          id="adminEmail"
                          name="adminEmail"
                          value={formData.adminEmail}
                          onChange={handleChange}
                          placeholder="admin@college.edu.pk"
                          className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121b2b] pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70 mb-1.5">
                        Contact Phone *
                      </label>
                      <div className="relative">
                        <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" size={17} />
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="0300-1234567"
                          className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121b2b] pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Student Count */}
                  <div>
                    <label htmlFor="studentCount" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70 mb-1.5">
                      Estimated Student Strength *
                    </label>
                    <div className="relative">
                      <HiOutlineAcademicCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" size={17} />
                      <input
                        type="number"
                        id="studentCount"
                        name="studentCount"
                        value={formData.studentCount}
                        onChange={handleChange}
                        placeholder="e.g. 1200"
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121b2b] pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                        min="1"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Message / Requirements */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70 mb-1.5">
                      Special Requirements or Existing Software (Optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Mention specific programs, multiple campus branches, biometric machines, or custom needs..."
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121b2b] p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition min-h-[72px]"
                      disabled={loading}
                    />
                  </div>

                  {/* Preferred Contact Method */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70 mb-1.5">
                      Preferred Follow-up Method
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-white/80 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredContact"
                          value="email"
                          checked={formData.preferredContact === 'email'}
                          onChange={handleChange}
                          disabled={loading}
                          className="accent-[#0A4D94]"
                        />
                        Email Address
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-white/80 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredContact"
                          value="phone"
                          checked={formData.preferredContact === 'phone'}
                          onChange={handleChange}
                          disabled={loading}
                          className="accent-[#0A4D94]"
                        />
                        Phone / WhatsApp
                      </label>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                      <HiOutlineExclamationCircle size={16} className="shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A4D94] hover:bg-[#083e78] py-3.5 px-6 font-bold text-xs sm:text-sm text-white shadow-[0_10px_24px_-10px_rgba(10,77,148,0.7)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Provisioning Request...
                      </div>
                    ) : (
                      <>
                        Request {currentPlan.name} <HiOutlineArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-slate-400 dark:text-white/40 pt-1">
                    No upfront credit card required. Our team assists with complete data onboarding.
                  </p>
                </form>
              </div>
            )}

          </div>
        </div>
      </section>

    </div>
  );
}

export default function RequestSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-app text-fg">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A4D94] border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500">Loading subscription details...</p>
          </div>
        </div>
      }
    >
      <SubscriptionRequestContent />
    </Suspense>
  );
}
