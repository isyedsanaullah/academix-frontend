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
  HiOutlineServer,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCreditCard,
  HiOutlineDatabase,
  HiOutlineCollection,
  HiOutlineSwitchHorizontal,
  HiOutlineStar,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import { apiGet, apiPost } from '@/lib/api';
import LoginArt from '@/legacy-pages/auth/LoginArt.jsx';

// ─── Canonical fallback data ───────────────────────────────────────────────────
const FALLBACK_PLANS = [
  {
    planId: 'starter',
    name: 'Starter',
    description: 'Run college day-to-day on 1 screen',
    monthlyPrice: 2999,
    yearlyPrice: 32989,
    limits: { maxStudents: 300, maxStaff: 20, maxAdmins: 2, maxCampuses: 1, maxStorageBytes: 5368709120, maxApplications: 0 },
  },
  {
    planId: 'standard',
    name: 'Standard',
    description: 'Admissions, fees, board exams & staff',
    monthlyPrice: 5999,
    yearlyPrice: 65989,
    limits: { maxStudents: 750, maxStaff: 50, maxAdmins: 5, maxCampuses: 1, maxStorageBytes: 26843545600, maxApplications: 50 },
  },
  {
    planId: 'premium',
    name: 'Premium',
    description: 'Parents, results analysis, AI help, 2 campuses',
    monthlyPrice: 10999,
    yearlyPrice: 120989,
    limits: { maxStudents: 1500, maxStaff: 100, maxAdmins: 10, maxCampuses: 2, maxStorageBytes: 107374182400, maxApplications: 150 },
  },
  {
    planId: 'enterprise',
    name: 'Enterprise',
    description: 'Full AI, autonomous agent, 3 campuses, API',
    monthlyPrice: 17999,
    yearlyPrice: 197989,
    limits: { maxStudents: 3000, maxStaff: 200, maxAdmins: 25, maxCampuses: 3, maxStorageBytes: 322122547200, maxApplications: 400 },
  },
];

const SERVICE_COUNTS = { starter: 33, standard: 88, premium: 141, enterprise: 162 };

const AI_TIERS = {
  starter: { label: 'None', color: 'text-fg-muted' },
  standard: { label: 'AI Lite', color: 'text-sky-600 dark:text-sky-400' },
  premium: { label: 'AI Plus', color: 'text-violet-600 dark:text-violet-400' },
  enterprise: { label: 'AI Full + Agent', color: 'text-emerald-600 dark:text-emerald-400' },
};

const MSG_CREDITS = {
  starter: 'Add-on only',
  standard: 'Add-on only',
  premium: '200 / mo',
  enterprise: '600 / mo',
};

const PLAN_THEME = {
  starter: {
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
    ring: 'ring-slate-300 dark:ring-slate-700',
    btn: 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white',
    dot: 'bg-slate-400',
  },
  standard: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
    ring: 'ring-amber-400 dark:ring-amber-500',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
    dot: 'bg-amber-400',
  },
  premium: {
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700',
    ring: 'ring-violet-400 dark:ring-violet-500',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white',
    dot: 'bg-violet-400',
  },
  enterprise: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700',
    ring: 'ring-emerald-400 dark:ring-emerald-500',
    btn: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    dot: 'bg-emerald-400',
  },
};

function formatBytes(bytes) {
  if (!bytes) return '—';
  const gb = bytes / 1073741824;
  return `${Math.round(gb)} GB`;
}

function formatFeature(feat) {
  return feat.replace(/^ai-/, 'AI ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ─── Billing Toggle ────────────────────────────────────────────────────────────
function BillingToggle({ cycle, onChange }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className={`text-sm font-semibold ${cycle === 'monthly' ? 'text-fg' : 'text-fg-muted'}`}>Monthly</span>
      <button
        type="button"
        onClick={() => onChange(cycle === 'monthly' ? 'yearly' : 'monthly')}
        className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors duration-200 ${
          cycle === 'yearly' ? 'bg-[#0A4D94]' : 'bg-slate-300 dark:bg-slate-600'
        }`}
        aria-label="Toggle billing cycle"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            cycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-semibold ${cycle === 'yearly' ? 'text-fg' : 'text-fg-muted'}`}>Yearly</span>
      {cycle === 'yearly' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          <HiOutlineStar size={12} /> 1 Month FREE
        </span>
      )}
    </div>
  );
}

