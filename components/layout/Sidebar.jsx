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
    { to: '/admin/academic', icon: HiOutlineAcademicCap, label: 'Academic Management' },
    { to: '/admin/students', icon: HiOutlineAcademicCap, label: 'Students' },
    { label: 'ATTENDANCE', divider: true },
    { to: '/admin/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance Reports' },
    { label: 'EXAMINATIONS', divider: true },
    { to: '/admin/exams', icon: HiOutlineDocumentText, label: 'Exams' },
    { to: '/admin/results', icon: HiOutlineChartBar, label: 'Results' },
    { label: 'FINANCE', divider: true },
    { to: '/admin/fees', icon: HiOutlineCurrencyDollar, label: 'Fees' },
    { to: '/admin/fees/defaulters', icon: HiOutlineExclamation, label: 'Defaulters', sub: true },
    { label: 'HR & STAFF', divider: true },
    { to: '/admin/staff', icon: HiOutlineUserGroup, label: 'Manage Accounts' },
    { label: 'ADMINISTRATION', divider: true },
    { to: '/admin/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements' },
    { to: '/admin/approvals', icon: HiOutlineShieldCheck, label: 'Approvals' },
    { to: '/admin/early-exit', icon: HiOutlineClock, label: 'Early Exit Approvals' },
    { to: '/admin/leaves', icon: HiOutlineDocumentText, label: 'Leave Applications' },
    { to: '/admin/visitors', icon: HiOutlineShieldCheck, label: 'Visitors' },
    { to: '/admin/id-cards', icon: HiOutlineQrcode, label: 'ID Cards & QR' },
    { to: '/admin/certificates', icon: HiOutlineDocumentText, label: 'Certificates' },
    { label: 'AI', divider: true },
    { to: '/admin/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat' },
    { label: 'ACCOUNT', divider: true },
    { to: '/admin/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/admin/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/admin/profile', icon: HiOutlineUser, label: 'Profile & Settings' },
  ],

  // Registrar — student admissions & records
  registrar: [
    { to: '/registrar', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'ADMISSIONS', divider: true },
    { to: '/registrar/applications', icon: HiOutlineClipboardCheck, label: 'Applications' },
    { to: '/registrar/admission-seasons', icon: HiOutlineCalendar, label: 'Admission Seasons' },
    { label: 'STUDENTS', divider: true },
    { to: '/registrar/students', icon: HiOutlineAcademicCap, label: 'Student Records' },
    { to: '/registrar/certificates', icon: HiOutlineIdentification, label: 'Certificates' },
    { label: 'ACADEMIC', divider: true },
    { to: '/registrar/timetable', icon: HiOutlineClock, label: 'Timetable' },
    { label: 'AI', divider: true },
    { to: '/registrar/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat' },
    { label: 'OTHER', divider: true },
    { to: '/registrar/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/registrar/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/registrar/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements' },
    { to: '/registrar/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  // Accountant — fee & financial management
  accountant: [
    { to: '/accountant', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'TREASURY', divider: true },
    { to: '/accountant/treasury', icon: HiOutlineCurrencyDollar, label: 'Treasury' },
    { label: 'FEES', divider: true },
    { to: '/accountant/fees', icon: HiOutlineCurrencyDollar, label: 'Fee Collection' },
    { to: '/accountant/fees/defaulters', icon: HiOutlineExclamation, label: 'Defaulters', sub: true },
    { to: '/accountant/dues', icon: HiOutlineDocumentText, label: 'Dues Report' },
    { label: 'PAYROLL', divider: true },
    { to: '/accountant/payroll', icon: HiOutlineBriefcase, label: 'Employee Pay' },
    { label: 'AI PREMIUM', divider: true },
    { to: '/accountant/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat' },
    { label: 'OTHER', divider: true },
    { to: '/accountant/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/accountant/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/accountant/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements' },
    { to: '/accountant/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  // Principal — approvals + oversight
  principal: [
    { to: '/principal', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'APPROVALS', divider: true },
    { to: '/principal/approvals', icon: HiOutlineShieldCheck, label: 'Approvals' },
    { label: 'EVALUATIONS', divider: true },
    { to: '/principal/evaluations', icon: HiOutlineStar, label: 'Teacher Evaluations' },
    { label: 'OVERVIEW', divider: true },
    { to: '/principal/students', icon: HiOutlineAcademicCap, label: 'Students' },
    { to: '/principal/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance' },
    { to: '/principal/results', icon: HiOutlineChartBar, label: 'Results' },
    { to: '/principal/exams', icon: HiOutlineDocumentText, label: 'Exams' },
    { to: '/principal/fees', icon: HiOutlineCurrencyDollar, label: 'Fee Overview' },
    { to: '/principal/staff', icon: HiOutlineUserGroup, label: 'Staff' },
    { to: '/principal/announcements', icon: HiOutlineSpeakerphone, label: 'Announcements' },
    { label: 'GATE', divider: true },
    { to: '/principal/gate-logs', icon: HiOutlineClipboardCheck, label: 'Gate Logs', comingSoon: true },
    { label: 'REPORTS', divider: true },
    { to: '/principal/reports', icon: HiOutlineDocumentDuplicate, label: 'Report Center', comingSoon: true },
    { label: 'OTHER', divider: true },
    { to: '/principal/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/principal/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/principal/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  teacher: [
    { to: '/teacher', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/teacher/students', icon: HiOutlineAcademicCap, label: 'Students' },
    { to: '/teacher/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance' },
    { to: '/teacher/results', icon: HiOutlineChartBar, label: 'Results' },
    { to: '/teacher/results/upload', icon: HiOutlineCloudUpload, label: 'Upload Results', sub: true },
    { label: 'LMS', divider: true },
    { to: '/teacher/assignments', icon: HiOutlineClipboardList, label: 'Assignments' },
    { to: '/teacher/quizzes', icon: HiOutlineDocumentDuplicate, label: 'Quizzes' },
    { to: '/teacher/timetable', icon: HiOutlineClock, label: 'My Timetable' },
    { label: 'MANAGEMENT', divider: true },
    { to: '/teacher/fines', icon: HiOutlineCurrencyDollar, label: 'Fine Student' },
    { label: 'AI PREMIUM', divider: true },
    { to: '/teacher/ai/chat', icon: HiOutlineSparkles, label: 'AI Chat' },
    { to: '/teacher/ai/pdf-library', icon: HiOutlineCloudUpload, label: 'PDF Library' },
    { to: '/teacher/ai/quiz', icon: HiOutlineDocumentDuplicate, label: 'Quiz Generator' },
    { to: '/teacher/ai/paper', icon: HiOutlineNewspaper, label: 'Paper Generator' },
    { to: '/teacher/ai/mcq', icon: HiOutlineCollection, label: 'MCQ Generator' },
    { to: '/teacher/ai/notes', icon: HiOutlineBookOpen, label: 'Notes Generator', comingSoon: true },
    { to: '/teacher/ai/assignment', icon: HiOutlineClipboardList, label: 'Assignment Gen.' },
    { to: '/teacher/ai/syllabus', icon: HiOutlineTemplate, label: 'Syllabus Gen.', comingSoon: true },
    { label: 'OTHER', divider: true },
    { to: '/teacher/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/teacher/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/teacher/early-exit', icon: HiOutlineClock, label: 'Early Exit' },
    { to: '/teacher/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],

  student: [
    { to: '/student', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/student/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance' },
    { to: '/student/fees', icon: HiOutlineCurrencyDollar, label: 'Fees' },
    { to: '/student/fines', icon: HiOutlineExclamation, label: 'Fines' },
    { to: '/student/results', icon: HiOutlineChartBar, label: 'Results' },
    { label: 'LMS', divider: true },
    { to: '/student/assignments', icon: HiOutlineClipboardList, label: 'Assignments' },
    { to: '/student/quizzes', icon: HiOutlineDocumentDuplicate, label: 'Quizzes' },
    { to: '/student/timetable', icon: HiOutlineClock, label: 'Timetable' },
    { label: 'LEAVE', divider: true },
    { to: '/student/leave', icon: HiOutlineDocumentText, label: 'Leave Application' },
    { label: 'EVALUATION', divider: true },
    { to: '/student/evaluation', icon: HiOutlineStar, label: 'Teacher Evaluation' },
    { label: 'AI PREMIUM', divider: true },
    { to: '/student/ai/pdf-library', icon: HiOutlineBookOpen, label: 'Course Materials' },
    { to: '/student/ai/chat', icon: HiOutlineSparkles, label: 'Course Assistant' },
    { to: '/student/ai/notes', icon: HiOutlineDocumentText, label: 'Notes Generator', comingSoon: true },
    { label: 'OTHER', divider: true },
    { to: '/student/activity-log', icon: HiOutlineClock, label: 'Activity Log' },
    { to: '/student/trash', icon: HiOutlineTrash, label: 'Trash' },
    { to: '/student/early-exit', icon: HiOutlineClock, label: 'Early Exit' },
    { to: '/student/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],


  employee: [
    { to: '/employee', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { label: 'GATE SECURITY', divider: true },
    { to: '/employee/gate', icon: HiOutlineShieldCheck, label: 'Gate Scanner' },
    { to: '/employee/gate-logs', icon: HiOutlineClipboardCheck, label: 'Gate Logs' },
    { label: 'OTHER', divider: true },
    { to: '/employee/visitors', icon: HiOutlineShieldCheck, label: 'Visitors' },
    { to: '/employee/early-exit', icon: HiOutlineClock, label: 'Early Exit' },
    { to: '/employee/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
  ],
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const links = NAV[user?.role] || [];

  const handleLogout = () => { 
    logout(); 
    router.push('/login'); 
    if (onClose) onClose(); 
  };

  const roleMeta = {
    superAdmin: { label: 'SUPER ADMIN', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
    admin: { label: 'ADMIN', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400' },
    registrar: { label: 'REGISTRAR', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
    accountant: { label: 'ACCOUNTANT', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
    principal: { label: 'PRINCIPAL', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
    teacher: { label: 'TEACHER', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
    student: { label: 'STUDENT', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
    employee: { label: 'EMPLOYEE', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' },
  };
  const rm = roleMeta[user?.role] || { label: '?', color: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/50' };

  return (
    <aside className="flex flex-col h-full w-64 bg-white dark:bg-[#0d1117] border-r border-gray-200 dark:border-white/[0.06] transition-colors duration-200">
      {/* Logo + Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-white/[0.06]">
        {/* Logo mark */}
        <div className="w-8 h-8 shrink-0 relative">
          <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">Academix</p>
          <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${rm.color}`}>{rm.label} Panel</p>
        </div>
        <button onClick={onClose} className="ml-auto p-1 rounded-lg text-gray-500 dark:text-white/30 hover:text-gray-800 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition lg:hidden">
          <HiOutlineX size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {links.map((link, idx) => {
          if (link.divider) return (
            <div key={idx} className="pt-4 pb-1.5 px-2">
              <span className="text-[9px] font-bold tracking-[0.12em] text-gray-400 dark:text-white/20 uppercase">{link.label}</span>
            </div>
          );

          // Coming Soon — non-clickable item with badge
          if (link.comingSoon) {
            return (
              <div key={link.to}
                className={`flex items-center gap-2.5 rounded-lg cursor-not-allowed opacity-60
                  ${link.sub ? 'pl-7 pr-3 py-1.5' : 'px-3 py-2'}
                  text-gray-400 dark:text-white/25`}
              >
                <link.icon size={link.sub ? 14 : 17} className="text-gray-300 dark:text-white/20 shrink-0" />
                <span className={`${link.sub ? 'text-xs' : 'text-[13px]'} font-medium leading-none`}>{link.label}</span>
                <span className="ml-auto shrink-0 text-[8px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 uppercase whitespace-nowrap">
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
                `flex items-center gap-2.5 rounded-lg transition-all duration-150 group
                ${link.sub ? 'pl-7 pr-3 py-1.5' : 'px-3 py-2'}
                ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.04]'}`
              }
            >
              <link.icon size={link.sub ? 14 : 17} className={isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-white/30 group-hover:text-gray-600 dark:group-hover:text-white/60'} />
              <span className={`${link.sub ? 'text-xs' : 'text-[13px]'} font-medium leading-none`}>{link.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-gray-200 dark:border-white/[0.06]">
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-600 dark:text-white/40 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.08] transition-all text-[13px] font-medium">
          <HiOutlineLogout size={17} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
