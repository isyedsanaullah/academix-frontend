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
  Authentication: { icon: HiOutlineKey, colorLight: '#0284c7', colorDark: '#38bdf8', bgLight: '#f0f9ff', bgDark: 'rgba(56, 189, 248, 0.12)', borderLight: '#bae6fd', borderDark: 'rgba(56, 189, 248, 0.25)' },
  Academic: { icon: HiOutlineAcademicCap, colorLight: '#4f46e5', colorDark: '#818cf8', bgLight: '#eef2ff', bgDark: 'rgba(129, 140, 248, 0.12)', borderLight: '#c7d2fe', borderDark: 'rgba(129, 140, 248, 0.25)' },
  Assignment: { icon: HiOutlineClipboardList, colorLight: '#7c3aed', colorDark: '#a78bfa', bgLight: '#f5f3ff', bgDark: 'rgba(167, 139, 250, 0.12)', borderLight: '#ddd6fe', borderDark: 'rgba(167, 139, 250, 0.25)' },
  Examination: { icon: HiOutlineDocumentText, colorLight: '#d97706', colorDark: '#fbbf24', bgLight: '#fffbeb', bgDark: 'rgba(251, 191, 36, 0.12)', borderLight: '#fde68a', borderDark: 'rgba(251, 191, 36, 0.25)' },
  Attendance: { icon: HiOutlineClipboardCheck, colorLight: '#16a34a', colorDark: '#4ade80', bgLight: '#f0fdf4', bgDark: 'rgba(74, 222, 128, 0.12)', borderLight: '#bbf7d0', borderDark: 'rgba(74, 222, 128, 0.25)' },
  Finance: { icon: HiOutlineCurrencyDollar, colorLight: '#059669', colorDark: '#34d399', bgLight: '#ecfdf5', bgDark: 'rgba(52, 211, 153, 0.12)', borderLight: '#a7f3d0', borderDark: 'rgba(52, 211, 153, 0.25)' },
  Student: { icon: HiOutlineUserGroup, colorLight: '#2563eb', colorDark: '#60a5fa', bgLight: '#eff6ff', bgDark: 'rgba(96, 165, 250, 0.12)', borderLight: '#bfdbfe', borderDark: 'rgba(96, 165, 250, 0.25)' },
  Teacher: { icon: HiOutlineBriefcase, colorLight: '#db2777', colorDark: '#f472b6', bgLight: '#fdf2f8', bgDark: 'rgba(244, 114, 182, 0.12)', borderLight: '#fbcfe8', borderDark: 'rgba(244, 114, 182, 0.25)' },
  Administration: { icon: HiOutlineCog, colorLight: '#e11d48', colorDark: '#fb7185', bgLight: '#fff1f2', bgDark: 'rgba(251, 113, 133, 0.12)', borderLight: '#fecdd3', borderDark: 'rgba(251, 113, 133, 0.25)' },
  Announcement: { icon: HiOutlineSpeakerphone, colorLight: '#d97706', colorDark: '#f59e0b', bgLight: '#fffbeb', bgDark: 'rgba(245, 158, 11, 0.12)', borderLight: '#fde68a', borderDark: 'rgba(245, 158, 11, 0.25)' },
  Profile: { icon: HiOutlineUser, colorLight: '#2563eb', colorDark: '#93c5fd', bgLight: '#eff6ff', bgDark: 'rgba(147, 197, 253, 0.12)', borderLight: '#bfdbfe', borderDark: 'rgba(147, 197, 253, 0.25)' },
  College: { icon: HiOutlineOfficeBuilding, colorLight: '#9333ea', colorDark: '#c084fc', bgLight: '#faf5ff', bgDark: 'rgba(192, 132, 252, 0.12)', borderLight: '#e9d5ff', borderDark: 'rgba(192, 132, 252, 0.25)' },
  System: { icon: HiOutlineShieldCheck, colorLight: '#0284c7', colorDark: '#38bdf8', bgLight: '#f0f9ff', bgDark: 'rgba(56, 189, 248, 0.12)', borderLight: '#bae6fd', borderDark: 'rgba(56, 189, 248, 0.25)' },
};

export default function ActivityCategoryIcon({ category, size = 18 }) {
  const config = CATEGORY_MAP[category] || { 
    icon: HiOutlineSparkles, 
    colorLight: '#4f46e5', 
    colorDark: '#818cf8', 
    bgLight: '#eef2ff', 
    bgDark: 'rgba(129, 140, 248, 0.12)',
    borderLight: '#c7d2fe',
    borderDark: 'rgba(129, 140, 248, 0.25)'
  };
  
  const IconComponent = config.icon;

  return (
    <div
      style={{
        width: size * 2.2,
        height: size * 2.2,
      }}
      className="rounded-xl flex items-center justify-center shrink-0 border transition-colors bg-[var(--cat-bg)] border-[var(--cat-border)] text-[var(--cat-color)]"
      ref={(el) => {
        if (el) {
          const isDark = document.documentElement.classList.contains('dark');
          el.style.setProperty('--cat-bg', isDark ? config.bgDark : config.bgLight);
          el.style.setProperty('--cat-border', isDark ? config.borderDark : config.borderLight);
          el.style.setProperty('--cat-color', isDark ? config.colorDark : config.colorLight);
        }
      }}
    >
      <IconComponent size={size} />
    </div>
  );
}
