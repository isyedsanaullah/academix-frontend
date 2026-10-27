'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import {
  HiArrowRight, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding,
  HiOutlineUser, HiOutlineLogin, HiOutlineShieldCheck, HiOutlineUserGroup,
  HiOutlineClipboardList, HiOutlineAcademicCap, HiOutlineLocationMarker,
  HiOutlineCash, HiOutlineKey, HiOutlineChatAlt2, HiOutlineFolderOpen,
  HiOutlineBadgeCheck, HiOutlineMenu, HiOutlineX,
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

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });

/* ── Content (all values are the approved ones from the original page) ─ */

const fmt = (n) => n.toLocaleString('en-US');

const PLANS = [
  { id: 'starter', name: 'Starter', best: 'Small and new colleges', monthly: 7999, yearly: 79990, recommended: true,
    services: '29 services: 11 available now, 6 being completed, 12 coming soon',
    students: '300', extra: 'Not available: upgrade', staff: '20', storage: '5 GB', apps: 'None: registrar enters by hand', support: 'Email', cta: 'Request Starter' },
  { id: 'standard', name: 'Standard', best: 'Private colleges', monthly: 19999, yearly: 199990,
    services: 'Everything in Starter plus 56 more services (85 in total)',
    students: '1,000', extra: 'PKR 18 per student', staff: '60', storage: '20 GB', apps: '300', support: 'Chat, business hours', cta: 'Request Standard' },
  { id: 'premium', name: 'Premium', best: 'Growing multi-department colleges', monthly: 44999, yearly: 449990,
    services: 'Everything in Standard plus 6 more services (91 in total)',
    students: '2,500', extra: 'PKR 14 per student', staff: '150', storage: '75 GB', apps: '2,000', support: 'Priority chat', cta: 'Request Premium' },
  { id: 'enterprise', name: 'Enterprise', best: 'Large colleges and groups', monthly: 119999, yearly: 1199990,
    services: 'Everything in Premium plus 12 AI services (103 in total)',
    students: '5,000', extra: 'PKR 12 per student', staff: '400', storage: '300 GB', apps: '10,000', support: 'Named contact', cta: 'Request Enterprise' },
];

const COMPARISON_ROWS = [
  { label: 'Price per month', v: ['PKR 7,999', 'PKR 19,999', 'PKR 44,999', 'PKR 119,999'] },
  { label: 'Price per year (10 months billed)', v: ['PKR 79,990', 'PKR 199,990', 'PKR 449,990', 'PKR 1,199,990'] },
  { label: 'Best for', v: ['Small and new colleges', 'Private colleges', 'Growing multi-department colleges', 'Large colleges and groups'] },
  { label: 'Students included', v: ['300', '1,000', '2,500', '5,000'] },
  { label: 'Extra student, per month', v: ['Not available: upgrade', 'PKR 18', 'PKR 14', 'PKR 12'] },
  { label: 'Staff accounts', v: ['20', '60', '150', '400'] },
  { label: 'File storage included', v: ['5 GB', '20 GB', '75 GB', '300 GB'] },
  { label: 'Online applications per year', v: ['0 (registrar enters by hand)', '300', '2,000', '10,000'] },
  { label: 'Audit log kept', v: ['30 days', '90 days', '180 days', '365 days'] },
  { label: 'Campuses', v: ['1', '1', '1', '3 (extra PKR 15,000 per month)'] },
  { label: 'AI features', v: ['No', 'No', 'No', 'Included, 100M tokens per month shared'] },
  { label: 'Support', v: ['Email', 'Chat, business hours', 'Priority chat', 'Named contact'] },
  { label: 'Services in total', v: ['29', '85', '91', '103'] },
];

const CORE_FEATURES = [
  { icon: HiOutlineFolderOpen, title: 'Students and enrollment', desc: 'Sessions, classes, groups, sections, student records and enrollment.' },
  { icon: HiOutlineUserGroup, title: 'Attendance', desc: 'Daily attendance in a manual register.' },
  { icon: HiOutlineClipboardList, title: 'Timetable', desc: 'A timetable for every section.' },
  { icon: HiOutlineAcademicCap, title: 'Exams and results', desc: 'Exams, roll slips and result cards.' },
  { icon: HiOutlineCash, title: 'Fee vouchers', desc: 'Fee templates and cash vouchers.' },
  { icon: HiOutlineChatAlt2, title: 'Announcements', desc: 'Announcements and in-app notifications for the campus.' },
  { icon: HiOutlineKey, title: 'Audit trail and recycle bin', desc: 'See who changed what, and restore deleted records.' },
];

