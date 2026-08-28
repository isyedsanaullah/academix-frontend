'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HiOutlineAcademicCap, HiArrowRight, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineMail, HiOutlinePhone,
  HiOutlineOfficeBuilding, HiOutlineUser, HiOutlineLogin,
  HiOutlineSparkles, HiOutlineShieldCheck, HiOutlineDatabase,
  HiOutlineUserGroup, HiOutlineClipboardList, HiOutlineClock,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import { HiOutlineCpuChip } from 'react-icons/hi2';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

// ── Plan data (only approved values) ──────────────────────────────────
const PLANS = [
  {
    id: 'standard',
    name: 'Standard',
    price: 'PKR 12,000',
    period: '/month',
    tag: 'Entry Level',
    tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15',
    accentColor: 'from-indigo-500/[0.03]',
    borderColor: 'border-white/[0.07]',
    features: [
      { text: 'Maximum 300 users', included: true },
      { text: '20 GB file storage', included: true },
      { text: '100 online applications', included: true },
      { text: '5 years of historical records', included: true },
      { text: 'Core academic modules', included: true },
      { text: 'AI-powered features', included: false },
      { text: 'Digitally verifiable certificates', included: false },
      { text: 'Transport management', included: false },
      { text: 'Advanced attendance system', included: false },
      { text: 'Developer onboarding — charges apply', included: null },
    ],
    cta: 'Request Standard',
    ctaClass: 'btn-secondary',
    recommended: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 'PKR 13,500',
    period: '/month',
    tag: 'Popular',
    tagColor: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
    accentColor: 'from-violet-500/[0.03]',
    borderColor: 'border-violet-500/20',
    features: [
      { text: 'Maximum 600 users', included: true },
      { text: '30 GB file storage', included: true },
      { text: '150 online applications', included: true },
      { text: '5 years of historical records', included: true },
      { text: 'Core academic modules', included: true },
      { text: 'Priority college visibility on public directory', included: true },
      { text: 'AI-powered features', included: false },
      { text: 'Digitally verifiable certificates', included: false },
      { text: 'Transport management', included: false },
      { text: 'Advanced attendance system', included: false },
      { text: 'Developer onboarding — charges apply', included: null },
    ],
    cta: 'Request Professional',
    ctaClass: 'btn-secondary',
    recommended: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'PKR 15,000',
    period: '/month',
    tag: 'Full Featured',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
    accentColor: 'from-indigo-500/[0.05]',
    borderColor: 'border-indigo-500/30',
    features: [
      { text: 'User capacity — contact us', included: true },
      { text: '50 GB file storage', included: true },
      { text: '10 years of historical records', included: true },
      { text: 'Online applications — included; capacity to be discussed', included: true },
      { text: 'Core academic modules', included: true },
      { text: 'AI-powered features', included: true },
      { text: 'Digitally verifiable certificates', included: true },
      { text: 'Transport management system', included: true },
      { text: 'Priority college visibility on public directory', included: true },
      { text: 'Developer onboarding — free', included: true },
    ],
    cta: 'Request Premium',
    ctaClass: 'btn-primary',
    recommended: true,
  },
];

// ── Comparison table rows ──────────────────────────────────────────────
const COMPARISON_ROWS = [
  { label: 'Price', std: 'PKR 12,000/mo', pro: 'PKR 13,500/mo', prem: 'PKR 15,000/mo' },
  { label: 'Users', std: '300', pro: '600', prem: 'Contact us' },
  { label: 'Storage', std: '20 GB', pro: '30 GB', prem: '50 GB' },
  { label: 'Online Applications', std: '100', pro: '150', prem: 'Included; to be discussed' },
  { label: 'Historical Records', std: '5 years', pro: '5 years', prem: '10 years' },
  { label: 'AI Features', std: false, pro: false, prem: true },
  { label: 'Verifiable Certificates', std: false, pro: false, prem: true },
  { label: 'Transport Management', std: false, pro: false, prem: true },
  { label: 'Fingerprint/Biometric Attendance', std: false, pro: false, prem: true },
  { label: 'QR-Code Attendance', std: false, pro: false, prem: true },
  { label: 'Manual Attendance Backup', std: 'Not specified', pro: 'Not specified', prem: true },
  { label: 'Priority Public Visibility', std: false, pro: true, prem: true },
  { label: 'Developer Onboarding', std: 'Paid', pro: 'Paid', prem: 'Free' },
];

