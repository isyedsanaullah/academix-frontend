'use client';

import Link from 'next/link';
import BrandLogo from '@/components/common/BrandLogo';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';

const PLATFORM = [
  { href: '/', label: 'Colleges Directory' },
  { href: '/join', label: 'Join Collegeshub' },
  { href: '/request-subscription', label: 'Request Subscription' },
  { href: '/join#features', label: 'Key Features' },
];
const PORTALS = ['Student & Staff Login', 'College Admin Portal', 'Faculty Workspace', 'Super Admin Console'];
const linkCls = 'text-white/65 transition-colors hover:text-white';
const headCls = 'text-xs font-bold uppercase tracking-[0.14em] text-white';

export default function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="relative overflow-hidden bg-[#051d3a] text-white/70">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0A4D94] via-[#2A9B4A] to-[#0A4D94]" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#2A9B4A]/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-5 lg:col-span-4">
            <Link href="/" aria-label="Collegeshub home" className="inline-block">
              <BrandLogo variant="horizontal" height={44} dark />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              One platform for every college: multi-tenant campus management, automated admissions and student engagement tools, built for institutions in Pakistan.
            </p>
          </div>

          <nav className="space-y-4 lg:col-span-2" aria-label="Platform">
            <h4 className={headCls}>Platform</h4>
            <ul className="space-y-3 text-sm">
              {PLATFORM.map(l => <li key={l.label}><Link href={l.href} className={linkCls}>{l.label}</Link></li>)}
            </ul>
          </nav>

          <nav className="space-y-4 lg:col-span-3" aria-label="Portals">
            <h4 className={headCls}>Portals &amp; Access</h4>
            <ul className="space-y-3 text-sm">
              {PORTALS.map(p => <li key={p}><Link href="/login" className={linkCls}>{p}</Link></li>)}
            </ul>
          </nav>

          <div className="space-y-4 lg:col-span-3">
            <h4 className={headCls}>Contact Support</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-emerald-400"><HiOutlinePhone size={17} /></span>
                <div><p className="text-[10px] font-bold uppercase text-white/40">24/7 Helpline</p>
                  <a href="tel:+923135013303" className="font-semibold text-white hover:text-emerald-300">+92 313 5013303</a></div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-emerald-400"><HiOutlineMail size={17} /></span>
                <div><p className="text-[10px] font-bold uppercase text-white/40">Official Email</p>
                  <a href="mailto:support@collegeshub.org" className="text-white hover:text-emerald-300">support@collegeshub.org</a></div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-emerald-400"><HiOutlineLocationMarker size={17} /></span>
                <div><p className="text-[10px] font-bold uppercase text-white/40">Location</p>
                  <span className="text-white/80">Islamabad, Pakistan</span></div>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-white/45 sm:flex-row">
          <p>© {year} Collegeshub.org. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <span className="text-white/15">•</span>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <span className="text-white/15">•</span>
            <span className="text-[11px] text-white/30">v2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
