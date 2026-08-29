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
    '/admin/staff': 'Manage Accounts',
    '/admin/teachers': 'Teachers',
    '/admin/employees': 'Employees',
    '/admin/fees': 'Fee Management',
    '/admin/fees/defaulters': 'Fee Defaulters',
    '/admin/attendance': 'Attendance',
    '/admin/timetable': 'Timetable',
    '/admin/exams': 'Examinations',
    '/admin/exams/roll-slips': 'Roll Number Slips',
    '/admin/results': 'Results',
    '/admin/results/entry': 'Enter Results',
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
  return map[pathname] || 'Academix';
};

/* ── Build searchable nav items (unchanged) ── */
const buildSearchItems = (role) => {
  const items = [];
  const map = {
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/sessions', label: 'Academic Sessions' },
      { to: '/admin/classes', label: 'Classes & Sections' },
      { to: '/admin/subjects', label: 'Subjects' },
      { to: '/admin/students', label: 'Students' },
      { to: '/admin/staff', label: 'Manage Accounts' },
      { to: '/admin/teachers', label: 'Teachers' },
      { to: '/admin/employees', label: 'Employees' },
      { to: '/admin/fees', label: 'Fee Management' },
      { to: '/admin/attendance', label: 'Attendance' },
      { to: '/admin/timetable', label: 'Timetable' },
      { to: '/admin/exams', label: 'Examinations' },
      { to: '/admin/results', label: 'Results' },
      { to: '/admin/assignments', label: 'Assignments' },
      { to: '/admin/quizzes', label: 'Quizzes' },
      { to: '/admin/announcements', label: 'Announcements' },
      { to: '/admin/leaves', label: 'Leave Applications' },
      { to: '/admin/visitors', label: 'Visitor Log' },
      { to: '/admin/certificates', label: 'Certificates' },
      { to: '/admin/settings', label: 'Settings' },
      { to: '/admin/ai/chat', label: 'AI Chat' },
      { to: '/admin/ai/pdf-library', label: 'PDF Library' },
      { to: '/admin/ai/quiz', label: 'AI Quiz Generator' },
      { to: '/admin/ai/paper', label: 'AI Paper Generator' },
      { to: '/admin/ai/notes', label: 'AI Notes Generator' },
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

/* ── Spotlight Search Modal (theme-aware) ── */
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
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-[#0f1721] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl transition-colors duration-200 overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.06]">
          <HiOutlineSearch size={18} className="text-gray-400 dark:text-white/30 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, features..."
            className="flex-1 bg-transparent text-gray-800 dark:text-white/85 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-white/25" />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-[10px] text-gray-500 dark:text-white/20 font-mono">ESC</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-white/20 text-sm py-6">No results found</p>
          ) : (
            filtered.map((item) => (
              <button key={item.to} onClick={() => handleSelect(item.to)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition group">
                <HiOutlineChevronRight size={12} className="text-gray-400 dark:text-white/15 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition" />
                <span className="text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white/90 transition">{item.label}</span>
                <span className="ml-auto text-[10px] text-gray-400 dark:text-white/15 font-mono truncate max-w-32">{item.to}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 dark:border-white/[0.06] text-[10px] text-gray-400 dark:text-white/15">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
};

/* ── Notifications Dropdown (theme-aware) ── */
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
    <div ref={dropRef} className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#0f1721] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl transition-colors duration-200 overflow-hidden z-50 animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <HiOutlineBell size={15} className="text-indigo-500 dark:text-indigo-400" />
          <h4 className="text-xs font-bold text-gray-800 dark:text-white/80">Notifications</h4>
        </div>
        <button onClick={onClose} className="text-gray-400 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/50 transition">
          <HiOutlineX size={14} />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <HiOutlineSpeakerphone size={24} className="mx-auto text-gray-300 dark:text-white/10 mb-2" />
            <p className="text-xs text-gray-400 dark:text-white/25">No recent announcements</p>
          </div>
        ) : (
          announcements.map((a, i) => (
            <div key={a._id || i} className="px-4 py-3 border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
              <p className="text-xs font-semibold text-gray-800 dark:text-white/70 truncate">{a.title}</p>
              <p className="text-[11px] text-gray-500 dark:text-white/30 mt-0.5 line-clamp-2">
                {(a.message || a.content || '').replace(/<p[^>]*>/gi,'').replace(/<\/p>/gi,' ').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,'').trim()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-white/15 mt-1">
                {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ── User Profile Dropdown (theme-aware) ── */
const ProfileDropdown = ({ open, onClose, user }) => {
  const { logout } = useAuthStore();
  const router = useRouter();
  const dropRef = useRef(null);

  const roleMeta = {
    superAdmin: { label: 'Super Admin', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
    admin: { label: 'Admin', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400' },
    registrar: { label: 'Registrar', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
    accountant: { label: 'Accountant', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
    principal: { label: 'Principal', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
    teacher: { label: 'Teacher', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
    student: { label: 'Student', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
    employee: { label: 'Employee', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' },
  };
  const rm = roleMeta[user?.role] || { label: 'User', color: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/50' };

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
    <div ref={dropRef} className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#0f1721] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl transition-colors duration-200 overflow-hidden z-50 animate-slide-up">
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-white/30 truncate">{user?.email}</p>
          </div>
        </div>
        <span className={`inline-flex items-center mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${rm.color}`}>
          {rm.label}
        </span>
        {user?.college && (
          <p className="text-[11px] text-gray-400 dark:text-white/20 mt-1 truncate">{user.college.name}</p>
        )}
      </div>

      <div className="py-1">
        {settingsPath && (
          <button onClick={() => { router.push(settingsPath); onClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition text-sm">
            <HiOutlineCog size={16} /> Settings
          </button>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-500 dark:text-white/40 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.06] transition text-sm">
          <HiOutlineLogout size={16} /> Sign Out
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#080c12] transition-colors duration-200 overflow-hidden">
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar mobileOpen={false} onClose={() => { }} />
      </div>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden animate-slide-right">
            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-md shrink-0 transition-colors duration-200">
          {/* Mobile: logo + hamburger; Desktop: page title */}
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition lg:hidden">
            <HiOutlineMenu size={20} />
          </button>
          {/* Mobile logo (visible only when sidebar is hidden) */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            <div className="w-6 h-6 relative">
              <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
            </div>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">Academix</span>
          </div>
          <div className="flex-1 min-w-0 hidden lg:block">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/80 truncate">{pageTitle}</h2>
            {user?.college && <p className="text-[11px] text-gray-500 dark:text-white/30 truncate">{user.college.name}</p>}
          </div>
          {/* Desktop page title only on mobile as well */}
          <div className="flex-1 min-w-0 lg:hidden text-right">
            <h2 className="text-xs font-semibold text-gray-600 dark:text-white/50 truncate">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle Button */}
            <button onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-white/30 hover:text-gray-800 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition border border-transparent">
              {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
            </button>

            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-500 dark:text-white/25 hover:text-gray-800 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition border border-gray-200 dark:border-white/[0.06] text-xs">
              <HiOutlineSearch size={15} />
              <span className="hidden sm:inline text-gray-500 dark:text-white/20">Search</span>
              <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 rounded bg-gray-100 dark:bg-white/[0.04] text-[9px] text-gray-500 dark:text-white/15 font-mono ml-1">Ctrl+K</kbd>
            </button>

            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2 rounded-lg text-gray-500 dark:text-white/30 hover:text-gray-800 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition">
                <HiOutlineBell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </button>
              <NotificationsDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            <div className="relative">
              <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ml-1 hover:opacity-90 transition cursor-pointer">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </button>
              <ProfileDropdown open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <SpotlightSearch open={searchOpen} onClose={() => setSearchOpen(false)} role={user?.role} />
    </div>
  );
};

export default DashboardLayout;
