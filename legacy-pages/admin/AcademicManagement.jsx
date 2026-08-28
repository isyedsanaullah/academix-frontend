'use client';

import { useState } from 'react';
import Sessions from '@/legacy-pages/admin/Sessions';
import ClassesAndSections from '@/legacy-pages/admin/ClassesAndSections';
import Subjects from '@/legacy-pages/admin/Subjects';
import TimetablePage from '@/legacy-pages/admin/TimetablePage';
import {
  HiOutlineCalendar,
  HiOutlineCollection,
  HiOutlineBookOpen,
  HiOutlineClock,
} from 'react-icons/hi';

const TABS = [
  { id: 'sessions',  label: 'Sessions',           icon: HiOutlineCalendar,    Component: Sessions },
  { id: 'classes',   label: 'Classes & Sections',  icon: HiOutlineCollection,  Component: ClassesAndSections },
  { id: 'subjects',  label: 'Subjects',            icon: HiOutlineBookOpen,    Component: Subjects },
  { id: 'timetable', label: 'Timetable',           icon: HiOutlineClock,       Component: TimetablePage },
];

const AcademicManagement = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.Component;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Academic Management</h1>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
          Manage sessions, classes, subjects, and timetables in one place.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all duration-150
              ${activeTab === id
                ? 'bg-white dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-none border border-gray-200 dark:border-indigo-500/20'
                : 'text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70 hover:bg-white/60 dark:hover:bg-white/[0.04]'
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AcademicManagement;
