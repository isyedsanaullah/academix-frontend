'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import MobileBottomBar, { isFullscreenStudentPlayer } from './MobileBottomBar';
import Icon from '../Icon';
import PlanBadge from '../common/PlanBadge';
import SubscriptionExpiryBanner from '../common/SubscriptionExpiryBanner';
import CollegesHubLoader from '../common/CollegesHubLoader';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../providers/ThemeProvider';
import { getAppPortalRoot } from '../../lib/portal';
import api from '../../lib/api';

/* ── Helper: get page title (unchanged route map) ── */
const getPageTitle = (pathname) => {
  const map = {
    // Super Admin
    '/super-admin': 'Platform Command Center',
    '/super-admin/colleges': 'College Management',
    '/super-admin/subscription-requests': 'Subscription Requests',
    '/super-admin/billing': 'Billing Queue',
    '/super-admin/analytics': 'Platform Analytics',
    '/super-admin/ai/chat': 'AI Reports',
    '/super-admin/activity-log': 'Activity Log',
    '/super-admin/trash': 'Trash',
    '/super-admin/settings': 'Profile & Settings',
    // Admin
    '/admin': 'Dashboard',
    '/admin/sessions': 'Academic Sessions',
    '/admin/classes': 'Classes & Sections',
    '/admin/subjects': 'Subjects',
    '/admin/academic': 'Academic Management',
    '/admin/students': 'Students',
    '/admin/applications': 'Admission Applications',
    '/admin/admission-seasons': 'Admission Seasons',
    '/admin/staff': 'Manage Accounts',
    '/admin/teachers': 'Teachers',
    '/admin/employees': 'Employees',
    '/admin/subscription': 'Subscription & Billing',
    '/admin/treasury': 'Treasury & Cashflow Ledger',
    '/admin/fees': 'Fee Management',
    '/admin/fees/defaulters': 'Fee Defaulters',
    '/admin/dues': 'Dues Report',
    '/admin/payroll': 'Staff Payroll',
    '/admin/fines': 'Student Fines',
    '/admin/attendance': 'Attendance',
    '/admin/gate': 'Gate Scanner',
    '/admin/gate-logs': 'Campus Gate Logs',
    '/admin/timetable': 'Timetable',
    '/admin/exams': 'Examinations',
    '/admin/exams/roll-slips': 'Roll Number Slips',
    '/admin/results': 'Results',
    '/admin/results/entry': 'Enter Results',
    '/admin/results/upload': 'Bulk Upload Marks',
    '/admin/evaluations': 'Teacher Evaluations',
    '/admin/eligibility': 'Send-Up & Eligibility',
    '/admin/exam-analytics': 'Weak Students & Analysis',
    '/admin/practicals': 'Practicals & Labs',
    '/admin/entry-test': 'Entry-Test & MDCAT',
    '/admin/board': 'Board Examination Portal',
    '/admin/reports': 'Report Center (PDF)',
    '/admin/assignments': 'Assignments',
    '/admin/quizzes': 'Quizzes',
    '/admin/announcements': 'Announcements',
    '/admin/approvals': 'Central Approvals',
    '/admin/early-exit': 'Early Exit Approvals',
    '/admin/leaves': 'Leave Applications',
    '/admin/visitors': 'Visitor Log',
    '/admin/id-cards': 'Member ID Cards',
    '/admin/certificates': 'Certificates',
    '/admin/templates': 'Document Templates',
    '/admin/guidance': 'Parents & Guidance',
    '/admin/activity-log': 'Activity Log',
    '/admin/trash': 'Trash',
    '/admin/settings': 'Settings',
    // Profile & Settings
    '/admin/profile': 'My Profile & Settings',
    '/teacher/settings': 'Profile & Settings',
    '/student/settings': 'Profile & Settings',
    '/principal/settings': 'Profile & Settings',
    '/registrar/settings': 'Profile & Settings',
    '/accountant/settings': 'Profile & Settings',
    '/employee/settings': 'Profile & Settings',
    // Registrar
    '/registrar': 'Registrar Dashboard',
    '/registrar/applications': 'Admission Applications',
    '/registrar/admission-seasons': 'Admission Seasons',
    '/registrar/students': 'Student Registration',
    '/registrar/sessions': 'Academic Sessions',
    '/registrar/classes': 'Classes & Sections',
    '/registrar/subjects': 'Subjects',
    '/registrar/attendance': 'Attendance',
    '/registrar/exams': 'Examinations',
    '/registrar/results': 'Results',
    '/registrar/timetable': 'Timetable',
    '/registrar/certificates': 'Certificates',
    '/registrar/announcements': 'Announcements',
    '/registrar/activity-log': 'Activity Log',
    '/registrar/trash': 'Trash',
    // Accountant
    '/accountant': 'Accountant Dashboard',
    '/accountant/treasury': 'Treasury & Cashflow',
    '/accountant/subscription': 'Subscription Billing',
    '/accountant/fees': 'Fee Collection',
    '/accountant/payment-proofs': 'Payment Proofs',
    '/accountant/fees/defaulters': 'Fee Defaulters',
    '/accountant/dues': 'Dues Report',
    '/accountant/payroll': 'Employee Payroll',
    '/accountant/announcements': 'Announcements',
    '/accountant/activity-log': 'Activity Log',
    '/accountant/trash': 'Trash',
    // Principal
    '/principal': 'Principal Dashboard',
    '/principal/approvals': 'Central Approvals',
    '/principal/evaluations': 'Teacher Evaluations',
    '/principal/students': 'Students Overview',
    '/principal/attendance': 'Attendance Overview',
    '/principal/results': 'Results Overview',
    '/principal/exams': 'Examinations',
    '/principal/fees': 'Fee Overview',
    '/principal/staff': 'Staff Overview',
    '/principal/announcements': 'Announcements',
    '/principal/early-exit': 'Early Exit Approvals',
    '/principal/gate-logs': 'Gate Logs',
    '/principal/activity-log': 'Activity Log',
    '/principal/trash': 'Trash',
    // Teacher
    '/teacher': 'Dashboard',
    '/teacher/students': 'Students',
    '/teacher/attendance': 'Attendance',
    '/teacher/results': 'Student Results',
    '/teacher/results/upload': 'Upload Results',
    '/teacher/assignments': 'Assignments',
    '/teacher/quizzes': 'Quizzes',
    '/teacher/timetable': 'My Timetable',
    '/teacher/fines': 'Fine Student',
    '/teacher/my-qr': 'My QR Code',
    '/teacher/early-exit': 'Early Exit Request',
    '/teacher/activity-log': 'Activity Log',
    '/teacher/trash': 'Trash',
    // Student
    '/student': 'Dashboard',
    '/student/attendance': 'My Attendance',
    '/student/fees': 'My Fees',
    '/student/fines': 'My Fines',
    '/student/results': 'My Results',
    '/student/assignments': 'Assignments',
    '/student/quizzes': 'Quizzes',
    '/student/timetable': 'Timetable',
    '/student/leave': 'Leave Application',
    '/student/evaluation': 'Teacher Evaluation',
    '/student/my-qr': 'My QR Code',
    '/student/early-exit': 'Early Exit Request',
    '/student/activity-log': 'Activity Log',
    '/student/trash': 'Trash',
    // Employee
    '/employee': 'Dashboard',
    '/employee/visitors': 'Visitors',
    '/employee/gate': 'Gate Scanner',
    '/employee/gate-logs': 'Gate Logs',
    '/employee/early-exit': 'Early Exit',
    // AI (shared across roles)
    ...Object.fromEntries(
      ['admin', 'teacher', 'student', 'principal', 'registrar', 'accountant'].flatMap((role) => [
        [`/${role}/ai/chat`, 'AI Chat'],
        [`/${role}/ai/pdf-library`, 'PDF Knowledge Library'],
        [`/${role}/ai/quiz`, 'AI Quiz Generator'],
        [`/${role}/ai/paper`, 'AI Paper Generator'],
        [`/${role}/ai/mcq`, 'AI MCQ Generator'],
        [`/${role}/ai/notes`, 'AI Notes Generator'],
        [`/${role}/ai/assignment`, 'AI Assignment Generator'],
        [`/${role}/ai/syllabus`, 'AI Syllabus Generator'],
      ])
    ),
  };
  if (!pathname) return 'CollegesHub';
  if (pathname.match(/\/super-admin\/colleges\/.+/)) return 'College Details';
  if (pathname.match(/\/(admin|registrar|principal)\/students\/.+/)) return 'Student Profile';
  if (pathname.match(/\/(admin|accountant)\/fees\/receipt\/.+/)) return 'Fee Receipt';
  if (pathname.startsWith('/admin/results/card/')) return 'Result Card';
  return map[pathname] || 'CollegesHub';
};

