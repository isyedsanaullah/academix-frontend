import { createIcon } from '../Icon';

const HiOutlineViewGrid = createIcon('dashboard');
const HiOutlineAcademicCap = createIcon('academic-cap');
const HiOutlineUserGroup = createIcon('user-group');
const HiOutlineCurrencyDollar = createIcon('usd-circle');
const HiOutlineCreditCard = createIcon('wallet');
const HiOutlineClipboardCheck = createIcon('clipboard-check');
const HiOutlineDocumentText = createIcon('document-text');
const HiOutlineChartBar = createIcon('chart');
const HiOutlineSpeakerphone = createIcon('promote');
const HiOutlineCog = createIcon('cog');
const HiOutlineLogout = createIcon('logout');
const HiOutlineOfficeBuilding = createIcon('building');
const HiOutlineX = createIcon('close');
const HiOutlineShieldCheck = createIcon('shield-check');
const HiOutlineExclamation = createIcon('exclamation');
const HiOutlineCalendar = createIcon('calendar');
const HiOutlineBookOpen = createIcon('book-open');
const HiOutlineCollection = createIcon('layers');
const HiOutlineBriefcase = createIcon('briefcase');
const HiOutlineDocumentDuplicate = createIcon('document-duplicate');
const HiOutlineClock = createIcon('clock');
const HiOutlineClipboardList = createIcon('clipboard-list');
const HiOutlineLibrary = createIcon('library');
const HiOutlineCash = createIcon('wallet');
const HiOutlineIdentification = createIcon('id-card');
const HiOutlineSparkles = createIcon('sparkles');
const HiOutlineNewspaper = createIcon('newspaper');
const HiOutlineTemplate = createIcon('grid');
const HiOutlineCloudUpload = createIcon('upload');
const HiOutlineStar = createIcon('star-stroke');
const HiOutlineUser = createIcon('profile');
const HiOutlineTrash = createIcon('trash');
const HiOutlineQrcode = createIcon('qrcode');
const HiOutlineBeaker = createIcon('beaker');

/**
 * Core 2.0 Categorized Navigation Configuration per Role
 * - Single primary item (`Dashboard`) stays top-level without a group.
 * - Logical expandable categories (`children: [...]`) replicate the sample UI's
 *   `components/Sidebar/Dropdown/index.tsx` tree structure, vertical trunk line,
 *   curved L-connectors, and chevron animation.
 * - All existing routes, feature gates (`feature`), and `comingSoon` flags are preserved 1:1.
 */
