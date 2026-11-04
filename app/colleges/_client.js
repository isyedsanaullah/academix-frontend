'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '@/components/common/BrandLogo';
import PublicFooter from '@/components/common/PublicFooter';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import { buildTenantUrl } from '@/lib/host';
import { apiGet, resolveFileUrl } from '@/lib/api';
import {
  HiOutlineSearch, HiOutlineLocationMarker, HiOutlineOfficeBuilding,
  HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineExternalLink,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineFilter,
  HiOutlineArrowLeft, HiOutlineChevronRight, HiOutlineX,
  HiOutlineClipboardList
} from 'react-icons/hi';

const STATUS_META = {
  submitted:    { color: '#b45309', bg: '#fef3c7', label: 'Submitted' },
  under_review: { color: '#0369a1', bg: '#e0f2fe', label: 'Under Review' },
  entry_test:   { color: '#6d28d9', bg: '#ede9fe', label: 'Entry Test' },
  interview:    { color: '#be185d', bg: '#fce7f3', label: 'Interview' },
  approved:     { color: '#15803d', bg: '#dcfce7', label: 'Approved' },
  rejected:     { color: '#b91c1c', bg: '#fee2e2', label: 'Rejected' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function CollegesPageClient() {
  const router = useRouter();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [onlyAdmissionsOpen, setOnlyAdmissionsOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');

  // Application Tracking state
  const [showTracker, setShowTracker] = useState(false);
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGet('/public/colleges')
      .then(res => {
        if (!cancelled && res?.data) {
          setColleges(res.data);
        }
      })
      .catch(err => {
        console.error('Failed to load colleges directory:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const cities = useMemo(() => {
    const set = new Set();
    colleges.forEach(c => { if (c.city && typeof c.city === 'string') set.add(c.city.trim()); });
    return Array.from(set).sort();
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    let result = colleges.filter(c => {
      const q = searchName.trim().toLowerCase();
      if (q) {
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesCode = (c.code || '').toLowerCase().includes(q);
        const matchesCity = (c.city || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCity) return false;
      }
      if (selectedCity && (c.city || '').toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (onlyAdmissionsOpen) {
        if (c.admissionSeason?.status !== 'open') return false;
      }
      return true;
    });

    if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortBy === 'city') {
      result.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
    }

    return result;
  }, [colleges, searchName, selectedCity, onlyAdmissionsOpen, sortBy]);

  const checkApplicationStatus = async (e) => {
    e?.preventDefault();
    const q = statusQuery.trim();
    if (!q) return;

    setStatusLoading(true);
    setStatusError('');
    setStatusResult(null);

    try {
      const res = await apiGet(`/public/application-status/${encodeURIComponent(q)}`);
      if (res?.data) {
        setStatusResult(res.data);
      } else {
        setStatusError('No application found with this tracking number.');
      }
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Application not found. Please verify tracking ID.');
    } finally {
      setStatusLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchName('');
    setSelectedCity('');
    setOnlyAdmissionsOpen(false);
    setSortBy('name-asc');
  };

  const hasActiveFilters = Boolean(searchName || selectedCity || onlyAdmissionsOpen || sortBy !== 'name-asc');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-[#0A4D94]/15">
      {/* ── TOP NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
              <BrandLogo variant="horizontal" height={32} />
            </Link>
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0A4D94]"
            >
              <HiOutlineArrowLeft size={14} /> Back to Home
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTracker(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-[#0A4D94] hover:text-[#0A4D94]"
            >
              <HiOutlineClipboardList size={16} className="text-[#0A4D94]" />
              <span>Track Application</span>
            </button>
            <Link
              href="/join"
              className="hidden rounded-xl bg-[#0A4D94] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#083f7a] sm:inline-flex"
            >
              Register College
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-[#0A4D94] hover:text-[#0A4D94]"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EEF4FB] via-white to-slate-50 py-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]"
          style={{
            backgroundImage: 'linear-gradient(#dbe5f1 1px, transparent 1px), linear-gradient(90deg, #dbe5f1 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />

        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Colleges Directory
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              Explore institutions, colleges, and higher secondary academies registered across Pakistan. Access each college’s public profile, programs, admissions, and portals.
            </p>

            {/* Quick Stat Highlights */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-bold sm:gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-slate-700 shadow-sm ring-1 ring-slate-200">
                <span className="h-2 w-2 rounded-full bg-[#0A4D94]" />
                {loading ? '–' : `${colleges.length}+ Institutions Registered`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-slate-700 shadow-sm ring-1 ring-slate-200">
                <HiOutlineLocationMarker size={14} className="text-[#2A9B4A]" />
                {loading ? '–' : `${cities.length} Cities Covered`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Admissions Active
              </span>
            </div>
          </div>

          {/* ── Collapsible Application Tracker ── */}
          <AnimatePresence>
            {showTracker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#0A4D94]/20 bg-white p-6 shadow-xl ring-4 ring-[#0A4D94]/5">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A4D94]/10 text-[#0A4D94]">
                        <HiOutlineClipboardList size={18} />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900">Track Admission Application</h2>
                    </div>
                    <button
                      onClick={() => setShowTracker(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <HiOutlineX size={18} />
                    </button>
                  </div>
                  <form onSubmit={checkApplicationStatus} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter tracking number (e.g. APP-2026-0001)..."
                      value={statusQuery}
                      onChange={e => setStatusQuery(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#0A4D94] focus:ring-2 focus:ring-[#0A4D94]/10"
                    />
                    <button
                      type="submit"
                      disabled={statusLoading || !statusQuery.trim()}
                      className="rounded-xl bg-[#0A4D94] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#083f7a] disabled:opacity-50"
                    >
                      {statusLoading ? 'Searching…' : 'Check Status'}
                    </button>
                  </form>

                  {statusError && (
                    <p className="mt-3 text-xs font-semibold text-rose-600">{statusError}</p>
                  )}

                  {statusResult && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-500">
                            Tracking: {statusResult.applicationNumber}
                          </p>
                          <h4 className="text-sm font-bold text-slate-900">{statusResult.applicantName}</h4>
                          <p className="text-xs text-slate-600">Applied for: {statusResult.program}</p>
                        </div>
                        {STATUS_META[statusResult.status] && (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                            style={{
                              color: STATUS_META[statusResult.status].color,
                              backgroundColor: STATUS_META[statusResult.status].bg
                            }}
                          >
                            {STATUS_META[statusResult.status].label}
                          </span>
                        )}
                      </div>
                      {statusResult.remarks && (
                        <p className="mt-2 text-xs italic text-slate-500">“{statusResult.remarks}”</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── FILTER & CONTROLS TOOLBAR ───────────────────────────── */}
      <section className="sticky top-18 z-30 border-y border-slate-200/90 bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search and Filters */}
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <HiOutlineSearch
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="Search college by name, code, or city…"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A4D94] focus:ring-4 focus:ring-[#0A4D94]/10"
              />
              {searchName && (
                <button
                  onClick={() => setSearchName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <HiOutlineX size={15} />
                </button>
              )}
            </div>

            {/* City Selector */}
            <div className="relative sm:w-48">
              <HiOutlineLocationMarker
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#0A4D94] focus:ring-4 focus:ring-[#0A4D94]/10"
              >
                <option value="">All Cities</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Admissions Open Toggle */}
            <button
              onClick={() => setOnlyAdmissionsOpen(v => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                onlyAdmissionsOpen
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${onlyAdmissionsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              Admissions Open
            </button>
          </div>

          {/* Right Side: Sorting & Total count */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
            <span className="text-xs font-bold text-slate-500">
              Showing <span className="text-slate-900">{filteredColleges.length}</span> of {colleges.length}+ colleges
            </span>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium text-slate-400 sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0A4D94]"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="city">City</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-xl px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── COLLEGES GRID ───────────────────────────────────────── */}
      <main className="mx-auto flex-1 w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <CollegesHubLoader size="lg" text="Loading institutions…" />
          </div>
        ) : filteredColleges.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <HiOutlineOfficeBuilding size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No colleges match your search</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Try adjusting your city filter, clear the search keywords, or browse all institutions.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={clearFilters}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-[#0A4D94]"
              >
                Clear all filters
              </button>
              <Link
                href="/join"
                className="rounded-xl bg-[#0A4D94] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#083f7a]"
              >
                Register Your College
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredColleges.map(college => (
              <DirectoryCollegeCard key={college.id || college.code} college={college} />
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <PublicFooter />
    </div>
  );
}

function DirectoryCollegeCard({ college }) {
  const [logoErr, setLogoErr] = useState(false);
  const [coverErr, setCoverErr] = useState(false);

  const settings = college.settings || {};
  const rawCover = college.coverPhoto || settings.coverPhoto;
  const cover = !coverErr && (rawCover ? resolveFileUrl(rawCover) : null);
  const logo = !logoErr && (college.logo ? resolveFileUrl(college.logo) : null);

  const slug = (college.slug || college.code || '').toLowerCase();
  const tenantUrl = buildTenantUrl(slug);
  const initials = college.code?.replace(/[^A-Za-z0-9]/g, '').slice(0, 3) || college.name?.slice(0, 2).toUpperCase() || 'CH';

  const isAdmissionsOpen = college.admissionSeason?.status === 'open';

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#0A4D94]/35 hover:shadow-[0_20px_40px_-15px_rgba(10,77,148,0.2)]">
      {/* ── Banner / Cover ── */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-[#072448] via-[#0A4D94] to-[#12589D]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            onError={() => setCoverErr(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '16px 16px'
              }}
            />
            <div className="pointer-events-none absolute -right-3 -bottom-5 text-white/[0.09]">
              <HiOutlineAcademicCap size={110} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute inset-x-3.5 top-3 flex items-center justify-between">
          <span className="rounded-md bg-white/95 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0A4D94] shadow-sm backdrop-blur-sm">
            {college.code}
          </span>
          {isAdmissionsOpen && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Admissions Open
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-1 flex-col p-5 pt-0">
        {/* Floating Logo */}
        <div className="relative z-10 -mt-8 mb-3 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white p-1 shadow-[0_8px_20px_-4px_rgba(5,29,58,0.2)] ring-1 ring-slate-200/70">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={college.name}
              onError={() => setLogoErr(true)}
              className="h-full w-full rounded-xl object-contain bg-white"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#0A4D94] to-[#051d3a] font-mono text-sm font-black tracking-wider text-white shadow-inner">
              {initials}
            </div>
          )}
        </div>

        {/* Title & Tagline */}
        <div className="flex-1">
          <a
            href={tenantUrl}
            className="line-clamp-1 text-base font-bold text-slate-900 transition-colors group-hover:text-[#0A4D94]"
          >
            {college.name}
          </a>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {college.tagline || settings.bio || settings.about || 'Recognized higher education institution on Collegeshub.'}
          </p>
        </div>

        {/* Location & Established Meta */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-100">
            <HiOutlineLocationMarker size={12} className="text-slate-400" />
            {college.city || 'Pakistan'}
          </span>
          {settings.establishedYear && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-100">
              <HiOutlineCalendar size={12} className="text-slate-400" />
              Est. {settings.establishedYear}
            </span>
          )}
          {settings.affiliation && (
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-100">
              {settings.affiliation}
            </span>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 flex items-center gap-2 pt-1">
          <a
            href={tenantUrl}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0A4D94] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#083f7a]"
          >
            <span>Visit College Portal</span>
            <HiOutlineChevronRight size={13} />
          </a>
          {isAdmissionsOpen && (
            <a
              href={`${tenantUrl}/apply/${slug}`}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              Apply
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