const PREMIUM_FEATURES = [
  { icon: HiOutlineShieldCheck, title: 'Gate QR attendance', desc: 'Daily attendance marked automatically by the gate QR scan.', plan: 'Standard' },
  { icon: HiOutlineBadgeCheck, title: 'ID cards and certificates', desc: 'ID cards with QR and serial-numbered certificates.', plan: 'Standard' },
  { icon: HiOutlineClipboardList, title: 'Online admissions', desc: 'Public apply portal, merit lists and desk entry.', plan: 'Standard' },
  { icon: HiOutlineCash, title: 'Bank challans and payroll', desc: '3-copy bank challans, dues ledger, payroll and pay slips.', plan: 'Standard' },
  { icon: HiOutlineChatAlt2, title: 'Parent portal', desc: 'Attendance, marks and fee status for parents.', plan: 'Standard', status: 'Coming soon' },
  { icon: HiOutlineLocationMarker, title: 'Automatic timetable', desc: 'A conflict-free timetable built from teacher, subject and room limits.', plan: 'Premium', status: 'Coming soon' },
  { icon: HiOutlineCpuChip, title: 'AI tutor and AI quiz generator', desc: 'AI tutor chat, PDF knowledge library, and quiz, paper and MCQ generator.', plan: 'Enterprise' },
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

function FeatureRow({ icon: Icon, title, desc, tone = 'blue', status = 'Available now', plan }) {
  const box = tone === 'green' ? 'bg-[#DFF2E5] text-[#1F7A3A]' : 'bg-[#E8F0FA] text-[#0A4D94]';
  const chip = status === 'Available now' ? 'bg-[#DFF2E5] text-[#1F7A3A]' : status === 'Coming soon' ? 'bg-[#EEF2F7] text-[#52657C]' : 'bg-[#FFF1D6] text-[#8A5A00]';
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
    <div className={`${display.variable} ${body.variable} ch-root flex min-h-screen flex-col bg-white text-[#0E2238] selection:bg-[#4C94E8]/30`}>
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
                  'Plans from PKR 7,999 per month',
                  'Yearly billing is 10 months for 12',
                  'Every service shows whether it is available now',
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
                <h3 className="mb-2 text-sm font-semibold text-[#0E2238]">Available from Starter</h3>
                <ul className="divide-y divide-[#DDE6F0] border-y border-[#DDE6F0]">
                  {CORE_FEATURES.map((f) => <FeatureRow key={f.title} {...f} />)}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#1F7A3A]">Added in higher plans</h3>
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
                Prices are in PKR, excluding sales tax. Yearly billing is 10 months for 12.
              </SectionHeading>
              <div role="group" aria-label="Billing period" className="inline-flex shrink-0 self-start rounded-lg border border-[#C5D3E4] bg-[#F4F7FB] p-1 lg:self-auto">
                {[[false, 'Monthly'], [true, 'Yearly: 2 months free']].map(([v, l]) => (
                  <button key={l} aria-pressed={annual === v} onClick={() => setAnnual(v)}
                    className={`h-10 rounded-md px-4 text-sm font-semibold transition-colors ${annual === v ? 'bg-[#0A4D94] text-white' : 'text-[#26405C] hover:bg-white'}`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {PLANS.map((plan) => {
                const rec = !!plan.recommended;
                const sub = rec ? 'text-[#A9C2E2]' : 'text-[#52657C]';
                return (
                  <article key={plan.id}
                    className={`relative flex flex-col rounded-2xl p-6 ${rec ? 'bg-[#061E3D] text-white shadow-[0_24px_48px_-20px_rgba(6,30,61,0.55)]' : 'border border-[#DDE6F0] bg-white'}`}>
                    {rec && <span className="ch-badge absolute -top-3 left-6 rounded-full bg-[#3DBE63] px-3.5 py-1 text-xs font-bold text-[#06264A]">Recommended now</span>}
                    <h3 className="ch-display text-2xl font-bold">{plan.name}</h3>
                    <p className={`mt-1 min-h-[40px] text-sm ${sub}`}>{plan.best}</p>

                    <div className="mt-4 min-h-[84px]">
                      <p className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="ch-display text-3xl font-extrabold">PKR {fmt(annual ? plan.yearly : plan.monthly)}</span>
                        <span className={`text-sm ${sub}`}>{annual ? 'per year' : 'per month'}</span>
                      </p>
                      <p className={`mt-1 text-sm ${sub}`}>{annual ? `PKR ${fmt(plan.monthly)} x 10 months billed` : 'Billed monthly'}</p>
                    </div>

                    <p className={`min-h-[60px] border-t pt-4 text-sm leading-relaxed ${rec ? 'border-white/15 text-[#DCE8F7]' : 'border-[#DDE6F0] text-[#26405C]'}`}>{plan.services}</p>

                    <dl className="mt-2 text-sm">
                      {[['Students included', plan.students], ['Extra students', plan.extra], ['Staff accounts', plan.staff], ['File storage', plan.storage], ['Applications a year', plan.apps], ['Support', plan.support]].map(([k, v]) => (
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

            <div className="mt-10 grid gap-8 rounded-2xl border border-[#DDE6F0] bg-[#F4F7FB] p-6 sm:p-8 md:grid-cols-2">
              <div>
                <h3 className="text-base font-semibold">What is ready today</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#52657C]">
                  Starter is the plan we recommend right now. Across all plans, 31 of 111 services are available now, 13 are being completed and 67 are in development. When a service is released, it appears automatically for colleges on that plan.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold">Add-ons</h3>
                <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-[#52657C]">
                  <li>Extra storage, any plan: PKR 150 per 10 GB per month.</li>
                  <li>Above 300 students, Starter colleges move to Standard.</li>
                  <li>SMS and WhatsApp alerts: prepaid credits (in development).</li>
                  <li>Need a mix that fits no plan? Custom plans start at a PKR 5,999 platform fee plus one pack per service, and never below PKR 7,999. Ask for a quote.</li>
                </ul>
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
                <caption className="sr-only">Comparison of Starter, Standard, Premium and Enterprise plans</caption>
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
                          <option>Enterprise plan</option>
                          <option>Custom plan</option>
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