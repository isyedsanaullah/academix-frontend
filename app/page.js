'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import BrandLogo from '@/components/common/BrandLogo';
import PublicFooter from '@/components/common/PublicFooter';
import { buildTenantUrl } from '@/lib/host';
import { apiGet } from '@/lib/api';
import {
  HiOutlineSearch, HiOutlineLocationMarker, HiOutlineSpeakerphone, HiOutlineClipboardList,
  HiOutlineLogin, HiOutlineX, HiChevronRight, HiChevronDown, HiArrowRight, HiOutlineMenu,
  HiOutlineExclamationCircle, HiOutlineRefresh, HiOutlineOfficeBuilding, HiOutlineViewGrid,
  HiOutlineCheckCircle, HiOutlineAcademicCap, HiOutlineCash, HiOutlineChartBar,
  HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineShieldCheck,
  HiOutlineBadgeCheck, HiOutlineBookOpen, HiOutlineBriefcase, HiOutlineKey,
  HiOutlineIdentification, HiOutlinePhone, HiOutlineMail, HiOutlineSupport,
} from 'react-icons/hi';
import { HiOutlineSignal } from 'react-icons/hi2';

// Brand colours (from the logo): blue #0A4D94 · green #2A9B4A · navy #051d3a

const ROLE_HOME = {
  superAdmin: '/super-admin', admin: '/admin', teacher: '/teacher',
  student: '/student', registrar: '/registrar', accountant: '/accountant',
  principal: '/principal', employee: '/employee',
};

const STATUS_META = {
  submitted:    { color: '#b45309', bg: '#fef3c7', label: 'Submitted' },
  under_review: { color: '#0369a1', bg: '#e0f2fe', label: 'Under Review' },
  entry_test:   { color: '#6d28d9', bg: '#ede9fe', label: 'Entry Test' },
  interview:    { color: '#be185d', bg: '#fce7f3', label: 'Interview' },
  approved:     { color: '#15803d', bg: '#dcfce7', label: 'Approved' },
  rejected:     { color: '#b91c1c', bg: '#fee2e2', label: 'Rejected' },
};

const NAV = [
  { label: 'Colleges', id: 'college-directory' },
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Portals', id: 'portals' },
  { label: 'FAQ', id: 'faq' },
];

const FEATURES = [
  { icon: HiOutlineClipboardList, title: 'Admissions Management', text: 'Online applications, entry tests, interviews and merit decisions in one tracked pipeline.' },
  { icon: HiOutlineAcademicCap, title: 'Academics & Timetables', text: 'Programs, courses, sections and class schedules organised for every semester.' },
  { icon: HiOutlineCheckCircle, title: 'Attendance Tracking', text: 'Daily attendance marked by faculty and visible to students and administrators.' },
  { icon: HiOutlineCash, title: 'Fees & Accounts', text: 'Fee structures, vouchers, payments and dues managed with a clear financial trail.' },
  { icon: HiOutlineDocumentText, title: 'Certificates & Documents', text: 'Generate and verify official certificates and student documents quickly.' },
  { icon: HiOutlineBookOpen, title: 'Exams & Results', text: 'Prepare exams, record marks and publish results securely to students.' },
  { icon: HiOutlineSpeakerphone, title: 'Notices & Announcements', text: 'Reach students and staff instantly with public and role-specific updates.' },
  { icon: HiOutlineChartBar, title: 'Reports & Insights', text: 'Clear dashboards that help principals and admins make informed decisions.' },
];

const STEPS = [
  { n: '01', title: 'Request a subscription', text: 'Tell us about your college. Our team reviews your request and gets in touch.' },
  { n: '02', title: 'We set up your workspace', text: 'Your college gets its own branded space with programs, staff roles and settings.' },
  { n: '03', title: 'Go live', text: 'Students, faculty and staff log in to their portals and your public page goes online.' },
];