/* ── Build searchable nav items (unchanged business data) ── */
const buildSearchItems = (role) => {
  const map = {
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/applications', label: 'Admission Applications' },
      { to: '/admin/admission-seasons', label: 'Admission Seasons' },
      { to: '/admin/academic', label: 'Academic Management' },
      { to: '/admin/sessions', label: 'Academic Sessions' },
      { to: '/admin/classes', label: 'Classes & Sections' },
      { to: '/admin/subjects', label: 'Subjects' },
      { to: '/admin/students', label: 'Students' },
      { to: '/admin/staff', label: 'Manage Accounts' },
      { to: '/admin/teachers', label: 'Teachers' },
      { to: '/admin/employees', label: 'Employees' },
      { to: '/admin/subscription', label: 'Subscription & Billing' },
      { to: '/admin/treasury', label: 'Treasury & Cashflow Ledger' },
      { to: '/admin/fees', label: 'Fee Management' },
      { to: '/admin/fees/defaulters', label: 'Fee Defaulters' },
      { to: '/admin/dues', label: 'Dues Report' },
      { to: '/admin/payroll', label: 'Employee Payroll' },
      { to: '/admin/fines', label: 'Student Fines' },
      { to: '/admin/attendance', label: 'Attendance Reports' },
      { to: '/admin/gate', label: 'Gate Scanner' },
      { to: '/admin/gate-logs', label: 'Campus Gate Logs' },
      { to: '/admin/early-exit', label: 'Early Exit Approvals' },
      { to: '/admin/timetable', label: 'Universal Timetable' },
      { to: '/admin/exams', label: 'Examinations' },
      { to: '/admin/exams/roll-slips', label: 'Roll Number Slips' },
      { to: '/admin/results', label: 'Results' },
      { to: '/admin/results/entry', label: 'Enter Results' },
      { to: '/admin/results/upload', label: 'Bulk Upload Marks' },
      { to: '/admin/evaluations', label: 'Teacher Evaluations' },
      { to: '/admin/eligibility', label: 'Send-Up & Eligibility' },
      { to: '/admin/exam-analytics', label: 'Weak Students & Analysis' },
      { to: '/admin/practicals', label: 'Practicals & Labs' },
      { to: '/admin/entry-test', label: 'Entry-Test & MDCAT' },
      { to: '/admin/board', label: 'Board Examination Portal' },
      { to: '/admin/reports', label: 'Report Center (PDF)' },
      { to: '/admin/assignments', label: 'Assignments' },
      { to: '/admin/quizzes', label: 'Quizzes' },
      { to: '/admin/announcements', label: 'Announcements' },
      { to: '/admin/approvals', label: 'Central Approvals' },
      { to: '/admin/leaves', label: 'Leave Applications' },
      { to: '/admin/visitors', label: 'Visitor Log' },
      { to: '/admin/id-cards', label: 'Member ID Cards & QR' },
      { to: '/admin/certificates', label: 'Certificates' },
      { to: '/admin/templates', label: 'Document Templates' },
      { to: '/admin/guidance', label: 'Parents & Guidance' },
      { to: '/admin/settings', label: 'Settings' },
      { to: '/admin/profile', label: 'My Profile' },
      { to: '/admin/ai/chat', label: 'AI Chat' },
      { to: '/admin/ai/pdf-library', label: 'PDF Library' },
      { to: '/admin/ai/quiz', label: 'AI Quiz Generator' },
      { to: '/admin/ai/paper', label: 'AI Paper Generator' },
      { to: '/admin/ai/mcq', label: 'AI MCQ Generator' },
      { to: '/admin/ai/notes', label: 'AI Notes Generator' },
      { to: '/admin/ai/assignment', label: 'AI Assignment Generator' },
      { to: '/admin/ai/syllabus', label: 'AI Syllabus Generator' },
      { to: '/admin/activity-log', label: 'Activity Log' },
      { to: '/admin/trash', label: 'Trash' },
    ],
    teacher: [
      { to: '/teacher', label: 'Dashboard' },
      { to: '/teacher/students', label: 'Students' },
      { to: '/teacher/attendance', label: 'Attendance' },
      { to: '/teacher/results', label: 'Results' },
      { to: '/teacher/assignments', label: 'Assignments' },
      { to: '/teacher/quizzes', label: 'Quizzes' },
      { to: '/teacher/timetable', label: 'My Timetable' },
      { to: '/teacher/fines', label: 'Fine Student' },
      { to: '/teacher/ai/chat', label: 'AI Chat' },
      { to: '/teacher/ai/quiz', label: 'AI Quiz Generator' },
      { to: '/teacher/ai/paper', label: 'AI Paper Generator' },
      { to: '/teacher/ai/notes', label: 'AI Notes Generator' },
      { to: '/teacher/settings', label: 'Settings' },
    ],
    student: [
      { to: '/student', label: 'Dashboard' },
      { to: '/student/attendance', label: 'My Attendance' },
      { to: '/student/fees', label: 'My Fees' },
      { to: '/student/fines', label: 'My Fines' },
      { to: '/student/results', label: 'My Results' },
      { to: '/student/assignments', label: 'Assignments' },
      { to: '/student/quizzes', label: 'Quizzes' },
      { to: '/student/timetable', label: 'Timetable' },
      { to: '/student/leave', label: 'Leave Application' },
      { to: '/student/ai/chat', label: 'Study Assistant' },
      { to: '/student/ai/notes', label: 'AI Notes Generator' },
      { to: '/student/settings', label: 'Profile & Settings' },
    ],
    superAdmin: [
      { to: '/super-admin', label: 'Dashboard' },
      { to: '/super-admin/colleges', label: 'Colleges' },
      { to: '/super-admin/subscription-requests', label: 'Subscription Requests' },
      { to: '/super-admin/billing', label: 'Billing Queue' },
      { to: '/super-admin/analytics', label: 'Analytics' },
      { to: '/super-admin/ai/chat', label: 'AI Reports' },
      { to: '/super-admin/activity-log', label: 'Activity Log' },
      { to: '/super-admin/trash', label: 'Trash' },
      { to: '/super-admin/settings', label: 'Profile & Settings' },
    ],
    registrar: [
      { to: '/registrar', label: 'Dashboard' },
      { to: '/registrar/applications', label: 'Applications' },
      { to: '/registrar/admission-seasons', label: 'Admission Seasons' },
      { to: '/registrar/students', label: 'Students' },
      { to: '/registrar/certificates', label: 'Certificates' },
      { to: '/registrar/timetable', label: 'Timetable' },
      { to: '/registrar/announcements', label: 'Announcements' },
      { to: '/registrar/settings', label: 'Profile & Settings' },
    ],
    accountant: [
      { to: '/accountant', label: 'Dashboard' },
      { to: '/accountant/treasury', label: 'Treasury' },
      { to: '/accountant/subscription', label: 'Subscription Billing' },
      { to: '/accountant/fees', label: 'Fee Collection' },
      { to: '/accountant/payment-proofs', label: 'Payment Proofs' },
      { to: '/accountant/fees/defaulters', label: 'Defaulters' },
      { to: '/accountant/dues', label: 'Dues Report' },
      { to: '/accountant/payroll', label: 'Employee Payroll' },
      { to: '/accountant/settings', label: 'Profile & Settings' },
    ],
    principal: [
      { to: '/principal', label: 'Dashboard' },
      { to: '/principal/approvals', label: 'Approvals' },
      { to: '/principal/evaluations', label: 'Teacher Evaluations' },
      { to: '/principal/students', label: 'Students' },
      { to: '/principal/attendance', label: 'Attendance' },
      { to: '/principal/results', label: 'Results' },
      { to: '/principal/exams', label: 'Exams' },
      { to: '/principal/fees', label: 'Fees' },
      { to: '/principal/staff', label: 'Staff' },
      { to: '/principal/settings', label: 'Profile & Settings' },
    ],
    employee: [
      { to: '/employee', label: 'Dashboard' },
      { to: '/employee/gate', label: 'Gate Scanner' },
      { to: '/employee/gate-logs', label: 'Gate Logs' },
      { to: '/employee/visitors', label: 'Visitors' },
      { to: '/employee/settings', label: 'Profile & Settings' },
    ],
  };
  return map[role] || [];
};

