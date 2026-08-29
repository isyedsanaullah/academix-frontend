'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import LottieLoader from '@/components/common/LottieLoader';
import {
  HiOutlineSearch, HiOutlineLocationMarker, HiOutlineMail,
  HiOutlineSpeakerphone, HiOutlineClipboardList, HiOutlineLogin,
  HiOutlineX, HiChevronRight, HiOutlineAcademicCap, HiArrowRight,
  HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlineRefresh, HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import { HiOutlineSignal } from 'react-icons/hi2';
import toast from 'react-hot-toast';

// ─── Role → dashboard path ──────────────────────────────────────────────
const ROLE_HOME = {
  superAdmin: '/super-admin', admin: '/admin', teacher: '/teacher',
  student: '/student', registrar: '/registrar', accountant: '/accountant',
  principal: '/principal', employee: '/employee',
};

// ─── Status colours ─────────────────────────────────────────────────────
const STATUS_META = {
  submitted:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  label: 'Submitted' },
  under_review: { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', label: 'Under Review' },
  entry_test:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', label: 'Entry Test' },
  approved:     { color: '#4ade80', bg: 'rgba(74,222,128,0.10)', label: 'Approved' },
  rejected:     { color: '#f87171', bg: 'rgba(248,113,113,0.10)', label: 'Rejected' },
  enrolled:     { color: '#34d399', bg: 'rgba(52,211,153,0.10)', label: 'Enrolled' },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (user) router.replace(ROLE_HOME[user.role] || '/login');
  }, [user, router]);

  // College directory state
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [activeNav, setActiveNav] = useState('announcements');

  // Sidebar panel state
  const [announcements, setAnnouncements] = useState([]);
  const [admissionInfo, setAdmissionInfo] = useState(null);
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Fetch colleges
  useEffect(() => {
    fetch('/api/public/colleges')
      .then(r => r.json())
      .then(d => { if (d.success) setColleges(d.data || []); })
      .catch(() => {})
      .finally(() => setLoadingColleges(false));
  }, []);

  // Derived data
  const cities = [...new Set(colleges.map(c => c.city).filter(Boolean))].sort();

  const filtered = colleges.filter(c => {
    const nameMatch = !searchName || c.name.toLowerCase().includes(searchName.toLowerCase())
      || (c.code || '').toLowerCase().includes(searchName.toLowerCase());
    const cityMatch = !searchCity || (c.city || '').toLowerCase().includes(searchCity.toLowerCase());
    return nameMatch && cityMatch;
  });

  const checkStatus = async () => {
    if (!statusQuery.trim()) return;
    setStatusLoading(true);
    setStatusResult(null);
    setStatusError('');
    try {
      const r = await fetch(`/api/public/application-status/${statusQuery.trim()}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Not found');
      setStatusResult(d.data);
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const clearFilters = () => { setSearchName(''); setSearchCity(''); };

  const scrollToDirectory = () => {
    const el = document.getElementById('college-directory');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#04070d] text-white/85 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* ── FULLSCREEN LOADER ───────────────────────────────────── */}
      {loadingColleges && <LottieLoader fullScreen text="Loading Colleges..." />}

      {/* ── STICKY HEADER ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#04070d]/80 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 h-14 sm:h-[62px] flex items-center justify-between gap-2 sm:gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 min-w-0" onClick={scrollToDirectory}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 relative">
              <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-[15px] font-extrabold text-white leading-none tracking-tight">Academix</h1>
              <p className="text-[8px] sm:text-[9px] text-white/35 font-semibold uppercase tracking-wider sm:tracking-widest mt-0.5 leading-none truncate">
                College Directory
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/60">
            <button onClick={scrollToDirectory} className="hover:text-white transition-colors">Colleges</button>
            <a href="/join" className="hover:text-white transition-colors">Join Academix</a>
            <a href="/join#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={scrollToDirectory}
              className="btn-secondary py-1 sm:py-1.5 px-2 sm:px-3 text-[11px] sm:text-xs font-medium gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl"
            >
              <HiOutlineSearch className="w-3 h-3 sm:w-[13px] sm:h-[13px] text-indigo-400 shrink-0" />
              <span className="hidden xs:inline">Find My College</span>
              <span className="xs:hidden">Find College</span>
            </button>
            <button
              onClick={() => router.push('/login')}
              className="btn-secondary py-1 sm:py-1.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-medium gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl"
            >
              <HiOutlineLogin className="w-3 h-3 sm:w-[13px] sm:h-[13px] text-violet-400 shrink-0" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-10 border-b border-white/[0.04]">
        {/* Subtle glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-indigo-600/[0.04] blur-3xl pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="max-w-[860px] mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <motion.div {...fadeUp(0.0)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[10px] font-bold tracking-wider uppercase">
            <HiOutlineAcademicCap size={11} />
            Public College Directory
          </motion.div>

          <motion.h2 {...fadeUp(0.1)} className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
            Find Your College on Academix
          </motion.h2>

          <motion.p {...fadeUp(0.2)} className="text-sm sm:text-base text-white/50 max-w-xl mx-auto leading-relaxed">
            Search registered colleges and access their public Academix workspace.
          </motion.p>

          {/* Hero Search */}
          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto pt-2">
            <div className="relative flex-1">
              <HiOutlineSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scrollToDirectory()}
                placeholder="Search by college name or code…"
                className="input-field pl-10 text-sm h-11 w-full"
              />
              {searchName && (
                <button onClick={() => setSearchName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  <HiOutlineX size={13} />
                </button>
              )}
            </div>
            <button
              onClick={scrollToDirectory}
              className="btn-primary py-2.5 px-5 text-sm font-bold shrink-0"
            >
              Search <HiArrowRight size={14} className="ml-1 shrink-0" />
            </button>
          </motion.div>

          {/* Quick stats (real data) */}
          {!loadingColleges && colleges.length > 0 && (
            <motion.div {...fadeUp(0.4)} className="flex items-center justify-center gap-6 pt-2 text-[11px] text-white/35 font-semibold">
              <span><span className="text-white/70 font-black">{colleges.length}</span> college{colleges.length !== 1 ? 's' : ''} registered</span>
              {cities.length > 0 && (
                <span><span className="text-white/70 font-black">{cities.length}</span> cit{cities.length !== 1 ? 'ies' : 'y'} covered</span>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── COLLEGE DIRECTORY ────────────────────────────────────── */}
      <section id="college-directory" className="py-10 flex-1 bg-[#080c12]/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Nav Panel (sidebar) */}
            <aside className="w-full lg:w-[290px] xl:w-[310px] shrink-0 lg:sticky lg:top-24">
              <NavPanel
                active={activeNav}
                onChange={setActiveNav}
                announcements={announcements}
                setAnnouncements={setAnnouncements}
                admissionInfo={admissionInfo}
                setAdmissionInfo={setAdmissionInfo}
                statusQuery={statusQuery}
                setStatusQuery={setStatusQuery}
                statusResult={statusResult}
                statusLoading={statusLoading}
                statusError={statusError}
                onCheckStatus={checkStatus}
              />
            </aside>

            {/* Main directory */}
            <main className="flex-1 min-w-0 w-full space-y-5">

              {/* Search / filter bar */}
              <SearchBar
                searchName={searchName}
                setSearchName={setSearchName}
                searchCity={searchCity}
                setSearchCity={setSearchCity}
                cities={cities}
                onClear={clearFilters}
                total={colleges.length}
                shown={filtered.length}
              />

              {/* Colleges grid */}
              <CollegesGrid
                colleges={filtered}
                loading={loadingColleges}
                onSelect={c => router.push(`/college/${c.slug || c.code?.toLowerCase()}`)}
              />

              {/* Empty state — join CTA */}
              {!loadingColleges && filtered.length === 0 && colleges.length > 0 && (
                <div className="text-center pt-6">
                  <p className="text-xs text-white/30">
                    Can't find your college?{' '}
                    <a href="/join" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                      Join Academix
                    </a>
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* ── JOIN ACADEMIX CTA ─────────────────────────────────────── */}
      <section className="py-14 border-t border-white/[0.04]">
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto">
            <HiOutlineAcademicCap size={22} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Is your college not on Academix?
          </h2>
          <p className="text-sm text-white/45 leading-relaxed">
            Bring your college operations online. Manage admissions, academics, attendance, fees, certificates, and more — all in one platform.
          </p>
          <a href="/join" className="btn-primary inline-flex items-center gap-2 py-2.5 px-6 text-sm font-bold">
            Join Academix <HiArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] bg-[#04070d] py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <HiOutlineAcademicCap size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white tracking-tight">Academix</p>
                <p className="text-[10px] text-white/30 mt-0.5">Public college discovery and digital campus services.</p>
              </div>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap gap-4 text-xs text-white/40 font-medium">
              <button onClick={() => document.getElementById('college-directory')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-indigo-400 transition-colors">Colleges</button>
              <a href="/join" className="hover:text-indigo-400 transition-colors">Join Academix</a>
              <a href="/join#contact" className="hover:text-indigo-400 transition-colors">Contact</a>
              <a href="/privacy-policy" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-indigo-400 transition-colors">Terms</a>
              <button onClick={() => router.push('/login')} className="hover:text-indigo-400 transition-colors">Login</button>
            </nav>
          </div>

          <div className="border-t border-white/[0.05] mt-8 pt-6 text-center text-[10px] text-white/20">
            © {new Date().getFullYear()} Academix. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  COLLEGE DIRECTORY COMPONENTS
// ══════════════════════════════════════════════════════════════════════

// ── Panel: Announcements ───────────────────────────────────────────────
function AnnouncementsPanel({ announcements }) {
  if (!announcements) {
    return (
      <div className="space-y-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }
  if (!announcements.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3">
          <HiOutlineSpeakerphone size={18} className="text-indigo-400/60" />
        </div>
        <p className="text-xs font-semibold text-white/40">No announcements available</p>
        <p className="text-[10px] text-white/25 mt-1">Check back later for updates</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 animate-fade-in">
      <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-3">Latest Announcements</p>
      {announcements.slice(0, 4).map((a, i) => (
        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
          <p className="text-[12px] font-semibold text-white/85 leading-tight truncate">{a.title}</p>
          <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
          <p className="text-[9px] text-white/25 mt-1.5">{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
      ))}
    </div>
  );
}

// ── Panel: Admissions ──────────────────────────────────────────────────
function AdmissionsPanel({ admissionInfo }) {
  if (admissionInfo === null) {
    return (
      <div className="space-y-2.5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }
  if (!admissionInfo.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
          <HiOutlineClipboardList size={18} className="text-emerald-400/60" />
        </div>
        <p className="text-xs font-semibold text-white/40">No open admissions</p>
        <p className="text-[10px] text-white/25 mt-1">Admissions are currently closed</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 animate-fade-in">
      <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-3">Open Admissions</p>
      {admissionInfo.map((item, i) => (
        <div key={i} className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.12]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[12px] font-bold text-white/85 truncate">{item.college.name}</p>
          </div>
          <p className="text-[11px] text-emerald-400/75 font-semibold">{item.season.title}</p>
          <p className="text-[10px] text-white/35 mt-1">
            Deadline: {new Date(item.season.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Panel: Track Application ───────────────────────────────────────────
function TrackPanel({ query, setQuery, result, loading, error, onCheck }) {
  const meta = result ? STATUS_META[result.status] : null;
  return (
    <div className="space-y-3 animate-fade-in">
      <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider">Application Tracking</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onCheck()}
          placeholder="e.g. APP-2026-00001"
          className="input-field flex-1 text-xs py-2"
        />
        <button
          onClick={onCheck}
          disabled={loading}
          className="btn-primary px-3 py-2 text-xs"
        >
          {loading ? <HiOutlineRefresh size={13} className="animate-spin" /> : <HiOutlineSignal size={13} />}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-[11px] text-red-400">
            <HiOutlineExclamationCircle size={12} /> {error}
          </motion.div>
        )}
        {result && meta && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border"
            style={{ background: meta.bg, borderColor: `${meta.color}30` }}>
            <p className="text-[12px] font-bold text-white/80">{result.name}</p>
            <p className="text-[10px] text-white/35 mt-0.5">#{result.applicationNumber}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
              {meta.label}
            </span>
            {result.rejectionReason && (
              <p className="text-[10px] text-red-400 mt-1.5 font-medium">Reason: {result.rejectionReason}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !error && !loading && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <HiOutlineSignal size={22} className="text-amber-400/40 mb-2" />
          <p className="text-[10px] text-white/30">Enter your application tracking number above</p>
        </div>
      )}
    </div>
  );
}

// ── NavPanel Sidebar ───────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: 'announcements',
    label: 'Notices',
    desc: 'Latest public updates',
    icon: HiOutlineSpeakerphone,
    color: 'from-indigo-500/20 to-violet-500/10',
    iconColor: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  {
    id: 'admissions',
    label: 'Admissions',
    desc: 'Check open seasons',
    icon: HiOutlineClipboardList,
    color: 'from-emerald-500/15 to-teal-500/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    id: 'track',
    label: 'Track',
    desc: 'Verify submission status',
    icon: HiOutlineSignal,
    color: 'from-amber-500/15 to-orange-500/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
  },
];

function NavPanel({
  active, onChange,
  announcements, setAnnouncements,
  admissionInfo, setAdmissionInfo,
  statusQuery, setStatusQuery,
  statusResult, statusLoading, statusError, onCheckStatus,
}) {
  useEffect(() => {
    if (active !== 'announcements') return;
    if (announcements.length) return;
    fetch('/api/public/colleges')
      .then(r => r.json())
      .then(async d => {
        if (!d.success || !d.data?.length) return;
        const first = d.data[0];
        const r2 = await fetch(`/api/public/college/${first.slug || first.code}`);
        const d2 = await r2.json();
        if (d2.success) setAnnouncements(d2.data?.announcements || []);
      })
      .catch(() => {});
  }, [active]);

  useEffect(() => {
    if (active !== 'admissions') return;
    if (admissionInfo !== null) return;
    fetch('/api/public/colleges')
      .then(r => r.json())
      .then(async d => {
        if (!d.success || !d.data?.length) return;
        const open = [];
        for (const c of d.data.slice(0, 3)) {
          const r2 = await fetch(`/api/public/college/${c.slug || c.code}`);
          const d2 = await r2.json();
          if (d2.success && d2.data?.admissionSeason?.status === 'open') {
            open.push({ college: c, season: d2.data.admissionSeason });
          }
        }
        setAdmissionInfo(open);
      })
      .catch(() => setAdmissionInfo([]));
  }, [active]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 lg:flex lg:flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`
                w-full text-left p-3 rounded-2xl border transition-all duration-200 group
                ${isActive
                  ? `bg-gradient-to-br ${item.color} ${item.border} shadow-sm`
                  : 'bg-surface-900/60 border-white/[0.05] hover:border-white/10 hover:bg-surface-900'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all
                  ${isActive ? 'bg-white/10' : 'bg-white/[0.04] group-hover:bg-white/[0.07]'}
                `}>
                  <Icon size={15} className={isActive ? item.iconColor : 'text-white/40 group-hover:text-white/60'} />
                </div>
                <div className="min-w-0 flex-1 hidden lg:block">
                  <p className={`text-[12px] font-bold leading-none mb-0.5 truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {item.label}
                  </p>
                  <p className="text-[9px] text-white/35 truncate">{item.desc}</p>
                </div>
                {isActive && (
                  <HiChevronRight size={14} className={`${item.iconColor} shrink-0 hidden lg:block`} />
                )}
              </div>
              <p className={`text-[10px] font-semibold mt-1.5 text-center lg:hidden leading-tight truncate
                ${isActive ? 'text-white' : 'text-white/45'}`}>
                {item.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-4 min-h-[180px] bg-[#0d1117] border border-white/[0.06] rounded-2xl">
        {active === 'announcements' && (
          <AnnouncementsPanel announcements={announcements} />
        )}
        {active === 'admissions' && (
          <AdmissionsPanel admissionInfo={admissionInfo} />
        )}
        {active === 'track' && (
          <TrackPanel
            query={statusQuery}
            setQuery={setStatusQuery}
            result={statusResult}
            loading={statusLoading}
            error={statusError}
            onCheck={onCheckStatus}
          />
        )}
      </div>
    </div>
  );
}

// ── SearchBar ──────────────────────────────────────────────────────────
function SearchBar({ searchName, setSearchName, searchCity, setSearchCity, cities, onClear, total, shown }) {
  const hasFilters = searchName || searchCity;
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="Search by name or code…"
            className="input-field pl-9 text-xs"
          />
          {searchName && (
            <button onClick={() => setSearchName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <HiOutlineX size={13} />
            </button>
          )}
        </div>
        <div className="relative sm:w-52">
          <HiOutlineLocationMarker size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            list="city-list"
            value={searchCity}
            onChange={e => setSearchCity(e.target.value)}
            placeholder="Filter by city…"
            className="input-field pl-9 text-xs"
          />
          <datalist id="city-list">
            {cities.map(c => <option key={c} value={c} />)}
          </datalist>
          {searchCity && (
            <button onClick={() => setSearchCity('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <HiOutlineX size={13} />
            </button>
          )}
        </div>
        {hasFilters && (
          <button onClick={onClear} className="btn-secondary py-2 px-4 text-xs shrink-0">
            <HiOutlineRefresh size={12} />
            Reset
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-[10px] text-white/35 font-semibold">
          {hasFilters
            ? `Found ${shown} of ${total} colleges`
            : `Showing ${total} registered college${total !== 1 ? 's' : ''}`}
        </p>
        {hasFilters && shown === 0 && (
          <span className="badge badge-warning">No records found</span>
        )}
      </div>
    </div>
  );
}

// ── CollegesGrid ───────────────────────────────────────────────────────
function CollegesGrid({ colleges, loading, onSelect }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[148px] rounded-2xl bg-[#0d1117]/60 border border-white/[0.04] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!colleges.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-[#0d1117] border border-white/[0.06] rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/15">
          <HiOutlineOfficeBuilding size={24} className="text-indigo-400/60" />
        </div>
        <h3 className="text-xs font-bold text-white/60 mb-1">No college found</h3>
        <p className="text-[11px] text-white/30 max-w-[260px] leading-relaxed">
          We couldn't find a registered college matching your search. Try adjusting the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {colleges.map((c, i) => (
        <CollegeCard key={c._id || c.id || i} college={c} onClick={() => onSelect(c)} />
      ))}
    </div>
  );
}

// ── CollegeCard ────────────────────────────────────────────────────────
function CollegeCard({ college, onClick }) {
  const c = college;
  const initials = c.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#0d1117] border border-white/[0.06] rounded-2xl p-5 cursor-pointer hover:border-indigo-500/20 hover:bg-gradient-to-br hover:from-indigo-500/[0.04] hover:to-transparent transition-all duration-200 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-indigo-600/20 to-violet-600/20 flex items-center justify-center">
          {c.logo ? (
            <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[12px] font-extrabold text-indigo-300">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[12px] font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-200 transition-colors">
            {c.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {c.city && (
              <span className="inline-flex items-center gap-1 text-[9px] text-white/40 font-semibold">
                <HiOutlineLocationMarker size={10} className="text-indigo-400/60" />
                {c.city}
              </span>
            )}
            {c.code && (
              <span className="text-[8px] font-bold text-indigo-400/70 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                {c.code}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 w-6 h-6 rounded-lg bg-white/[0.04] group-hover:bg-indigo-500/15 flex items-center justify-center transition-all ml-auto self-start">
          <HiArrowRight size={12} className="text-white/20 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      <div className="h-px bg-white/[0.04]" />

      <div className="flex items-center justify-between gap-2">
        {c.email ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <HiOutlineMail size={11} className="text-white/30 shrink-0" />
            <span className="text-[10px] text-white/40 truncate font-medium">{c.email}</span>
          </div>
        ) : (
          <span />
        )}
        <span className="badge badge-primary shrink-0 text-[8px]">View College</span>
      </div>
    </div>
  );
}
