'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import BrandLogo from '@/components/common/BrandLogo';
import PublicFooter from '@/components/common/PublicFooter';
import { buildTenantUrl, getTenantSlug } from '@/lib/host';
import { apiGet, resolveFileUrl } from '@/lib/api';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import CollegeProfilePage from './college/[college-shortcut]/_client';
import {
  HiOutlineSearch, HiOutlineLocationMarker, HiOutlineLogin,
  HiOutlineX, HiChevronRight, HiChevronDown, HiArrowRight, HiOutlineMenu,
  HiOutlineOfficeBuilding, HiOutlineViewGrid, HiOutlineCheckCircle,
  HiOutlineAcademicCap, HiOutlineCash, HiOutlineChartBar,
  HiOutlineDocumentText, HiOutlineBookOpen, HiOutlineSpeakerphone,
  HiOutlineBadgeCheck, HiOutlineShieldCheck, HiOutlineKey,
  HiOutlineSupport
} from 'react-icons/hi';

const ROLE_HOME = {
  superAdmin: '/super-admin', admin: '/admin', teacher: '/teacher',
  student: '/student', registrar: '/registrar', accountant: '/accountant',
  principal: '/principal', employee: '/employee',
};

const NAV = [
  { label: 'Colleges', id: 'colleges-showcase', isRoute: false },
  { label: 'Features', id: 'features', isRoute: false },
  { label: 'How it works', id: 'how-it-works', isRoute: false },
  { label: 'Portals', id: 'portals', isRoute: false },
  { label: 'FAQ', id: 'faq', isRoute: false },
];

const FEATURES = [
  { icon: HiOutlineDocumentText, title: 'Admissions Management', text: 'Online applications, entry tests, interviews and merit decisions in one tracked pipeline.' },
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
  {
    title: 'Student',
    subtitle: 'Academic & Campus Life',
    text: 'Applications, daily attendance, class timetables, fee vouchers, and term results.',
    details: 'Students can check admission status, download digital fee challans, view live attendance records, access lecture materials, take online quizzes, and check report cards securely.',
    badge: 'Learning'
  },
  {
    title: 'Faculty',
    subtitle: 'Teaching & Academics',
    text: 'Class schedules, attendance marking, student grades, assignments, and announcements.',
    details: 'Teachers manage enrolled students, record daily attendance, upload course materials, create AI-powered quizzes, grade papers, and publish subject notices.',
    badge: 'Teaching'
  },
  {
    title: 'Parents',
    subtitle: 'Family & Progress',
    text: 'Live attendance alerts, fee dues, report cards, exam notices, and direct communication.',
    details: 'Parents stay informed with real-time attendance alerts, automated fee dues reminders, academic term progress reports, official notices, and direct contact with college administration.',
    badge: 'Guardian'
  },
  {
    title: 'Registrar',
    subtitle: 'Admissions & Records',
    text: 'Admissions management, student enrollment records, eligibility, and official certificates.',
    details: 'Registrars oversee online admission seasons, verify applicant documents, generate merit lists, manage class transfers, and issue character and completion certificates.',
    badge: 'Records'
  },
  {
    title: 'Accountant',
    subtitle: 'Finance & Treasury',
    text: 'Fee voucher generation, payment collections, defaulter tracking, and financial ledgers.',
    details: 'Accountants generate individual or batch fee challans, approve online payment proofs, monitor dues and defaulters, manage payroll, and run financial treasury summaries.',
    badge: 'Finance'
  },
  {
    title: 'Principal',
    subtitle: 'Leadership & Oversight',
    text: 'Institutional analytics, approval workflows, faculty evaluations, and executive reports.',
    details: 'Principals monitor overall campus performance, approve fee concessions and leaves, review teacher evaluation scores, and inspect consolidated admission and academic metrics.',
    badge: 'Executive'
  },
  {
    title: 'College Admin',
    subtitle: 'Workspace Configuration',
    text: 'Institution settings, staff accounts, program structures, and system permissions.',
    details: 'College administrators configure sessions, classes, sections, and subjects, manage staff and faculty access, monitor audit activity logs, and brand their public portal.',
    badge: 'System'
  },
  {
    title: 'Employee',
    subtitle: 'Campus Operations',
    text: 'Staff duty shifts, gate security scanner, visitor registration, and early exit passes.',
    details: 'Campus staff and security personnel scan QR identity cards at entry gates, log visitor entries, manage student gate passes, and track daily attendance records.',
    badge: 'Operations'
  },
];

