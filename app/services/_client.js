'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineExternalLink,
  HiOutlineCollection,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlineClock,
} from 'react-icons/hi';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import { apiGet } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_OPTIONS = [
  { id: 'all', label: 'All Plans' },
  { id: 'starter', label: 'Starter' },
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: 'Premium' },
  { id: 'enterprise', label: 'Enterprise' },
];

const PLAN_THEME = {
  starter: {
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
    btn: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    btnActive: 'bg-slate-700 text-white border-slate-700',
  },
  standard: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-400',
    btn: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    btnActive: 'bg-amber-600 text-white border-amber-600',
  },
  premium: {
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700',
    dot: 'bg-violet-400',
    btn: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    btnActive: 'bg-violet-600 text-white border-violet-600',
  },
  enterprise: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
    btn: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    btnActive: 'bg-emerald-700 text-white border-emerald-700',
  },
};

const CATEGORY_ICONS = {
  'Academic Core': '🎓',
  'Admissions & Board': '📋',
  'Fees & Treasury': '💰',
  'Gate & Security': '🔐',
  'HR & Staff': '👥',
  'Parents & Comms': '📱',
  'Examination & Test Prep': '📝',
  'Operations': '⚙️',
  'Governance & Infrastructure': '🏛️',
  'AI & Intelligence Suite': '🤖',
};