export const NAV = {
  // Platform Superadmin Command Center
  superAdmin: [
    { to: '/super-admin', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'colleges-onboarding',
      label: 'Colleges',
      icon: HiOutlineOfficeBuilding,
      children: [
        { to: '/super-admin/colleges', icon: HiOutlineOfficeBuilding, label: 'All Colleges' },
        { to: '/super-admin/subscription-requests', icon: HiOutlineClipboardList, label: 'Sub Requests' },
      ],
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: HiOutlineCreditCard,
      children: [
        { to: '/super-admin/finance/overview', icon: HiOutlineChartBar, label: 'Accounting Overview', badgeKey: 'accountingOverview' },
        { to: '/super-admin/finance/payments', icon: HiOutlineCurrencyDollar, label: 'Payments History', badgeKey: 'paymentsHistory' },
        { to: '/super-admin/finance/colleges', icon: HiOutlineOfficeBuilding, label: 'Per-College Billing', badgeKey: 'perCollegeBilling' },
        { to: '/super-admin/finance/accountants', icon: HiOutlineUser, label: 'Accountant Details', badgeKey: 'accountantDetails' },
      ],
    },
    {
      id: 'insights-ai',
      label: 'Insights & AI',
      icon: HiOutlineChartBar,
      children: [
        { to: '/super-admin/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
        { to: '/super-admin/ai/chat', icon: HiOutlineSparkles, label: 'AI Reports' },
      ],
    },
    {
      id: 'system-account',
      label: 'System & Account',
      icon: HiOutlineCog,
      children: [
        { to: '/super-admin/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
        { to: '/super-admin/trash', icon: HiOutlineTrash, label: 'Trash' },
        { to: '/super-admin/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
      ],
    },
  ],

  // College Administration — full institutional control
  admin: [
    { to: '/admin', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'admissions',
      label: 'Admissions',
      icon: HiOutlineAcademicCap,
      children: [
        { to: '/admin/applications', icon: HiOutlineClipboardCheck, label: 'Applications', feature: 'core-academic' },
        { to: '/admin/admission-seasons', icon: HiOutlineCalendar, label: 'Admission Seasons', feature: 'core-academic' },
        { to: '/admin/students', icon: HiOutlineAcademicCap, label: 'Students', feature: 'core-academic' },
        { to: '/admin/certificates', icon: HiOutlineDocumentText, label: 'Certificates', feature: 'certificates' },
      ],
    },
    {
      id: 'academics-lms',
      label: 'Academics & LMS',
      icon: HiOutlineBookOpen,
      children: [
        { to: '/admin/academic', icon: HiOutlineAcademicCap, label: 'Academic Management', feature: 'core-academic' },
        { to: '/admin/timetable', icon: HiOutlineClock, label: 'Universal Timetable', feature: 'timetable' },
        { to: '/admin/assignments', icon: HiOutlineClipboardList, label: 'Assignments', feature: 'assignments-quizzes' },
        { to: '/admin/quizzes', icon: HiOutlineDocumentDuplicate, label: 'Quizzes', feature: 'assignments-quizzes' },
        { to: '/admin/practicals', icon: HiOutlineBeaker, label: 'Practicals & Labs', feature: 'practicals' },
      ],
    },
    {
      id: 'attendance-security',
      label: 'Attendance & Security',
      icon: HiOutlineShieldCheck,
      children: [
        { to: '/admin/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance Reports', feature: 'attendance' },
        { to: '/admin/gate', icon: HiOutlineShieldCheck, label: 'Gate Scanner', feature: 'entry-system' },
        { to: '/admin/gate-logs', icon: HiOutlineClipboardCheck, label: 'Gate Logs', feature: 'entry-system' },
        { to: '/admin/early-exit', icon: HiOutlineClock, label: 'Early Exit Approvals', feature: 'entry-system' },
        { to: '/admin/visitors', icon: HiOutlineShieldCheck, label: 'Visitors', feature: 'visitors' },
        { to: '/admin/id-cards', icon: HiOutlineQrcode, label: 'ID Cards & QR', feature: 'entry-system' },
      ],
    },
    {
      id: 'examinations',
      label: 'Examinations',
      icon: HiOutlineDocumentText,
      children: [
        { to: '/admin/exams', icon: HiOutlineDocumentText, label: 'Exams & Roll Slips', feature: 'exams-results' },
        { to: '/admin/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
        { to: '/admin/results/upload', icon: HiOutlineCloudUpload, label: 'Upload Marks', sub: true, feature: 'exams-results' },
        { to: '/admin/evaluations', icon: HiOutlineStar, label: 'Teacher Evaluations', feature: 'exams-results' },
        { to: '/admin/eligibility', icon: HiOutlineClipboardCheck, label: 'Send-Up & Eligibility', feature: 'eligibility-lists' },
        { to: '/admin/exam-analytics', icon: HiOutlineChartBar, label: 'Weak Students & Analysis', feature: 'weak-student-lists' },
        { to: '/admin/entry-test', icon: HiOutlineAcademicCap, label: 'Entry-Test & MDCAT', feature: 'mcq-bank' },
        { to: '/admin/board', icon: HiOutlineLibrary, label: 'Board Examination Portal', feature: 'board-registration' },
      ],
    },
    {
      id: 'finance-treasury',
      label: 'Finance & Treasury',
      icon: HiOutlineCurrencyDollar,
      children: [
        { to: '/admin/subscription', icon: HiOutlineCreditCard, label: 'Subscription & Billing' },
        { to: '/admin/treasury', icon: HiOutlineCurrencyDollar, label: 'Treasury & Ledger', feature: 'fees' },
        { to: '/admin/fees', icon: HiOutlineCurrencyDollar, label: 'Fee Management', feature: 'fees' },
        { to: '/accountant/payment-proofs', icon: HiOutlineClipboardCheck, label: 'Payment Proofs', feature: 'payment-proof' },
        { to: '/admin/fees/defaulters', icon: HiOutlineExclamation, label: 'Defaulters', sub: true, feature: 'fees' },
        { to: '/admin/dues', icon: HiOutlineDocumentText, label: 'Dues Report', feature: 'fees' },
        { to: '/admin/payroll', icon: HiOutlineBriefcase, label: 'Employee Payroll', feature: 'employees' },
        { to: '/admin/fines', icon: HiOutlineCurrencyDollar, label: 'Student Fines', feature: 'fees' },
      ],
    },
    {
      id: 'staff-hr',
      label: 'Staff & HR',
      icon: HiOutlineUserGroup,
      children: [
        { to: '/admin/staff', icon: HiOutlineUserGroup, label: 'Manage Accounts', feature: 'employees' },
        { to: '/admin/approvals', icon: HiOutlineShieldCheck, label: 'Central Approvals', feature: 'employees' },
        { to: '/admin/leaves', icon: HiOutlineDocumentText, label: 'Leave Applications', feature: 'employees' },
      ],
    },
    {
      id: 'communication-docs',
      label: 'Communication & Docs',
      icon: HiOutlineSpeakerphone,
      children: [
        { to: '/admin/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
        { to: '/admin/guidance', icon: HiOutlineUserGroup, label: 'Parents & Guidance', feature: 'career-counselling' },
        { to: '/admin/templates', icon: HiOutlineTemplate, label: 'Document Templates', feature: 'doc-templates' },
        { to: '/admin/reports', icon: HiOutlineDocumentDuplicate, label: 'Report Center (PDF)', feature: 'analytics-reports' },
      ],
    },
    {
      id: 'ai-tools',
      label: 'AI Tools',
      icon: HiOutlineSparkles,
      children: [
        { to: '/admin/ai/chat', icon: HiOutlineSparkles, label: 'AI Assistant', feature: 'ai-chat' },
        { to: '/admin/ai/pdf-library', icon: HiOutlineCloudUpload, label: 'PDF Library', feature: 'ai-pdf-chat' },
        { to: '/admin/ai/quiz', icon: HiOutlineDocumentDuplicate, label: 'Quiz Generator', feature: 'ai-generators' },
        { to: '/admin/ai/paper', icon: HiOutlineNewspaper, label: 'Paper Generator', feature: 'ai-generators' },
        { to: '/admin/ai/mcq', icon: HiOutlineCollection, label: 'MCQ Generator', feature: 'ai-generators' },
        { to: '/admin/ai/notes', icon: HiOutlineBookOpen, label: 'Notes Generator', feature: 'ai-generators' },
        { to: '/admin/ai/assignment', icon: HiOutlineClipboardList, label: 'Assignment Gen.', feature: 'ai-generators' },
        { to: '/admin/ai/syllabus', icon: HiOutlineTemplate, label: 'Syllabus Gen.', feature: 'ai-generators' },
      ],
    },
    {
      id: 'settings-logs',
      label: 'Settings & Logs',
      icon: HiOutlineCog,
      children: [
        { to: '/admin/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
        { to: '/admin/trash', icon: HiOutlineTrash, label: 'Trash' },
        { to: '/admin/profile', icon: HiOutlineUser, label: 'Profile & Settings' },
      ],
    },
  ],

  // Registrar — student admissions & records
  registrar: [
    { to: '/registrar', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'admissions-records',
      label: 'Admissions & Records',
      icon: HiOutlineAcademicCap,
      children: [
        { to: '/registrar/applications', icon: HiOutlineClipboardCheck, label: 'Applications', feature: 'core-academic' },
        { to: '/registrar/admission-seasons', icon: HiOutlineCalendar, label: 'Admission Seasons', feature: 'core-academic' },
        { to: '/registrar/students', icon: HiOutlineAcademicCap, label: 'Student Records', feature: 'core-academic' },
        { to: '/registrar/certificates', icon: HiOutlineIdentification, label: 'Certificates', feature: 'certificates' },
      ],
    },
    {
      id: 'academics-board',
      label: 'Academics & Board',
      icon: HiOutlineLibrary,
      children: [
        { to: '/registrar/timetable', icon: HiOutlineClock, label: 'Timetable', feature: 'timetable' },
        { to: '/admin/board', icon: HiOutlineLibrary, label: 'Board Examination Portal', feature: 'board-registration' },
        { to: '/admin/eligibility', icon: HiOutlineClipboardCheck, label: 'Send-Up & Eligibility', feature: 'eligibility-lists' },
        { to: '/admin/practicals', icon: HiOutlineBeaker, label: 'Practicals & Labs', feature: 'practicals' },
      ],
    },
    {
      id: 'communication-ai',
      label: 'Communication & AI',
      icon: HiOutlineSparkles,
      children: [
        { to: '/registrar/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
        { to: '/registrar/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat', feature: 'ai-chat' },
      ],
    },
    {
      id: 'settings-logs',
      label: 'Settings & Logs',
      icon: HiOutlineCog,
      children: [
        { to: '/registrar/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
        { to: '/registrar/trash', icon: HiOutlineTrash, label: 'Trash' },
        { to: '/registrar/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
      ],
    },
  ],

  // Accountant — fee & financial management
  accountant: [
    { to: '/accountant', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'treasury-billing',
      label: 'Treasury & Billing',
      icon: HiOutlineCreditCard,
      children: [
        { to: '/accountant/treasury', icon: HiOutlineCurrencyDollar, label: 'Treasury', feature: 'fees' },
        { to: '/accountant/subscription', icon: HiOutlineCreditCard, label: 'Subscription Billing' },
      ],
    },
    {
      id: 'fees-collections',
      label: 'Fees & Collections',
      icon: HiOutlineCurrencyDollar,
      children: [
        { to: '/accountant/fees', icon: HiOutlineCurrencyDollar, label: 'Fee Collection', feature: 'fees' },
        { to: '/accountant/payment-proofs', icon: HiOutlineClipboardCheck, label: 'Payment Proofs', feature: 'payment-proof' },
        { to: '/accountant/fees/defaulters', icon: HiOutlineExclamation, label: 'Defaulters', sub: true, feature: 'fees' },
        { to: '/accountant/dues', icon: HiOutlineDocumentText, label: 'Dues Report', feature: 'fees' },
      ],
    },
    {
      id: 'payroll-ai',
      label: 'Payroll & AI',
      icon: HiOutlineBriefcase,
      children: [
        { to: '/accountant/payroll', icon: HiOutlineBriefcase, label: 'Employee Pay', feature: 'employees' },
        { to: '/accountant/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat', feature: 'ai-chat' },
      ],
    },
    {
      id: 'settings-logs',
      label: 'Settings & Logs',
      icon: HiOutlineCog,
      children: [
        { to: '/accountant/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
        { to: '/accountant/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
        { to: '/accountant/trash', icon: HiOutlineTrash, label: 'Trash' },
        { to: '/accountant/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
      ],
    },
  ],

  // Principal — approvals + institutional oversight
  principal: [
    { to: '/principal', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'governance-approvals',
      label: 'Governance & Approvals',
      icon: HiOutlineShieldCheck,
      children: [
        { to: '/principal/approvals', icon: HiOutlineShieldCheck, label: 'Approvals', feature: 'employees' },
        { to: '/principal/evaluations', icon: HiOutlineStar, label: 'Teacher Evaluations', feature: 'exams-results' },
        { to: '/principal/staff', icon: HiOutlineUserGroup, label: 'Staff', feature: 'employees' },
        { to: '/principal/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
      ],
    },
    {
      id: 'academic-oversight',
      label: 'Academic Oversight',
      icon: HiOutlineAcademicCap,
      children: [
        { to: '/principal/students', icon: HiOutlineAcademicCap, label: 'Students', feature: 'core-academic' },
        { to: '/principal/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance', feature: 'attendance' },
        { to: '/principal/exams', icon: HiOutlineDocumentText, label: 'Exams', feature: 'exams-results' },
        { to: '/principal/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
      ],
    },
    {
      id: 'board-analytics',
      label: 'Board & Analytics',
      icon: HiOutlineLibrary,
      children: [
        { to: '/admin/board', icon: HiOutlineLibrary, label: 'Board Examination Portal', feature: 'board-registration' },
        { to: '/admin/eligibility', icon: HiOutlineClipboardCheck, label: 'Send-Up & Eligibility', feature: 'eligibility-lists' },
        { to: '/admin/exam-analytics', icon: HiOutlineChartBar, label: 'Weak Students & Analysis', feature: 'weak-student-lists' },
        { to: '/admin/practicals', icon: HiOutlineBeaker, label: 'Practicals & Labs', feature: 'practicals' },
      ],
    },
    {
      id: 'finance-reports',
      label: 'Finance & Reports',
      icon: HiOutlineChartBar,
      children: [
        { to: '/principal/fees', icon: HiOutlineCurrencyDollar, label: 'Fee Overview', feature: 'fees' },
        { to: '/principal/gate-logs', icon: HiOutlineClipboardCheck, label: 'Gate Logs', comingSoon: true, feature: 'entry-system' },
        { to: '/principal/reports', icon: HiOutlineDocumentDuplicate, label: 'Report Center', comingSoon: true, feature: 'analytics-reports' },
      ],
    },
    {
      id: 'settings-logs',
      label: 'Settings & Logs',
      icon: HiOutlineCog,
      children: [
        { to: '/principal/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
        { to: '/principal/trash', icon: HiOutlineTrash, label: 'Trash' },
        { to: '/principal/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
      ],
    },
  ],

  // Teacher — faculty portal
  teacher: [
    { to: '/teacher', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'classroom-exams',
      label: 'Classroom & Exams',
      icon: HiOutlineAcademicCap,
      children: [
        { to: '/teacher/students', icon: HiOutlineAcademicCap, label: 'Students', feature: 'core-academic' },
        { to: '/teacher/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance', feature: 'attendance' },
        { to: '/teacher/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
        { to: '/teacher/results/upload', icon: HiOutlineCloudUpload, label: 'Upload Results', sub: true, feature: 'exams-results' },
        { to: '/teacher/fines', icon: HiOutlineCurrencyDollar, label: 'Fine Student', feature: 'fees' },
      ],
    },
    {
      id: 'lms-schedule',
      label: 'LMS & Schedule',
      icon: HiOutlineClipboardList,
      children: [
        { to: '/teacher/assignments', icon: HiOutlineClipboardList, label: 'Assignments', feature: 'assignments-quizzes' },
        { to: '/teacher/quizzes', icon: HiOutlineDocumentDuplicate, label: 'Quizzes', feature: 'assignments-quizzes' },
        { to: '/teacher/timetable', icon: HiOutlineClock, label: 'My Timetable', feature: 'timetable' },
      ],
    },
    {
      id: 'ai-studio',
      label: 'AI Studio',
      icon: HiOutlineSparkles,
      children: [
        { to: '/teacher/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat', feature: 'ai-chat' },
        { to: '/teacher/ai/pdf-library', icon: HiOutlineCloudUpload, label: 'PDF Library', feature: 'ai-pdf-chat' },
        { to: '/teacher/ai/quiz', icon: HiOutlineDocumentDuplicate, label: 'Quiz Generator', feature: 'ai-generators' },
        { to: '/teacher/ai/paper', icon: HiOutlineNewspaper, label: 'Paper Generator', feature: 'ai-generators' },
        { to: '/teacher/ai/mcq', icon: HiOutlineCollection, label: 'MCQ Generator', feature: 'ai-generators' },
        { to: '/teacher/ai/notes', icon: HiOutlineBookOpen, label: 'Notes Generator', comingSoon: true, feature: 'ai-generators' },
        { to: '/teacher/ai/assignment', icon: HiOutlineClipboardList, label: 'Assignment Gen.', feature: 'ai-generators' },
        { to: '/teacher/ai/syllabus', icon: HiOutlineTemplate, label: 'Syllabus Gen.', comingSoon: true, feature: 'ai-generators' },
      ],
    },
    {
      id: 'settings-logs',
      label: 'Settings & Logs',
      icon: HiOutlineCog,
      children: [
        { to: '/teacher/early-exit', icon: HiOutlineClock, label: 'Early Exit', feature: 'entry-system' },
        { to: '/teacher/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
        { to: '/teacher/trash', icon: HiOutlineTrash, label: 'Trash' },
        { to: '/teacher/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
      ],
    },
  ],

  // Student — student portal
  student: [
    { to: '/student', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'academics-lms',
      label: 'Academics & LMS',
      icon: HiOutlineAcademicCap,
      children: [
        { to: '/student/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance', feature: 'attendance' },
        { to: '/student/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
        { to: '/student/assignments', icon: HiOutlineClipboardList, label: 'Assignments', feature: 'assignments-quizzes' },
        { to: '/student/quizzes', icon: HiOutlineDocumentDuplicate, label: 'Quizzes', feature: 'assignments-quizzes' },
        { to: '/student/timetable', icon: HiOutlineClock, label: 'Timetable', feature: 'timetable' },
        { to: '/student/evaluation', icon: HiOutlineStar, label: 'Teacher Evaluation', feature: 'exams-results' },
      ],
    },
    {
      id: 'fees-requests',
      label: 'Fees & Requests',
      icon: HiOutlineCurrencyDollar,
      children: [
        { to: '/student/fees', icon: HiOutlineCurrencyDollar, label: 'Fees', feature: 'fees' },
        { to: '/student/fines', icon: HiOutlineExclamation, label: 'Fines', feature: 'fees' },
        { to: '/student/leave', icon: HiOutlineDocumentText, label: 'Leave Application', feature: 'employees' },
        { to: '/student/early-exit', icon: HiOutlineClock, label: 'Early Exit', feature: 'entry-system' },
      ],
    },
    {
      id: 'ai-study-tools',
      label: 'AI Study Tools',
      icon: HiOutlineSparkles,
      children: [
        { to: '/student/ai/pdf-library', icon: HiOutlineBookOpen, label: 'Course Materials', feature: 'ai-pdf-chat' },
        { to: '/student/ai/chat', icon: HiOutlineSparkles, label: 'Course Assistant', feature: 'ai-chat' },
        { to: '/student/ai/notes', icon: HiOutlineDocumentText, label: 'Notes Generator', comingSoon: true, feature: 'ai-generators' },
      ],
    },
    {
      id: 'settings-logs',
      label: 'Settings & Logs',
      icon: HiOutlineCog,
      children: [
        { to: '/student/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
        { to: '/student/trash', icon: HiOutlineTrash, label: 'Trash' },
        { to: '/student/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
      ],
    },
  ],

  // Employee — campus operations & security
  employee: [
    { to: '/employee', icon: HiOutlineViewGrid, label: 'Dashboard' },
    {
      id: 'gate-visitors',
      label: 'Gate & Visitors',
      icon: HiOutlineShieldCheck,
      children: [
        { to: '/employee/gate', icon: HiOutlineShieldCheck, label: 'Gate Scanner', feature: 'entry-system' },
        { to: '/employee/gate-logs', icon: HiOutlineClipboardCheck, label: 'Gate Logs', feature: 'entry-system' },
        { to: '/employee/visitors', icon: HiOutlineShieldCheck, label: 'Visitors', feature: 'visitors' },
        { to: '/employee/early-exit', icon: HiOutlineClock, label: 'Early Exit', feature: 'entry-system' },
      ],
    },
    {
      id: 'account',
      label: 'Account',
      icon: HiOutlineCog,
      children: [
        { to: '/employee/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
      ],
    },
  ],
};
