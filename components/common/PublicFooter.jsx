'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineLocationMarker, 
  HiOutlineAcademicCap,
  HiOutlineCollection
} from 'react-icons/hi';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#030712] text-white/80 overflow-hidden border-t border-white/[0.08]">
      {/* Top Ambient Glow / Gradient Border */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[150px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-white/[0.06]">
          
          {/* Col 1: Brand Info & Status (lg:span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#070c18] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                  <Image src="/logo.svg" alt="Academix Logo" width={24} height={24} className="object-contain" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                  Academix
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">
                  Smart Campus Ecosystem
                </span>
              </div>
            </Link>

            <p className="text-xs text-white/60 leading-relaxed font-normal max-w-sm">
              Empowering educational institutions with next-generation multi-tenant campus management, automated admissions, and student engagement tools.
            </p>
          </div>

          {/* Col 2: Navigation Links (lg:span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HiOutlineCollection className="text-indigo-400" size={15} /> Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-white/60 font-medium">
              <li>
                <Link href="/" className="hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Colleges Directory</span>
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Join Academix</span>
                </Link>
              </li>
              <li>
                <Link href="/request-subscription" className="hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Request Subscription</span>
                </Link>
              </li>
              <li>
                <Link href="/join#features" className="hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">Key Features</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Access (lg:span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HiOutlineAcademicCap className="text-indigo-400" size={15} /> Portals & Access
            </h4>
            <ul className="space-y-2.5 text-xs text-white/60 font-medium">
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 group-hover:bg-indigo-400 transition-colors" />
                  <span className="group-hover:translate-x-0.5 transition-transform">Student & Staff Login</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50 group-hover:bg-purple-400 transition-colors" />
                  <span className="group-hover:translate-x-0.5 transition-transform">College Admin Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 group-hover:bg-emerald-400 transition-colors" />
                  <span className="group-hover:translate-x-0.5 transition-transform">Faculty Workspace</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 group-hover:bg-amber-400 transition-colors" />
                  <span className="group-hover:translate-x-0.5 transition-transform">Super Admin Console</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Help (lg:span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HiOutlinePhone className="text-indigo-400" size={15} /> Contact Support
            </h4>
            
            <div className="space-y-3 text-xs text-white/60 font-medium">
              <div className="flex items-start gap-2.5">
                <HiOutlinePhone className="text-indigo-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">24/7 Helpline</p>
                  <a href="tel:+923135013303" className="text-white hover:text-indigo-300 font-semibold transition-colors">
                    +92 313 5013303
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HiOutlineMail className="text-indigo-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Official Email</p>
                  <a href="mailto:support@academix.pk" className="text-white hover:text-indigo-300 transition-colors">
                    support@academix.pk
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HiOutlineLocationMarker className="text-indigo-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Location</p>
                  <span>Islamabad, Pakistan</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-medium">
          <p>© {currentYear} Academix. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-indigo-400 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/10">•</span>
            <Link href="/terms" className="hover:text-indigo-400 transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/10">•</span>
            <span className="text-white/30 text-[11px]">v2.4.0</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
