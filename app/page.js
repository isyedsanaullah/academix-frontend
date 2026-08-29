'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import LottieLoader from '@/components/common/LottieLoader';
import PublicFooter from '@/components/common/PublicFooter';
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
  interview:    { color: '#f472b6', bg: 'rgba(244,114,182,0.10)', label: 'Interview' },
  approved:     { color: '#34d399', bg: 'rgba(52,211,153,0.10)',  label: 'Approved' },
  rejected:     { color: '#f87171', bg: 'rgba(248,113,113,0.10)', label: 'Rejected' },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // ── States ───────────────────────────────────────────────────────────
  const [colleges, setColleges] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);

  // Search & filter
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');

  // NavPanel tab: announcements | admissions | track
  const [activeNav, setActiveNav] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [admissionInfo, setAdmissionInfo] = useState(null);

  // Application tracker
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // ── Load registered colleges ──────────────────────────────────────────
  useEffect(() => {
    fetch('/api/public/colleges')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setColleges(d.data);
          const cityList = [...new Set(d.data.map(c => c.city).filter(Boolean))].sort();
          setCities(cityList);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingColleges(false));
  }, []);

  // ── Filter colleges ───────────────────────────────────────────────────
  const filtered = colleges.filter(c => {
    const matchName = !searchName.trim() ||
      c.name?.toLowerCase().includes(searchName.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchName.toLowerCase());
    const matchCity = !searchCity.trim() ||
      c.city?.toLowerCase() === searchCity.toLowerCase();
    return matchName && matchCity;
  });

  // ── Track application ─────────────────────────────────────────────────
  const checkStatus = async () => {
    if (!statusQuery.trim()) return;
    setStatusLoading(true);
    setStatusResult(null);
    setStatusError('');
    try {
      const res = await fetch(`/api/public/applications/track/${encodeURIComponent(statusQuery.trim())}`);
      const d = await res.json();
      if (d.success) setStatusResult(d.data);
      else setStatusError(d.message || 'Application not found');
    } catch {
      setStatusError('Could not verify status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchName('');
    setSearchCity('');
  };

  const scrollToDirectory = () => {
    document.getElementById('college-directory')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#04070d] text-white/85 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* ── FULLSCREEN LOADER ───────────────────────────────────── */}
      {loadingColleges && <LottieLoader fullScreen text="Loading Colleges..." />}

      {/* ── STICKY HEADER ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#04070d]/85 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-10 h-16 sm:h-[68px] flex items-center justify-between gap-3 sm:gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer shrink-0 min-w-0" onClick={scrollToDirectory}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 relative">
              <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-[17px] font-extrabold text-white leading-none tracking-tight">Academix</h1>
              <p className="text-[9px] sm:text-[10px] text-white/40 font-semibold uppercase tracking-wider sm:tracking-widest mt-1 leading-none truncate">
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={scrollToDirectory}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-500/40 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <HiOutlineSearch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden xs:inline">Find College</span>
              <span className="xs:hidden">Find</span>
            </button>
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-xl transition-all shadow-[0_2px_10px_rgba(99,102,241,0.28)] hover:shadow-[0_4px_14px_rgba(99,102,241,0.4)] active:scale-95"
            >
              <HiOutlineLogin className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 pb-12 sm:pt-16 sm:pb-14 border-b border-white/[0.04]">
        {/* Subtle glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-indigo-600/[0.04] blur-3xl pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="max-w-[860px] mx-auto px-4 sm:px-6 text-center space-y-5 relative z-10">
          <motion.h2 {...fadeUp(0.0)} className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Find Your College on Academix
          </motion.h2>

          <motion.p {...fadeUp(0.1)} className="text-sm sm:text-base text-white/50 max-w-xl mx-auto leading-relaxed">
            Search registered colleges and access their public Academix workspace.
          </motion.p>

          {/* Hero Search */}
          <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 max-w-xl mx-auto pt-2 w-full">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/35">
                <HiOutlineSearch size={16} />
              </div>
              <input
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scrollToDirectory()}
                placeholder="Search by college name or code…"
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-[#0f1723] border border-white/10 text-white placeholder:text-white/35 text-xs sm:text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
              {searchName && (
                <button onClick={() => setSearchName('')} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/30 hover:text-white/70 transition-colors">
                  <HiOutlineX size={14} />
                </button>
              )}
            </div>
            <button
              onClick={scrollToDirectory}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(99,102,241,0.35)] transition-all shrink-0 active:scale-98"
            >
              <span>Search</span>
              <HiArrowRight size={15} className="shrink-0" />
            </button>
          </motion.div>

          {/* Quick stats (real data) */}
          {!loadingColleges && colleges.length > 0 && (
            <motion.div {...fadeUp(0.3)} className="flex items-center justify-center gap-6 pt-2 text-[11px] text-white/35 font-semibold">
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
      <section className="py-16 border-t border-white/[0.04] relative overflow-hidden bg-gradient-to-b from-transparent via-indigo-950/[0.08] to-transparent">
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto drop-shadow-[0_8px_24px_rgba(99,102,241,0.25)]">
            <Image src="/logo.svg" alt="Academix" fill className="object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Is your college not on Academix?
          </h2>
          <p className="text-xs sm:text-sm text-white/50 max-w-lg mx-auto leading-relaxed">
            Bring your college operations online. Manage admissions, academics, attendance, fees, certificates, and more — all in one platform.
          </p>
          <div>
            <a href="/join" className="inline-flex items-center gap-2 py-3 px-7 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all active:scale-98">
              Join Academix <HiArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <PublicFooter />
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
          className="flex-1 px-3 py-2 rounded-xl bg-[#1a2230] border border-white/10 text-white placeholder:text-white/35 text-xs outline-none focus:border-indigo-500 transition-all"
        />
        <button
          onClick={onCheck}
          disabled={loading}
          className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold transition-all disabled:opacity-50"
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
    border: 'border-indigo-500/25',
  },
  {
    id: 'admissions',
    label: 'Admissions',
    desc: 'Check open seasons',
    icon: HiOutlineClipboardList,
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/25',
  },
  {
    id: 'track',
    label: 'Track',
    desc: 'Verify submission status',
    icon: HiOutlineSignal,
    color: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/25',
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
      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-3 lg:flex lg:flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`
                w-full text-left p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 group flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3.5
                ${isActive
                  ? `bg-gradient-to-br ${item.color} ${item.border} shadow-lg shadow-black/20`
                  : 'bg-[#0d1117]/80 border-white/[0.05] hover:border-white/10 hover:bg-[#131920]'}
              `}
            >
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all
                ${isActive ? 'bg-white/15' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'}
              `}>
                <Icon size={18} className={isActive ? item.iconColor : 'text-white/40 group-hover:text-white/70'} />
              </div>
              <div className="min-w-0 flex-1 text-center lg:text-left w-full">
                <p className={`text-[11px] sm:text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {item.label}
                </p>
                <p className="text-[9px] text-white/35 truncate mt-0.5 hidden sm:block">{item.desc}</p>
              </div>
              {isActive && (
                <HiChevronRight size={14} className={`${item.iconColor} shrink-0 hidden lg:block`} />
              )}
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
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/35">
            <HiOutlineSearch size={15} />
          </div>
          <input
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="Search by college name or code…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#0d1117] border border-white/10 text-white placeholder:text-white/35 text-xs sm:text-sm outline-none focus:border-indigo-500 transition-all"
          />
          {searchName && (
            <button onClick={() => setSearchName('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/70 transition-colors">
              <HiOutlineX size={14} />
            </button>
          )}
        </div>
        <div className="relative sm:w-56 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/35">
            <HiOutlineLocationMarker size={15} />
          </div>
          <input
            list="city-list"
            value={searchCity}
            onChange={e => setSearchCity(e.target.value)}
            placeholder="Filter by city…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#0d1117] border border-white/10 text-white placeholder:text-white/35 text-xs sm:text-sm outline-none focus:border-indigo-500 transition-all"
          />
          <datalist id="city-list">
            {cities.map(c => <option key={c} value={c} />)}
          </datalist>
          {searchCity && (
            <button onClick={() => setSearchCity('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/70 transition-colors">
              <HiOutlineX size={14} />
            </button>
          )}
        </div>
        {hasFilters && (
          <button onClick={onClear} className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all shrink-0">
            <HiOutlineRefresh size={13} />
            <span>Reset</span>
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
          <div key={i} className="h-56 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!colleges.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-card">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4 text-white/30">
          <HiOutlineOfficeBuilding size={26} />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Colleges Found</h3>
        <p className="text-xs text-white/40 max-w-sm">
          No colleges match your current search criteria. Try clearing the filter or searching by city.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {colleges.map((c) => (
        <CollegeCard key={c.id || c.code} college={c} onSelect={() => onSelect(c)} />
      ))}
    </div>
  );
}

// ── CollegeCard ────────────────────────────────────────────────────────
function CollegeCard({ college, onSelect }) {
  const settings = college.settings || {};
  const isAdmissionsOpen = college.admissionSeason?.status === 'open';

  return (
    <div
      onClick={onSelect}
      className="group relative rounded-2xl border border-white/[0.06] bg-[#0d1117] hover:border-indigo-500/40 hover:bg-[#101724] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
    >
      {/* Cover / Header Gradient */}
      <div className="h-24 w-full bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-surface-900 relative overflow-hidden">
        {settings.coverPhoto && (
          <img src={settings.coverPhoto} alt="" className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent" />
        
        {/* Status badges */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {isAdmissionsOpen && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              Admissions Open
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between relative">
        {/* Logo Avatar */}
        <div className="-mt-7 flex items-end justify-between">
          <div className="w-12 h-12 rounded-xl bg-[#131920] border-2 border-[#0d1117] flex items-center justify-center text-indigo-400 font-black text-lg overflow-hidden shadow-lg shrink-0">
            {college.logo ? (
              <img src={college.logo} alt={college.name} className="w-full h-full object-cover" />
            ) : (
              <span>{college.name?.charAt(0) || 'C'}</span>
            )}
          </div>
          <span className="font-mono text-[9px] text-white/30 font-bold uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.04]">
            {college.code}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-1">
            {college.name}
          </h3>
          <p className="text-[11px] text-white/40 line-clamp-2 mt-1 leading-relaxed">
            {college.tagline || settings.bio || 'Public digital workspace on Academix.'}
          </p>
        </div>

        {/* Location & Details */}
        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-white/35">
          <div className="flex items-center gap-1 truncate">
            <HiOutlineLocationMarker size={12} className="shrink-0 text-white/30" />
            <span className="truncate">{college.city || 'Pakistan'}</span>
          </div>
          <span className="inline-flex items-center gap-0.5 font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">
            View Portal <HiChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}
