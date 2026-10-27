'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from './Sidebar';
import {
  HiOutlineMenu, HiOutlineBell, HiOutlineSearch, HiOutlineLogout,
  HiOutlineCog, HiOutlineX, HiOutlineSpeakerphone,
  HiOutlineChevronRight, HiOutlineSun, HiOutlineMoon
} from 'react-icons/hi';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import SubscriptionExpiryBanner from '../common/SubscriptionExpiryBanner';

// --- Theme Context (light/dark) ---
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ui-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const setThemeClass = (theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
};

/* ── Helper: get page title (unchanged) ── */
const getPageTitle = (pathname) => {
  const map = {
    // Super Admin
    '/super-admin': 'Dashboard',
    '/super-admin/colleges': 'College Management',
    '/super-admin/subscription-requests': 'Subscription Requests',
    '/super-admin/analytics': 'Platform Analytics',
    '/super-admin/ai/chat': 'AI Reports',
    '/super-admin/settings': 'Profile & Settings',
    // Admin
    '/admin': 'Dashboard',
    '/admin/sessions': 'Academic Sessions',
    '/admin/classes': 'Classes & Sections',
    '/admin/subjects': 'Subjects',
    '/admin/students': 'Students',
    '/admin/applications': 'Admission Applications',
    '/admin/admission-seasons': 'Admission Seasons',
    '/admin/staff': 'Manage Accounts',
    '/admin/teachers': 'Teachers',
    '/admin/employees': 'Employees',
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
    '/admin/settings': 'Settings',
    '/admin/profile': 'My Profile',
    // Registrar
    '/registrar': 'Registrar Dashboard',
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
    // Accountant
    '/accountant': 'Accountant Dashboard',
    '/accountant/fees': 'Fee Collection',
    '/accountant/fees/defaulters': 'Fee Defaulters',
    '/accountant/announcements': 'Announcements',
    // Principal
    '/principal': 'Principal Dashboard',
    '/principal/students': 'Students Overview',
    '/principal/attendance': 'Attendance Overview',
    '/principal/results': 'Results Overview',
    '/principal/exams': 'Examinations',
    '/principal/fees': 'Fee Overview',
    '/principal/staff': 'Staff Overview',
    '/principal/announcements': 'Announcements',
    '/principal/early-exit': 'Early Exit Approvals',
    '/principal/gate-logs': 'Gate Logs',
    // Teacher
    '/teacher': 'Dashboard',
    '/teacher/students': 'Students',
    '/teacher/attendance': 'Attendance',
    '/teacher/results': 'Student Results',
    '/teacher/assignments': 'Assignments',
    '/teacher/quizzes': 'Quizzes',
    '/teacher/fines': 'Fine Student',
    '/teacher/my-qr': 'My QR Code',
    '/teacher/early-exit': 'Early Exit Request',
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
    '/student/my-qr': 'My QR Code',
    '/student/early-exit': 'Early Exit Request',
    // Employee
    '/employee': 'Dashboard',
    '/employee/visitors': 'Visitors',
    '/employee/gate': 'Gate Scanner',
    '/employee/gate-logs': 'Gate Logs',
    '/employee/early-exit': 'Early Exit',
    // AI (shared across roles)
    ...Object.fromEntries(
      ['admin', 'teacher', 'student', 'principal'].flatMap(role => [
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
  if (pathname.match(/\/super-admin\/colleges\/.+/)) return 'College Details';
  if (pathname.match(/\/(admin|registrar|principal)\/students\/.+/)) return 'Student Profile';
  if (pathname.match(/\/(admin|accountant)\/fees\/receipt\/.+/)) return 'Fee Receipt';
  if (pathname.startsWith('/admin/results/card/')) return 'Result Card';
  return map[pathname] || 'Collegeshub';
};

/* ── Build searchable nav items (unchanged) ── */
const buildSearchItems = (role) => {
  const map = {
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/applications', label: 'Admission Applications' },
      { to: '/admin/admission-seasons', label: 'Admission Seasons' },
      { to: '/admin/sessions', label: 'Academic Sessions' },
      { to: '/admin/classes', label: 'Classes & Sections' },
      { to: '/admin/subjects', label: 'Subjects' },
      { to: '/admin/students', label: 'Students' },
      { to: '/admin/staff', label: 'Manage Accounts' },
      { to: '/admin/teachers', label: 'Teachers' },
      { to: '/admin/employees', label: 'Employees' },
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
      { to: '/admin/reports', label: 'Report Center (PDF)' },
      { to: '/admin/assignments', label: 'Assignments' },
      { to: '/admin/quizzes', label: 'Quizzes' },
      { to: '/admin/announcements', label: 'Announcements' },
      { to: '/admin/approvals', label: 'Central Approvals' },
      { to: '/admin/leaves', label: 'Leave Applications' },
      { to: '/admin/visitors', label: 'Visitor Log' },
      { to: '/admin/id-cards', label: 'Member ID Cards & QR' },
      { to: '/admin/certificates', label: 'Certificates' },
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
    ],
    superAdmin: [
      { to: '/super-admin', label: 'Dashboard' },
      { to: '/super-admin/colleges', label: 'Colleges' },
      { to: '/super-admin/subscription-requests', label: 'Subscription Requests' },
    ],
    registrar: [
      { to: '/registrar', label: 'Dashboard' },
      { to: '/registrar/students', label: 'Students' },
      { to: '/registrar/sessions', label: 'Sessions' },
      { to: '/registrar/classes', label: 'Classes' },
      { to: '/registrar/subjects', label: 'Subjects' },
      { to: '/registrar/attendance', label: 'Attendance' },
      { to: '/registrar/announcements', label: 'Announcements' },
    ],
    accountant: [
      { to: '/accountant', label: 'Dashboard' },
      { to: '/accountant/fees', label: 'Fee Collection' },
      { to: '/accountant/fees/defaulters', label: 'Defaulters' },
    ],
    principal: [
      { to: '/principal', label: 'Dashboard' },
      { to: '/principal/students', label: 'Students' },
      { to: '/principal/attendance', label: 'Attendance' },
      { to: '/principal/results', label: 'Results' },
      { to: '/principal/exams', label: 'Exams' },
      { to: '/principal/fees', label: 'Fees' },
      { to: '/principal/staff', label: 'Staff' },
      { to: '/principal/ai/chat', label: 'AI Advisor' },
    ],
    employee: [
      { to: '/employee', label: 'Dashboard' },
      { to: '/employee/visitors', label: 'Visitors' },
    ],
  };
  return map[role] || [];
};

/* ── Spotlight Search Modal ── */
const SpotlightSearch = ({ open, onClose, role }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef(null);
  const items = buildSearchItems(role);

  const filtered = query.trim()
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (to) => { router.push(to); onClose(); };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center px-3 pt-[10vh] sm:pt-[15vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search pages"
    >
      <div className="fixed inset-0 bg-app/75 backdrop-blur-sm" />
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-slide-up"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <HiOutlineSearch size={18} className="shrink-0 text-fg-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, features..."
            aria-label="Search pages and features"
            className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-faint sm:text-sm"
          />
          <kbd className="hidden shrink-0 items-center rounded bg-card-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted sm:inline-flex">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-1 sm:max-h-72">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">No results found</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.to}
                onClick={() => handleSelect(item.to)}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-card-2 focus-visible:bg-card-2 focus-visible:outline-none"
              >
                <HiOutlineChevronRight size={12} className="shrink-0 text-fg-faint transition group-hover:text-accent" aria-hidden="true" />
                <span className="min-w-0 truncate text-sm text-fg-muted transition group-hover:text-fg">{item.label}</span>
                <span className="ml-auto hidden max-w-32 truncate font-mono text-[10px] text-fg-faint sm:inline">{item.to}</span>
              </button>
            ))
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2 text-[10px] text-fg-faint sm:flex">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
};

/* ── Notifications Dropdown ── */
const NotificationsDropdown = ({ open, onClose }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/announcements?limit=5&sort=-createdAt')
      .then(({ data }) => setAnnouncements(data.data?.slice(0, 5) || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={dropRef}
      className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-card shadow-2xl animate-slide-up"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <HiOutlineBell size={16} className="text-accent" aria-hidden="true" />
          <h4 className="text-xs font-bold text-fg">Notifications</h4>
        </div>
        <button
          onClick={onClose}
          aria-label="Close notifications"
          className="rounded-md p-1 text-fg-faint transition hover:bg-card-2 hover:text-fg"
        >
          <HiOutlineX size={16} />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center">
            <HiOutlineSpeakerphone size={24} className="mx-auto mb-2 text-fg-faint" aria-hidden="true" />
            <p className="text-xs text-fg-muted">No recent announcements</p>
          </div>
        ) : (
          announcements.map((a, i) => (
            <div key={a._id || i} className="border-b border-line px-4 py-3 transition last:border-b-0 hover:bg-card-2">
              <p className="truncate text-xs font-semibold text-fg">{a.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-fg-muted">
                {(a.message || a.content || '').replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').trim()}
              </p>
              <p className="mt-1 text-[10px] tabular-nums text-fg-faint">
                {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ── User Profile Dropdown ── */
const ProfileDropdown = ({ open, onClose, user }) => {
  const { logout } = useAuthStore();
  const router = useRouter();
  const dropRef = useRef(null);

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
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const handleLogout = () => {
    logout();
    router.push('/login');
    onClose();
  };

  const settingsPath = user?.role === 'superAdmin' ? null :
    ['admin', 'teacher'].includes(user?.role) ? `/${user.role}/settings` : null;

  if (!open) return null;

  return (
    <div
      ref={dropRef}
      className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-line bg-card shadow-2xl animate-slide-up"
    >
      <div className="border-b border-line px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line">
            {user?.avatar
              ? <img src={user.avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center bg-accent text-sm font-bold text-accent-fg">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            }
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg" title={user?.name}>{user?.name}</p>
            <p className="truncate text-[11px] text-fg-muted" title={user?.email}>{user?.email}</p>
          </div>
        </div>
        <span className="badge badge-primary mt-2 uppercase tracking-wider">{roleLabel}</span>
        {user?.college && (
          <p className="mt-1 truncate text-[11px] text-fg-faint" title={user.college.name}>{user.college.name}</p>
        )}
      </div>

      <div className="py-1">
        {settingsPath && (
          <button
            onClick={() => { router.push(settingsPath); onClose(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-fg-muted transition hover:bg-card-2 hover:text-fg"
          >
            <HiOutlineCog size={16} aria-hidden="true" /> Settings
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-fg-muted transition hover:bg-bad/10 hover:text-bad"
        >
          <HiOutlineLogout size={16} aria-hidden="true" /> Sign Out
        </button>
      </div>
    </div>
  );
};

/* ── Dashboard Layout with Theme Toggle ── */
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Theme state
  const [theme, setTheme] = useState(getInitialTheme);
  const { user } = useAuthStore();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  // Apply theme class to html element
  useEffect(() => {
    setThemeClass(theme);
    localStorage.setItem('ui-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => { setSidebarOpen(false); setNotifOpen(false); setProfileOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const pathSegment = pathname?.split('/')[1] || '';
  const roleFromPath = pathSegment === 'super-admin' ? 'superAdmin' : pathSegment;
  const activeRole = user?.role || roleFromPath || 'admin';

  const iconBtn =
    'flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted transition hover:bg-card-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

  return (
    <div data-role={activeRole} className="flex h-screen overflow-hidden bg-app transition-colors duration-200">
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar mobileOpen={false} onClose={() => { }} role={activeRole} />
      </div>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-app/75 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden animate-slide-right">
            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-2 border-b border-line bg-card/90 px-3 py-2 backdrop-blur-md transition-colors duration-200 sm:gap-3 sm:px-4 lg:px-6">
          {/* Mobile: hamburger + logo */}
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className={`${iconBtn} lg:hidden`}
          >
            <HiOutlineMenu size={20} />
          </button>
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <div className="relative h-6 w-6">
              <Image src="/logo.svg" alt="Collegeshub" fill className="object-contain" priority />
            </div>
            <span className="hidden text-sm font-extrabold tracking-tight text-fg min-[420px]:inline">Collegeshub</span>
          </div>

          {/* Desktop page title */}
          <div className="hidden min-w-0 flex-1 lg:block">
            <h2 className="truncate text-sm font-semibold text-fg">{pageTitle}</h2>
            {user?.college && <p className="truncate text-[11px] text-fg-muted">{user.college.name}</p>}
          </div>

          {/* Mobile page title */}
          <div className="min-w-0 flex-1 text-right lg:hidden">
            <h2 className="truncate text-xs font-semibold text-fg-muted">{pageTitle}</h2>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={iconBtn}
            >
              {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 text-xs text-fg-muted transition hover:bg-card-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:border-line"
            >
              <HiOutlineSearch size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden items-center rounded bg-card-2 px-1 py-0.5 font-mono text-[9px] text-fg-faint sm:inline-flex">Ctrl+K</kbd>
            </button>

            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className={`${iconBtn} relative`}
              >
                <HiOutlineBell size={18} />
                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              </button>
              <NotificationsDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                className="ml-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-accent/40 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {user?.avatar
                  ? <img src={user.avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center bg-accent text-sm font-bold text-accent-fg">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                }
              </button>
              <ProfileDropdown open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
            </div>
          </div>
        </header>

        <SubscriptionExpiryBanner />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full min-w-0 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
            {children}
          </div>
        </main>
      </div>

      <SpotlightSearch open={searchOpen} onClose={() => setSearchOpen(false)} role={user?.role} />
    </div>
  );
};

export default DashboardLayout;