'use client';

import {
  HiOutlineKey,
  HiOutlineAcademicCap,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineOfficeBuilding,
  HiOutlineSpeakerphone,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi';

const CATEGORY_MAP = {
  Authentication: { icon: HiOutlineKey, cls: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20' },
  Academic: { icon: HiOutlineAcademicCap, cls: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' },
  Assignment: { icon: HiOutlineClipboardList, cls: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' },
  Examination: { icon: HiOutlineDocumentText, cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' },
  Attendance: { icon: HiOutlineClipboardCheck, cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
  Finance: { icon: HiOutlineCurrencyDollar, cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
  Student: { icon: HiOutlineUserGroup, cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' },
  Teacher: { icon: HiOutlineBriefcase, cls: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/20' },
  Administration: { icon: HiOutlineCog, cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' },
  Announcement: { icon: HiOutlineSpeakerphone, cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' },
  Profile: { icon: HiOutlineUser, cls: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20' },
  College: { icon: HiOutlineOfficeBuilding, cls: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' },
  System: { icon: HiOutlineShieldCheck, cls: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20' },
};

export default function ActivityCategoryIcon({ category, size = 18 }) {
  const config = CATEGORY_MAP[category] || {
    icon: HiOutlineSparkles,
    cls: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
  };

  const IconComponent = config.icon;

  return (
    <div
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors shadow-xs ${config.cls}`}
    >
      <IconComponent size={size} />
    </div>
  );
}
