'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { HiArrowLeft, HiOutlinePrinter, HiOutlineChevronDown } from 'react-icons/hi';
import BrandLogo from '@/components/common/BrandLogo';
import PublicFooter from '@/components/common/PublicFooter';

/* Text helpers used by the page files */
export const P = ({ children }) => <p className="mt-3 first:mt-0">{children}</p>;
export const H3 = ({ children }) => <h3 className="mt-6 text-base font-semibold text-[#0E2238]">{children}</h3>;
export const UL = ({ items }) => (
  <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-[#3068A7]">
    {items.map((t, i) => <li key={i}>{t}</li>)}
  </ul>
);
export const Note = ({ children }) => (
  <div className="mt-4 rounded-xl border border-[#C9DBF0] bg-[#EAF1FA] p-4 text-[15px] leading-relaxed text-[#0E2238]">{children}</div>
);

const CSS = `
:root { --font-display: 'Bricolage Grotesque', system-ui, sans-serif; --font-body: 'Figtree', system-ui, sans-serif; }
.lg-root { font-family: var(--font-body), system-ui, -apple-system, 'Segoe UI', sans-serif; }
.lg-display { font-family: var(--font-display), var(--font-body), system-ui, sans-serif; letter-spacing: -0.02em; }
.lg-root a:focus-visible, .lg-root button:focus-visible { outline: 2px solid #4C94E8; outline-offset: 2px; }
@media print { .lg-hide { display: none !important; } .lg-main { padding-top: 0 !important; } .lg-hero { background: #fff !important; color: #000 !important; } }
`;

/**
 * title, updated, summary: string[] ("In short" points), notice: string,
 * sections: { id, title, content }[], other: { href, label }
 */
export default function LegalLayout({ title, updated, summary = [], notice, sections, other }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(sections[0].id);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-120px 0px -65% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const go = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const current = sections.find((s) => s.id === active) || sections[0];
  const wrap = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8';

  return (
    <div className="lg-root flex min-h-screen flex-col bg-white text-[#0E2238] selection:bg-[#4C94E8]/30">
      <style>{CSS}</style>

      <header className="lg-hide fixed inset-x-0 top-0 z-50 border-b border-[#DDE6F0] bg-white/90 backdrop-blur-md">
        <div className={`${wrap} flex h-[68px] items-center justify-between gap-4`}>
          <a href="/" aria-label="CollegesHub home" className="shrink-0"><BrandLogo variant="horizontal" height={32} priority /></a>
          <a href="/" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#C5D3E4] px-4 text-sm font-semibold text-[#0A4D94] transition-colors hover:bg-[#F4F7FB]">
            <HiArrowLeft size={16} aria-hidden="true" /> Back to home
          </a>
        </div>
        {!reduce && <motion.div aria-hidden="true" style={{ scaleX: progress }} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[#3DBE63]" />}
      </header>

      <main className="lg-main flex-1 pt-[68px]">
        <section className="lg-hero bg-[#061E3D] text-white">
          <div className={`${wrap} grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end`}>
            <div>
              <h1 className="lg-display text-4xl font-bold leading-[1.08] sm:text-5xl">{title}</h1>
              <p className="mt-4 text-base text-[#C9D9EE]">Last updated {updated}</p>
              <button onClick={() => window.print()} className="lg-hide mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 px-4 text-sm font-semibold transition-colors hover:bg-white/10">
                <HiOutlinePrinter size={16} aria-hidden="true" /> Print or save as PDF
              </button>
            </div>
            {summary.length > 0 && (
              <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 sm:p-6">
                <p className="text-sm font-semibold">In short</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-[#DCE8F7]">
                  {summary.map((t) => (
                    <li key={t} className="flex gap-3">
                      <svg viewBox="0 0 24 24" width="18" height="18" className="mt-0.5 shrink-0 text-[#3DBE63]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Mobile table of contents */}
        <div className="lg-hide sticky top-[68px] z-40 border-b border-[#DDE6F0] bg-white/95 backdrop-blur lg:hidden">
          <div className={wrap}>
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-12 w-full items-center justify-between gap-3 text-left text-sm font-semibold">
              <span className="truncate">On this page: <span className="text-[#0A4D94]">{current.title}</span></span>
              <HiOutlineChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open && (
              <ol className="max-h-[60vh] overflow-y-auto pb-3">
                {sections.map((s, i) => (
                  <li key={s.id}><button onClick={() => go(s.id)} className={`w-full py-2.5 text-left text-sm ${s.id === active ? 'font-semibold text-[#0A4D94]' : 'text-[#3B4F68]'}`}>{i + 1}. {s.title}</button></li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className={`${wrap} grid gap-12 py-12 sm:py-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16`}>
          <aside className="lg-hide hidden lg:block">
            <nav aria-label="Table of contents" className="sticky top-24">
              <p className="mb-3 text-sm font-semibold text-[#52657C]">On this page</p>
              <ol className="border-l border-[#DDE6F0]">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <button onClick={() => go(s.id)} aria-current={s.id === active ? 'true' : undefined}
                      className={`-ml-px block w-full border-l-2 py-1.5 pl-4 text-left text-sm transition-colors ${s.id === active ? 'border-[#3DBE63] font-semibold text-[#0A4D94]' : 'border-transparent text-[#52657C] hover:text-[#0E2238]'}`}>
                      {i + 1}. {s.title}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="max-w-[740px] text-base leading-7 text-[#26405C]">
            {notice && <Note>{notice}</Note>}
            <div className="space-y-12 pt-2 first:pt-0">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-32 lg:scroll-mt-24">
                  <h2 className="lg-display flex items-baseline gap-3 text-2xl font-bold text-[#0E2238]">
                    <span className="text-[#3068A7]">{i + 1}</span>{s.title}
                  </h2>
                  <div className="mt-4">{s.content}</div>
                </section>
              ))}
            </div>

            <div className="mt-14 grid gap-4 border-t border-[#DDE6F0] pt-8 sm:grid-cols-2">
              <a href="mailto:syyedsanaullah@gmail.com" className="rounded-xl border border-[#DDE6F0] p-5 transition-colors hover:border-[#0A4D94]">
                <span className="block text-sm text-[#52657C]">Questions? Email us</span>
                <span className="mt-1 block break-all text-[15px] font-semibold text-[#0E2238]">syyedsanaullah@gmail.com</span>
              </a>
              <a href={other.href} className="rounded-xl border border-[#DDE6F0] p-5 transition-colors hover:border-[#0A4D94]">
                <span className="block text-sm text-[#52657C]">Also read</span>
                <span className="mt-1 block text-[15px] font-semibold text-[#0A4D94]">{other.label}</span>
              </a>
            </div>
          </article>
        </div>
      </main>

      <div className="lg-hide"><PublicFooter /></div>
    </div>
  );
}
