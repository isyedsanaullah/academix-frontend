'use client';

import LegalLayout, { P, H3, UL, Note } from '@/components/common/LegalLayout';

const SECTIONS = [
  { id: 'introduction', title: 'Introduction', content: (<>
    <P>CollegesHub (“CollegesHub”, “we”, “our”, “us”) is a digital college management platform available at Collegeshub.org. This policy explains what information we collect, how we use it, who can see it and how long we keep it.</P>
    <P>It applies to college representatives, administrators, teachers, staff, students and parents who use any CollegesHub portal or dashboard.</P>
    <P>Each college is the data controller for its own students, staff and records. CollegesHub acts as the data processor and handles that data on the college’s behalf.</P>
  </>) },
  { id: 'info-collect', title: 'Information we collect', content: (<>
    <H3>Your college</H3>
    <UL items={['College name, code, city, website and email', 'Administrator accounts and sign-in activity', 'Your plan, limits and billing details']} />
    <H3>Students and guardians</H3>
    <UL items={['Name, CNIC, roll number, date of birth and address', 'Matric result, board and roll number recorded at admission', 'Guardian relationships and contact details', 'Student profile photos and uploaded documents such as DMC scans']} />
    <H3>Teachers and staff</H3>
    <UL items={['Qualifications, subjects, classes and assigned sections', 'Leave records, payroll and pay slips']} />
    <H3>Daily college activity</H3>
    <UL items={['Attendance, including manual registers and gate QR scans', 'Exams, marks, roll slips and result cards', 'Fee vouchers, bank challans, dues, fines and treasury records', 'Assignments and submissions, quizzes, announcements', 'Visitor entries and early-exit passes']} />
    <H3>Technical data</H3>
    <UL items={['IP address, browser and device type', 'Audit logs that record who changed what, and when']} />
    <Note>Some services, such as biometric device sync, parent portal and online fee payment, are still in development. Data for these is collected only once a college uses them.</Note>
  </>) },
  { id: 'info-use', title: 'How we use information', content: (<>
    <P>We use information only to run and improve CollegesHub:</P>
    <UL items={[
      <><strong>Providing the service:</strong> signing users in, setting up colleges and running student, teacher and staff portals.</>,
      <><strong>Access control:</strong> matching each person to their role, such as registrar, accountant, principal or teacher, so they see only what they should.</>,
      <><strong>Notifications:</strong> announcements, assignment notices and fee reminders.</>,
      <><strong>Support and improvement:</strong> fixing problems, reviewing audit logs and improving the platform.</>,
    ]} />
  </>) },
  { id: 'tenant-isolation', title: 'Separate data for every college', content: (<>
    <P>CollegesHub uses multi-tenant database isolation. Every college is assigned its own PostgreSQL connection, and its student, teacher, attendance, timetable and academic data is routed to that college’s own database schema.</P>
    <P>This is designed to prevent one college from reaching another college’s data.</P>
  </>) },
  { id: 'ai-features', title: 'AI features', content: (<>
    <P>AI features are part of the Enterprise plan. They include an AI tutor, a PDF knowledge library and quiz, paper and MCQ generators. Colleges on other plans do not use these features.</P>
    <UL items={[
      <><strong>What is sent:</strong> text you type, syllabus text or PDF files you upload to an AI tool may be sent to the configured AI provider (Google Gemini) to produce the result you asked for.</>,
      <><strong>Training:</strong> material sent for generation travels over secure API channels and is not used by the provider to train public models.</>,
      <><strong>Accuracy:</strong> AI output can contain mistakes. Qualified staff must review quizzes, papers and summaries before they are published.</>,
    ]} />
  </>) },
  { id: 'uploaded-docs', title: 'Uploaded files', content: (<>
    <P>Colleges upload files such as student photos, DMC scans, assignments, curriculum material, logos, stamps and signatures. Files are stored in a private file vault that counts toward your plan’s storage limit.</P>
    <P>Only signed-in college staff with the right permission can open them, for example a teacher grading an assignment or a registrar reviewing an admission.</P>
  </>) },
  { id: 'security', title: 'Security', content: (<>
    <UL items={['SSL/TLS encryption for data in transit', 'Role-based access control checks on every API endpoint', 'Hashed storage of user passwords', 'An audit trail of critical actions, and a recycle bin for deleted records']} />
    <P>No online system is perfectly secure. If we learn of a breach that affects your data, we will tell the affected college.</P>
  </>) },
  { id: 'data-sharing', title: 'Sharing with others', content: (<>
    <P>We do not sell, rent or trade student, teacher or college data. We share information only with:</P>
    <UL items={[
      <><strong>AI provider:</strong> Google Gemini, only when an Enterprise college uses an AI feature.</>,
      <><strong>Infrastructure providers:</strong> the hosting company that runs our databases and servers.</>,
      <><strong>Authorities:</strong> when a court order or the law requires it, or to defend a legal claim.</>,
    ]} />
    <P>If a college turns on SMS, WhatsApp or online payment services when they launch, the provider will receive the details needed to deliver those messages or payments.</P>
  </>) },
  { id: 'retention', title: 'How long we keep data', content: (<>
    <UL items={[
      'Your data is kept while your subscription is active.',
      'Audit logs are kept for 30 days on Starter, 90 days on Standard, 180 days on Premium and 365 days on Enterprise.',
      'Changing plans never deletes existing data. After a downgrade, services above your new plan become read-only for 30 days and your data is kept for 90 days.',
      'If a payment is late, you keep full access for 7 days, then read-only access for 14 days, then the workspace is suspended.',
    ]} />
    <P>When a subscription ends, we keep data for a cleanup window and then deactivate or securely delete it. Contact us before leaving to agree how your data is returned or deleted.</P>
  </>) },
  { id: 'children-data', title: 'Students and minors', content: (<>
    <P>Colleges record details about students who may be under 18, such as date of birth and guardian phone numbers. The college is responsible for getting any parent or guardian consent it needs, and for following the education and child-protection laws that apply to it.</P>
  </>) },
  { id: 'user-rights', title: 'Your rights', content: (<>
    <P>Administrators, staff and students can ask to see, correct or delete their personal records. Because the college is the data controller, it must approve and carry out requests about student records. We will help the college do so.</P>
    <P>If you are a student or parent, start by asking your college’s administrator.</P>
  </>) },
  { id: 'changes', title: 'Changes to this policy', content: (<>
    <P>We may update this policy. When we make material changes, we will change the “Last updated” date on this page or show a notice on the CollegesHub site.</P>
  </>) },
  { id: 'contact', title: 'Contact us', content: (<>
    <P>For questions about this policy, security concerns or data requests:</P>
    <UL items={['Email: syyedsanaullah@gmail.com (subject: CollegesHub privacy inquiry)', 'Phone: +92 313 5013303']} />
  </>) },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="October 23, 2026"
      summary={[
        'Your college’s data stays in its own separate database.',
        'We never sell student, teacher or college data.',
        'Colleges decide what happens to their students’ records.',
      ]}
      notice="This policy describes how CollegesHub handles data. It is not legal advice. Colleges should have it reviewed by qualified legal counsel before going live."
      sections={SECTIONS}
      other={{ href: '/terms', label: 'Terms & Conditions' }}
    />
  );
}