/* ── Core 2.0 Spotlight Search Modal (Portaled inside #app-portal-root) ── */
const SpotlightSearch = ({ open, onClose, role }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef(null);
  const items = buildSearchItems(role);

  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (to) => {
    router.push(to);
    onClose();
  };

  const portalRoot = getAppPortalRoot();
  const content = (
    <div
      className="fixed inset-0 z-[105] flex items-start justify-center px-3 pt-[10vh] sm:pt-[14vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search pages"
    >
      <div className="fixed inset-0 bg-b-surface1/75 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-4xl border border-s-subtle bg-b-surface2 p-3 shadow-dropdown animate-slide-up"
      >
        <div className="relative flex items-center gap-3 rounded-3xl bg-b-surface1 px-4 h-12 border border-s-subtle focus-within:border-s-focus focus-within:bg-b-surface2 transition-all">
          <Icon name="search" className="!size-5 shrink-0 fill-t-secondary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, modules, or tools..."
            aria-label="Search pages and features"
            className="min-w-0 flex-1 bg-transparent text-body-2 text-t-primary outline-none placeholder:text-t-tertiary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="p-1 rounded-full text-t-tertiary hover:text-t-primary"
            >
              <Icon name="close" className="!size-4 fill-current" />
            </button>
          )}
          <kbd className="hidden shrink-0 items-center rounded-lg bg-b-surface2 px-2 py-1 font-mono text-[10px] font-semibold text-t-secondary border border-s-subtle sm:inline-flex">
            ESC
          </kbd>
        </div>

        <div className="mt-2 max-h-[55vh] overflow-y-auto px-1 py-1 sm:max-h-80">
          <div className="px-3 py-2 text-caption font-semibold text-t-tertiary uppercase tracking-wider">
            {query.trim() ? 'Matching Pages' : 'Quick Navigation'}
          </div>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-body-2 text-t-tertiary">
              No matching pages found
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => handleSelect(item.to)}
                className="group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-b-highlight focus-visible:bg-b-highlight focus-visible:outline-none cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-b-surface1 border border-s-subtle group-hover:border-s-highlight transition-colors">
                  <Icon
                    name="arrow"
                    className="!size-4 fill-t-secondary transition group-hover:fill-[var(--accent,var(--primary-01))]"
                  />
                </div>
                <span className="min-w-0 truncate text-sub-title-2 text-t-secondary transition group-hover:text-t-primary">
                  {item.label}
                </span>
                <span className="ml-auto hidden max-w-40 truncate font-mono text-caption text-t-tertiary sm:inline">
                  {item.to}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
};