// ─── Single Plan Card ──────────────────────────────────────────────────────────
function PlanCard({ plan, cycle, counts, isSelected, onSelect }) {
  const pid = plan.planId;
  const theme = PLAN_THEME[pid] || PLAN_THEME.starter;
  const price = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const isMostPopular = pid === 'standard';
  const isBestValue = pid === 'enterprise';
  const serviceCount = counts[pid] || SERVICE_COUNTS[pid] || '?';
  const lim = plan.limits || {};

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 bg-card p-5 transition-all duration-200 cursor-pointer
        ${isSelected
          ? `border-[#0A4D94] dark:border-brand-blue-400 shadow-lg ring-2 ${theme.ring}`
          : 'border-line hover:border-line-strong hover:shadow-md'
        }`}
      onClick={() => onSelect(pid)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(pid)}
      aria-pressed={isSelected}
    >
      {/* Top banners */}
      {isMostPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#0A4D94] px-3 py-0.5 text-[11px] font-bold text-white shadow">
            ⭐ Most Popular
          </span>
        </div>
      )}
      {isBestValue && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white shadow">
            🏆 Best Value
          </span>
        </div>
      )}

      {/* Plan name + badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isSelected && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0A4D94] text-white"><HiOutlineCheck size={11} /></span>}
          <h3 className="text-base font-black text-fg tracking-tight">{plan.name}</h3>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
          {serviceCount} Services
        </span>
      </div>

      <p className="text-xs text-fg-muted mb-4 leading-relaxed">{plan.description}</p>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-fg">PKR {price?.toLocaleString()}</span>
          <span className="text-xs text-fg-muted font-semibold">/{cycle === 'yearly' ? 'yr' : 'mo'}</span>
        </div>
        {cycle === 'yearly' && (
          <p className="text-[11px] text-fg-muted mt-0.5">
            ~PKR {Math.round(price / 11).toLocaleString()}/mo · billed annually
          </p>
        )}
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
          ✓ 14-Day Free Trial
        </p>
      </div>

      {/* Key limits */}
      <div className="space-y-1.5 text-xs text-fg-muted mb-5">
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><HiOutlineUsers size={13} /> Students</span>
          <span className="font-semibold text-fg">{lim.maxStudents?.toLocaleString() || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><HiOutlineUsers size={13} /> Staff</span>
          <span className="font-semibold text-fg">{lim.maxStaff?.toLocaleString() || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>Admins</span>
          <span className="font-semibold text-fg">{lim.maxAdmins || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>Campuses</span>
          <span className="font-semibold text-fg">{lim.maxCampuses || 1}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><HiOutlineServer size={13} /> Storage</span>
          <span className="font-semibold text-fg">{formatBytes(lim.maxStorageBytes)}</span>
        </div>
        <div className="flex justify-between">
          <span>Applications/yr</span>
          <span className="font-semibold text-fg">{lim.maxApplications ? lim.maxApplications.toLocaleString() : 'Manual only'}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1"><HiOutlineCreditCard size={13} /> Messages</span>
          <span className="font-semibold text-fg">{MSG_CREDITS[pid] || '—'}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-line">
          <span className="flex items-center gap-1"><HiOutlineSparkles size={13} /> AI Tier</span>
          <span className={`font-bold ${AI_TIERS[pid]?.color}`}>{AI_TIERS[pid]?.label || '—'}</span>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onSelect(pid); document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' }); }}
        className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all ${theme.btn}`}
      >
        Select {plan.name} <HiOutlineArrowRight className="inline ml-1" size={13} />
      </button>
    </div>
  );
}

