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
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const CATEGORY_MAP = {
  Authentication: { icon: HiOutlineKey, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  Academic: { icon: HiOutlineAcademicCap, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' },
  Assignment: { icon: HiOutlineClipboardList, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
  Examination: { icon: HiOutlineDocumentText, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
  Attendance: { icon: HiOutlineClipboardCheck, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)' },
  Finance: { icon: HiOutlineCurrencyDollar, color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
  Student: { icon: HiOutlineUserGroup, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
  Teacher: { icon: HiOutlineBriefcase, color: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)' },
  Administration: { icon: HiOutlineCog, color: '#fb7185', bg: 'rgba(251, 113, 133, 0.12)' },
  Announcement: { icon: HiOutlineSpeakerphone, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  Profile: { icon: HiOutlineUser, color: '#93c5fd', bg: 'rgba(147, 197, 253, 0.12)' },
  College: { icon: HiOutlineOfficeBuilding, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)' },
  System: { icon: HiOutlineShieldCheck, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
};

export default function ActivityCategoryIcon({ category, size = 18 }) {
  const config = CATEGORY_MAP[category] || { icon: HiOutlineSparkles, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
  const IconComponent = config.icon;

  return (
    <div
      style={{
        width: size * 2,
        height: size * 2,
        borderRadius: '12px',
        background: config.bg,
        border: `1px solid ${config.color}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <IconComponent size={size} style={{ color: config.color }} />
    </div>
  );
}
