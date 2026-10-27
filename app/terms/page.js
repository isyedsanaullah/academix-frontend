'use client';

import LegalLayout, { P, H3, UL, Note } from '@/components/common/LegalLayout';

const PLAN_ROWS = [
  ['Starter', '7,999', '79,990', '300', '20', '5 GB'],
  ['Standard', '19,999', '199,990', '1,000', '60', '20 GB'],
  ['Premium', '44,999', '449,990', '2,500', '150', '75 GB'],
  ['Enterprise', '119,999', '1,199,990', '5,000', '400', '300 GB'],
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
    <P>Prices are in Pakistani rupees (PKR) and exclude sales tax, which is confirmed before invoicing. Yearly billing charges 10 months for 12.</P>
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
    <H3>Extras</H3>
    <UL items={[
      'Extra students: PKR 18 (Standard), PKR 14 (Premium) or PKR 12 (Enterprise) per student per month above the included number. Starter does not sell extra students.',
      'Extra storage on any plan: PKR 150 per 10 GB per month, rounded up to the next 10 GB.',
      'Enterprise only: extra AI tokens at PKR 450 per 1 million tokens after the shared 100M tokens a month are used, and PKR 15,000 per month for each campus beyond 3.',
      'SMS and WhatsApp alerts use prepaid credits at the provider’s rate plus a margin. Online payment gateway fees are passed to the college. Both are separate from the plan price.',
      'Custom plans start from a platform fee of PKR 5,999 plus one pack per chosen service, and never below PKR 7,999. Ask us for a quote.',
    ]} />
    <P>Payment is due at the start of each billing period. We may change prices with reasonable advance notice.</P>
  </>) },
  { id: 'limits', title: 'Limits and upgrades', content: (<>
    <P>Each plan has limits for students, staff accounts, storage, online admission applications, audit log history and campuses. A college with more than 300 students needs Standard or higher. A college can move to a higher plan at any time.</P>
    <P>Please contact the developer to discuss your capacity before choosing a plan.</P>
  </>) },
  { id: 'service-status', title: 'What is ready and what is coming', content: (<>
    <P>Every service in our plans is marked as available now, being completed or coming soon. Most Standard, Premium and Enterprise services are still being built. Services that are coming soon or in development are listed so you can see our direction. They are not promised for any particular date.</P>
    <P>When a service is released, it appears automatically for colleges on a plan that includes it. No migration is needed.</P>
    <Note>Choose a plan based on the services marked “Available now”. Starter is the plan we recommend today.</Note>
  </>) },
  { id: 'plan-changes', title: 'Changing plans and your data', content: (<>
    <P>Changing plans never deletes your existing data. After a downgrade, services above your new plan become read-only for 30 days, and your data is kept for 90 days.</P>
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
      updated="October 23, 2026"
      summary={[
        'Four monthly plans, from PKR 7,999. Yearly billing is 10 months for 12.',
        'Every service is labelled available now, being completed or coming soon.',
        'Changing plans never deletes your data.',
      ]}
      sections={SECTIONS}
      other={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  );
}
