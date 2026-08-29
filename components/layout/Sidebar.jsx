'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '../../store/authStore';
import {
  HiOutlineViewGrid, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineCurrencyDollar,
  HiOutlineClipboardCheck, HiOutlineDocumentText, HiOutlineChartBar, HiOutlineSpeakerphone,
  HiOutlineCog, HiOutlineLogout, HiOutlineOfficeBuilding, HiOutlineX,
  HiOutlineShieldCheck, HiOutlineExclamation, HiOutlineCalendar, HiOutlineBookOpen,
  HiOutlineCollection, HiOutlineBriefcase, HiOutlineDocumentDuplicate, HiOutlineClock,
  HiOutlineClipboardList, HiOutlineLibrary, HiOutlineCash, HiOutlineIdentification,
  HiOutlineSparkles, HiOutlineNewspaper, HiOutlineTemplate, HiOutlineCloudUpload,
  HiOutlineStar, HiOutlineUser, HiOutlineTrash, HiOutlineQrcode
} from 'react-icons/hi';

const NAV = {
  superAdmin: [
    { to: '/super-admin', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/super-admin/colleges', icon: HiOutlineOfficeBuilding, label: 'Colleges' },
    { to: '/super-admin/subscription-requests', icon: HiOutlineClipboardList, label: 'Sub Requests' },
    { label: 'ANALYTICS', divider: true },
    { to: '/super-admin/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    { label: 'AI', divider: true },
    { to: '/super-admin/ai/chat', icon: HiOutlineSparkles, label: 'AI Reports' },
    { label: 'LOGS & HISTORY', divider: true },
    { to: '/super-admin/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/super-admin/trash', icon: HiOutlineTrash, label: 'Trash' },
    { label: 'ACCOUNT', divider: true },
    { to: '/super-admin/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  // College Administration — full control
  admin: [
    { to: '/admin', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'ACADEMIC', divider: true },
    { to: '/admin/academic', icon: HiOutlineAcademicCap, label: 'Academic Management', feature: 'core-academic' },
    { to: '/admin/students', icon: HiOutlineAcademicCap, label: 'Students', feature: 'core-academic' },
    { label: 'ATTENDANCE', divider: true },
    { to: '/admin/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance Reports', feature: 'attendance' },
    { label: 'EXAMINATIONS', divider: true },
    { to: '/admin/exams', icon: HiOutlineDocumentText, label: 'Exams', feature: 'exams-results' },
    { to: '/admin/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
    { label: 'FINANCE', divider: true },
    { to: '/admin/fees', icon: HiOutlineCurrencyDollar, label: 'Fees', feature: 'fees' },
    { to: '/admin/fees/defaulters', icon: HiOutlineExclamation, label: 'Defaulters', sub: true, feature: 'fees' },
    { label: 'HR & STAFF', divider: true },
    { to: '/admin/staff', icon: HiOutlineUserGroup, label: 'Manage Accounts', feature: 'employees' },
    { label: 'ADMINISTRATION', divider: true },
    { to: '/admin/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
    { to: '/admin/approvals', icon: HiOutlineShieldCheck, label: 'Approvals', feature: 'employees' },
    { to: '/admin/early-exit', icon: HiOutlineClock, label: 'Early Exit Approvals', feature: 'entry-system' },
    { to: '/admin/leaves', icon: HiOutlineDocumentText, label: 'Leave Applications', feature: 'employees' },
    { to: '/admin/visitors', icon: HiOutlineShieldCheck, label: 'Visitors', feature: 'visitors' },
    { to: '/admin/id-cards', icon: HiOutlineQrcode, label: 'ID Cards & QR', feature: 'entry-system' },
    { to: '/admin/certificates', icon: HiOutlineDocumentText, label: 'Certificates', feature: 'certificates' },
    { label: 'AI', divider: true },
    { to: '/admin/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat', feature: 'ai-chat' },
    { label: 'ACCOUNT', divider: true },
    { to: '/admin/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/admin/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/admin/profile', icon: HiOutlineUser, label: 'Profile & Settings' },
  ],

  // Registrar — student admissions & records
  registrar: [
    { to: '/registrar', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'ADMISSIONS', divider: true },
    { to: '/registrar/applications', icon: HiOutlineClipboardCheck, label: 'Applications', feature: 'core-academic' },
    { to: '/registrar/admission-seasons', icon: HiOutlineCalendar, label: 'Admission Seasons', feature: 'core-academic' },
    { label: 'STUDENTS', divider: true },
    { to: '/registrar/students', icon: HiOutlineAcademicCap, label: 'Student Records', feature: 'core-academic' },
    { to: '/registrar/certificates', icon: HiOutlineIdentification, label: 'Certificates', feature: 'certificates' },
    { label: 'ACADEMIC', divider: true },
    { to: '/registrar/timetable', icon: HiOutlineClock, label: 'Timetable', feature: 'timetable' },
    { label: 'AI', divider: true },
    { to: '/registrar/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat', feature: 'ai-chat' },
    { label: 'OTHER', divider: true },
    { to: '/registrar/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/registrar/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/registrar/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
    { to: '/registrar/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  // Accountant — fee & financial management
  accountant: [
    { to: '/accountant', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'TREASURY', divider: true },
    { to: '/accountant/treasury', icon: HiOutlineCurrencyDollar, label: 'Treasury', feature: 'fees' },
    { label: 'FEES', divider: true },
    { to: '/accountant/fees', icon: HiOutlineCurrencyDollar, label: 'Fee Collection', feature: 'fees' },
    { to: '/accountant/fees/defaulters', icon: HiOutlineExclamation, label: 'Defaulters', sub: true, feature: 'fees' },
    { to: '/accountant/dues', icon: HiOutlineDocumentText, label: 'Dues Report', feature: 'fees' },
    { label: 'PAYROLL', divider: true },
    { to: '/accountant/payroll', icon: HiOutlineBriefcase, label: 'Employee Pay', feature: 'employees' },
    { label: 'AI PREMIUM', divider: true },
    { to: '/accountant/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat', feature: 'ai-chat' },
    { label: 'OTHER', divider: true },
    { to: '/accountant/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/accountant/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/accountant/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
    { to: '/accountant/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  // Principal — approvals + oversight
  principal: [
    { to: '/principal', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'APPROVALS', divider: true },
    { to: '/principal/approvals', icon: HiOutlineShieldCheck, label: 'Approvals', feature: 'employees' },
    { label: 'EVALUATIONS', divider: true },
    { to: '/principal/evaluations', icon: HiOutlineStar, label: 'Teacher Evaluations', feature: 'exams-results' },
    { label: 'OVERVIEW', divider: true },
    { to: '/principal/students', icon: HiOutlineAcademicCap, label: 'Students', feature: 'core-academic' },
    { to: '/principal/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance', feature: 'attendance' },
    { to: '/principal/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
    { to: '/principal/exams', icon: HiOutlineDocumentText, label: 'Exams', feature: 'exams-results' },
    { to: '/principal/fees', icon: HiOutlineCurrencyDollar, label: 'Fee Overview', feature: 'fees' },
    { to: '/principal/staff', icon: HiOutlineUserGroup, label: 'Staff', feature: 'employees' },
    { to: '/principal/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements', feature: 'announcements' },
    { label: 'GATE', divider: true },
    { to: '/principal/gate-logs', icon: HiOutlineClipboardCheck, label: 'Gate Logs', comingSoon: true, feature: 'entry-system' },
    { label: 'REPORTS', divider: true },
    { to: '/principal/reports', icon: HiOutlineDocumentDuplicate, label: 'Report Center', comingSoon: true, feature: 'analytics-reports' },
    { label: 'OTHER', divider: true },
    { to: '/principal/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/principal/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/principal/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  teacher: [
    { to: '/teacher', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/teacher/students', icon: HiOutlineAcademicCap, label: 'Students', feature: 'core-academic' },
    { to: '/teacher/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance', feature: 'attendance' },
    { to: '/teacher/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
    { to: '/teacher/results/upload', icon: HiOutlineCloudUpload, label: 'Upload Results', sub: true, feature: 'exams-results' },
    { label: 'LMS', divider: true },
    { to: '/teacher/assignments', icon: HiOutlineClipboardList, label: 'Assignments', feature: 'assignments-quizzes' },
    { to: '/teacher/quizzes', icon: HiOutlineDocumentDuplicate, label: 'Quizzes', feature: 'assignments-quizzes' },
    { to: '/teacher/timetable', icon: HiOutlineClock, label: 'My Timetable', feature: 'timetable' },
    { label: 'MANAGEMENT', divider: true },
    { to: '/teacher/fines', icon: HiOutlineCurrencyDollar, label: 'Fine Student', feature: 'fees' },
    { label: 'AI PREMIUM', divider: true },
    { to: '/teacher/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat', feature: 'ai-chat' },
    { to: '/teacher/ai/pdf-library', icon: HiOutlineCloudUpload, label: 'PDF Library', feature: 'ai-pdf-chat' },
    { to: '/teacher/ai/quiz', icon: HiOutlineDocumentDuplicate, label: 'Quiz Generator', feature: 'ai-generators' },
    { to: '/teacher/ai/paper', icon: HiOutlineNewspaper, label: 'Paper Generator', feature: 'ai-generators' },
    { to: '/teacher/ai/mcq', icon: HiOutlineCollection, label: 'MCQ Generator', feature: 'ai-generators' },
    { to: '/teacher/ai/notes', icon: HiOutlineBookOpen, label: 'Notes Generator', comingSoon: true, feature: 'ai-generators' },
    { to: '/teacher/ai/assignment', icon: HiOutlineClipboardList, label: 'Assignment Gen.', feature: 'ai-generators' },
    { to: '/teacher/ai/syllabus', icon: HiOutlineTemplate, label: 'Syllabus Gen.', comingSoon: true, feature: 'ai-generators' },
    { label: 'OTHER', divider: true },
    { to: '/teacher/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/teacher/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/teacher/early-exit', icon: HiOutlineClock, label: 'Early Exit', feature: 'entry-system' },
    { to: '/teacher/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  student: [
    { to: '/student', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/student/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance', feature: 'attendance' },
    { to: '/student/fees', icon: HiOutlineCurrencyDollar, label: 'Fees', feature: 'fees' },
    { to: '/student/fines', icon: HiOutlineExclamation, label: 'Fines', feature: 'fees' },
    { to: '/student/results', icon: HiOutlineChartBar, label: 'Results', feature: 'exams-results' },
    { label: 'LMS', divider: true },
    { to: '/student/assignments', icon: HiOutlineClipboardList, label: 'Assignments', feature: 'assignments-quizzes' },
    { to: '/student/quizzes', icon: HiOutlineDocumentDuplicate, label: 'Quizzes', feature: 'assignments-quizzes' },
    { to: '/student/timetable', icon: HiOutlineClock, label: 'Timetable', feature: 'timetable' },
    { label: 'LEAVE', divider: true },
    { to: '/student/leave', icon: HiOutlineDocumentText, label: 'Leave Application', feature: 'employees' },
    { label: 'EVALUATION', divider: true },
    { to: '/student/evaluation', icon: HiOutlineStar, label: 'Teacher Evaluation', feature: 'exams-results' },
    { label: 'AI PREMIUM', divider: true },
    { to: '/student/ai/pdf-library', icon: HiOutlineBookOpen, label: 'Course Materials', feature: 'ai-pdf-chat' },
    { to: '/student/ai/chat', icon: HiOutlineSparkles, label: 'Course Assistant', feature: 'ai-chat' },
    { to: '/student/ai/notes', icon: HiOutlineDocumentText, label: 'Notes Generator', comingSoon: true, feature: 'ai-generators' },
    { label: 'OTHER', divider: true },
    { to: '/student/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/student/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/student/early-exit', icon: HiOutlineClock, label: 'Early Exit', feature: 'entry-system' },
    { to: '/student/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  employee: [
    { to: '/employee', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'GATE SECURITY', divider: true },
    { to: '/employee/gate', icon: HiOutlineShieldCheck, label: 'Gate Scanner', feature: 'entry-system' },
    { to: '/employee/gate-logs', icon: HiOutlineClipboardCheck, label: 'Gate Logs', feature: 'entry-system' },
    { label: 'OTHER', divider: true },
    { to: '/employee/visitors', icon: HiOutlineShieldCheck, label: 'Visitors', feature: 'visitors' },
    { to: '/employee/early-exit', icon: HiOutlineClock, label: 'Early Exit', feature: 'entry-system' },
    { to: '/employee/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const rawLinks = NAV[user?.role] || [];

  const effectiveFeatures = user?.college?.effectiveFeatures || user?.college?.subscription?.features || null;

  // Filter links based on college effective features
  const links = rawLinks.filter((link) => {
    if (user?.role === 'superAdmin') return true;
    if (link.divider) return true;
    if (!link.feature) return true;
    if (!effectiveFeatures) return true;
    return effectiveFeatures.includes(link.feature);
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
    if (onClose) onClose();
  };

  const roleMeta = {
    superAdmin: { label: 'SUPER ADMIN', color: 'text-violet-600 dark:text-violet-400' },
    admin: { label: 'ADMIN', color: 'text-indigo-600 dark:text-indigo-400' },
    registrar: { label: 'REGISTRAR', color: 'text-emerald-600 dark:text-emerald-400' },
    accountant: { label: 'ACCOUNTANT', color: 'text-amber-600 dark:text-amber-400' },
    principal: { label: 'PRINCIPAL', color: 'text-sky-600 dark:text-sky-400' },
    teacher: { label: 'TEACHER', color: 'text-blue-600 dark:text-blue-400' },
    student: { label: 'STUDENT', color: 'text-rose-600 dark:text-rose-400' },
    employee: { label: 'EMPLOYEE', color: 'text-orange-600 dark:text-orange-400' },
  };
  const rm = roleMeta[user?.role] || { label: '?', color: 'text-gray-500 dark:text-white/40' };
  return (
    <aside className="flex flex-col h-full w-64 bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0e14] dark:to-[#0d1117] border-r border-slate-200/60 dark:border-white/[0.04] shadow-sm dark:shadow-none transition-all duration-300">
      {/* Logo + Brand */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-slate-200/60 dark:border-white/[0.04] bg-white/40 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none">
        <div className="w-18 h-18 shrink-0 relative">
          <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-white leading-none tracking-tight">Academix</p>
          <p className={`text-[10px] font-semibold tracking-widest mt-0.5 ${rm.color}`}>{rm.label} Panel</p>
        </div>
        <button onClick={onClose} className="ml-auto p-1 rounded-lg text-slate-400 dark:text-white/20 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition lg:hidden">
          <HiOutlineX size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {links.map((link, idx) => {
          if (link.divider) return (
            <div key={idx} className="pt-5 pb-2 px-3">
              <span className="text-[10px] font-semibold tracking-[0.15em] text-slate-400 dark:text-white/15 uppercase">{link.label}</span>
            </div>
          );

          if (link.comingSoon) {
            return (
              <div key={link.to}
                className={`flex items-center gap-3 rounded-xl cursor-not-allowed opacity-50
                  ${link.sub ? 'pl-8 pr-3 py-1.5' : 'px-3 py-2.5'}
                  text-slate-400 dark:text-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition`}
              >
                <link.icon size={link.sub ? 14 : 18} className="text-slate-300 dark:text-white/15 shrink-0" />
                <span className={`${link.sub ? 'text-xs' : 'text-sm'} font-medium leading-none`}>{link.label}</span>
                <span className="ml-auto shrink-0 text-[8px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase whitespace-nowrap border border-emerald-200/30 dark:border-emerald-400/10">
                  Soon
                </span>
              </div>
            );
          }

          const isActive = link.sub
            ? pathname === link.to
            : link.to.split('/').length <= 2
              ? pathname === link.to
              : pathname.startsWith(link.to);
          return (
            <Link key={link.to} href={link.to} onClick={onClose}
              className={
                `flex items-center gap-3 rounded-xl transition-all duration-200 group
                ${link.sub ? 'pl-8 pr-3 py-1.5' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-indigo-100/70 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm dark:shadow-none'
                  : 'text-slate-600 dark:text-white/30 hover:text-slate-800 dark:hover:text-white/70 hover:bg-slate-100/70 dark:hover:bg-white/[0.03]'}`
              }
            >
              <link.icon size={link.sub ? 14 : 18} className={isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-white/20 group-hover:text-slate-600 dark:group-hover:text-white/50'} />
              <span className={`${link.sub ? 'text-xs' : 'text-sm'} font-medium leading-none`}>{link.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-300 shrink-0 shadow-sm shadow-indigo-200 dark:shadow-none" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-slate-200/60 dark:border-white/[0.04] bg-white/20 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-white/30 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50/60 dark:hover:bg-rose-500/[0.06] transition-all text-sm font-medium group">
          <HiOutlineLogout size={18} className="group-hover:scale-105 transition" /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
