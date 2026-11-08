'use client';

import Icon from '@/components/Icon';

const TONE = {
  accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  info: 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]',
  blue: 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]',
  ok: 'bg-[var(--brand-green-soft)] text-[var(--brand-green-text)]',
  warn: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  neutral: 'bg-b-surface1 border border-s-subtle text-t-secondary',
};

const CATEGORY_MAP = {
  Authentication: { icon: 'key', cls: TONE.info },
  Academic: { icon: 'graduation-cap', cls: TONE.accent },
  Assignment: { icon: 'clipboard-list', cls: TONE.blue },
  Examination: { icon: 'document', cls: TONE.warn },
  Attendance: { icon: 'clipboard-check', cls: TONE.ok },
  Finance: { icon: 'wallet', cls: TONE.ok },
  Student: { icon: 'users', cls: TONE.blue },
  Teacher: { icon: 'briefcase', cls: TONE.accent },
  Administration: { icon: 'cog', cls: TONE.neutral },
  Announcement: { icon: 'megaphone', cls: TONE.warn },
  Profile: { icon: 'profile', cls: TONE.info },
  College: { icon: 'building', cls: TONE.accent },
  System: { icon: 'shield', cls: TONE.neutral },
};

export default function ActivityCategoryIcon({ category, size = 18 }) {
  const config = CATEGORY_MAP[category] || {
    icon: 'sparkles',
    cls: TONE.accent,
  };

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${config.cls}`}
    >
      <Icon name={config.icon} size={size} className="fill-current" aria-hidden="true" />
    </div>
  );
}
