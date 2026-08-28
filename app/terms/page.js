'use client';

import { useRouter } from 'next/navigation';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#04070d] text-white/85 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#04070d]/80 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[62px] flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
              <HiOutlineAcademicCap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-white leading-none tracking-tight">Academix</h1>
              <p className="text-[9px] text-white/35 font-semibold uppercase tracking-widest mt-0.5 leading-none">Terms & Conditions</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="btn-secondary py-1.5 px-3.5 text-xs">
            Back to Home
          </button>
        </div>
      </header>

      {/* CONTAINER */}
      <div className="flex-1 max-w-[800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 sm:p-10 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-xs text-white/40 mt-2">Last Updated: August 2026</p>
          </div>

          <hr className="border-white/[0.06]" />

          <div className="space-y-7 text-sm text-white/70 leading-relaxed font-normal">

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">1. Agreement to Terms</h2>
              <p>
                By requesting a subscription, registering, or accessing the Academix platform, educational institutions, administrators, teachers, and students agree to be bound by these Terms &amp; Conditions. If you do not agree to these terms, do not use the platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">2. Platform Usage</h2>
              <p>
                Academix is a digital college management platform. Access is granted based on the subscription plan associated with the college's workspace. Each college has a separate workspace. Users must only use the platform for lawful purposes related to their college operations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">3. Account Responsibilities</h2>
              <p>
                Each college's designated administrator is responsible for managing access within their workspace. This includes inviting staff and students, maintaining user accounts, and ensuring that credentials are kept secure. Any activity carried out under a college workspace is the responsibility of that institution.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">4. Subscription Plans &amp; Payments</h2>
              <p>
                Academix currently offers the following monthly subscription plans:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-white/60">
                <li><strong className="text-white/80">Standard Plan</strong> — PKR 12,000 per month. Maximum 300 users, 20 GB storage, 100 online applications, 5 years of historical records.</li>
                <li><strong className="text-white/80">Professional Plan</strong> — PKR 13,500 per month. Maximum 600 users, 30 GB storage, 150 online applications, 5 years of historical records.</li>
                <li><strong className="text-white/80">Premium Plan</strong> — PKR 15,000 per month. Includes 50 GB storage, 10 years of historical records, AI features, digitally verifiable certificates, transport management, and the full attendance system (fingerprint/biometric, QR-code scanning, and manual attendance as a backup method).</li>
              </ul>
              <p className="mt-2">
                Monthly payments are due at the start of each billing period. Failure to clear dues may result in restricted or suspended access to the platform. Plan pricing is subject to change with reasonable advance notice.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">5. Developer Onboarding Charges</h2>
              <p>
                Developer onboarding and initial system setup is included at no additional cost for Premium plan subscribers. For Standard and Professional plan subscribers, developer onboarding charges apply separately and will be communicated prior to setup.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">6. Feature &amp; Usage Limits</h2>
              <p>
                Each subscription plan has associated limits for users, storage, and online applications as described above. Exceeding these limits may require an upgrade to a higher plan. The developer team should be contacted to discuss capacity requirements before a plan is selected.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">7. Full System Ownership Option</h2>
              <p>
                As an alternative to the monthly subscription model, colleges and institutions may choose the Full System Ownership option for a one-time payment of <strong className="text-white/80">PKR 280,000</strong>. This results in the complete Academix system being handed over to the purchasing organization.
              </p>
              <p className="mt-2">What is included:</p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-white/60">
                <li>Complete system handover</li>
                <li>Developer onboarding</li>
                <li>3 months of developer support after handover</li>
              </ul>
              <p className="mt-2">After the handover, the customer is solely responsible for all operational infrastructure and related recurring costs, including:</p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-white/60">
                <li>Hosting</li>
                <li>Domain</li>
                <li>Database and server infrastructure</li>
                <li>All other operational infrastructure costs</li>
              </ul>
              <p className="mt-2">
                The one-time payment does not include lifetime hosting, lifetime domain registration, lifetime database costs, or unlimited future development. Developer support or custom development after the included 3-month period should be discussed and agreed upon separately.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">8. Acceptable Use</h2>
              <p>
                Users must not use the Academix platform to engage in any unlawful activity, upload harmful or illegal content, attempt to compromise the security of any workspace, or misuse the platform in a way that disrupts service for other colleges.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">9. Uploaded Content &amp; Data Responsibility</h2>
              <p>
                Content uploaded to the platform — including documents, images, student records, and other files — remains the responsibility of the uploading institution. Academix does not claim ownership over uploaded institutional data. Colleges are responsible for ensuring that the content they upload complies with applicable laws.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">10. Service Availability</h2>
              <p>
                Academix operates on a best-effort basis. No specific uptime percentage is guaranteed. Maintenance periods and unforeseen technical issues may result in temporary unavailability. We aim to minimize disruptions and will communicate planned maintenance where possible.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">11. Suspension &amp; Termination</h2>
              <p>
                Access to a college workspace may be restricted or terminated if subscription payments are not made, if the platform is used in violation of these terms, or if the college requests deactivation. Data may be retained for a period following termination in accordance with the Privacy Policy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">12. Changes to Features &amp; Pricing</h2>
              <p>
                Academix reserves the right to modify features, usage limits, or pricing with reasonable advance notice. Continued use of the platform after such notice constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white tracking-tight">13. Contact Information</h2>
              <p>For terms inquiries or questions about your subscription, please contact:</p>
              <p className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs font-mono w-fit">
                Email: syyedsanaullah@gmail.com<br />
                Phone: +92 346 9581362
              </p>
            </section>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] bg-[#04070d] py-8 text-center text-xs text-white/30 space-y-2 mt-auto">
        <p className="font-semibold text-white/50">Academix — College Portal</p>
        <p>© {new Date().getFullYear()} Academix. All rights reserved.</p>
      </footer>
    </div>
  );
}