/* ── Core 2.0 Notifications Slide-Over / Popover (Portaled inside #app-portal-root) ── */
const NotificationsDrawer = ({ open, onClose, role }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || role === 'superAdmin') return;
    setLoading(true);
    api
      .get('/announcements?limit=5&sort=-createdAt')
      .then(({ data }) => setAnnouncements(data.data?.slice(0, 5) || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [open, role]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const announcementsHref =
    role && ['admin', 'registrar', 'accountant', 'principal'].includes(role)
      ? `/${role}/announcements`
      : null;

  const portalRoot = getAppPortalRoot();
  const content = (
    <div
      className="fixed inset-0 z-[105] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications panel"
    >
      <div
        className="fixed inset-0 bg-b-surface1/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 flex flex-col w-108 max-md:w-[calc(100vw-1.5rem)] m-3 rounded-4xl bg-b-surface2 border border-s-subtle shadow-dropdown overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between h-20 px-7 border-b border-s-subtle">
          <div className="flex items-center gap-2.5">
            <Icon name="bell" className="!size-5 fill-[var(--accent,var(--primary-01))]" />
            <h3 className="text-h5 text-t-primary">Notifications</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-b-surface1 text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
          >
            <Icon name="close" className="!size-5 fill-current" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12">
              <CollegesHubLoader
                size="xs"
                text="Loading notifications…"
                minHeight="min-h-[120px]"
              />
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="mx-auto mb-3 flex items-center justify-center w-12 h-12 rounded-2xl bg-b-surface1 text-t-tertiary">
                <Icon name="megaphone" className="!size-6 fill-t-tertiary" />
              </div>
              <p className="text-sub-title-1 text-t-primary">All caught up</p>
              <p className="mt-1 text-body-2 text-t-secondary">
                No recent institutional announcements right now.
              </p>
            </div>
          ) : (
            announcements.map((a, i) => (
              <div
                key={a._id || i}
                className="group relative flex items-start gap-3.5 p-4 rounded-3xl hover:bg-b-highlight border border-transparent hover:border-s-subtle transition-all"
              >
                <div className="flex shrink-0 items-center justify-center w-11 h-11 rounded-full bg-b-surface1 text-primary-01 border border-s-subtle">
                  <Icon name="megaphone" className="!size-5 fill-primary-01" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sub-title-2 text-t-primary">
                    {a.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-body-2 text-t-secondary">
                    {(a.message || a.content || '')
                      .replace(/<p[^>]*>/gi, '')
                      .replace(/<\/p>/gi, ' ')
                      .replace(/<br\s*\/?>/gi, ' ')
                      .replace(/<[^>]*>/g, '')
                      .trim()}
                  </p>
                  <p className="mt-1.5 text-caption text-t-tertiary tabular-nums">
                    {a.createdAt
                      ? new Date(a.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {announcementsHref && (
          <div className="p-4 border-t border-s-subtle bg-b-surface2">
            <Link
              href={announcementsHref}
              onClick={onClose}
              className="btn-primary w-full flex items-center justify-center"
            >
              All announcements
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
};

/* ── Core 2.0 User Profile Dropdown (Portaled or Anchored inside [data-app]) ── */
const ProfileDropdown = ({ open, onClose, user, plan, subStatus }) => {
  const { logout } = useAuthStore();
  const router = useRouter();

  const roleLabels = {
    superAdmin: 'Super Admin',
    admin: 'Admin',
    registrar: 'Registrar',
    accountant: 'Accountant',
    principal: 'Principal',
    teacher: 'Teacher',
    student: 'Student',
    employee: 'Employee',
  };
  const roleLabel = roleLabels[user?.role] || 'User';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
    onClose();
  };

  const profilePath =
    user?.role === 'superAdmin'
      ? '/super-admin/settings'
      : user?.role === 'admin'
        ? '/admin/profile'
        : user?.role
          ? `/${user.role}/settings`
          : null;

  const collegeSettingsPath = user?.role === 'admin' ? '/admin/settings' : null;
  const subscriptionPath =
    user?.role === 'admin'
      ? '/admin/subscription'
      : user?.role === 'accountant'
        ? '/accountant/subscription'
        : null;

  const portalRoot = getAppPortalRoot();
  const content = (
    <div className="fixed inset-0 z-[105]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="menu"
        aria-label="User profile menu"
        className="fixed top-20 right-6 max-md:right-3 z-[106] w-72 max-w-[calc(100vw-1.5rem)] p-3 rounded-4xl bg-b-surface2 border border-s-subtle shadow-dropdown animate-slide-up"
      >
        <div className="p-3 mb-2 rounded-3xl bg-b-surface1 border border-s-subtle">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
              style={{ borderColor: 'var(--accent, var(--primary-01))' }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-sm font-bold"
                  style={{
                    background: 'var(--accent, var(--primary-01))',
                    color: 'var(--accent-fg, #FFFFFF)',
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sub-title-1 text-t-primary"
                title={user?.name}
              >
                {user?.name || 'Account'}
              </p>
              <p
                className="truncate text-caption text-t-secondary"
                title={user?.email}
              >
                {user?.email}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="label label-blue !h-6 !px-2.5 !text-[11px] uppercase tracking-wider">
              {roleLabel}
            </span>
            {user?.role !== 'superAdmin' && (
              <PlanBadge
                plan={plan || user?.college?.planId || 'starter'}
                status={
                  subStatus === 'suspended' || subStatus === 'expired'
                    ? subStatus
                    : undefined
                }
              />
            )}
          </div>
          {user?.college && (
            <p
              className="mt-2 truncate text-caption text-t-tertiary"
              title={user.college.name}
            >
              {user.college.name}
            </p>
          )}
        </div>

        <div className="space-y-1">
          {profilePath && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                router.push(profilePath);
                onClose();
              }}
              className="group flex w-full items-center gap-3 h-11 px-3.5 rounded-2xl text-button text-t-secondary hover:bg-b-highlight hover:text-t-primary transition-colors cursor-pointer"
            >
              <Icon
                name="profile"
                className="!size-5 fill-t-secondary group-hover:fill-t-primary"
              />
              <span>My Profile & Settings</span>
            </button>
          )}
          {collegeSettingsPath && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                router.push(collegeSettingsPath);
                onClose();
              }}
              className="group flex w-full items-center gap-3 h-11 px-3.5 rounded-2xl text-button text-t-secondary hover:bg-b-highlight hover:text-t-primary transition-colors cursor-pointer"
            >
              <Icon
                name="gear"
                className="!size-5 fill-t-secondary group-hover:fill-t-primary"
              />
              <span>College Settings</span>
            </button>
          )}
          {subscriptionPath && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                router.push(subscriptionPath);
                onClose();
              }}
              className="group flex w-full items-center gap-3 h-11 px-3.5 rounded-2xl text-button text-t-secondary hover:bg-b-highlight hover:text-t-primary transition-colors cursor-pointer"
            >
              <Icon
                name="wallet"
                className="!size-5 fill-t-secondary group-hover:fill-t-primary"
              />
              <span>Subscription & Billing</span>
            </button>
          )}
        </div>

        <div className="my-2 h-px bg-s-subtle" />

        <button
          type="button"
          role="menuitem"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 h-11 px-3.5 rounded-2xl text-button text-t-secondary hover:bg-primary-03/10 hover:text-primary-03 transition-colors cursor-pointer"
        >
          <Icon
            name="logout"
            className="!size-5 fill-t-secondary group-hover:fill-primary-03"
          />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
};

/* ── Core 2.0 DashboardLayout Shell ── */
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user } = useAuthStore();
  const { theme, toggleTheme, plan, subStatus } = useTheme();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const pathSegment = pathname?.split('/')[1] || '';
  const roleFromPath = pathSegment === 'super-admin' ? 'superAdmin' : pathSegment;
  const activeRole = user?.role || roleFromPath || 'admin';
  const isSuperAdmin = activeRole === 'superAdmin';
  const appType = isSuperAdmin ? 'platform' : 'college';

  // Determine whether notifications endpoint is supported for current role
  const effectiveFeatures =
    user?.college?.effectiveFeatures || user?.college?.subscription?.features || null;
  const showNotifications =
    !isSuperAdmin &&
    (!effectiveFeatures || effectiveFeatures.includes('announcements'));

  // Determine whether student MobileBottomBar is visible (for content bottom padding)
  const hasMobileBottomBar =
    activeRole === 'student' && !isFullscreenStudentPlayer(pathname);

  return (
    <div
      data-app={appType}
      data-theme={theme}
      data-plan={!isSuperAdmin ? plan || 'starter' : undefined}
      data-sub-status={subStatus}
      data-role={activeRole}
      className="min-h-screen bg-b-surface1 text-t-primary font-inter transition-colors duration-200 xl:pl-85 max-4xl:xl:pl-70 max-3xl:xl:pl-60"
    >
      {/* Fixed Core 2.0 Sidebar */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={activeRole}
      />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="no-print fixed inset-0 z-30 bg-b-surface1/75 backdrop-blur-xs xl:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed Core 2.0 Header (h-22 desktop / h-18 mobile) */}
      <header className="no-print fixed top-0 right-0 left-0 xl:left-85 max-4xl:xl:left-70 max-3xl:xl:left-60 z-20 bg-b-surface1/95 backdrop-blur-md border-b border-s-subtle transition-colors duration-200">
        {/* Top Plan Accent / Superadmin Command Center Gradient Hairline */}
        <div
          className="h-[3px] w-full"
          style={{
            background: isSuperAdmin
              ? 'linear-gradient(90deg, #0B4D94 0%, #4C94E8 50%, #3DBE63 100%)'
              : 'var(--header-strip)',
          }}
          aria-hidden="true"
        />

        <div className="center-with-sidebar flex items-center justify-between h-22 max-md:h-18 gap-3">
          {/* Left: Mobile Logo + Sidebar Toggle + Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex xl:hidden items-center gap-2.5 shrink-0">
              <Link
                href={isSuperAdmin ? '/super-admin' : `/${activeRole}`}
                className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-b-surface2 border border-s-subtle shadow-widget"
                aria-label="CollegesHub Home"
              >
                <img
                  src="/logo-mark.svg"
                  alt="CollegesHub"
                  className="w-6 h-6 object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
                className="flex items-center justify-center w-11 h-11 rounded-full bg-b-surface2 border border-s-subtle text-t-secondary hover:text-t-primary shadow-widget transition-colors cursor-pointer"
              >
                <Icon name="menu" className="!size-5 fill-current" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-h4 max-lg:text-h5 max-md:text-h6 text-t-primary">
                  {pageTitle}
                </h1>
                {!isSuperAdmin && (
                  <div className="hidden sm:inline-flex">
                    <PlanBadge
                      plan={plan || user?.college?.planId || 'starter'}
                      status={
                        subStatus === 'suspended' || subStatus === 'expired'
                          ? subStatus
                          : undefined
                      }
                    />
                  </div>
                )}
                {isSuperAdmin && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-01/12 text-t-blue border border-primary-01/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-02" />
                    Platform HQ
                  </span>
                )}
              </div>
              {user?.college && !isSuperAdmin && (
                <p className="truncate text-caption text-t-secondary hidden sm:block">
                  {user.college.name}
                </p>
              )}
            </div>
          </div>

          {/* Right: Core 2.0 Global Search Pill + Theme Toggle + Notifications + Avatar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Desktop Search Trigger Pill (Core 2.0 w-79 h-12 rounded-3xl) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search pages and features (Ctrl+K)"
              className="hidden md:flex items-center gap-3 w-72 lg:w-79 h-12 px-4.5 rounded-3xl bg-b-surface2 border border-s-subtle text-body-2 text-t-secondary hover:border-s-highlight hover:text-t-primary shadow-widget transition-all cursor-pointer"
            >
              <Icon name="search" className="!size-5 fill-t-secondary shrink-0" />
              <span className="truncate">Search anything...</span>
              <kbd className="ml-auto inline-flex items-center rounded-lg bg-b-surface1 px-2 py-0.5 font-mono text-[11px] font-medium text-t-tertiary border border-s-subtle">
                Ctrl K
              </kbd>
            </button>

            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search pages and features"
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-b-surface2 border border-s-subtle text-t-secondary hover:text-t-primary shadow-widget transition-colors cursor-pointer"
            >
              <Icon name="search" className="!size-5 fill-current" />
            </button>

            {/* Header Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
              className="flex items-center justify-center w-12 h-12 max-md:w-11 max-md:h-11 rounded-full bg-b-surface2 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight shadow-widget transition-all cursor-pointer"
            >
              <Icon
                name={theme === 'dark' ? 'sun' : 'moon'}
                className="!size-5 fill-current"
              />
            </button>

            {/* Notifications Button (College panels only — hidden on Superadmin per backend support rule) */}
            {showNotifications && (
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                aria-label="Open notifications"
                aria-expanded={notifOpen}
                className="relative flex items-center justify-center w-12 h-12 max-md:w-11 max-md:h-11 rounded-full bg-b-surface2 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight shadow-widget transition-all cursor-pointer"
              >
                <Icon name="bell" className="!size-5 fill-current" />
                <span
                  className="absolute right-3 top-3 w-2 h-2 rounded-full"
                  style={{ background: 'var(--accent, var(--primary-01))' }}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* User Profile Avatar Button with Plan Accent Ring */}
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              aria-label="Open user profile menu"
              aria-expanded={profileOpen}
              className="relative flex items-center justify-center w-12 h-12 max-md:w-11 max-md:h-11 rounded-full p-0.5 transition-transform active:scale-95 cursor-pointer"
              style={{
                background: isSuperAdmin
                  ? 'linear-gradient(135deg, #4C94E8, #3DBE63)'
                  : 'var(--accent, var(--primary-01))',
              }}
            >
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-b-surface2 border-2 border-b-surface2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-sub-title-1 font-bold"
                    style={{
                      background: 'var(--accent-soft, rgba(11,77,148,0.12))',
                      color: 'var(--accent-text, var(--primary-01))',
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (pt-22 desktop / pt-18 mobile + pb-24 on student mobile) */}
      <div
        className={`pt-22 max-md:pt-18 ${
          hasMobileBottomBar ? 'max-lg:pb-24 pb-8' : 'pb-8'
        }`}
      >
        <SubscriptionExpiryBanner />

        <main className="center-with-sidebar pt-5 max-md:pt-3">
          {children}
        </main>
      </div>

      {/* Student Mobile Bottom Tab Bar (< 1024px) */}
      <MobileBottomBar
        role={activeRole}
        onOpenMore={() => setSidebarOpen(true)}
      />

      {/* Portal Root INSIDE [data-app] so all Modals, Slide-Overs, Dropdowns, Select Popovers, and Tooltips inherit theme, plan, and CSS variables */}
      <div id="app-portal-root" className="relative z-[100]" />

      {/* Portaled Overlays */}
      <SpotlightSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        role={activeRole}
      />
      {showNotifications && (
        <NotificationsDrawer
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          role={activeRole}
        />
      )}
      <ProfileDropdown
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        plan={plan}
        subStatus={subStatus}
      />
    </div>
  );
};

export default DashboardLayout;
