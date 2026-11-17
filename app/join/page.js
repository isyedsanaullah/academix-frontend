'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  HiArrowRight, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding,
  HiOutlineUser, HiOutlineLogin, HiOutlineShieldCheck, HiOutlineUserGroup,
  HiOutlineClipboardList, HiOutlineAcademicCap, HiOutlineLocationMarker,
  HiOutlineCash, HiOutlineKey, HiOutlineChatAlt2, HiOutlineFolderOpen,
  HiOutlineBadgeCheck, HiOutlineMenu, HiOutlineX, HiOutlineSparkles,
  HiOutlineDatabase, HiOutlineScale, HiOutlineCollection, HiOutlineCheckCircle,
} from 'react-icons/hi';
import { HiOutlineCpuChip } from 'react-icons/hi2';
import PublicFooter from '@/components/common/PublicFooter';
import BrandLogo from '@/components/common/BrandLogo';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────────────────────────────
   Design tokens (taken from the CollegesHub logo)
   navy-900  #061E3D  hero / dark panels
   navy-600  #0A4D94  brand blue — primary actions on light
   blue-500  #3068A7  secondary blue
   sky-400   #4C94E8  accents on dark, focus ring
   green-600 #1F7A3A  text-safe green on light (logo green #299A49 is too light for small text)
   green-400 #3DBE63  logo green on dark
   ink       #0E2238  headings        muted  #52657C  body
   surface   #F4F7FB  alt sections    line   #DDE6F0  borders
   ────────────────────────────────────────────────────────────────────── */


/* ── Content (Canonical Master Blueprint v4.1 — All 13 Phases Live) ─ */

const fmt = (n) => n.toLocaleString('en-US');

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    best: 'Small and new colleges',
    monthly: 2999,
    yearly: 32989,
    liveCount: 26,
    totalCount: 33,
    services: '26 live today (33 total): academic foundation, daily attendance register, timetable, cash vouchers, audit trail (30d) & recycle bin (30d)',
    students: '300',
    extra: 'Not available: upgrade to Standard',
    staff: '20',
    admins: '2 admins (fixed)',
    campuses: '1 campus',
    storage: '5 GB (10 MB/file)',
    apps: 'Manual desk intake',
    emails: '3,000 emails / mo',
    restore: 'Recycle bin only (30d)',
    support: 'Email support',
    cta: 'Request Starter',
  },
  {
    id: 'standard',
    name: 'Standard',
    best: 'Established private & degree colleges',
    monthly: 5999,
    yearly: 65989,
    recommended: true,
    liveCount: 70,
    totalCount: 88,
    services: '70 live today (88 total): gate QR, 3-copy challans, payroll, AI quiz & translation (AI Lite 1M), + Library/Canteen add-on options',
    students: '750',
    extra: 'PKR 15 per student (+50% cap)',
    staff: '50',
    admins: '5 admins (fixed)',
    campuses: '1 campus',
    storage: '25 GB (max 45 GB w/ 2 add-on blocks)',
    apps: '50 / year (max 100 w/ 2 packs)',
    emails: '10,000 emails / mo',
    restore: 'Recycle bin only (30d)',
    support: 'In-app chat, business hours',
    cta: 'Request Standard',
  },
  {
    id: 'premium',
    name: 'Premium',
    best: 'Growing & multi-campus institutions (up to 3 campuses)',
    monthly: 14999,
    yearly: 164989,
    liveCount: 86,
    totalCount: 153,
    services: '86 live today (153 total): 2 campuses included, Library & Canteen free, AI Full (20M credits, 20/day tutor, Ask-Your-Data, Agent), N05 ZIP backup',
    students: '2,000',
    extra: 'PKR 10 per student (+50% / 3,000)',
    staff: '150',
    admins: '15 admins (fixed)',
    campuses: '2 campuses (+1 add-on -> 3 max)',
    storage: '150 GB (max 300 GB w/ add-ons)',
    apps: '300 / year (max 600 w/ packs)',
    emails: '25,000 emails / mo',
    restore: '1 self-service ZIP backup / mo (N05)',
    support: 'Priority chat & onboarding',
    cta: 'Request Premium',
  },
];