// ─── Add-ons Section ───────────────────────────────────────────────────────────
function AddonsSection({ addons, cycle }) {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = {};
    for (const a of addons) {
      if (!map[a.addonType]) map[a.addonType] = [];
      map[a.addonType].push(a);
    }
    return map;
  }, [addons]);

  const ADDON_ICONS = {
    STUDENTS: HiOutlineUsers,
    STAFF: HiOutlineUsers,
    ADMINS: HiOutlineUsers,
    CAMPUS: HiOutlineCollection,
    STORAGE_GB: HiOutlineDatabase,
    SMS_PACK_500: HiOutlineCreditCard,
    SMS_PACK_2000: HiOutlineCreditCard,
    SMS_PACK_5000: HiOutlineCreditCard,
    AI_TOKENS_1M: HiOutlineSparkles,
    AI_TOKENS_5M: HiOutlineSparkles,
    AI_TOKENS_40M: HiOutlineSparkles,
    MODULE_LIBRARY: HiOutlineCollection,
    MODULE_CANTEEN: HiOutlineCollection,
    MODULE_TRANSPORT: HiOutlineCollection,
    MODULE_HOSTEL: HiOutlineCollection,
  };

  if (!addons.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-card-2 transition"
      >
        <div>
          <h3 className="text-sm font-bold text-fg">Add-On Pricing</h3>
          <p className="text-xs text-fg-muted mt-0.5">Capacity upgrades & module unlocks — available after activation</p>
        </div>
        {open ? <HiOutlineChevronUp size={18} className="text-fg-muted shrink-0" /> : <HiOutlineChevronDown size={18} className="text-fg-muted shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-line px-5 py-4 space-y-5">
          {Object.entries(grouped).map(([type, rows]) => {
            const Icon = ADDON_ICONS[type] || HiOutlineCollection;
            const label = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} className="text-fg-muted shrink-0" />
                  <span className="text-xs font-bold text-fg uppercase tracking-wider">{label}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map(r => {
                    const price = cycle === 'yearly' ? r.unitPriceYearlyPkr : r.unitPriceMonthlyPkr;
                    return (
                      <div key={r.id || `${r.addonType}-${r.planId}`} className="rounded-xl border border-line bg-card-2 p-3">
                        <p className="text-xs font-semibold text-fg">{r.name}</p>
                        <p className="text-sm font-black text-[#0A4D94] dark:text-brand-blue-400 mt-1">
                          PKR {price?.toLocaleString()}<span className="text-xs font-semibold text-fg-muted">/{cycle === 'yearly' ? 'yr' : 'mo'}</span>
                        </p>
                        <p className="text-[11px] text-fg-muted mt-0.5">From {r.planId?.charAt(0).toUpperCase() + r.planId?.slice(1)} plan</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Proration note */}
          <div className="rounded-xl border border-blue-200/60 dark:border-brand-blue-400/20 bg-blue-50/60 dark:bg-brand-blue-500/5 p-3.5">
            <p className="text-xs text-fg-muted leading-relaxed">
              <span className="font-bold text-fg">Proration: </span>Unused days on your current cycle are credited when you upgrade.
              {' '}<span className="font-bold text-fg">Add-on caps: </span>up to 50% of base for student/staff headcount, up to 100% for storage.
              Add-ons are available on your chosen plan after subscription activation — request them from your Admin dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Content Component ───────────────────────────────────────────────────
function SubscriptionRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPlan = searchParams?.get('plan')?.toLowerCase() || 'standard';
  const initialCycle = searchParams?.get('cycle')?.toLowerCase() === 'yearly' ? 'yearly' : 'monthly';

  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [counts, setCounts] = useState(SERVICE_COUNTS);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [billingCycle, setBillingCycle] = useState(initialCycle);

  const [formData, setFormData] = useState({
    collegeName: '',
    adminEmail: '',
    phone: '',
    studentCount: '',
    message: '',
    preferredContact: 'email',
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
        if (d?.success && d?.data) {
          if (Array.isArray(d.data.plans) && d.data.plans.length > 0) setPlans(d.data.plans);
          if (Array.isArray(d.data.addons)) setAddons(d.data.addons);
          if (d.data.counts) setCounts({ ...SERVICE_COUNTS, ...d.data.counts });
        }
      })
      .catch(() => {/* use fallback */})
      .finally(() => { if (mounted) setPlansLoading(false); });
    return () => { mounted = false; };
  }, []);

  const activePlans = useMemo(() => (plans.length > 0 ? plans : FALLBACK_PLANS), [plans]);
  const currentPlan = useMemo(() => activePlans.find(p => p.planId === selectedPlanId) || activePlans[1] || FALLBACK_PLANS[1], [activePlans, selectedPlanId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.collegeName.trim()) { toast.error('College name is required'); return false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.adminEmail.trim() || !emailRe.test(formData.adminEmail)) { toast.error('A valid administrator email is required'); return false; }
    const phoneRe = /^\+?[0-9\s\-]{7,15}$/;
    if (!formData.phone.trim() || !phoneRe.test(formData.phone)) { toast.error('A valid contact phone number is required'); return false; }
    const students = parseInt(formData.studentCount, 10);
    if (isNaN(students) || students <= 0) { toast.error('Estimated student count must be a positive number'); return false; }
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
        selectedPlan: selectedPlanId,
        billingCycle,
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

  const currentPrice = billingCycle === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;

  return (
    <div className="min-h-dvh bg-app text-fg">

      {/* ════════ DESKTOP STICKY LEFT PANEL ════════ */}
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] selection:bg-accent-soft">
        <aside
          className="relative hidden overflow-hidden bg-gradient-to-br from-brand-blue-900 via-surface-900 to-surface-950 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:p-10 xl:p-12"
          aria-label="Collegeshub subscription overview"
        >
          {/* Background glows */}
          <div className="login-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-blue-500/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-brand-green-600/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" aria-hidden="true" />

          {/* Animated artwork */}
          <div className="pointer-events-none absolute inset-0 flex items-start justify-end pl-16 pr-0 pb-52 pt-6 xl:pl-20" aria-hidden="true">
            <LoginArt className="h-full w-full max-w-[560px]" />
          </div>

          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5 rounded-lg">
              <Image src="/logo-mark.svg" alt="" width={36} height={34} priority />
              <span className="text-lg font-extrabold tracking-tight">
                Collegeshub<span className="text-brand-green-500">.org</span>
              </span>
            </Link>
            <Link href="/" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white">
              <HiOutlineHome size={14} aria-hidden="true" /> Back to Home
            </Link>
          </div>

          {/* Live Selected Plan Showcase */}
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
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white/80">
                      {counts[selectedPlanId] || SERVICE_COUNTS[selectedPlanId] || '?'} Services
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/60 line-clamp-1">{currentPlan.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-extrabold text-white">
                    PKR {currentPrice?.toLocaleString() || '—'}
                  </span>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-white/50">
                    / {billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
              </div>

              {/* Quick stat grid */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/80">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <HiOutlineUsers size={16} className="text-brand-blue-400 shrink-0" />
                  <span className="truncate">Up to {currentPlan.limits?.maxStudents?.toLocaleString() || '?'} Students</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <HiOutlineServer size={16} className="text-brand-green-500 shrink-0" />
                  <span className="truncate">{formatBytes(currentPlan.limits?.maxStorageBytes)} Storage</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <HiOutlineSparkles size={16} className="text-violet-400 shrink-0" />
                  <span className="truncate">{AI_TIERS[selectedPlanId]?.label || '—'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <HiOutlineSwitchHorizontal size={16} className="text-amber-400 shrink-0" />
                  <span className="truncate">{currentPlan.limits?.maxCampuses || 1} Campus{currentPlan.limits?.maxCampuses > 1 ? 'es' : ''}</span>
                </div>
              </div>

              {/* Trial badge */}
              <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-brand-green-600/15 border border-brand-green-500/20 px-3 py-2">
                <HiOutlineCheckCircle size={15} className="text-brand-green-400 shrink-0" />
                <span className="text-xs font-semibold text-brand-green-300">14-Day Free Trial — Full Access, No Credit Card</span>
              </div>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-6 text-[11px] font-medium text-white/60">
              <span className="flex items-center gap-1.5"><HiOutlineShieldCheck size={15} className="text-brand-green-400" /> Isolated Data Vault</span>
              <span className="flex items-center gap-1.5"><HiOutlineLightningBolt size={15} className="text-brand-blue-400" /> 99.9% Cloud Uptime</span>
            </div>
            <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} Collegeshub.org &bull; Secure Multi-Tenant Cloud</p>
          </div>
        </aside>

        {/* ════════ RIGHT: Pricing + Form ════════ */}
        <section className="relative flex flex-col overflow-y-auto bg-app">
          <div className="brand-rail" aria-hidden="true" />

          {/* Mobile brand header */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-brand-blue-900 to-surface-950 px-4 py-3 text-white sm:px-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5 rounded-lg">
              <Image src="/logo-mark.svg" alt="" width={32} height={30} priority />
              <span className="text-base font-extrabold tracking-tight">
                Collegeshub<span className="text-brand-green-500">.org</span>
              </span>
            </Link>
            <Link href="/" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
              <HiOutlineHome size={14} aria-hidden="true" /> Home
            </Link>
          </div>

          <div className="flex-1 px-4 py-8 sm:px-8 sm:py-10 space-y-10 max-w-3xl mx-auto w-full">

            {/* ── Hero heading ── */}
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-[11px] font-bold text-fg-muted">
                <HiOutlineCollection size={13} />
                162 Services · 4 Tiers · PKR Pricing
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
                Compare Plans &amp; Pricing
              </h1>
              <p className="text-sm text-fg-muted max-w-md mx-auto">
                All prices in PKR. Yearly billing saves one month.
                <Link href="/services" className="ml-1.5 text-[#0A4D94] dark:text-brand-blue-400 font-semibold hover:underline">
                  View all 162 services →
                </Link>
              </p>
            </div>

            {/* ── Billing Toggle ── */}
            <div className="flex justify-center">
              <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />
            </div>

            {/* ── Plan Cards ── */}
            {plansLoading && activePlans.length === 0 ? (
              <CollegesHubLoader size="sm" text="Fetching available tiers…" minHeight="min-h-[200px]" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activePlans.map(plan => (
                  <PlanCard
                    key={plan.planId}
                    plan={plan}
                    cycle={billingCycle}
                    counts={counts}
                    isSelected={plan.planId === selectedPlanId}
                    onSelect={setSelectedPlanId}
                  />
                ))}
              </div>
            )}

            {/* ── Add-Ons Section ── */}
            {addons.length > 0 && (
              <AddonsSection addons={addons} cycle={billingCycle} />
            )}

            {/* ── Request Form ── */}
            <div id="request-form" className="rounded-2xl border border-line bg-card p-6 sm:p-8 scroll-mt-8">
              {success ? (
                <div className="text-center py-8 space-y-6 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                    <HiOutlineCheckCircle size={36} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-fg tracking-tight">Request Submitted!</h2>
                    <p className="text-xs sm:text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
                      Thank you for requesting the <strong className="text-fg">{currentPlan.name}</strong> for{' '}
                      <strong className="text-fg">{formData.collegeName}</strong>. Our provisioning team will contact you at{' '}
                      <strong className="text-fg">{formData.adminEmail}</strong> or{' '}
                      <strong className="text-fg">{formData.phone}</strong> shortly.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button onClick={() => router.push('/')} className="w-full sm:w-auto btn-primary py-2.5 px-6 text-xs font-bold">
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
                  {/* Form header */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#0A4D94]/10 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0A4D94] dark:text-brand-blue-400">
                        Request Form
                      </span>
                      <span className="text-xs text-fg-muted">· Institution Onboarding</span>
                    </div>
                    <h2 className="text-xl font-black text-fg tracking-tight">Request Your College Subscription</h2>
                    <p className="mt-1 text-xs text-fg-muted">
                      Provide administrative details. Our engineers will set up your portal and databases within 24–48 hours.
                    </p>
                  </div>

                  {/* Plan selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-2">
                      Selected Tier *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activePlans.map(plan => {
                        const pid = plan.planId;
                        const isSelected = pid === selectedPlanId;
                        const theme = PLAN_THEME[pid] || PLAN_THEME.starter;
                        const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => setSelectedPlanId(pid)}
                            className={`relative flex flex-col justify-between rounded-xl p-3 text-left transition-all duration-200 border-2 ${
                              isSelected
                                ? 'border-[#0A4D94] bg-[#0A4D94]/[0.06] dark:border-brand-blue-400 dark:bg-brand-blue-500/10 shadow-sm'
                                : 'border-line bg-card-2 hover:border-line-strong'
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0A4D94] text-white dark:bg-brand-blue-400">
                                <HiOutlineCheck size={11} />
                              </span>
                            )}
                            <p className="text-xs font-bold text-fg pr-4">{plan.name}</p>
                            <p className="mt-1 text-[11px] font-extrabold text-[#0A4D94] dark:text-brand-blue-400">
                              PKR {price?.toLocaleString()}/{billingCycle === 'yearly' ? 'yr' : 'mo'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Billing cycle radio */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-2">Billing Cycle *</span>
                    <div className="flex gap-4">
                      {['monthly', 'yearly'].map(c => (
                        <label key={c} className="flex items-center gap-2 text-xs text-fg cursor-pointer">
                          <input type="radio" name="billingCycle" value={c} checked={billingCycle === c} onChange={() => setBillingCycle(c)} className="accent-[#0A4D94]" />
                          {c.charAt(0).toUpperCase() + c.slice(1)}{c === 'yearly' ? ' (1 Month FREE)' : ''}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Form fields */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* College Name */}
                    <div>
                      <label htmlFor="collegeName" className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5">
                        College / Institution Name *
                      </label>
                      <div className="relative">
                        <HiOutlineOfficeBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" size={17} />
                        <input
                          type="text" id="collegeName" name="collegeName"
                          value={formData.collegeName} onChange={handleChange}
                          placeholder="e.g. Punjab College of Science"
                          className="w-full rounded-xl border border-line bg-card-2 pl-10 pr-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                          required disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label htmlFor="adminEmail" className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5">
                          Administrator Email *
                        </label>
                        <div className="relative">
                          <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" size={17} />
                          <input
                            type="email" id="adminEmail" name="adminEmail"
                            value={formData.adminEmail} onChange={handleChange}
                            placeholder="admin@college.edu.pk"
                            className="w-full rounded-xl border border-line bg-card-2 pl-10 pr-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                            required disabled={loading}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5">
                          Contact Phone *
                        </label>
                        <div className="relative">
                          <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" size={17} />
                          <input
                            type="text" id="phone" name="phone"
                            value={formData.phone} onChange={handleChange}
                            placeholder="0300-1234567"
                            className="w-full rounded-xl border border-line bg-card-2 pl-10 pr-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                            required disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Student Count */}
                    <div>
                      <label htmlFor="studentCount" className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5">
                        Estimated Student Strength *
                      </label>
                      <div className="relative">
                        <HiOutlineAcademicCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" size={17} />
                        <input
                          type="number" id="studentCount" name="studentCount"
                          value={formData.studentCount} onChange={handleChange}
                          placeholder="e.g. 1200" min="1"
                          className="w-full rounded-xl border border-line bg-card-2 pl-10 pr-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
                          required disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5">
                        Special Requirements or Existing Software (Optional)
                      </label>
                      <textarea
                        id="message" name="message"
                        value={formData.message} onChange={handleChange}
                        placeholder="Mention specific programs, multiple campus branches, biometric machines, or custom needs..."
                        className="w-full rounded-xl border border-line bg-card-2 p-3 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition min-h-[72px]"
                        disabled={loading}
                      />
                    </div>

                    {/* Preferred Contact */}
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5">Preferred Follow-up Method</span>
                      <div className="flex gap-4">
                        {[{ value: 'email', label: 'Email Address' }, { value: 'phone', label: 'Phone / WhatsApp' }].map(opt => (
                          <label key={opt.value} className="flex items-center gap-2 text-xs text-fg cursor-pointer">
                            <input
                              type="radio" name="preferredContact" value={opt.value}
                              checked={formData.preferredContact === opt.value}
                              onChange={handleChange} disabled={loading}
                              className="accent-[#0A4D94]"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                        <HiOutlineExclamationCircle size={16} className="shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit" disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A4D94] hover:bg-[#083e78] py-3.5 px-6 font-bold text-xs sm:text-sm text-white shadow-[0_10px_24px_-10px_rgba(10,77,148,0.7)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Submitting Request...
                        </div>
                      ) : (
                        <>Request {currentPlan.name} <HiOutlineArrowRight size={15} /></>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-fg-muted pt-1">
                      No upfront credit card required. Our team assists with complete data onboarding.
                    </p>
                  </form>
                </div>
              )}
            </div>

            {/* Trust footer row */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fg-muted pb-4">
              <span className="flex items-center gap-1.5"><HiOutlineCheckCircle size={14} className="text-emerald-500" /> 14-Day Free Trial</span>
              <span className="flex items-center gap-1.5"><HiOutlineCreditCard size={14} className="text-blue-500" /> No Credit Card</span>
              <span className="flex items-center gap-1.5"><HiOutlineShieldCheck size={14} className="text-violet-500" /> PKR Pricing</span>
              <span className="flex items-center gap-1.5"><HiOutlineServer size={14} className="text-amber-500" /> Secure Cloud</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function SubscriptionRequestClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-app text-fg">
          <CollegesHubLoader size="lg" text="Loading subscription details..." />
        </div>
      }
    >
      <SubscriptionRequestContent />
    </Suspense>
  );
}