const PORTALS = [
  { icon: HiOutlineAcademicCap, title: 'Student', text: 'Applications, attendance, fees, results.' },
  { icon: HiOutlineUserGroup, title: 'Faculty', text: 'Classes, attendance, marks, notices.' },
  { icon: HiOutlineIdentification, title: 'Registrar', text: 'Admissions, enrolment, records.' },
  { icon: HiOutlineCash, title: 'Accountant', text: 'Fees, vouchers, collections.' },
  { icon: HiOutlineBadgeCheck, title: 'Principal', text: 'Oversight, approvals, reports.' },
  { icon: HiOutlineViewGrid, title: 'College Admin', text: 'Setup, users, settings.' },
  { icon: HiOutlineBriefcase, title: 'Employee', text: 'Staff profile and duties.' },
  { icon: HiOutlineKey, title: 'Super Admin', text: 'Platform-wide control of all colleges.' },
];

const WHY = [
  { icon: HiOutlineShieldCheck, title: 'Separate data for every college', text: 'Multi-tenant by design: each institution works in its own workspace.' },
  { icon: HiOutlineKey, title: 'Role-based access', text: 'People only see and do what their role allows, from student to super admin.' },
  { icon: HiOutlineOfficeBuilding, title: 'Your own public page', text: 'Every college gets a public portal for admissions, notices and information.' },
  { icon: HiOutlineSupport, title: 'Local support, 24/7', text: 'A dedicated helpline and email team based in Islamabad, Pakistan.' },
];