// ── Feature overview data ─────────────────────────────────────────────
const FEATURES = [
  {
    icon: HiOutlineClipboardList,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/15',
    title: 'Admissions',
    desc: 'Online applications, applicant management, and admission tracking.',
    note: null,
  },
  {
    icon: HiOutlineAcademicCap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/15',
    title: 'Academics',
    desc: 'Classes, sections, subjects, academic records, and related workflows.',
    note: null,
  },
  {
    icon: HiOutlineUserGroup,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/15',
    title: 'Attendance',
    desc: 'Attendance management integrated into the platform.',
    note: 'Advanced attendance methods (fingerprint, QR) are available on Premium.',
  },
  {
    icon: HiOutlineDatabase,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/15',
    title: 'Fees',
    desc: 'Fee management, fee ledger, challan generation, and financial workflows.',
    note: null,
  },
  {
    icon: HiOutlineShieldCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/15',
    title: 'Certificates',
    desc: 'Digitally verifiable certificates for students.',
    note: 'Available on Premium.',
  },
  {
    icon: HiOutlineCpuChip,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/15',
    title: 'AI Tools',
    desc: 'AI-powered tools to assist with academic workflows.',
    note: 'Available on Premium.',
  },
  {
    icon: HiOutlineLocationMarker,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/15',
    title: 'Transport',
    desc: 'Transport Management System for fleet and route management.',
    note: 'Available on Premium.',
  },
  {
    icon: HiOutlineClock,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/15',
    title: 'Role-Based Access',
    desc: 'Dedicated interfaces for administrators, teachers, students, registrars, accountants, and more.',
    note: null,
  },
];

// ── Cell helper ───────────────────────────────────────────────────────
function Cell({ value }) {
  if (value === true) return <HiOutlineCheckCircle size={17} className="text-emerald-400 mx-auto" />;
  if (value === false) return <HiOutlineXCircle size={17} className="text-white/20 mx-auto" />;
  return <span className="text-[11px] text-white/60 font-medium">{value}</span>;
}