const COMPARISON_ROWS = [
  { label: 'Price per month', v: ['PKR 2,999', 'PKR 5,999', 'PKR 14,999'] },
  { label: 'Price per year (1 Mo FREE)', v: ['PKR 32,989 (save 2,999)', 'PKR 65,989 (save 5,999)', 'PKR 164,989 (save 14,999)'] },
  { label: 'Live / Total Services', v: ['26 live / 33 total', '70 live / 88 total', '86 live / 153 total (+9 add-ons)'] },
  { label: 'Best for', v: ['Small & new colleges', 'Single-campus private colleges', 'Multi-campus & AI colleges (2–3 campuses)'] },
  { label: 'Students included', v: ['300', '750', '2,000'] },
  { label: 'Extra student / month', v: ['Not available: upgrade', 'PKR 15 (+50% cap -> 1,125)', 'PKR 10 (+50% cap -> 3,000)'] },
  { label: 'Staff accounts included', v: ['20', '50 (+50% @ PKR 120)', '150 (+50% @ PKR 90)'] },
  { label: 'Administrator accounts', v: ['2 admins (fixed)', '5 admins (fixed)', '15 admins (fixed)'] },
  { label: 'Campuses under one admin', v: ['1 campus', '1 campus', '2 campuses (+1 @ PKR 3,000 -> 3 max)'] },
  { label: 'File storage & max upload', v: ['5 GB (10 MB/file, max 15 GB)', '25 GB (25 MB/file, max 45 GB)', '150 GB (100 MB/file, max 300 GB)'] },
  { label: 'Online applications / year', v: ['Manual desk intake', '50 / year (max 100)', '300 / year (max 600)'] },
  { label: 'Monthly bulk emails (2FA exempt)', v: ['3,000 / mo', '10,000 / mo', '25,000 / mo'] },
  { label: 'AI Intelligence Suite', v: ['No', 'AI Lite (1M credits/mo, 20 quizzes, 30 translations)', 'AI Full (20M credits/mo, Tutor, Agent, Ask-Your-Data)'] },
  { label: 'Student AI Tutor Chat (#99)', v: ['Disabled', 'Disabled', '20 msgs / student / day'] },
  { label: 'Message Credits (when live)', v: ['Disabled', 'Disabled', '300 credits / mo (SMS/WA Coming soon)'] },
  { label: 'Monthly Exports & Reports', v: ['3 CSV / mo (1k rows)', '60 CSV + 60 PDF (10k rows)', 'Unlimited fair-use (100k rows) + 30 scheduled'] },
  { label: 'Operations Modules', v: ['Base Academic Core', 'Library & Canteen add-ons (PKR 800/mo Coming soon)', 'Library (#N35) & Canteen (#98) Included Free'] },
  { label: 'Backup & Restore Policy', v: ['Recycle bin only (30d)', 'Recycle bin only (30d)', '90d recycle bin + 1 self-service ZIP/mo (N05)'] },
  { label: 'Audit Trail Retention (#23)', v: ['30 days', '90 days', '365 days'] },
];

const CORE_FEATURES = [
  { icon: HiOutlineFolderOpen, title: 'Students and enrollment', desc: 'Sessions, classes, groups, sections, student records and 2-year promotion cycles.' },
  { icon: HiOutlineUserGroup, title: 'Attendance and registers', desc: 'Daily attendance in manual registers, staff attendance logs and monthly summary statistics.' },
  { icon: HiOutlineClipboardList, title: 'Timetable and scheduling', desc: 'Section timetables, student schedules, combined classes and room allocation matrix.' },
  { icon: HiOutlineAcademicCap, title: 'Exams and results', desc: 'Terminal exams, roll number slips, marks entry, gazettes and printable result cards.' },
  { icon: HiOutlineCash, title: 'Fee vouchers and cash ledger', desc: 'Custom fee structures, cash vouchers, dues ledger and payment proof uploads.' },
  { icon: HiOutlineChatAlt2, title: 'Announcements and circulars', desc: 'Campus announcements, official circulars, and role-based notification feeds.' },
  { icon: HiOutlineKey, title: 'Audit trail and file vault', desc: 'Tamper-evident audit logging, secure file storage, and recycle bin with 30-day restore.' },
];

const PREMIUM_FEATURES = [
  { icon: HiOutlineShieldCheck, title: 'Gate QR auto-attendance & ID cards', desc: 'Daily attendance marked automatically by gate QR scans, with instant barcode/QR ID cards.', plan: 'Standard' },
  { icon: HiOutlineCash, title: '3-copy bank challans and payroll', desc: 'Kuickpay/1Link ready bank challans, fee defaulters ledger, staff salary and pay slips.', plan: 'Standard' },
  { icon: HiOutlineClipboardList, title: 'Online admissions and merit lists', desc: 'Public application portal, quota reservations, matric merit calculation and desk intake.', plan: 'Standard' },
  { icon: HiOutlineChatAlt2, title: 'Parent Portal PWA', desc: 'Dedicated mobile web app for parents with live attendance, marks, challans and absence alerts.', status: 'Coming soon', plan: 'Premium' },
  { icon: HiOutlineLocationMarker, title: 'Universal master timetable & conflict solver', desc: 'Campus-wide timetable builder with conflict detection, teacher substitutions and room matrix.', status: 'Limited', plan: 'Premium' },
  { icon: HiOutlineCpuChip, title: 'AI Quiz generator & document OCR', desc: 'Generate MCQs and exams from textbook PDFs, plus OCR scanning of student marksheets.', status: 'Full', plan: 'Standard (AI Lite) / Premium' },
  { icon: HiOutlineFolderOpen, title: 'Library management & Canteen POS', desc: 'Book cataloging, barcode circulation, student borrowing, and cafeteria touch POS ledger.', status: 'Add-on', plan: 'Premium Free / Std Add-on (Coming soon)' },
  { icon: HiOutlineSparkles, title: 'Autonomous AI Admin Agent & Ask-Your-Data', desc: 'Approval-gated admin proposals, natural language analytics, and AI student tutor (20 msgs/day).', status: 'Full', plan: 'Premium' },
];

const STEPS = [
  { title: 'Choose a plan', desc: 'Compare the plans below, or ask the developer which one fits your college.' },
  { title: 'Send your request', desc: 'Tell us your college name and the plan you want.' },
  { title: 'Get onboarded', desc: 'The developer helps you set up your college and your first users.' },
];

const HUB_NODES = [
  { label: 'Admissions', x: 120, y: 80 },
  { label: 'Academics', x: 440, y: 80 },
  { label: 'Attendance', x: 80, y: 260 },
  { label: 'Fees', x: 480, y: 260 },
  { label: 'Certificates', x: 130, y: 440 },
  { label: 'Exams', x: 430, y: 440 },
];

/* ── Small pieces ──────────────────────────────────────────────────── */

