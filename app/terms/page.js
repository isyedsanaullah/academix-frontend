import LegalLayout, { P, H3, UL, Note } from '@/components/common/LegalLayout';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms of service and subscription agreement for colleges and users on Collegeshub.',
  alternates: {
    canonical: '/terms',
  },
};

const PLAN_ROWS = [
  ['Starter', '2,999', '32,989', '300', '20 (2 admins)', '5 GB (10 MB/file)'],
  ['Standard', '5,999', '65,989', '750', '50 (5 admins)', '25 GB (25 MB/file)'],
  ['Premium', '14,999', '164,989', '2,000', '150 (15 admins)', '150 GB (100 MB/file)'],
];

const SECTIONS = [
  { id: 'agreement', title: 'Agreement to these terms', content: (<>
    <P>By requesting a subscription, registering or using CollegesHub, a college and its administrators, teachers, staff and students agree to these Terms & Conditions. If you do not agree, do not use the platform.</P>
  </>) },
  { id: 'platform-use', title: 'Using the platform', content: (<>
    <P>CollegesHub is a digital college management platform. Each college has its own workspace, and what it can use depends on its subscription plan. Use the platform only for lawful purposes connected to running your college.</P>
  </>) },
  { id: 'accounts', title: 'Accounts and responsibilities', content: (<>
    <P>Each college’s administrator manages access in its workspace: inviting staff and students, maintaining accounts and keeping sign-in details secure. The college is responsible for all activity in its workspace.</P>
  </>) },
  { id: 'plans', title: 'Plans, prices and billing', content: (<>
    <P>Prices are in Pakistani rupees (PKR) and exclude sales tax, which is confirmed before invoicing. Yearly billing includes 1 Month FREE (11 months billed for 12 months access).</P>
    <div className="mt-5 overflow-x-auto rounded-xl border border-[#DDE6F0]">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <caption className="sr-only">CollegesHub plans and prices</caption>
        <thead className="bg-[#F4F7FB] text-[#52657C]">
          <tr>{['Plan', 'Per month (PKR)', 'Per year (PKR)', 'Students', 'Staff accounts', 'Storage'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {PLAN_ROWS.map((r) => (
            <tr key={r[0]} className="border-t border-[#EEF2F7]">
              <th scope="row" className="px-4 py-3 font-semibold text-[#0E2238]">{r[0]}</th>
              {r.slice(1).map((c, i) => <td key={i} className="px-4 py-3">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <H3>Extras &amp; Add-On Catalog</H3>
    <UL items={[
      'Extra students: PKR 15 (Standard) or PKR 10 (Premium) per student per month (+50% dynamic cap). Starter does not sell extra students.',
      'Extra staff accounts: PKR 120 (Standard) or PKR 90 (Premium) per staff per month (+50% dynamic cap).',
      'Administrator accounts: Fixed cap of 2 (Starter), 5 (Standard), or 15 (Premium) — paid extra admin seats are not sold separately.',
      'Extra storage (10 GB blocks): PKR 600 (Starter, max 1 block -> 15 GB), PKR 500 (Standard, max 2 blocks -> 45 GB), or PKR 400 (Premium, max 15 blocks -> 300 GB).',
      'Online application packs (25 applications / yr): PKR 2,500 (Standard, max 2 packs -> 100/yr) or PKR 1,800 (Premium, max 12 packs -> 600/yr).',
      '9 Optional Add-On Modules & Control Packs (Coming soon): Library (N35) & Canteen POS (#98) are included free in Premium and priced at PKR 800/mo on Standard; Transport (N36) & Hostel (N37) at PKR 1,200/mo; Accounting (N40) at PKR 2,500/mo; Staff HR (N42) at PKR 1,500/mo; Governance Pack (N13–N16) at PKR 4,000/mo; Public API (N06) at PKR 2,500/mo. All non-live modules remain non-purchasable until launched.',
      'AI credit packs: 1M Haiku-token credits at PKR 500 (Standard, includes 1M/mo); 5M credits at PKR 1,800 (Premium, includes 20M/mo). Multipliers: 1x Lite, 20x Standard, 40x Advanced.',
      'Multi-campus & Custom Quote: Starter and Standard include 1 campus. Premium includes 2 campuses (+1 extra campus add-on at PKR 3,000/mo up to 3 max). Institutions needing above 3,000 students or 4 or more campuses receive a tailored Custom Quote.',
      'Mandatory Admin Security (Proposed by the plan, not in the source file): Two-factor authentication is mandatory for Admins and Principals on all plans following a 7-day setup grace window.',
    ]} />
    <P>Payment is due at the start of each billing period. Existing active subscriptions continue unchanged for their already settled billing period and transition cleanly at the next renewal with advance notice.</P>
  </>) },
  { id: 'limits', title: 'Limits and upgrades', content: (<>
    <P>Each plan has limits for students, staff accounts, storage, online admission applications, audit log history and campuses. A college with more than 300 students needs Standard or higher. A college can move to a higher plan at any time with immediate pro-rated credit for unused days.</P>
    <P>Please contact the developer or use the in-app subscription portal to discuss your capacity before choosing a plan.</P>
  </>) },
  { id: 'service-status', title: 'What is ready and what is coming', content: (<>
    <P>86 core academic, financial, operational, and AI services are verified live and active today out of 162 cataloged services across Starter, Standard, Premium, and 9 optional add-on modules. Unbuilt or roadmap capabilities display a Coming soon badge and cannot be purchased until live.</P>
    <P>When an upcoming integration or service is released, it appears automatically for colleges on a plan that includes it.</P>
    <Note>Starter and Standard recover deleted items via the Recycle bin only (30-day retention). Monthly self-service ZIP backup exports (N05) are included in Premium (90-day recycle bin retention).</Note>
  </>) },
  { id: 'plan-changes', title: 'Changing plans and offboarding data export', content: (<>
    <P>Changing plans never deletes your existing data. Following cancellation or expiry, college Administrators and Principals retain access to a one-time full CSV/archive offboarding data copy export for 30 days (Proposed by the plan, not in the source file).</P>
  </>) },
  { id: 'late-payment', title: 'Late payment and suspension', content: (<>
    <P>If a payment is late, you keep full access for 7 days, then read-only access for 14 days. After that, the workspace is suspended.</P>
    <P>We may also restrict or end access if the platform is used against these terms, or if the college asks us to deactivate its workspace. Data may be kept afterward as described in our Privacy Policy.</P>
  </>) },
  { id: 'acceptable-use', title: 'Acceptable use', content: (<>
    <P>You must not use CollegesHub for unlawful activity, upload harmful or illegal content, try to break the security of any workspace, or disrupt the service for other colleges.</P>
  </>) },
  { id: 'content', title: 'Uploaded content', content: (<>
    <P>Documents, images, student records and other files remain the responsibility of the college that uploads them. CollegesHub does not claim ownership of your data. Colleges must make sure what they upload follows the law.</P>
  </>) },
  { id: 'availability', title: 'Service availability', content: (<>
    <P>CollegesHub runs on a best-effort basis, and we do not guarantee a specific uptime percentage. Maintenance and unexpected technical problems can cause short outages. We will announce planned maintenance where we can.</P>
  </>) },
  { id: 'changes', title: 'Changes to features and pricing', content: (<>
    <P>We may change features, limits or pricing with reasonable advance notice. If you keep using the platform after that notice, you accept the updated terms.</P>
  </>) },
  { id: 'contact', title: 'Contact us', content: (<>
    <P>For questions about these terms or your subscription:</P>
    <UL items={['Email: syyedsanaullah@gmail.com', 'Phone: +92 313 5013303']} />
  </>) },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      updated="November 18, 2026"
      summary={[
        'Three monthly plans (Starter PKR 2,999, Standard PKR 5,999, Premium PKR 14,999); yearly billing includes 1 Month FREE.',
        '86 live services active today out of 162 cataloged services; Coming soon add-ons remain locked until live.',
        'Recycle bin only on Starter/Standard (30d); 30-day post-cancellation Admin export & 7-day Admin 2FA grace (Proposed by the plan, not in the source file).',
      ]}
      sections={SECTIONS}
      other={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  );
}