const WHY = [
  { icon: HiOutlineShieldCheck, title: 'Separate data for every college', text: 'Multi-tenant by design: each institution works in its own workspace.' },
  { icon: HiOutlineKey, title: 'Role-based access', text: 'People only see and do what their role allows, with distinct privacy for all roles.' },
  { icon: HiOutlineOfficeBuilding, title: 'Your own public page', text: 'Every college gets a public portal for admissions, notices and information.' },
  { icon: HiOutlineSupport, title: 'Local support, 24/7', text: 'A dedicated helpline and email team based in Islamabad, Pakistan.' },
];

const FAQ = [
  { q: 'How do I find my college?', a: 'Use the Colleges Directory on Collegeshub. Search by college name or code, or filter by city, then open the college’s public portal.' },
  { q: 'How can I track my admission application?', a: 'Open the Colleges Directory page, click Track Application, enter the tracking number you received when you applied, and see your current status instantly.' },
  { q: 'My college is not listed. How can it join?', a: 'Choose “Register Your College” and submit a subscription request. Our team will contact you and help you get started.' },
  { q: 'Is each college’s data kept separate?', a: 'Yes. Collegeshub is a multi-tenant platform, so every college operates in its own workspace with role-based access for its users.' },
  { q: 'Who do I contact for help?', a: 'Call our 24/7 helpline at +92 313 5013303 or email support@collegeshub.org.' },
];

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A4D94] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(10,77,148,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#083f7a] active:translate-y-0';
const btnOutline = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-[#0A4D94] hover:text-[#0A4D94] active:translate-y-0';

function Reveal({ children, delay = 0, className = '' }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ title, text, light = false }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h2>
      {text && (
        <p className={`mt-3 text-base leading-relaxed ${light ? 'text-white/65' : 'text-slate-600'}`}>
          {text}
        </p>
      )}
    </Reveal>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tenantSlug, setTenantSlug] = useState(() => {
    if (typeof window !== 'undefined') {
      return getTenantSlug(window.location.hostname);
    }
    return null;
  });

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [expandedRole, setExpandedRole] = useState(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const slug = getTenantSlug(window.location.hostname);
      if (slug && slug !== tenantSlug) {
        setTenantSlug(slug);
      }
    }
  }, [tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    apiGet('/public/colleges')
      .then(d => {
        if (!cancelled && d?.data) {
          setColleges(d.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (tenantSlug) {
    return <CollegeProfilePage overrideSlug={tenantSlug} />;
  }

  const dashboardPath = mounted && user?.role ? ROLE_HOME[user.role] : null;

  const navTo = (id) => {
    setMenuOpen(false);
    go(id);
  };

  const toggleRole = (title) => {
    setExpandedRole(prev => (prev === title ? null : title));
  };

  const cities = Array.from(new Set(colleges.map(c => c.city).filter(Boolean)));

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-[#0A4D94]/15">
      {/* ── TOP ANNOUNCEMENT BANNER ───────────────────────────── */}
      <div className="relative z-30 bg-[#051d3a] px-4 py-2.5 text-center text-xs font-semibold text-white/90">
        <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2">
          <span className="rounded-full bg-[#2A9B4A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">New</span>
          <span>Online admissions & digital campus management for Pakistani colleges.</span>
          <Link href="/join" className="underline underline-offset-2 hover:text-white">Learn more →</Link>
        </div>
      </div>

      {/* ── HEADER / NAVBAR ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center">
            <span className="hidden sm:block"><BrandLogo variant="horizontal" height={40} priority /></span>
            <span className="sm:hidden"><BrandLogo variant="mark" height={40} priority /></span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/colleges"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0A4D94]"
            >
              Colleges Directory
            </Link>
            {NAV.slice(1).map(n => (
              <button
                key={n.id}
                onClick={() => navTo(n.id)}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0A4D94]"
              >
                {n.label}
              </button>
            ))}
            <button
              onClick={() => navTo('contact')}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0A4D94]"
            >
              Contact
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/join" className={`${btnOutline} hidden px-4 py-2.5 text-sm md:inline-flex`}>
              For Colleges
            </Link>
            {dashboardPath ? (
              <Link href={dashboardPath} className={`${btnPrimary} px-5 py-2.5 text-sm`}>
                <HiOutlineViewGrid size={16} /> Dashboard
              </Link>
            ) : (
              <button onClick={() => router.push('/login')} className={`${btnPrimary} px-5 py-2.5 text-sm`}>
                <HiOutlineLogin size={16} /> Login
              </button>
            )}
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            >
              {menuOpen ? <HiOutlineX size={20} /> : <HiOutlineMenu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 bg-white lg:hidden"
            >
              <div className="space-y-1 px-4 py-3">
                <Link
                  href="/colleges"
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Colleges Directory
                </Link>
                {NAV.slice(1).map(n => (
                  <button
                    key={n.id}
                    onClick={() => navTo(n.id)}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {n.label}
                  </button>
                ))}
                <button
                  onClick={() => navTo('contact')}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Contact
                </button>
                <Link href="/join" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#0A4D94]">
                  For Colleges →
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EEF4FB] via-white to-white pb-24 pt-14 sm:pt-20">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#0A4D94]/10 blur-[110px]" />
        <div className="pointer-events-none absolute -left-24 top-40 h-[320px] w-[320px] rounded-full bg-[#2A9B4A]/10 blur-[100px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          style={{
            backgroundImage: 'linear-gradient(#dbe5f1 1px, transparent 1px), linear-gradient(90deg, #dbe5f1 1px, transparent 1px)',
            backgroundSize: '44px 44px'
          }}
        />

        <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-10">
          <div>
            {/* Direct headline start - no green pills */}
            <Reveal delay={0.05}>
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-[56px]">
                Run your entire College on <span className="text-[#0A4D94]">one smart</span> <span className="text-[#2A9B4A]">platform</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Collegeshub brings admissions, academics, attendance, fees and certificates together, so students, faculty and administrators all work from the same trusted place.
              </p>
            </Reveal>
            <Reveal delay={0.18} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/colleges" className={`${btnPrimary} px-7 py-3.5 text-[15px]`}>
                <HiOutlineSearch size={18} /> Search Colleges
              </Link>
              <Link href="/join" className={`${btnOutline} px-7 py-3.5 text-[15px]`}>
                Register Your College <HiArrowRight size={16} />
              </Link>
            </Reveal>
            <Reveal delay={0.24} className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-medium text-slate-600">
              {['Admissions to results', 'Role-based portals', 'Separate data per college'].map(t => (
                <span key={t} className="flex items-center gap-2">
                  <HiOutlineCheckCircle size={18} className="text-[#2A9B4A]" /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <HeroPreview />
          </Reveal>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="relative z-10 -mt-12 px-4 sm:px-6">
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(5,29,58,0.25)] md:grid-cols-4 md:divide-x">
          {[
            { n: loading ? '–' : `${colleges.length}+`, l: 'Colleges registered' },
            { n: loading ? '–' : `${cities.length}`, l: 'Cities covered' },
            { n: `${PORTALS.length}`, l: 'Role-based portals' },
            { n: '24/7', l: 'Helpline support' },
          ].map((s, i) => (
            <div
              key={s.l}
              className={`px-4 py-6 text-center ${i > 1 ? 'border-t border-slate-200 md:border-t-0' : ''} ${i % 2 ? 'border-l border-slate-200 md:border-l-0' : ''}`}
            >
              <p className="text-3xl font-black tracking-tight text-[#0A4D94]">{s.n}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── REGISTERED COLLEGES SHOWCASE ──────────────────────── */}
      <section id="colleges-showcase" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="Registered Colleges Directory"
            text="Explore premier colleges and academies across Pakistan. Browse campuses, admissions, and verified portals."
          />

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <CollegesHubLoader size="lg" text="Loading registered colleges…" />
            </div>
          ) : (
            <>
              {/* Top 10 Colleges Grid with refreshed card UI */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {colleges.slice(0, 10).map(c => (
                  <HomeCollegeCard key={c.id || c.code} college={c} />
                ))}
              </div>

              {/* View More Colleges Banner */}
              <div className="mt-14 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#F3F7FC] via-white to-slate-50 p-8 text-center shadow-sm sm:p-12">
                <div className="mx-auto max-w-xl">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Explore all {colleges.length}+ colleges in our directory
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Search every registered institution across all cities in Pakistan, check open admission cycles, and access digital campus profiles.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/colleges"
                      className={`${btnPrimary} px-8 py-3.5 text-sm`}
                    >
                      View All Colleges Directory ({colleges.length}+) <HiArrowRight size={16} />
                    </Link>
                    <Link
                      href="/join"
                      className={`${btnOutline} px-6 py-3.5 text-sm`}
                    >
                      Register Your College
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 bg-[#F3F7FC] py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="Platform Features: Everything your college needs in one place"
            text="Replace scattered spreadsheets and paperwork with a single, organised system."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.06}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0A4D94]/30 hover:shadow-[0_20px_40px_-20px_rgba(10,77,148,0.35)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A4D94]/[0.08] text-[#0A4D94] transition-colors group-hover:bg-[#0A4D94] group-hover:text-white">
                    <f.icon size={24} />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (WITH SCROLL ANIMATION) ───────────────── */}
      <section id="how-it-works" className="scroll-mt-20 overflow-hidden bg-white py-24">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="How It Works: Get your college online in three steps"
            text="A simple, guided onboarding process with our dedicated team beside you."
          />

          <div className="relative mt-16">
            {/* Animated Connecting Track */}
            <div className="absolute left-[16%] right-[16%] top-1/2 -translate-y-12 hidden h-0.5 md:block">
              <div className="h-full w-full bg-slate-200" />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                className="absolute inset-0 origin-left bg-gradient-to-r from-[#0A4D94] via-[#2A9B4A] to-[#0A4D94]"
              />
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  className="group relative flex flex-col items-center rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-sm transition-all hover:border-[#0A4D94]/30 hover:shadow-[0_20px_40px_-20px_rgba(10,77,148,0.2)]"
                >
                  {/* Step Number Circle */}
                  <div className="relative mb-6">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0A4D94] to-[#083f7a] text-2xl font-black text-white shadow-[0_12px_28px_-8px_rgba(10,77,148,0.5)] ring-8 ring-white transition-transform duration-300 group-hover:scale-105">
                      {s.n}
                    </div>
                    <span className="absolute -inset-1 -z-10 rounded-3xl bg-[#0A4D94]/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-[#0A4D94]">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.text}</p>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#0A4D94]">
                    <span>Step {i + 1} of 3</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE-BASED PORTALS (NO SVGs, EXPAND BUTTON) ────────── */}
      <section id="portals" className="scroll-mt-20 bg-[#F3F7FC] py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="Role-Based Portals: A dedicated workspace for every role"
            text="Each person signs in once and lands in a portal built specifically for their responsibilities."
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PORTALS.map((p, i) => {
              const isExpanded = expandedRole === p.title;
              return (
                <Reveal key={p.title} delay={(i % 4) * 0.05}>
                  <div
                    className={`flex h-full flex-col rounded-2xl border bg-white p-6 transition-all duration-300 ${
                      isExpanded
                        ? 'border-[#0A4D94] shadow-[0_16px_36px_-12px_rgba(10,77,148,0.25)] ring-2 ring-[#0A4D94]/15'
                        : 'border-slate-200 shadow-sm hover:-translate-y-1 hover:border-[#0A4D94]/30 hover:shadow-md'
                    }`}
                  >
                    {/* Top Role Badge (NO SVG) */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {p.badge}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Portal</span>
                    </div>

                    {/* Role Title & Subtitle */}
                    <h3 className="mt-4 text-lg font-bold text-slate-900">{p.title}</h3>
                    <p className="text-xs font-medium text-[#0A4D94]">{p.subtitle}</p>

                    {/* Short Summary */}
                    <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600">{p.text}</p>

                    {/* Expand Button */}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => toggleRole(p.title)}
                        className="flex w-full items-center justify-between py-1 text-xs font-bold text-[#0A4D94] transition-colors hover:text-[#083f7a]"
                      >
                        <span>{isExpanded ? 'Hide explanation' : 'Role details & tools'}</span>
                        <HiChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#0A4D94]' : 'text-slate-400'}`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                              <p>{p.details}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action Link */}
                    <div className="mt-4 pt-1">
                      <Link
                        href="/login"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-[#0A4D94] hover:text-white"
                      >
                        <span>Sign in to {p.title}</span>
                        <HiChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY COLLEGESHUB ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#051d3a] py-24">
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#0A4D94]/40 blur-[110px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#2A9B4A]/20 blur-[110px]" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            light
            title="Why Collegeshub: Built for trust, designed for education"
            text="Institutions choose a platform they can rely on every single day."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.07}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:bg-white/[0.07]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <w.icon size={24} />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-white">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-[820px] px-4 sm:px-6">
          <SectionHead
            title="Frequently Asked Questions (FAQ)"
            text="Everything you need to know about getting started and managing your institution."
          />
          <div className="space-y-3">
            {FAQ.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div
                  key={f.q}
                  className={`overflow-hidden rounded-2xl border transition-colors ${
                    open ? 'border-[#0A4D94]/30 bg-[#F3F7FC]' : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => setFaqOpen(open ? -1 : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[15px] font-bold text-slate-900">{f.q}</span>
                    <HiChevronDown
                      size={20}
                      className={`shrink-0 text-[#0A4D94] transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
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
      <section id="contact" className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A4D94] via-[#083f7a] to-[#051d3a] px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#2A9B4A]/30 blur-[90px]" />
          <div className="relative mx-auto max-w-xl space-y-5">
            <BrandLogo variant="stacked" height={96} dark className="mx-auto" />
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
              Is your college not on Collegeshub yet?
            </h2>
            <p className="text-base leading-relaxed text-white/75">
              Bring admissions, academics, attendance, fees and certificates online from a single platform.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2A9B4A] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#238240]"
              >
                Join Collegeshub <HiArrowRight size={16} />
              </Link>
              <Link
                href="/request-subscription"
                className="inline-flex items-center rounded-xl border border-white/30 px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/10"
              >
                Request Subscription
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <PublicFooter />
    </div>
  );
}

function HomeCollegeCard({ college }) {
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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0A4D94]/35 hover:shadow-[0_20px_45px_-15px_rgba(10,77,148,0.22)]">
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
          <span className="rounded-md bg-white/95 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0A4D94] shadow-sm backdrop-blur-sm">
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

        {/* Location & Metadata */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-100">
            <HiOutlineLocationMarker size={12} className="text-slate-400" />
            {college.city || 'Pakistan'}
          </span>
          {settings.establishedYear && (
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-100">
              Est. {settings.establishedYear}
            </span>
          )}
          {settings.affiliation && (
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-100">
              {settings.affiliation}
            </span>
          )}
        </div>

        {/* Footer Link */}
        <div className="mt-4 pt-1">
          <a
            href={tenantUrl}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0A4D94] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#083f7a]"
          >
            <span>Visit College Portal</span>
            <HiChevronRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

function HeroPreview() {
  const bars = [40, 65, 80, 55, 90, 75, 85];
  const rows = [
    { n: 'Hamza Malik', p: 'FSc Pre-Medical', s: 'Verified', c: 'bg-emerald-100 text-emerald-800' },
    { n: 'Ayesha Khan', p: 'ICS Computer Sci', s: 'Enrolled', c: 'bg-blue-100 text-blue-800' },
    { n: 'Bilal Ahmed', p: 'FSc Pre-Engineering', s: 'Pending', c: 'bg-amber-100 text-amber-800' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-[#0A4D94]/15 to-[#2A9B4A]/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_-25px_rgba(5,29,58,0.4)]">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <BrandLogo variant="mark" height={26} />
          <span className="text-sm font-bold text-slate-800">College Dashboard</span>
          <span className="ml-auto flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <i className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <i className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </span>
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
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-[#0A4D94] to-[#4C94E8]"
                  style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.55 }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.n} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A4D94]/10 text-xs font-bold text-[#0A4D94]">
                  {r.n[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{r.n}</p>
                  <p className="truncate text-[11px] text-slate-400">{r.p}</p>
                </div>
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
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A9B4A]/10 text-[#2A9B4A]">
          <HiOutlineBadgeCheck size={18} />
        </span>
        <div>
          <p className="text-xs font-bold text-slate-800">Result published</p>
          <p className="text-[10px] text-slate-400">Sample preview</p>
        </div>
      </div>
    </div>
  );
}