// ─── Plan Badge ───────────────────────────────────────────────────────────────
function PlanBadge({ plan }) {
  const theme = PLAN_THEME[plan] || PLAN_THEME.starter;
  const label = plan.charAt(0).toUpperCase() + plan.slice(1);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${theme.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      {label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
        <HiOutlineLightningBolt size={10} /> Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
      <HiOutlineClock size={10} /> Roadmap
    </span>
  );
}

// ─── Service Accordion Card ───────────────────────────────────────────────────
function ServiceCard({ service }) {
  const [open, setOpen] = useState(false);
  const isComingSoon = service.status === 'coming_soon';

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isComingSoon ? 'border-line bg-card/60 opacity-80' : 'border-line bg-card hover:border-line-strong hover:shadow-sm'
    }`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        {/* Service ID */}
        <span className="text-[10px] font-mono font-bold text-fg-faint w-14 shrink-0">
          {service.id}
        </span>

        {/* Name */}
        <span className={`flex-1 text-sm font-semibold ${isComingSoon ? 'text-fg-muted' : 'text-fg'}`}>
          {service.name}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PlanBadge plan={service.startsIn} />
          <StatusBadge status={service.status} />
          {open
            ? <HiOutlineChevronUp size={15} className="text-fg-muted ml-1 shrink-0" />
            : <HiOutlineChevronDown size={15} className="text-fg-muted ml-1 shrink-0" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-4 space-y-3">
          {/* Description */}
          <p className="text-xs text-fg-muted leading-relaxed">{service.description}</p>

          {/* Institution Benefit */}
          {service.institutionBenefit && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50/60 dark:bg-brand-blue-500/5 border border-blue-200/50 dark:border-brand-blue-400/15 px-3 py-2.5">
              <HiOutlineCheck size={14} className="text-[#0A4D94] dark:text-brand-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-fg">{service.institutionBenefit}</p>
            </div>
          )}

          {/* Tier Progression */}
          {service.tierLevels && Object.keys(service.tierLevels).length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted mb-2">Tier Progression</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.entries(service.tierLevels).map(([tier, desc]) => (
                  <div key={tier} className="flex items-start gap-2 rounded-lg border border-line bg-card-2 px-3 py-2">
                    <PlanBadge plan={tier} />
                    <p className="text-[11px] text-fg-muted leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-on note */}
          {service.addonTiers && service.addonTiers.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200/60 dark:border-amber-700/30 bg-amber-50/50 dark:bg-amber-500/5 px-3 py-2">
              <HiOutlineCollection size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Also available as add-on on: {service.addonTiers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
              </p>
            </div>
          )}

          {/* Coming soon note */}
          {isComingSoon && (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-card-2 px-3 py-2">
              <HiOutlineClock size={13} className="text-fg-muted shrink-0" />
              <p className="text-[11px] text-fg-muted">On our development roadmap. Subscribe now to get access when it launches.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category Tab ─────────────────────────────────────────────────────────────
function CategoryTab({ category, isActive, count, onClick }) {
  const emoji = CATEGORY_ICONS[category] || '📌';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-[#0A4D94] border-[#0A4D94] text-white shadow-sm'
          : 'border-line bg-card text-fg-muted hover:border-line-strong hover:text-fg'
      }`}
    >
      <span>{emoji}</span>
      <span className="hidden sm:inline">{category}</span>
      <span className="sm:hidden">{category.split(' ')[0]}</span>
      {count !== undefined && (
        <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          isActive ? 'bg-white/20 text-white' : 'bg-card-2 text-fg-muted'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ServicesClient() {
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ total: 162, live: 86, comingSoon: 76, starter: 33, standard: 88, premium: 141, enterprise: 162 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeCategory, setActiveCategory] = useState('all');
  const [activePlan, setActivePlan] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch data from backend with resilient path fallback
  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      try {
        let d = null;
        try {
          d = await apiGet('/public/services-catalog');
        } catch (e1) {
          try {
            d = await apiGet('/services-catalog');
          } catch (e2) {
            d = await apiGet('/services');
          }
        }
        if (!mounted) return;
        if (d?.success && d?.data) {
          setAllServices(d.data.services || []);
          setCategories(d.data.categories || []);
          if (d.data.summary) setSummary(d.data.summary);
        } else {
          setError('Failed to load services catalog.');
        }
      } catch (err) {
        if (mounted) setError('Could not reach the server. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCatalog();
    return () => { mounted = false; };
  }, []);

  // Filtered + searched services
  const filteredServices = useMemo(() => {
    let result = allServices;

    if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory);
    }

    if (activePlan !== 'all') {
      const planLevels = { starter: 1, standard: 2, premium: 3, enterprise: 4 };
      const targetLevel = planLevels[activePlan] ?? 0;
      result = result.filter(s => (planLevels[s.startsIn] ?? 0) <= targetLevel);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.institutionBenefit?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allServices, activeCategory, activePlan, debouncedSearch]);

  // Count per category for tab badges
  const categoryCounts = useMemo(() => {
    const map = { all: allServices.length };
    for (const s of allServices) {
      map[s.category] = (map[s.category] || 0) + 1;
    }
    return map;
  }, [allServices]);

  // Group filtered services by category for rendering
  const grouped = useMemo(() => {
    if (activeCategory !== 'all') {
      return { [activeCategory]: filteredServices };
    }
    const map = {};
    for (const s of filteredServices) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    return map;
  }, [filteredServices, activeCategory]);

  const handleReset = useCallback(() => {
    setActiveCategory('all');
    setActivePlan('all');
    setSearch('');
  }, []);

  const hasFilters = activeCategory !== 'all' || activePlan !== 'all' || debouncedSearch.trim();

  return (
    <div className="min-h-dvh bg-app text-fg">

      {/* ── Topbar ── */}
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 rounded-lg">
                <Image src="/logo-mark.svg" alt="" width={28} height={27} priority />
                <span className="text-sm font-extrabold tracking-tight text-fg hidden sm:inline">
                  Collegeshub<span className="text-brand-green-600 dark:text-brand-green-500">.org</span>
                </span>
              </Link>
              <span className="text-fg-faint">/</span>
              <span className="text-sm font-bold text-fg">Services</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-1.5 text-xs font-semibold text-fg-muted hover:text-fg transition"
              >
                <HiOutlineHome size={13} /> Home
              </Link>
              <Link
                href="/request-subscription"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A4D94] px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-[#083e78] transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Stats Bar ── */}
      <div className="bg-gradient-to-r from-brand-blue-900 via-surface-800 to-surface-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HiOutlineCollection size={18} className="text-brand-green-400" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Complete Service Catalog
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-white/70 max-w-lg">
                All features and services across every subscription tier — from daily college ops to AI-powered analytics.
              </p>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center">
                <p className="text-lg font-black">{summary.total}</p>
                <p className="text-[10px] text-white/60 font-semibold">Total</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
                <p className="text-lg font-black text-emerald-300">{summary.live}</p>
                <p className="text-[10px] text-emerald-400/80 font-semibold">Live</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center">
                <p className="text-lg font-black text-amber-300">{summary.comingSoon}</p>
                <p className="text-[10px] text-amber-400/80 font-semibold">Roadmap</p>
              </div>
              <Link
                href="/request-subscription"
                className="flex items-center gap-1.5 rounded-xl border border-brand-blue-400/40 bg-brand-blue-500/15 px-3 py-2 text-xs font-bold text-brand-blue-300 hover:bg-brand-blue-500/25 transition"
              >
                Compare Plans <HiOutlineExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="sticky top-14 z-20 border-b border-line bg-card/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-3">

          {/* Search */}
          <div className="relative">
            <HiOutlineSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services by name, description, or ID…"
              className="w-full rounded-xl border border-line bg-card-2 pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:border-[#0A4D94] dark:focus:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
              >
                ✕
              </button>
            )}
          </div>

          {/* Plan filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <HiOutlineFilter size={14} className="text-fg-muted shrink-0" />
            {PLAN_OPTIONS.map(opt => {
              const isActive = activePlan === opt.id;
              const theme = PLAN_THEME[opt.id];
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActivePlan(opt.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                    opt.id === 'all'
                      ? isActive
                        ? 'bg-[#0A4D94] border-[#0A4D94] text-white'
                        : 'border-line bg-card text-fg-muted hover:text-fg'
                      : isActive
                        ? theme?.btnActive
                        : `${theme?.btn} hover:border-current`
                  } border`}
                >
                  {opt.label}
                  {opt.id !== 'all' && summary[opt.id] && (
                    <span className="ml-1 opacity-70">({summary[opt.id]})</span>
                  )}
                </button>
              );
            })}

            {hasFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="ml-auto flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition"
              >
                <HiOutlineRefresh size={13} /> Reset
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <CategoryTab
              category="all"
              isActive={activeCategory === 'all'}
              count={categoryCounts.all}
              onClick={() => setActiveCategory('all')}
            />
            {categories.map(cat => (
              <CategoryTab
                key={cat}
                category={cat}
                isActive={activeCategory === cat}
                count={categoryCounts[cat]}
                onClick={() => setActiveCategory(cat === activeCategory ? 'all' : cat)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {loading && (
          <CollegesHubLoader size="md" text="Loading 162 services…" minHeight="min-h-[300px]" />
        )}

        {!loading && error && (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">⚠️</p>
            <p className="text-sm font-semibold text-fg">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-secondary text-xs px-4 py-2">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredServices.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="text-sm font-semibold text-fg">No services match your filters</p>
            <p className="text-xs text-fg-muted">Try adjusting the plan filter, category tab, or search query.</p>
            <button onClick={handleReset} className="btn-secondary text-xs px-4 py-2">
              <HiOutlineRefresh className="inline mr-1" size={13} /> Reset Filters
            </button>
          </div>
        )}

        {!loading && !error && filteredServices.length > 0 && (
          <div className="space-y-10">
            {/* Result count */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fg-muted">
                Showing <strong className="text-fg">{filteredServices.length}</strong> of{' '}
                <strong className="text-fg">{allServices.length}</strong> services
                {debouncedSearch && <span> for &ldquo;<em>{debouncedSearch}</em>&rdquo;</span>}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-fg-muted">
                <span className="flex items-center gap-1"><HiOutlineLightningBolt size={12} className="text-emerald-500" /> Live</span>
                <span className="flex items-center gap-1"><HiOutlineClock size={12} className="text-amber-500" /> Roadmap</span>
              </div>
            </div>

            {/* Grouped service lists */}
            {Object.entries(grouped).map(([cat, services]) => {
              const emoji = CATEGORY_ICONS[cat] || '📌';
              const liveCount = services.filter(s => s.status === 'live').length;
              const roadmapCount = services.filter(s => s.status === 'coming_soon').length;
              return (
                <section key={cat}>
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl" aria-hidden="true">{emoji}</span>
                    <div>
                      <h2 className="text-base font-black text-fg tracking-tight">{cat}</h2>
                      <p className="text-[11px] text-fg-muted">
                        {services.length} services ·{' '}
                        <span className="text-emerald-600 dark:text-emerald-400">{liveCount} live</span>
                        {roadmapCount > 0 && (
                          <> · <span className="text-amber-600 dark:text-amber-400">{roadmapCount} roadmap</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Service cards */}
                  <div className="space-y-2">
                    {services.map(service => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Bottom CTA */}
            <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-blue-900/80 to-surface-800/80 p-6 sm:p-8 text-white text-center space-y-4">
              <HiOutlineSparkles size={32} className="mx-auto text-brand-green-400" />
              <h3 className="text-xl font-black tracking-tight">Ready to deploy your college workspace?</h3>
              <p className="text-sm text-white/70 max-w-md mx-auto">
                Start a 14-day free trial with full access. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/request-subscription"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A4D94] px-6 py-3 text-sm font-bold text-white hover:bg-[#083e78] transition shadow-lg"
                >
                  Compare Plans & Pricing →
                </Link>
                <Link
                  href="/request-subscription?plan=enterprise"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                >
                  Request Enterprise Demo
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