const GLOBAL_CSS = `
:root { --font-display: 'Bricolage Grotesque', system-ui, sans-serif; --font-body: 'Figtree', system-ui, sans-serif; }
.ch-root { font-family: var(--font-body), system-ui, -apple-system, 'Segoe UI', sans-serif; }
.ch-display { font-family: var(--font-display), var(--font-body), system-ui, sans-serif; letter-spacing: -0.02em; }
.ch-root a:focus-visible, .ch-root button:focus-visible, .ch-root input:focus-visible,
.ch-root select:focus-visible, .ch-root textarea:focus-visible { outline: 2px solid #4C94E8; outline-offset: 2px; }

@keyframes ch-ring { 0% { transform: scale(1); opacity: .45; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes ch-flow { to { stroke-dashoffset: -20; } }
@keyframes ch-pop  { from { opacity: 0; } to { opacity: 1; } }
@keyframes ch-sweep { 0% { transform: translateX(-120%); } 55%, 100% { transform: translateX(220%); } }

.ch-ring { transform-box: fill-box; transform-origin: center; animation: ch-ring 3.2s ease-out infinite; }
.ch-flow { stroke-dasharray: 3 7; animation: ch-flow 1.4s linear infinite; }
.ch-pop  { opacity: 0; animation: ch-pop .5s ease-out forwards; }
.ch-badge { position: relative; overflow: hidden; }
.ch-badge::after { content: ''; position: absolute; inset: 0;
  background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.6) 50%, transparent 70%);
  animation: ch-sweep 3.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ch-ring { animation: none; opacity: .2; }
  .ch-flow { animation: none; }
  .ch-dot { display: none; }
  .ch-pop { animation: none; opacity: 1; }
  .ch-badge::after { animation: none; display: none; }
}
`;

/** Check mark that draws itself once when it scrolls into view. */
function DrawCheck({ size = 18, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="9.5" opacity="0.35" />
      <motion.path d="M7.5 12.5l3 3 6-6.5"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }} />
    </svg>
  );
}

