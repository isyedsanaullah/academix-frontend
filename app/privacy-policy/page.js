'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { HiOutlineArrowRight, HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineLockClosed, HiOutlineExclamationCircle } from 'react-icons/hi';

const SECTIONS = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'info-collect', label: '2. Information We Collect' },
  { id: 'info-use', label: '3. How Information Is Used' },
  { id: 'tenant-isolation', label: '4. Multi-Tenant Data Isolation' },
  { id: 'ai-features', label: '5. AI Integration & Disclaimers' },
  { id: 'uploaded-docs', label: '6. Uploaded Materials & Documents' },
  { id: 'security', label: '7. Data Security Measures' },
  { id: 'data-sharing', label: '8. Data Sharing & Third Parties' },
  { id: 'retention', label: '9. Data Retention' },
  { id: 'children-data', label: '10. Children\'s & Student Data' },
  { id: 'user-rights', label: '11. Your Rights & Access' },
  { id: 'changes', label: '12. Policy Changes' },
  { id: 'contact', label: '13. Contact Information' },
];

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('introduction');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#04070d] text-white/85 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#04070d]/80 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 h-14 sm:h-[62px] flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 min-w-0" onClick={() => router.push('/')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 relative">
              <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-[15px] font-extrabold text-white leading-none tracking-tight">Academix</h1>
              <p className="text-[8px] sm:text-[9px] text-white/35 font-semibold uppercase tracking-wider sm:tracking-widest mt-0.5 leading-none truncate">
                Privacy Policy
              </p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="btn-secondary py-1 sm:py-1.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs rounded-lg sm:rounded-xl shrink-0">
            Back to Home
          </button>
        </div>
      </header>

      {/* CONTAINER */}
      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-[260px] shrink-0 lg:sticky lg:top-24 h-fit">
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-3 px-2">Table of Contents</p>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSection === sec.id
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 shadow-sm'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </aside>

        {/* POLICY CONTENT */}
        <main className="flex-1 bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 sm:p-8 space-y-10">
          
          {/* INTRO */}
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-md">
              Draft Document
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-4">
              Privacy Policy
            </h1>
            <p className="text-xs text-white/40 mt-2 font-medium">
              Last Updated: August 9, 2026
            </p>
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/15 text-xs text-amber-300/80 leading-relaxed">
              <HiOutlineExclamationCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
              <p>
                <strong>Important Notice:</strong> This Privacy Policy is a draft model describing the data handling operations of the Academix SaaS platform. It does not constitute legal advice. Institutions using this platform should have this document reviewed by qualified legal counsel to ensure compliance with relevant local and international regulations prior to production onboarding.
              </p>
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          {/* SECTIONS */}
          <div className="space-y-12 text-sm text-white/70 leading-relaxed font-normal">
            
            {/* 1 */}
            <section id="introduction" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">1. Introduction</h2>
              <p>
                Welcome to Academix (the "Platform", "we", "our", or "us"), a digital college management platform. This Privacy Policy describes how we collect, use, store, share, and protect information in connection with our services.
              </p>
              <p>
                This policy applies to visiting representatives of colleges or educational institutions, registered institutional administrators, teachers, staff, students, and parents accessing any portal, mobile client, or dashboard powered by the Platform.
              </p>
            </section>

            {/* 2 */}
            <section id="info-collect" className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">2. Information We Collect</h2>
              <p>
                We collect multiple categories of information to support institutional operations and provide system services.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-white mb-2">Institutional Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-white/50">
                    <li>College name, code, city, website, and email</li>
                    <li>Administrator credentials and logs</li>
                    <li>Subscription tier, limits, and pricing details</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-white mb-2">Academic & User Profiles</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-white/50">
                    <li>Student names, CNIC, roll numbers, dob, addresses</li>
                    <li>Teacher qualifications, specialization, salary, assigned sections</li>
                    <li>Guardian relationships and contact details</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-white mb-2">Operational Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-white/50">
                    <li>Attendance logs (Biometric ID, QR codes, manual entry)</li>
                    <li>Grades, marks, exam schedules, and result cards</li>
                    <li>Fee challan receipts, fines, canteen transactions</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-white mb-2">Technical & Device Logs</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-white/50">
                    <li>IP addresses, user agent details, browser types</li>
                    <li>Audit logs detailing user interactions</li>
                    <li>System performance metrics and diagnostic reports</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3 */}
            <section id="info-use" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">3. How Information Is Used</h2>
              <p>
                We use collected information strictly to deliver, monitor, and optimize the Academix system:
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-2 text-white/60">
                <li><strong>Service Provision:</strong> Managing user sessions, onboarding colleges, and enabling student, teacher, and employee portal activities.</li>
                <li><strong>Authentication:</strong> Assuring secure logins and matching roles (e.g. registrar, accountant, principal) to prevent unauthorized access.</li>
                <li><strong>Notifications:</strong> Generating attendance warnings, grading updates, assignment notices, and fee defaulter alerts.</li>
                <li><strong>System Improvement:</strong> Diagnostic debugging, audit logs tracking critical actions, and AI template optimizations.</li>
              </ul>
            </section>

            {/* 4 */}
            <section id="tenant-isolation" className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">4. Multi-Tenant Data Isolation</h2>
              <div className="p-4 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineLockClosed className="text-indigo-400" size={18} />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Isolated Database Schema Architecture</h3>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Academix utilizes logical multi-tenant database isolation. Every college is assigned a dedicated PostgreSQL connection string. Student profiles, teacher records, attendance logs, timetables, and academic performance data are dynamically routed and physically isolated inside the respective college's database schema. This safeguards institutional data, preventing cross-tenant access, leakage, or inter-college data exposure.
                </p>
              </div>
            </section>

            {/* 5 */}
            <section id="ai-features" className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">5. AI Integration & Disclaimers</h2>
              <p>
                Academix incorporates artificial intelligence features (e.g., automated paper generators, notice writing templates, study assistants, and AI evaluations) to assist teachers and administrators.
              </p>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs space-y-2">
                <p>
                  <strong>• Processing:</strong> Text inputs, study syllabus documents, or uploaded PDF files may be parsed and analyzed by the configured LLM API provider to generate the requested output.
                </p>
                <p>
                  <strong>• Data Privacy:</strong> User-provided institutional materials processed for generation are sent via secure API channels and are not used by the provider to train public models.
                </p>
                <p>
                  <strong>• Accuracy:</strong> AI-generated content (including quiz answers and evaluation summaries) may contain mistakes. Final manual review by qualified academic staff is mandatory before publishing tests or reports.
                </p>
              </div>
            </section>

            {/* 6 */}
            <section id="uploaded-docs" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">6. Uploaded Materials & Documents</h2>
              <p>
                Users upload files such as DMC/transcript scans, student photos, assignments, and curriculum materials. These files are securely stored on our designated infrastructure. Access is restricted to authenticated college personnel (e.g. teachers grading assignments, registrars reviewing admissions) who possess explicit authorization flags.
              </p>
            </section>

            {/* 7 */}
            <section id="security" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">7. Data Security Measures</h2>
              <p>
                We employ standard administrative and technical safeguards:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-2 text-white/60">
                <li>SSL/TLS encryption for all data transit</li>
                <li>Role-Based Access Control (RBAC) checks on every API endpoint</li>
                <li>Hashed storage of local system user passwords</li>
                <li>Continuous audit logging tracking critical database writes</li>
              </ul>
            </section>

            {/* 8 */}
            <section id="data-sharing" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">8. Data Sharing & Third Parties</h2>
              <p>
                We do not sell, rent, or trade student, teacher, or institutional data. We only share information with:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-2 text-white/60">
                <li><strong>AI Providers:</strong> Gemini/Google APIs to fulfill requested AI generation commands.</li>
                <li><strong>Infrastructure Providers:</strong> Hosted database and server instances.</li>
                <li><strong>Legal Mandate:</strong> Authorities when required by court orders or to defend legal claims.</li>
              </ul>
            </section>

            {/* 9 */}
            <section id="retention" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">9. Data Retention</h2>
              <p>
                Institutional data is retained for the active duration of the college's subscription. Upon termination or non-renewal, records are kept for a standard cleanup window (or up to the limit of the chosen plan, e.g. up to 10 years of historical data for Premium subscribers) after which data is deactivated or securely deleted.
              </p>
            </section>

            {/* 10 */}
            <section id="children-data" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">10. Children's & Student Data</h2>
              <p>
                Due to our focus on high school and college institutions, student data containing minor details (e.g., date of birth, guardian phone numbers) is recorded. Educational institutions are solely responsible for obtaining parental consent and ensuring that registering minor student records complies with national and local educational protection laws.
              </p>
            </section>

            {/* 11 */}
            <section id="user-rights" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">11. Your Rights & Access</h2>
              <p>
                Administrators, students, and staff members may request review, update, or deletion of their specific personal profile records. Requests for student record deletion must be approved and executed by the respective college administrator since they serve as the primary data controller, while Academix acts as the data processor.
              </p>
            </section>

            {/* 12 */}
            <section id="changes" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">12. Policy Changes</h2>
              <p>
                We may update this Privacy Policy from time to time. Any material changes will be notified by updating the "Last Updated" date at the top of this page or by displaying a banner announcement on the root SaaS portal.
              </p>
            </section>

            {/* 13 */}
            <section id="contact" className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-tight">13. Contact Information</h2>
              <p>
                For questions regarding this policy, security inquiries, or data access requests, please contact:
              </p>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono">
                Email: syyedsanaullah@gmail.com<br/>
                Subject: Academix Privacy Inquiry
              </div>
            </section>

          </div>

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] bg-[#04070d] py-8 text-center text-xs text-white/30 space-y-2 mt-auto">
        <p className="font-semibold text-white/50">Academix SaaS College Management Platform</p>
        <p>© 2026 Academix — All rights reserved.</p>
      </footer>
    </div>
  );
}