const FAQ = [
  { q: 'How do I find my college?', a: 'Use the Colleges Directory on this page. Search by college name or code, or filter by city, then open the college’s public portal.' },
  { q: 'How can I track my admission application?', a: 'Open the Track tab in the directory section, enter the tracking number you received when you applied, and see your current status instantly.' },
  { q: 'My college is not listed. How can it join?', a: 'Choose “Register Your College” and submit a subscription request. Our team will contact you and help you get started.' },
  { q: 'Is each college’s data kept separate?', a: 'Yes. Collegeshub is a multi-tenant platform, so every college operates in its own workspace with role-based access for its users.' },
  { q: 'Who do I contact for help?', a: 'Call our 24/7 helpline at +92 313 5013303 or email support@collegeshub.org.' },
];

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A4D94] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(10,77,148,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#083f7a] active:translate-y-0';
const btnOutline = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-[#0A4D94] hover:text-[#0A4D94] active:translate-y-0';
const inputCls = 'w-full rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A4D94] focus:ring-4 focus:ring-[#0A4D94]/10';

function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function SectionHead({ eyebrow, title, text, light = false }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${light ? 'bg-white/10 text-emerald-300' : 'bg-[#2A9B4A]/10 text-[#23823e]'}`}>{eyebrow}</span>
      <h2 className={`mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      {text && <p className={`mt-3 text-base leading-relaxed ${light ? 'text-white/65' : 'text-slate-600'}`}>{text}</p>}
    </Reveal>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [activeNav, setActiveNav] = useState('announcements');
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);

  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dashboardPath = mounted && user?.role ? ROLE_HOME[user.role] : null;

  useEffect(() => {
    apiGet('/public/colleges')
      .then(d => { if (d?.success && Array.isArray(d?.data)) setColleges(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => [...new Set(colleges.map(c => c.city).filter(Boolean))].sort(), [colleges]);
  const filtered = useMemo(() => {
    const q = searchName.trim().toLowerCase();
    const city = searchCity.trim().toLowerCase();
    return colleges.filter(c =>
      (!q || c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)) &&
      (!city || c.city?.toLowerCase() === city));
  }, [colleges, searchName, searchCity]);

  const checkStatus = async () => {
    if (!statusQuery.trim()) return;
    setStatusLoading(true); setStatusResult(null); setStatusError('');
    try {
      const d = await apiGet(`/public/applications/track/${encodeURIComponent(statusQuery.trim())}`);
      if (d?.success) setStatusResult(d.data); else setStatusError(d?.message || 'Application not found');
    } catch (err) {
      setStatusError(err?.response?.data?.message || 'Could not verify status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  const navTo = (id) => { setMenuOpen(false); go(id); };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-600 selection:bg-[#0A4D94]/15 selection:text-[#0A4D94]">

      {/* ── TOP BAR ───────────────────────────────────────────── */}
      <div className="hidden bg-[#051d3a] text-[12px] text-white/75 sm:block">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Smart campus management for colleges across Pakistan</span>
          <div className="flex items-center gap-5">
            <a href="tel:+923135013303" className="flex items-center gap-1.5 hover:text-white"><HiOutlinePhone size={13} /> +92 313 5013303</a>
            <a href="mailto:support@collegeshub.org" className="flex items-center gap-1.5 hover:text-white"><HiOutlineMail size={13} /> support@collegeshub.org</a>
          </div>
        </div>
      </div>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="Collegeshub home" className="shrink-0">
            <span className="hidden sm:block"><BrandLogo variant="horizontal" height={40} priority /></span>
            <span className="sm:hidden"><BrandLogo variant="mark" height={40} priority /></span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map(n => (
              <button key={n.id} onClick={() => navTo(n.id)} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0A4D94]">{n.label}</button>
            ))}
            <button onClick={() => navTo('contact')} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0A4D94]">Contact</button>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/join" className={`${btnOutline} hidden px-4 py-2.5 text-sm md:inline-flex`}>For Colleges</Link>
            {dashboardPath ? (
              <Link href={dashboardPath} className={`${btnPrimary} px-5 py-2.5 text-sm`}><HiOutlineViewGrid size={16} /> Dashboard</Link>
            ) : (
              <button onClick={() => router.push('/login')} className={`${btnPrimary} px-5 py-2.5 text-sm`}><HiOutlineLogin size={16} /> Login</button>
            )}
            <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden">
              {menuOpen ? <HiOutlineX size={20} /> : <HiOutlineMenu size={20} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 bg-white lg:hidden">
              <div className="space-y-1 px-4 py-3">
                {[...NAV, { label: 'Contact', id: 'contact' }].map(n => (
                  <button key={n.id} onClick={() => navTo(n.id)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">{n.label}</button>
                ))}
                <Link href="/join" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#0A4D94]">For Colleges →</Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EEF4FB] via-white to-white pb-24 pt-14 sm:pt-20">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#0A4D94]/10 blur-[110px]" />
        <div className="pointer-events-none absolute -left-24 top-40 h-[320px] w-[320px] rounded-full bg-[#2A9B4A]/10 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          style={{ backgroundImage: 'linear-gradient(#dbe5f1 1px, transparent 1px), linear-gradient(90deg, #dbe5f1 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

        <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-10">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2A9B4A]/25 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#23823e] shadow-sm">
                <BrandLogo variant="mark" height={16} /> Multi-tenant campus platform for colleges
              </span>
            </Reveal>
            <Reveal delay={0.07}>
              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-[56px]">
                Run your entire college on <span className="text-[#0A4D94]">one smart</span> <span className="text-[#2A9B4A]">platform</span>
              </h1>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Collegeshub brings admissions, academics, attendance, fees and certificates together, so students, faculty and administrators all work from the same trusted place.
              </p>
            </Reveal>
            <Reveal delay={0.2} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => go('college-directory')} className={`${btnPrimary} px-7 py-3.5 text-[15px]`}>
                <HiOutlineSearch size={18} /> Search Colleges
              </button>
              <Link href="/join" className={`${btnOutline} px-7 py-3.5 text-[15px]`}>
                Register Your College <HiArrowRight size={16} />
              </Link>
            </Reveal>
            <Reveal delay={0.26} className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-medium text-slate-600">
              {['Admissions to results', 'Role-based portals', 'Separate data per college'].map(t => (
                <span key={t} className="flex items-center gap-2"><HiOutlineCheckCircle size={18} className="text-[#2A9B4A]" /> {t}</span>
              ))}
            </Reveal>
          </div>

          <Reveal delay={0.15}><HeroPreview /></Reveal>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="relative z-10 -mt-12 px-4 sm:px-6">
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(5,29,58,0.25)] md:grid-cols-4 md:divide-x">
          {[
            { n: loading ? '–' : colleges.length, l: 'Colleges registered' },
            { n: loading ? '–' : cities.length, l: 'Cities covered' },
            { n: PORTALS.length, l: 'Role-based portals' },
            { n: '24/7', l: 'Helpline support' },
          ].map((s, i) => (
            <div key={s.l} className={`px-4 py-6 text-center ${i > 1 ? 'border-t border-slate-200 md:border-t-0' : ''} ${i % 2 ? 'border-l border-slate-200 md:border-l-0' : ''}`}>
              <p className="text-3xl font-black tracking-tight text-[#0A4D94]">{s.n}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIRECTORY ─────────────────────────────────────────── */}
      <section id="college-directory" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <SectionHead eyebrow="Colleges Directory" title="Find your college" text="Search every college on Collegeshub, check open admissions and enter its public portal." />
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[320px]">
              <NavPanel active={activeNav} onChange={setActiveNav} colleges={colleges}
                statusQuery={statusQuery} setStatusQuery={setStatusQuery} statusResult={statusResult}
                statusLoading={statusLoading} statusError={statusError} onCheckStatus={checkStatus} />
            </aside>
            <main className="w-full min-w-0 flex-1 space-y-5">
              <FilterBar searchName={searchName} setSearchName={setSearchName} searchCity={searchCity} setSearchCity={setSearchCity}
                cities={cities} onClear={() => { setSearchName(''); setSearchCity(''); }} total={colleges.length} shown={filtered.length} />
              <CollegesGrid colleges={filtered} loading={loading} onSelect={c => router.push(`/college/${c.slug || c.code?.toLowerCase()}`)} />
              {!loading && filtered.length === 0 && colleges.length > 0 && (
                <p className="pt-2 text-center text-sm text-slate-500">Can’t find your college?{' '}
                  <Link href="/join" className="font-semibold text-[#0A4D94] hover:underline">Register it on Collegeshub</Link></p>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 bg-[#F3F7FC] py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <SectionHead eyebrow="Platform Features" title="Everything your college needs, in one place" text="Replace scattered spreadsheets and paperwork with a single, organised system." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.06}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0A4D94]/30 hover:shadow-[0_20px_40px_-20px_rgba(10,77,148,0.35)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A4D94]/[0.08] text-[#0A4D94] transition-colors group-hover:bg-[#0A4D94] group-hover:text-white"><f.icon size={24} /></div>
                  <h3 className="mt-5 text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10">
          <SectionHead eyebrow="How it works" title="Get your college online in three steps" text="A simple, guided onboarding with our team beside you." />
          <div className="relative grid gap-6 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-[#0A4D94]/20 md:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1} className="relative text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0A4D94] text-xl font-black text-white shadow-[0_12px_24px_-10px_rgba(10,77,148,0.7)] ring-8 ring-white">{s.n}</div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTALS ───────────────────────────────────────────── */}
      <section id="portals" className="scroll-mt-20 bg-[#F3F7FC] py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <SectionHead eyebrow="Role-based portals" title="A dedicated workspace for every role" text="Each person signs in once and lands in a portal built for their responsibilities." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PORTALS.map((p, i) => (
              <Reveal key={p.title} delay={(i % 4) * 0.05}>
                <Link href="/login" className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#2A9B4A]/40 hover:shadow-lg">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A9B4A]/10 text-[#23823e]"><p.icon size={22} /></span>
                  <h3 className="mt-4 text-[15px] font-bold text-slate-900">{p.title}</h3>
                  <p className="mt-1 flex-1 text-[13px] leading-relaxed text-slate-500">{p.text}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0A4D94] opacity-0 transition-opacity group-hover:opacity-100">Sign in <HiChevronRight size={13} /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#051d3a] py-20">
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#0A4D94]/40 blur-[110px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#2A9B4A]/20 blur-[110px]" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <SectionHead light eyebrow="Why Collegeshub" title="Built for trust, designed for education" text="Institutions choose a platform they can rely on every day." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.07}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:bg-white/[0.07]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><w.icon size={24} /></span>
                  <h3 className="mt-5 text-base font-bold text-white">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-[820px] px-4 sm:px-6">
          <SectionHead eyebrow="FAQ" title="Frequently asked questions" />
          <div className="space-y-3">
            {FAQ.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={f.q} className={`overflow-hidden rounded-2xl border transition-colors ${open ? 'border-[#0A4D94]/30 bg-[#F3F7FC]' : 'border-slate-200 bg-white'}`}>
                  <button onClick={() => setFaqOpen(open ? -1 : i)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                    <span className="text-[15px] font-bold text-slate-900">{f.q}</span>
                    <HiChevronDown size={20} className={`shrink-0 text-[#0A4D94] transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A4D94] via-[#083f7a] to-[#051d3a] px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#2A9B4A]/30 blur-[90px]" />
          <div className="relative mx-auto max-w-xl space-y-5">
            <BrandLogo variant="stacked" height={96} dark className="mx-auto" />
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">Is your college not on Collegeshub yet?</h2>
            <p className="text-base leading-relaxed text-white/75">Bring admissions, academics, attendance, fees and certificates online from a single platform.</p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Link href="/join" className="inline-flex items-center gap-2 rounded-xl bg-[#2A9B4A] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#238240]">Join Collegeshub <HiArrowRight size={16} /></Link>
              <Link href="/request-subscription" className="inline-flex items-center rounded-xl border border-white/30 px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/10">Request Subscription</Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  HERO PREVIEW (static, illustrative sample data)
// ══════════════════════════════════════════════════════════════════════
function HeroPreview() {
  const bars = [38, 56, 44, 70, 52, 84, 64];
  const rows = [
    { n: 'Ayesha Khan', p: 'BS Computer Science', s: 'Approved', c: 'bg-emerald-100 text-emerald-700' },
    { n: 'Hamza Ali', p: 'BS Business Admin', s: 'Interview', c: 'bg-pink-100 text-pink-700' },
    { n: 'Sara Ahmed', p: 'BS Physics', s: 'Under Review', c: 'bg-sky-100 text-sky-700' },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-[#0A4D94]/15 to-[#2A9B4A]/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_-25px_rgba(5,29,58,0.4)]">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <BrandLogo variant="mark" height={26} />
          <span className="text-sm font-bold text-slate-800">College Dashboard</span>
          <span className="ml-auto flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" /><i className="h-2.5 w-2.5 rounded-full bg-slate-300" /><i className="h-2.5 w-2.5 rounded-full bg-slate-300" /></span>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-3 gap-3">
            {[['Students', '2,480', '#0A4D94'], ['Attendance', '94%', '#2A9B4A'], ['Fees Collected', '87%', '#0A4D94']].map(([l, v, c]) => (
              <div key={l} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{l}</p>
                <p className="mt-1 text-xl font-black" style={{ color: c }}>{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-700">Weekly attendance</p>
            <div className="mt-3 flex h-24 items-end gap-2">
              {bars.map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#0A4D94] to-[#4C94E8]" style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.55 }} />)}
            </div>
          </div>
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.n} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A4D94]/10 text-xs font-bold text-[#0A4D94]">{r.n[0]}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{r.n}</p><p className="truncate text-[11px] text-slate-400">{r.p}</p></div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.c}`}>{r.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -right-3 -top-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-lg sm:-right-6">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Admissions Open
      </div>
      <div className="absolute -bottom-5 -left-3 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg sm:-left-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A9B4A]/10 text-[#2A9B4A]"><HiOutlineBadgeCheck size={18} /></span>
        <div><p className="text-xs font-bold text-slate-800">Result published</p><p className="text-[10px] text-slate-400">Sample preview</p></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  SIDEBAR PANEL
// ══════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id: 'announcements', label: 'Notices', icon: HiOutlineSpeakerphone },
  { id: 'admissions', label: 'Admissions', icon: HiOutlineClipboardList },
  { id: 'track', label: 'Track', icon: HiOutlineSignal },
];

function useCollegeDetails(colleges) {
  const [details, setDetails] = useState(null);
  useEffect(() => {
    if (!colleges.length) return;
    let cancelled = false;
    Promise.all(colleges.slice(0, 3).map(c =>
      apiGet(`/public/college/${c.slug || c.code}`)
        .then(d => (d?.success ? { college: c, ...d.data } : null)).catch(() => null)
    )).then(list => { if (!cancelled) setDetails(list.filter(Boolean)); });
    return () => { cancelled = true; };
  }, [colleges]);
  return details;
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A4D94]/[0.07] text-[#0A4D94]"><Icon size={22} /></div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{text}</p>
    </div>
  );
}
const Skeleton = ({ n, h }) => <div className="space-y-2.5">{[...Array(n)].map((_, i) => <div key={i} className={`${h} animate-pulse rounded-xl bg-slate-100`} />)}</div>;

function AnnouncementsPanel({ details }) {
  if (details === null) return <Skeleton n={3} h="h-16" />;
  const items = details.flatMap(d => (d.announcements || []).map(a => ({ ...a, collegeName: d.college.name })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  if (!items.length) return <EmptyState icon={HiOutlineSpeakerphone} title="No announcements yet" text="Check back later for updates" />;
  return (
    <div className="space-y-2.5">
      {items.map((a, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-colors hover:bg-slate-50">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#0A4D94]">{a.collegeName}</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-900">{a.title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{a.content}</p>
          <p className="mt-2 text-[10px] text-slate-400">{fmtDate(a.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function AdmissionsPanel({ colleges, details }) {
  if (details === null && colleges.length) return <Skeleton n={2} h="h-20" />;
  const open = (details || []).map(d => ({ college: d.college, season: d.admissionSeason || d.college.admissionSeason })).filter(x => x.season?.status === 'open');
  if (!open.length) return <EmptyState icon={HiOutlineClipboardList} title="No open admissions" text="Admissions are currently closed" />;
  return (
    <div className="space-y-2.5">
      {open.map((x, i) => (
        <div key={i} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <div className="mb-1 flex items-center gap-2"><span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" /><p className="truncate text-sm font-bold text-slate-900">{x.college.name}</p></div>
          <p className="text-xs font-semibold text-emerald-700">{x.season.title}</p>
          <p className="mt-1 text-[11px] text-slate-500">Deadline: {fmtDate(x.season.endDate)}</p>
        </div>
      ))}
    </div>
  );
}

function TrackPanel({ query, setQuery, result, loading, error, onCheck }) {
  const meta = result ? STATUS_META[result.status] : null;
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">Enter your tracking number to see where your application stands.</p>
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && onCheck()}
          placeholder="e.g. APP-2026-00001" aria-label="Application tracking number" className={`${inputCls} flex-1 px-3 py-2.5`} />
        <button onClick={onCheck} disabled={loading} aria-label="Check status" className={`${btnPrimary} px-3.5 disabled:opacity-50`}>
          {loading ? <HiOutlineRefresh size={16} className="animate-spin" /> : <HiOutlineSignal size={16} />}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <HiOutlineExclamationCircle size={15} className="shrink-0" /> {error}
          </motion.div>
        )}
        {result && meta && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-3.5" style={{ background: meta.bg, borderColor: `${meta.color}30` }}>
            <p className="text-sm font-bold text-slate-900">{result.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">#{result.applicationNumber}</p>
            <span className="mt-2.5 inline-block rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold" style={{ color: meta.color, border: `1px solid ${meta.color}40` }}>{meta.label}</span>
            {result.rejectionReason && <p className="mt-2 text-xs font-medium text-red-700">Reason: {result.rejectionReason}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavPanel({ active, onChange, colleges, statusQuery, setStatusQuery, statusResult, statusLoading, statusError, onCheckStatus }) {
  const details = useCollegeDetails(colleges);
  const d = colleges.length ? details : [];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-18px_rgba(5,29,58,0.3)]">
      <div role="tablist" className="grid grid-cols-3 gap-1 border-b border-slate-200 bg-slate-50 p-1.5">
        {NAV_ITEMS.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} role="tab" aria-selected={on} onClick={() => onChange(item.id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition-all ${on ? 'bg-white text-[#0A4D94] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              <item.icon size={15} /> {item.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-[230px] p-4">
        {active === 'announcements' && <AnnouncementsPanel details={d} />}
        {active === 'admissions' && <AdmissionsPanel colleges={colleges} details={d} />}
        {active === 'track' && <TrackPanel query={statusQuery} setQuery={setStatusQuery} result={statusResult} loading={statusLoading} error={statusError} onCheck={onCheckStatus} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  DIRECTORY COMPONENTS
// ══════════════════════════════════════════════════════════════════════
function FilterBar({ searchName, setSearchName, searchCity, setSearchCity, cities, onClear, total, shown }) {
  const hasFilters = searchName || searchCity;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <HiOutlineSearch size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Search by college name or code…" aria-label="Search colleges" className={`${inputCls} py-3 pl-11 pr-9`} />
          {searchName && <button onClick={() => setSearchName('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><HiOutlineX size={15} /></button>}
        </div>
        <div className="relative sm:w-56">
          <HiOutlineLocationMarker size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input list="city-list" value={searchCity} onChange={e => setSearchCity(e.target.value)} placeholder="Filter by city…" aria-label="Filter by city" className={`${inputCls} py-3 pl-11 pr-9`} />
          <datalist id="city-list">{cities.map(c => <option key={c} value={c} />)}</datalist>
          {searchCity && <button onClick={() => setSearchCity('')} aria-label="Clear city" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><HiOutlineX size={15} /></button>}
        </div>
        {hasFilters && (
          <button onClick={onClear} className={`${btnOutline} shrink-0 px-4 py-3 text-xs`}><HiOutlineRefresh size={14} /> Reset</button>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-500">{hasFilters ? `Found ${shown} of ${total} colleges` : `Showing ${total} registered college${total !== 1 ? 's' : ''}`}</p>
    </div>
  );
}

function CollegesGrid({ colleges, loading, onSelect }) {
  if (loading) {
    return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-60 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }
  if (!colleges.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm"><HiOutlineOfficeBuilding size={26} /></div>
        <h3 className="mb-1 text-base font-bold text-slate-900">No colleges found</h3>
        <p className="max-w-sm text-sm text-slate-500">No colleges match your search. Try clearing the filters or searching by city.</p>
      </div>
    );
  }
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{colleges.map(c => <CollegeCard key={c.id || c.code} college={c} onSelect={() => onSelect(c)} />)}</div>;
}

function CollegeCard({ college }) {
  const settings = college.settings || {};
  const isOpen = college.admissionSeason?.status === 'open';
  const slug = (college.slug || college.code || '').toLowerCase();
  const tenantUrl = buildTenantUrl(slug);
  return (
    <a href={tenantUrl} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#0A4D94]/30 hover:shadow-[0_24px_48px_-24px_rgba(10,77,148,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0A4D94]">
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-[#0A4D94] via-[#1a6bb8] to-[#2A9B4A]">
        {settings.coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.coverPhoto} alt="" className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105" />
        )}
        {isOpen && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Admissions Open
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 pt-0">
        <div className="-mt-7 flex items-end justify-between">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-[#EEF4FB] text-lg font-black text-[#0A4D94] shadow-md">
            {college.logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={college.logo} alt={college.name} className="h-full w-full object-cover" />
              : <span>{college.name?.charAt(0) || 'C'}</span>}
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">{college.code}</span>
        </div>
        <div className="flex-1">
          <h3 className="line-clamp-1 text-base font-bold text-slate-900 transition-colors group-hover:text-[#0A4D94]">{college.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{college.tagline || settings.bio || 'Public digital workspace on Collegeshub.'}</p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="flex min-w-0 items-center gap-1"><HiOutlineLocationMarker size={14} className="shrink-0" /><span className="truncate">{college.city || 'Pakistan'}</span></span>
          <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-[#0A4D94] transition-transform group-hover:translate-x-0.5">View Portal <HiChevronRight size={14} /></span>
        </div>
      </div>
    </a>
  );
}