/** Static tick for dense lists. */
function Tick({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function Cell({ value }) {
  if (value === true) return (<><Tick className="mx-auto text-[#1F7A3A]" /><span className="sr-only">Included</span></>);
  if (value === false) return (<><span aria-hidden="true" className="text-[#9AA9BB]">—</span><span className="sr-only">Not included</span></>);
  return <span className="text-[13px] font-medium text-[#0E2238]">{value}</span>;
}

function SectionHeading({ title, children }) {
  return (
    <div className="max-w-[640px]">
      <h2 className="ch-display text-3xl font-bold leading-[1.1] text-[#0E2238] sm:text-[40px]">{title}</h2>
      {children && <p className="mt-4 text-base leading-relaxed text-[#52657C]">{children}</p>}
    </div>
  );
}

function FeatureRow({ icon: Icon, title, desc, tone = 'blue', status = 'Full', plan }) {
  const box = tone === 'green' ? 'bg-[#DFF2E5] text-[#1F7A3A]' : 'bg-[#E8F0FA] text-[#0A4D94]';
  const chip = (status === 'Full' || status === 'Available now')
    ? 'bg-[#DFF2E5] text-[#1F7A3A]'
    : status === 'Coming soon'
      ? 'bg-[#EEF2F7] text-[#52657C]'
      : status === 'Add-on'
        ? 'bg-[#EDE9FE] text-[#6D28D9]'
        : 'bg-[#FFF1D6] text-[#8A5A00]';
  return (
    <li className="flex gap-4 px-1 py-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${box}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h4 className="text-[15px] font-semibold text-[#0E2238]">{title}</h4>
        <p className="mt-0.5 text-sm leading-relaxed text-[#52657C]">{desc}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-0.5 font-semibold ${chip}`}>{status}</span>
          {plan && <span className="text-[#52657C]">Included from {plan}</span>}
        </p>
      </div>
    </li>
  );
}

/** Hero illustration: the CollegesHub mark at the centre, every module connected to it. */
function CampusHub() {
  return (
    <div className="relative mx-auto aspect-[560/520] w-full max-w-[420px] sm:max-w-[540px]"
      role="img" aria-label="Diagram: admissions, academics, attendance, fees, certificates and exams all connected through one CollegesHub platform">
      <svg viewBox="0 0 560 520" className="h-full w-full" aria-hidden="true">
        {/* connectors */}
        {HUB_NODES.map((n, i) => (
          <line key={`l${i}`} x1="280" y1="260" x2={n.x} y2={n.y} stroke="#4C94E8" strokeOpacity="0.55" strokeWidth="1.5" className="ch-flow" />
        ))}
        {/* data travelling along the connectors */}
        {HUB_NODES.map((n, i) => (
          <circle key={`d${i}`} r="4.5" fill="#3DBE63" className="ch-dot">
            <animateMotion dur="3.2s" begin={`${1.4 + i * 0.45}s`} repeatCount="indefinite"
              path={i % 2 === 0 ? `M280 260 L${n.x} ${n.y}` : `M${n.x} ${n.y} L280 260`} />
          </circle>
        ))}
        {/* module pills */}
        {HUB_NODES.map((n, i) => (
          <g key={`n${i}`} className="ch-pop" style={{ animationDelay: `${0.35 + i * 0.12}s` }}>
            <rect x={n.x - 72} y={n.y - 24} width="144" height="48" rx="24" fill="#0B3566" stroke="#4C94E8" strokeOpacity="0.5" />
            <circle cx={n.x - 46} cy={n.y} r="5" fill="#3DBE63" />
            <text x={n.x - 32} y={n.y + 5.5} fill="#FFFFFF" fontSize="16" fontWeight="600"
              style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>{n.label}</text>
          </g>
        ))}
        {/* hub */}
        <circle cx="280" cy="260" r="64" fill="none" stroke="#3DBE63" strokeWidth="2" className="ch-ring" />
        <circle cx="280" cy="260" r="64" fill="none" stroke="#4C94E8" strokeWidth="2" className="ch-ring" style={{ animationDelay: '1.6s' }} />
        <circle cx="280" cy="260" r="64" fill="#FFFFFF" />
      </svg>
      <div className="absolute left-1/2 top-1/2 w-[14%] -translate-x-1/2 -translate-y-1/2">
        <Image src="/logo-mark.svg" alt="" width={66} height={63} className="h-auto w-full" priority />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function JoinPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '', organization: '', email: '', phone: '', interest: '', subject: '', message: '',
  });

  const rise = (delay) => (reduce ? {} : {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  });

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  const setField = (key) => (e) => setContactForm((f) => ({ ...f, [key]: e.target.value }));

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.subject.trim() || !contactForm.message.trim()) {
      return toast.error('Please fill in all required fields');
    }
    setSubmitting(true);
    try {
      const response = await api.post('/public/contact', {
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        subject: contactForm.subject,
        message: `College/Org: ${contactForm.organization || 'Not provided'}\nInterested in: ${contactForm.interest || 'Not specified'}\n\n${contactForm.message}`,
      });
      if (response.data?.success) {
        setSentTo(contactForm.email);
        setContactForm({ name: '', organization: '', email: '', phone: '', interest: '', subject: '', message: '' });
      } else {
        throw new Error(response.data?.message || 'Failed to send message');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Message not sent. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'h-11 w-full rounded-lg border border-[#C5D3E4] bg-white px-3.5 text-sm text-[#0E2238] placeholder:text-[#8696AB] transition-colors hover:border-[#9FB3CC] focus:border-[#0A4D94]';
  const labelCls = 'mb-1.5 block text-sm font-semibold text-[#0E2238]';
  const wrap = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8';

  const NAV = [
    ['features', 'Features'],
    ['pricing', 'Plans'],
    ['contact', 'Contact'],
  ];

  return (
    <div className="ch-root flex min-h-screen flex-col bg-white text-[#0E2238] selection:bg-[#4C94E8]/30">
      <style>{GLOBAL_CSS}</style>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#DDE6F0] bg-white/90 backdrop-blur-md">
        <div className={`${wrap} flex h-[68px] items-center justify-between gap-4`}>
          <a href="/" aria-label="CollegesHub home" className="shrink-0">
            <BrandLogo variant="horizontal" height={32} priority />
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-medium text-[#3B4F68] md:flex">
            {NAV.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="transition-colors hover:text-[#0A4D94]">{label}</button>
            ))}
            <a href="/" className="transition-colors hover:text-[#0A4D94]">Colleges</a>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/login')}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#C5D3E4] px-3.5 text-sm font-semibold text-[#0A4D94] transition-colors hover:bg-[#F4F7FB]">
              <HiOutlineLogin size={16} aria-hidden="true" /> Log in
            </button>
            <button onClick={() => scrollTo('pricing')}
              className="hidden h-10 items-center rounded-lg bg-[#0A4D94] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#083f7a] sm:inline-flex">
              View plans
            </button>
            <button onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label="Menu"
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#C5D3E4] text-[#0E2238] md:hidden">
              {menuOpen ? <HiOutlineX size={20} /> : <HiOutlineMenu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" aria-label="Mobile" className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-[#DDE6F0] bg-white md:hidden">
            <div className={`${wrap} flex flex-col py-2`}>
              {NAV.map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="py-3 text-left text-base font-medium text-[#0E2238]">{label}</button>
              ))}
              <a href="/" className="py-3 text-base font-medium text-[#0E2238]">Colleges</a>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 pt-[68px]">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#061E3D] text-white">
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
            <defs>
              <pattern id="ch-dots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ch-dots)" />
          </svg>

          <div className={`${wrap} relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-24`}>
            <div>
              <motion.h1 {...rise(0)} className="ch-display text-[34px] font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
                Run your whole college from one place
              </motion.h1>
              <motion.p {...rise(0.1)} className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[#C9D9EE]">
                CollegesHub brings admissions, academics, attendance, fees and certificates into one platform, with dedicated screens for every role on your campus.
              </motion.p>

              <motion.div {...rise(0.2)} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => scrollTo('pricing')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#3DBE63] px-7 text-base font-bold text-[#06264A] transition-colors hover:bg-[#59CE7C]">
                  Compare plans <HiArrowRight size={18} aria-hidden="true" />
                </button>
                <button onClick={() => scrollTo('contact')}
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10">
                  Talk to the developer
                </button>
              </motion.div>

              <motion.ul {...rise(0.32)} className="mt-10 grid gap-3 text-[15px] text-[#DCE8F7] sm:grid-cols-1">
                {[
                  'Three clear plans from PKR 2,999 / month (Starter, Standard, Premium)',
                  'Yearly billing includes 1 Month FREE (11 months billed for 12 months access)',
                  '86 live services verified today out of 162 cataloged services (14-day free trial)',
                ].map((t, i) => (
                  <li key={t} className="flex items-center gap-3">
                    <DrawCheck size={20} className="text-[#3DBE63]" delay={0.8 + i * 0.25} />
                    {t}
                  </li>
                ))}
              </motion.ul>
            </div>

            <motion.div {...(reduce ? {} : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] } })}>
              <CampusHub />
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className={`${wrap} grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16`}>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading title="Everything a college runs on, in one system">
                Replace separate registers, spreadsheets and chat groups with a single platform your whole staff can log in to.
              </SectionHeading>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#0E2238]">Available from Starter (Academic Core)</h3>
                <ul className="divide-y divide-[#DDE6F0] border-y border-[#DDE6F0]">
                  {CORE_FEATURES.map((f) => <FeatureRow key={f.title} {...f} />)}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#1F7A3A]">Added in higher plans (Operations & AI)</h3>
                <ul className="divide-y divide-[#CFE7D6] border-y border-[#CFE7D6] bg-[#F3FAF5] px-3">
                  {PREMIUM_FEATURES.map((f) => <FeatureRow key={f.title} tone="green" {...f} />)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS (a real sequence) ───────────────────── */}
        <section className="bg-[#F4F7FB] py-20 sm:py-24">
          <div className={wrap}>
            <SectionHeading title="From request to a running campus in three steps" />
            <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              <motion.div aria-hidden="true"
                className="absolute left-5 right-5 top-5 hidden h-px origin-left bg-[#9FB3CC] md:block"
                initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-80px' }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative">
                  <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[#0A4D94] text-base font-bold text-white ring-8 ring-[#F4F7FB]">{i + 1}</span>
                  <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 max-w-[34ch] text-[15px] leading-relaxed text-[#52657C]">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 bg-white py-16 sm:py-24">
          <div className={wrap}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading title="Pick the plan that fits your college">
                Prices are in PKR, excluding sales tax. Yearly billing includes 1 Month FREE (11 months billed for 12 months access).
              </SectionHeading>
              <div role="group" aria-label="Billing period" className="inline-flex shrink-0 self-start rounded-lg border border-[#C5D3E4] bg-[#F4F7FB] p-1 lg:self-auto">
                {[[false, 'Monthly'], [true, 'Yearly: 1 month free']].map(([v, l]) => (
                  <button key={l} aria-pressed={annual === v} onClick={() => setAnnual(v)}
                    className={`h-10 rounded-md px-4 text-sm font-semibold transition-colors ${annual === v ? 'bg-[#0A4D94] text-white' : 'text-[#26405C] hover:bg-white'}`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PLANS.map((plan) => {
                const rec = !!plan.recommended;
                const sub = rec ? 'text-[#A9C2E2]' : 'text-[#52657C]';
                return (
                  <article key={plan.id}
                    className={`relative flex flex-col rounded-2xl p-6 ${rec ? 'bg-[#061E3D] text-white shadow-[0_24px_48px_-20px_rgba(6,30,61,0.55)]' : 'border border-[#DDE6F0] bg-white'}`}>
                    {rec && <span className="ch-badge absolute -top-3 left-6 rounded-full bg-[#3DBE63] px-3.5 py-1 text-xs font-bold text-[#06264A]">Most Popular</span>}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="ch-display text-2xl font-bold">{plan.name}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${rec ? 'bg-white/15 text-[#DCE8F7]' : 'bg-[#E8F0FA] text-[#0A4D94]'}`}>
                        {plan.liveCount} live / {plan.totalCount} total
                      </span>
                    </div>
                    <p className={`mt-1 min-h-[40px] text-sm ${sub}`}>{plan.best}</p>

                    <div className="mt-4 min-h-[84px]">
                      <p className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="ch-display text-3xl font-extrabold">PKR {fmt(annual ? plan.yearly : plan.monthly)}</span>
                        <span className={`text-sm ${sub}`}>{annual ? 'per year' : 'per month'}</span>
                      </p>
                      <p className={`mt-1 text-sm ${sub}`}>{annual ? `PKR ${fmt(plan.monthly)} x 11 months billed (1 Mo FREE)` : 'Billed monthly'}</p>
                    </div>

                    <p className={`min-h-[68px] border-t pt-4 text-sm leading-relaxed ${rec ? 'border-white/15 text-[#DCE8F7]' : 'border-[#DDE6F0] text-[#26405C]'}`}>{plan.services}</p>

                    <dl className="mt-2 text-sm">
                      {[['Students included', plan.students], ['Extra students', plan.extra], ['Staff / Admins', `${plan.staff} staff · ${plan.admins}`], ['Campuses', plan.campuses], ['File storage', plan.storage], ['Applications a year', plan.apps], ['Monthly emails', plan.emails], ['Backup / Restore', plan.restore], ['Support', plan.support]].map(([k, v]) => (
                        <div key={k} className={`flex justify-between gap-3 border-b py-2.5 last:border-0 ${rec ? 'border-white/10' : 'border-[#EEF2F7]'}`}>
                          <dt className={sub}>{k}</dt>
                          <dd className="text-right font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <button onClick={() => router.push(`/request-subscription?plan=${plan.id}`)}
                      className={`mt-auto h-12 w-full rounded-lg text-[15px] font-bold transition-colors ${rec ? 'bg-[#3DBE63] text-[#06264A] hover:bg-[#59CE7C]' : 'border border-[#0A4D94] text-[#0A4D94] hover:bg-[#0A4D94] hover:text-white'}`}
                      style={{ marginTop: 24 }}>
                      {plan.cta}
                    </button>
                  </article>
                );
              })}
            </div>

            {/* ── CUSTOM QUOTE BANNER (>3,000 students or 4+ campuses) ── */}
            <div className="mt-8 rounded-2xl border border-[#DDE6F0] bg-[#F8FAFC] p-6 sm:p-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#E8F0FA] px-3 py-0.5 text-[11px] font-bold text-[#0A4D94]">
                  Custom Quote · Above 3,000 Students or 4+ Campuses
                </span>
                <h3 className="ch-display mt-2 text-xl font-bold text-[#0E2238]">
                  Need capacity beyond 3,000 students or 4 or more campuses?
                </h3>
                <p className="mt-1 text-sm text-[#52657C]">
                  Premium supports up to 3,000 students (with extra student add-ons) and up to 3 campuses (with 1 extra campus add-on). Larger groups receive a tailored Custom Quote.
                </p>
              </div>
              <button
                onClick={() => router.push('/request-subscription?plan=custom_quote')}
                className="shrink-0 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#061E3D] px-6 text-sm font-bold text-white hover:bg-[#0A4D94] transition-colors"
              >
                Request Custom Quote <HiArrowRight size={16} />
              </button>
            </div>

            {/* ── PLATFORM READINESS STATUS ───────────────────── */}
            <div className="mt-8 rounded-2xl border border-[#CCE0F5] bg-gradient-to-br from-[#F0F7FF] to-[#E5F1FC] p-6 sm:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#0A4D94]/10 px-3 py-1 text-xs font-bold text-[#0A4D94]">
                    <span className="h-2 w-2 rounded-full bg-[#1F7A3A] animate-pulse" />
                    Transparent Status: Full · Limited · Add-on · Coming soon
                  </div>
                  <h3 className="ch-display mt-2 text-xl font-bold text-[#061E3D] sm:text-2xl">
                    86 Live Services Ready Today · 162 Total Across Plans & 9 Add-ons
                  </h3>
                  <p className="mt-1.5 max-w-[85ch] text-sm leading-relaxed text-[#3B4F68]">
                    Every plan clearly separates what is <strong>Live</strong> today (26 in Starter, 70 in Standard, 86 in Premium) from upcoming <strong>Coming soon</strong> roadmap services and 9 optional <strong>Add-on</strong> modules. Starter and Standard restore deleted records via the <strong>Recycle bin only (30 days)</strong>; Premium includes monthly self-service backup exports (N05).
                  </p>
                </div>
                <div className="shrink-0">
                  <a href="/services"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0A4D94] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#083f7a]">
                    Explore 162 Services Catalog <HiArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>

            {/* ── ADD-ON CATALOG & POLICIES ──────────────────── */}
            <div className="mt-10">
              <div className="mb-6">
                <h3 className="ch-display text-2xl font-bold text-[#0E2238]">Add-On Catalog & Expansion Pricing</h3>
                <p className="mt-1 text-sm text-[#52657C]">
                  Scale your college capacity flexibly without getting locked into unnecessary tier upgrades.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Capacity Card */}
                <div className="flex flex-col rounded-2xl border border-[#DDE6F0] bg-[#F8FAFC] p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F0FA] text-[#0A4D94]">
                      <HiOutlineUserGroup size={22} />
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-[#0E2238]">Capacity Add-Ons</h4>
                      <p className="text-xs text-[#52657C]">Students, staff & storage blocks</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-3 divide-y divide-[#E2E8F0] text-sm">
                    <li className="pt-2.5 first:pt-0">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Extra Student</span>
                        <span className="text-[#0A4D94]">PKR 15 / 10 / mo</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Std: PKR 15 (+50% cap) · Prem: PKR 10 (+50% cap → 3,000 max)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Extra Staff Account</span>
                        <span className="text-[#0A4D94]">PKR 120 / 90 / mo</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Std: PKR 120 (+50% cap) · Prem: PKR 90 (+50% cap → 225 max)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Administrator Cap</span>
                        <span className="text-[#52657C]">Fixed: 2 / 5 / 15</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Admin seats are fixed by tier (Starter 2, Standard 5, Premium 15)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Extra 10 GB Storage</span>
                        <span className="text-[#0A4D94]">PKR 600 / 500 / 400</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Starter: max 1 (+10 GB → 15 GB) · Std: max 2 (+20 GB → 45 GB) · Prem: max 15 (300 GB)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Online Admissions (25-Pk)</span>
                        <span className="text-[#0A4D94]">PKR 2,500 / 1,800 / yr</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Valid 1 year · Std: PKR 2,500 (max 2 packs) · Prem: PKR 1,800 (max 12 packs)</p>
                    </li>
                  </ul>
                </div>

                {/* Modules Card (9 Add-ons — Coming soon badges) */}
                <div className="flex flex-col rounded-2xl border border-[#DDE6F0] bg-[#F8FAFC] p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E6F4EA] text-[#1F7A3A]">
                      <HiOutlineCollection size={22} />
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-[#0E2238]">9 Optional Add-On Modules</h4>
                      <p className="text-xs text-[#52657C]">Coming soon — purchase unlocks as each goes live</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-3 divide-y divide-[#E2E8F0] text-sm">
                    <li className="pt-2.5 first:pt-0">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Library (N35) &amp; Canteen POS (#98)</span>
                        <span className="text-[#8A5A00] text-xs font-bold">Coming soon · PKR 800/mo</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Standard add-on · <strong className="text-[#1F7A3A]">Included Free on Premium</strong></p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Transport (N36) &amp; Hostel (N37)</span>
                        <span className="text-[#8A5A00] text-xs font-bold">Coming soon · PKR 1,200/mo</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Available on Standard &amp; Premium when live</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Accounting (N40) &amp; Staff HR (N42)</span>
                        <span className="text-[#8A5A00] text-xs font-bold">Coming soon · PKR 2,500 / 1,500</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Premium add-on · Accounting PKR 2,500/mo · Staff HR PKR 1,500/mo</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Governance Pack (N13–N16) &amp; API (N06)</span>
                        <span className="text-[#8A5A00] text-xs font-bold">Coming soon · PKR 4,000 / 2,500</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">White-label, SSO, IP Allow-list, Legal Hold (PKR 4,000) · Public API (PKR 2,500)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Extra Campus Slot (Campus #3)</span>
                        <span className="text-[#1F7A3A]">PKR 3,000 / mo</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Premium includes 2 campuses (+1 add-on → 3 max; 4+ = Custom Quote)</p>
                    </li>
                  </ul>
                </div>

                {/* AI & Intelligence Card */}
                <div className="flex flex-col rounded-2xl border border-[#DDE6F0] bg-[#F8FAFC] p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
                      <HiOutlineSparkles size={22} />
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-[#0E2238]">AI &amp; Message Credits</h4>
                      <p className="text-xs text-[#52657C]">Haiku-equivalent AI credits &amp; message top-ups</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-3 divide-y divide-[#E2E8F0] text-sm">
                    <li className="pt-2.5 first:pt-0">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>1M AI Credits Pack</span>
                        <span className="text-[#7C3AED]">PKR 500</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Standard AI Lite top-up (1x Lite, 20x Standard, 40x Advanced)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>5M AI Credits Pack</span>
                        <span className="text-[#7C3AED]">PKR 1,800</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Premium bulk AI pack (20M credits included monthly)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>AI Tutor Daily Cap (#99)</span>
                        <span className="text-[#7C3AED]">20 msgs / day</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Included for Premium students (Starter/Standard: Disabled)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Message Credits (SMS/WA)</span>
                        <span className="text-[#8A5A00] text-xs font-bold">Coming soon · Prem only</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">300/mo free in Premium · Packs: 500 (PKR 2k) / 2,000 (7.5k) / 5,000 (18k)</p>
                    </li>
                    <li className="pt-2.5">
                      <div className="flex justify-between font-semibold text-[#0E2238]">
                        <span>Purchased Credit Expiry</span>
                        <span className="text-[#7C3AED]">Never Expire</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748B]">Purchased AI &amp; Message packs roll over indefinitely while active</p>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Policy Guarantees Grid */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#DDE6F0] bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0E2238]">
                    <DrawCheck size={18} className="text-[#1F7A3A]" />
                    14-Day Free Trial
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#52657C]">
                    Test every workflow with your actual faculty and student rosters. All features of your selected tier are completely unlocked for 14 days.
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDE6F0] bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0E2238]">
                    <DrawCheck size={18} className="text-[#1F7A3A]" />
                    Fair Dynamic Sizing Caps
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#52657C]">
                    +50% dynamic caps prevent colleges from overpaying. Natural break-even calculations show you exactly when moving to the next tier saves money.
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDE6F0] bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0E2238]">
                    <DrawCheck size={18} className="text-[#1F7A3A]" />
                    Immediate Pro-Rata Upgrades
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#52657C]">
                    Upgrades take effect immediately with full credit for unused days. Included modules are automatically refunded and pruned so you never pay twice.
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDE6F0] bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0E2238]">
                    <DrawCheck size={18} className="text-[#1F7A3A]" />
                    Zero Data Lock-In
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#52657C]">
                    Downgrading or pausing your subscription never deletes records. Your data remains protected with a 30-day read-only grace period and 90-day archive retention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON ───────────────────────────────────────── */}
        <section className="bg-[#F4F7FB] py-16 sm:py-24">
          <div className={wrap}>
            <SectionHeading title="Compare plans side by side" />
            <div className="mt-10 overflow-x-auto rounded-2xl border border-[#DDE6F0] bg-white">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <caption className="sr-only">Comparison of Starter, Standard, and Premium plans</caption>
                <thead>
                  <tr className="border-b border-[#DDE6F0]">
                    <th scope="col" className="sticky left-0 w-[24%] bg-white px-4 py-4 text-sm font-semibold text-[#52657C]">Feature</th>
                    {PLANS.map((pl) => (
                      <th key={pl.id} scope="col" className={`px-4 py-4 text-center text-sm font-bold ${pl.recommended ? 'bg-[#EAF1FA] text-[#0A4D94]' : ''}`}>{pl.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-[#EEF2F7] last:border-0">
                      <th scope="row" className="sticky left-0 bg-white px-4 py-3.5 text-sm font-medium text-[#26405C]">{row.label}</th>
                      {row.v.map((val, i) => (
                        <td key={i} className={`px-4 py-3.5 text-center ${PLANS[i].recommended ? 'bg-[#F3F7FC]' : ''}`}><Cell value={val} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                ['Your data stays yours', 'Existing data is never deleted when a plan changes. After a downgrade, services above the new plan are read-only for 30 days and your data is kept for 90 days.'],
                ['Late payments', 'A late payment gives 7 days of full access, then 14 days of read-only access, then suspension.'],
                ['Fees outside the plan', 'Payment gateway fees and SMS or WhatsApp credits are charged at cost plus a margin. Sales tax is confirmed before invoicing.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-[#DDE6F0] bg-white p-5">
                  <h3 className="text-[15px] font-semibold">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#52657C]">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ──────────────────────────────────────────── */}
        <section id="contact" className="scroll-mt-20 bg-[#F4F7FB] py-20 sm:py-24">
          <div className={wrap}>
            <SectionHeading title="Talk to the developer">
              Questions about plans, features or onboarding? Send a message or reach out directly.
            </SectionHeading>

            <div className="mt-12 grid gap-8 lg:grid-cols-5 lg:gap-12">
              <div className="space-y-4 lg:col-span-2">
                <a href="mailto:syyedsanaullah@gmail.com"
                  className="flex items-center gap-4 rounded-xl border border-[#DDE6F0] bg-white p-4 transition-colors hover:border-[#0A4D94]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#E8F0FA] text-[#0A4D94]"><HiOutlineMail size={20} aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm text-[#52657C]">Email</span>
                    <span className="block truncate text-[15px] font-semibold">syyedsanaullah@gmail.com</span>
                  </span>
                </a>
                <a href="tel:+923135013303"
                  className="flex items-center gap-4 rounded-xl border border-[#DDE6F0] bg-white p-4 transition-colors hover:border-[#0A4D94]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#E8F0FA] text-[#0A4D94]"><HiOutlinePhone size={20} aria-hidden="true" /></span>
                  <span>
                    <span className="block text-sm text-[#52657C]">Phone</span>
                    <span className="block text-[15px] font-semibold">+92 313 5013303</span>
                  </span>
                </a>
                <div className="rounded-xl border border-[#DDE6F0] bg-white p-5">
                  <p className="text-[15px] font-semibold">Ready to start?</p>
                  <p className="mt-1 text-sm text-[#52657C]">Skip the message and send a subscription request directly.</p>
                  <div className="mt-4 flex flex-col gap-2.5">
                    <button onClick={() => router.push('/request-subscription')}
                      className="h-11 rounded-lg bg-[#0A4D94] text-sm font-semibold text-white transition-colors hover:bg-[#083f7a]">
                      Request a subscription
                    </button>
                    <a href="/" className="grid h-11 place-items-center rounded-lg border border-[#C5D3E4] text-sm font-semibold text-[#0A4D94] transition-colors hover:bg-[#F4F7FB]">
                      Browse the college directory
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#DDE6F0] bg-white p-6 sm:p-8 lg:col-span-3">
                {sentTo ? (
                  <div role="status" className="flex min-h-[360px] flex-col items-center justify-center text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-[#DFF2E5] text-[#1F7A3A]">
                      <DrawCheck size={36} />
                    </span>
                    <h3 className="ch-display mt-5 text-2xl font-bold">Message sent</h3>
                    <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-[#52657C]">
                      The developer will reply to <span className="font-semibold text-[#0E2238]">{sentTo}</span>.
                    </p>
                    <button onClick={() => setSentTo(null)}
                      className="mt-6 h-11 rounded-lg border border-[#C5D3E4] px-5 text-sm font-semibold text-[#0A4D94] transition-colors hover:bg-[#F4F7FB]">
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5" noValidate={false}>
                    <p className="text-sm text-[#52657C]">Fields marked with * are required.</p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="join-name" className={labelCls}>Your name *</label>
                        <div className="relative">
                          <HiOutlineUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696AB]" size={16} aria-hidden="true" />
                          <input id="join-name" type="text" autoComplete="name" required value={contactForm.name} onChange={setField('name')}
                            placeholder="Full name" className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="join-org" className={labelCls}>College or organization</label>
                        <div className="relative">
                          <HiOutlineOfficeBuilding className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696AB]" size={16} aria-hidden="true" />
                          <input id="join-org" type="text" autoComplete="organization" value={contactForm.organization} onChange={setField('organization')}
                            placeholder="Name of your college" className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="join-email" className={labelCls}>Email *</label>
                        <div className="relative">
                          <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696AB]" size={16} aria-hidden="true" />
                          <input id="join-email" type="email" autoComplete="email" required value={contactForm.email} onChange={setField('email')}
                            placeholder="name@college.edu.pk" className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="join-phone" className={labelCls}>Phone</label>
                        <div className="relative">
                          <HiOutlinePhone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696AB]" size={16} aria-hidden="true" />
                          <input id="join-phone" type="tel" inputMode="tel" autoComplete="tel" value={contactForm.phone} onChange={setField('phone')}
                            placeholder="03XX XXXXXXX" className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="join-interest" className={labelCls}>Interested in</label>
                        <select id="join-interest" value={contactForm.interest} onChange={setField('interest')} className={inputCls}>
                          <option value="">Not sure yet</option>
                          <option>Starter plan</option>
                          <option>Standard plan</option>
                          <option>Premium plan</option>
                          <option>Custom Quote (&gt;3,000 students or 4+ campuses)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="join-subject" className={labelCls}>Subject *</label>
                        <input id="join-subject" type="text" required value={contactForm.subject} onChange={setField('subject')}
                          placeholder="e.g. Questions about onboarding" className={inputCls} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="join-message" className={labelCls}>Message *</label>
                      <textarea id="join-message" required value={contactForm.message} onChange={setField('message')}
                        placeholder="Tell us about your college and what you need"
                        className={`${inputCls} min-h-32 py-3 leading-relaxed`} />
                    </div>

                    <button type="submit" disabled={submitting}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0A4D94] text-[15px] font-bold text-white transition-colors hover:bg-[#083f7a] disabled:cursor-not-allowed disabled:opacity-60">
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                          Sending…
                        </>
                      ) : 'Send message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}