export default function JoinPage() {
  const router = useRouter();
  const [contactForm, setContactForm] = useState({
    name: '', organization: '', email: '', phone: '', subject: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

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
        message: `College/Org: ${contactForm.organization || 'Not provided'}\n\n${contactForm.message}`,
      });
      if (response.data?.success) {
        toast.success('Message sent successfully!');
        setContactForm({ name: '', organization: '', email: '', phone: '', subject: '', message: '' });
      } else {
        throw new Error(response.data?.message || 'Failed to send message');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04070d] text-white/85 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#04070d]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[62px] flex items-center justify-between">

          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
              <HiOutlineAcademicCap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-white leading-none tracking-tight">Academix</p>
              <p className="text-[9px] text-white/35 font-semibold uppercase tracking-widest mt-0.5 leading-none">Join Academix</p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/60">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Plans</button>
            <button onClick={() => scrollTo('ownership')} className="hover:text-white transition-colors">Full Ownership</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors">Contact</button>
            <a href="/" className="hover:text-white transition-colors">Colleges</a>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => scrollTo('pricing')} className="hidden sm:inline-flex btn-primary py-1.5 px-3.5 text-xs">
              View Plans
            </button>
            <button onClick={() => router.push('/login')} className="btn-secondary py-1.5 px-3.5 text-xs">
              <HiOutlineLogin size={13} />
              Login
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-20 border-b border-white/[0.04]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-indigo-600/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute top-8 right-16 w-80 h-80 rounded-full bg-violet-600/[0.03] blur-2xl pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="max-w-[860px] mx-auto px-4 sm:px-6 text-center space-y-7 relative z-10">
          <motion.div {...fadeUp(0.0)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[10px] font-bold tracking-wider uppercase">
            <HiOutlineSparkles size={11} className="animate-pulse" />
            For Colleges & Institutions
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05]">
            Bring Your College<br className="hidden sm:block" /> to Academix
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-sm sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Manage admissions, academics, attendance, fees, certificates, communication, and other college operations through one centralized platform.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => scrollTo('pricing')}
              className="w-full sm:w-auto btn-primary py-3 px-7 text-sm font-bold shadow-indigo-600/30"
            >
              View Plans <HiArrowRight size={15} className="ml-1 shrink-0" />
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="w-full sm:w-auto btn-secondary py-3 px-7 text-sm font-semibold"
            >
              Contact Developer
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── WHY ACADEMIX ─────────────────────────────────────────── */}
      <section className="py-16 border-b border-white/[0.04] bg-[#080c12]/50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Why Academix</h2>
            <p className="text-2xl font-black text-white tracking-tight">Centralize Your College Operations</p>
            <p className="text-xs text-white/40 leading-relaxed">Academix brings together the core functions of running a college into one organized, digital platform.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Centralized Management', desc: 'All college data and operations accessible from one organized platform.' },
              { title: 'Digital Student Records', desc: 'Maintain complete, organized student records digitally.' },
              { title: 'Online Admissions', desc: 'Accept and process applications online. Track each applicant through the process.' },
              { title: 'Academic Management', desc: 'Classes, sections, subjects, timetables, and academic records — all in one place.' },
              { title: 'Fee Management', desc: 'Manage fee collections, generate challans, and maintain fee ledgers.' },
              { title: 'Attendance Management', desc: 'Record and track student and staff attendance. Advanced methods available on Premium.' },
              { title: 'Role-Based Access', desc: 'Separate interfaces for administrators, teachers, students, registrars, accountants, and more.' },
              { title: 'Communication', desc: 'Notices, announcements, and internal communication tools for the campus.' },
            ].map((item, i) => (
              <div key={i} className="bg-[#0d1117] border border-white/[0.05] rounded-2xl p-5 space-y-2 hover:border-white/10 transition-colors">
                <h3 className="text-xs font-bold text-white">{item.title}</h3>
                <p className="text-[11px] text-white/45 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE OVERVIEW ─────────────────────────────────────── */}
      <section id="features" className="py-16 border-b border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Platform Features</h2>
            <p className="text-2xl font-black text-white tracking-tight">What Academix Covers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-[#0a0f18] border border-white/[0.05] rounded-2xl p-5 space-y-3 hover:border-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} border flex items-center justify-center ${f.color}`}>
                    <Icon size={19} />
                  </div>
                  <h3 className="text-xs font-bold text-white">{f.title}</h3>
                  <p className="text-[11px] text-white/45 leading-relaxed">{f.desc}</p>
                  {f.note && (
                    <p className="text-[10px] text-indigo-400/70 font-semibold leading-snug">{f.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 border-b border-white/[0.04] bg-[#080c12]/50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Subscription Plans</h2>
            <p className="text-2xl font-black text-white tracking-tight">Choose the Right Plan</p>
            <p className="text-xs text-white/40 leading-relaxed">Three monthly plans, one ownership option.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-gradient-to-b ${plan.accentColor} to-transparent border ${plan.borderColor} rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-xl`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <span className={`text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full border ${plan.tagColor}`}>
                      {plan.tag}
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">{plan.name}</h3>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{plan.price}</span>
                    <span className="text-xs text-white/40">{plan.period}</span>
                  </div>

                  <hr className="border-white/[0.06]" />

                  {/* Premium attendance detail */}
                  {plan.id === 'premium' && (
                    <div className="bg-indigo-500/[0.06] border border-indigo-500/15 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Complete Attendance System</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <p className="text-[11px] text-white/80 font-semibold">Fingerprint / Biometric <span className="text-indigo-400/70 font-normal">(Primary)</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <p className="text-[11px] text-white/80 font-semibold">QR-Code Scanning <span className="text-indigo-400/70 font-normal">(Primary)</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                          <p className="text-[11px] text-white/50 italic">Manual Attendance <span className="text-white/30">(Backup / Fallback)</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs">
                        {f.included === true ? (
                          <HiOutlineCheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        ) : f.included === false ? (
                          <HiOutlineXCircle size={14} className="text-white/20 shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0 mt-0.5 flex items-center justify-center">
                            <span className="w-1 h-1 rounded-full bg-white/30" />
                          </span>
                        )}
                        <span className={f.included === false ? 'text-white/30 line-through' : f.included === null ? 'text-white/50' : 'text-white/70'}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => router.push(`/request-subscription?plan=${plan.id}`)}
                  className={`w-full ${plan.ctaClass} py-2.5 justify-center text-xs mt-6`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLAN COMPARISON TABLE ─────────────────────────────────── */}
      <section className="py-16 border-b border-white/[0.04]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Comparison</h2>
            <p className="text-2xl font-black text-white tracking-tight">Plan Comparison</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#0d1117]">
                  <th className="text-left px-5 py-3.5 text-[10px] text-white/40 font-bold uppercase tracking-wider w-[40%]">Feature</th>
                  <th className="text-center px-4 py-3.5 text-[10px] text-white/60 font-black uppercase tracking-wider">Standard</th>
                  <th className="text-center px-4 py-3.5 text-[10px] text-white/60 font-black uppercase tracking-wider">Professional</th>
                  <th className="text-center px-4 py-3.5 text-[10px] text-indigo-400 font-black uppercase tracking-wider">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-white/[0.04] ${i % 2 === 0 ? 'bg-[#080c12]/30' : 'bg-transparent'}`}
                  >
                    <td className="px-5 py-3 text-[11px] text-white/60 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-center"><Cell value={row.std} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.pro} /></td>
                    <td className="px-4 py-3 text-center bg-indigo-500/[0.03]"><Cell value={row.prem} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FULL SYSTEM OWNERSHIP ─────────────────────────────────── */}
      <section id="ownership" className="py-16 border-b border-white/[0.04] bg-[#080c12]/50">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-transparent border border-amber-500/20 rounded-3xl p-8 sm:p-10 space-y-8">

            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex-1 space-y-3">
                <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase">One-Time Option</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Want Complete Ownership?</h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  Get the complete Academix system handed over to your organization for full control of your deployment.
                </p>
              </div>
              <div className="shrink-0 text-center sm:text-right">
                <p className="text-3xl font-black text-white">PKR 280,000</p>
                <p className="text-xs text-white/40 mt-1">One-time payment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-3">Included</p>
                <ul className="space-y-2">
                  {[
                    'Complete system handover',
                    'Developer onboarding',
                    '3 months developer support',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-white/70">
                      <HiOutlineCheckCircle size={14} className="text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-wider mb-3">Customer Responsibility After Handover</p>
                <ul className="space-y-2">
                  {[
                    'Hosting',
                    'Domain',
                    'Database / server infrastructure',
                    'Other operational infrastructure costs',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-white/50">
                      <span className="w-1 h-1 rounded-full bg-amber-400/50 shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
                  Developer support after the included 3-month period is not part of this package and should be discussed separately.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/request-subscription?plan=ownership')}
              className="btn-secondary py-2.5 px-6 text-sm font-bold"
            >
              Request Full System Ownership <HiArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ── CONTACT DEVELOPER ─────────────────────────────────────── */}
      <section id="contact" className="py-16 border-b border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Get in Touch</h2>
            <p className="text-2xl font-black text-white tracking-tight">Contact the Developer</p>
            <p className="text-xs text-white/40 leading-relaxed">
              Have questions about plans, features, or onboarding? Reach out directly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Contact details */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0d1117] border border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                  <HiOutlineMail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Email</p>
                  <a href="mailto:syyedsanaullah@gmail.com" className="text-xs text-white hover:text-indigo-400 transition-colors font-medium">
                    syyedsanaullah@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0d1117] border border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
                  <HiOutlinePhone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Phone</p>
                  <a href="tel:+923469581362" className="text-xs text-white hover:text-indigo-400 transition-colors font-medium">
                    +92 346 9581362
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d1117] border border-white/[0.05] space-y-2">
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Quick Actions</p>
                <button
                  onClick={() => router.push('/request-subscription')}
                  className="w-full btn-primary py-2 justify-center text-xs"
                >
                  Request a Subscription
                </button>
                <a href="/" className="w-full btn-secondary py-2 justify-center text-xs flex items-center gap-2">
                  View College Directory
                </a>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3 bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="join-name" className="block text-[11px] font-bold text-white/50 uppercase tracking-wide mb-1.5">Name *</label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                      <input
                        type="text"
                        id="join-name"
                        value={contactForm.name}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Your name"
                        className="input-field pl-9 text-xs py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="join-org" className="block text-[11px] font-bold text-white/50 uppercase tracking-wide mb-1.5">College / Organization</label>
                    <div className="relative">
                      <HiOutlineOfficeBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                      <input
                        type="text"
                        id="join-org"
                        value={contactForm.organization}
                        onChange={e => setContactForm({ ...contactForm, organization: e.target.value })}
                        placeholder="College or organization name"
                        className="input-field pl-9 text-xs py-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="join-email" className="block text-[11px] font-bold text-white/50 uppercase tracking-wide mb-1.5">Email *</label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                      <input
                        type="email"
                        id="join-email"
                        value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="your@email.com"
                        className="input-field pl-9 text-xs py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="join-phone" className="block text-[11px] font-bold text-white/50 uppercase tracking-wide mb-1.5">Phone</label>
                    <div className="relative">
                      <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                      <input
                        type="text"
                        id="join-phone"
                        value={contactForm.phone}
                        onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="03xx-xxxxxxx (optional)"
                        className="input-field pl-9 text-xs py-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="join-subject" className="block text-[11px] font-bold text-white/50 uppercase tracking-wide mb-1.5">Subject *</label>
                  <input
                    type="text"
                    id="join-subject"
                    value={contactForm.subject}
                    onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="What would you like to discuss?"
                    className="input-field text-xs py-2"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="join-message" className="block text-[11px] font-bold text-white/50 uppercase tracking-wide mb-1.5">Message *</label>
                  <textarea
                    id="join-message"
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Your message…"
                    className="input-field text-xs min-h-28"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-2.5 justify-center text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] bg-[#04070d] py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <HiOutlineAcademicCap size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white tracking-tight">Academix</p>
                <p className="text-[10px] text-white/30 mt-0.5">Digital campus management platform.</p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-4 text-xs text-white/40 font-medium">
              <button onClick={() => scrollTo('features')} className="hover:text-indigo-400 transition-colors">Features</button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-indigo-400 transition-colors">Plans</button>
              <button onClick={() => scrollTo('ownership')} className="hover:text-indigo-400 transition-colors">Full Ownership</button>
              <button onClick={() => scrollTo('contact')} className="hover:text-indigo-400 transition-colors">Contact</button>
              <a href="/" className="hover:text-indigo-400 transition-colors">College Directory</a>
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
