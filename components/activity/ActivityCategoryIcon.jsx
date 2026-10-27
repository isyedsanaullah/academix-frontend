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

// Restrained palette: the role accent plus status/brand tints. The category name is
// always shown as text next to the icon, so colour is never the only signal.
const TONE = {
  accent: 'bg-accent-soft text-accent',
  info: 'bg-info/10 text-info',
  blue: 'bg-brand-blue/10 text-brand-blue',
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  neutral: 'bg-card-3 text-fg-muted',
};

const CATEGORY_MAP = {
  Authentication: { icon: HiOutlineKey, cls: TONE.info },
  Academic: { icon: HiOutlineAcademicCap, cls: TONE.accent },
  Assignment: { icon: HiOutlineClipboardList, cls: TONE.blue },
  Examination: { icon: HiOutlineDocumentText, cls: TONE.warn },
  Attendance: { icon: HiOutlineClipboardCheck, cls: TONE.ok },
  Finance: { icon: HiOutlineCurrencyDollar, cls: TONE.ok },
  Student: { icon: HiOutlineUserGroup, cls: TONE.blue },
  Teacher: { icon: HiOutlineBriefcase, cls: TONE.accent },
  Administration: { icon: HiOutlineCog, cls: TONE.neutral },
  Announcement: { icon: HiOutlineSpeakerphone, cls: TONE.warn },
  Profile: { icon: HiOutlineUser, cls: TONE.info },
  College: { icon: HiOutlineOfficeBuilding, cls: TONE.accent },
  System: { icon: HiOutlineShieldCheck, cls: TONE.neutral },
};

export default function ActivityCategoryIcon({ category, size = 18 }) {
  const config = CATEGORY_MAP[category] || {
    icon: HiOutlineSparkles,
    cls: TONE.accent,
  };

  const IconComponent = config.icon;

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${config.cls}`}
    >
      <IconComponent size={size} aria-hidden="true" />
    </div>
  );
}