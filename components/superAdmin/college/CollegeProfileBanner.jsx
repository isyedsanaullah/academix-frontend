'use client';

import Icon from '@/components/Icon';
import SuspendActivateButton from '@/components/common/SuspendActivateButton';

const getCollegeInitials = (name, code) => {
  if (code && code.length >= 2) return code.slice(0, 2).toUpperCase();
  if (!name) return 'CH';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const PLAN_BADGES = {
  starter: {
    label: 'Starter Plan',
    classes: 'bg-[#00a656]/10 text-[#00a656] border-[#00a656]/20 dark:text-[#34d399]',
  },
  basic: {
    label: 'Starter Plan',
    classes: 'bg-[#00a656]/10 text-[#00a656] border-[#00a656]/20 dark:text-[#34d399]',
  },
  standard: {
    label: 'Standard Plan',
    classes: 'bg-[#0B4D94]/10 text-[#0B4D94] border-[#0B4D94]/20 dark:text-[#4C94E8]',
  },
  premium: {
    label: 'Premium Plan',
    classes: 'bg-[#8c62ff]/10 text-[#8c62ff] border-[#8c62ff]/20 dark:text-[#a78bfa]',
  },
  enterprise: {
    label: 'Enterprise Plan',
    classes: 'bg-[#E879F9]/10 text-[#E879F9] border-[#E879F9]/20 dark:text-[#F0ABFC]',
  },
};

export default function CollegeProfileBanner({
  college,
  isCollegeActive,
  onOpenEditDrawer,
  onToggleStatus,
}) {
  if (!college) return null;
  const c = college;
  const currentPlan = (c.subscription?.plan || 'basic').toLowerCase();
  const planInfo = PLAN_BADGES[currentPlan] || PLAN_BADGES.basic;

  return (
    <div className="relative rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget overflow-hidden">
      {/* ── Cover Photo Background ── */}
      <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-r from-[#0B4D94] via-[#1a62b8] to-[#289A48] dark:from-[#082b52] dark:via-[#103d72] dark:to-[#175429]">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top-Right Quick Actions */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenEditDrawer}
            title="Edit Institution Coordinates"
            aria-label="Edit Institution Coordinates"
            className="flex items-center justify-center size-11 rounded-full bg-b-surface2/90 hover:bg-b-surface2 backdrop-blur-md border border-s-subtle text-t-primary hover:text-primary-01 shadow-widget transition-all cursor-pointer"
          >
            <Icon name="edit" className="size-5" />
          </button>

          <SuspendActivateButton
            isActive={isCollegeActive}
            onClick={onToggleStatus}
          />
        </div>
      </div>

      {/* ── Profile Coordinates Section ── */}
      <div className="px-6 sm:px-8 pb-6">
        {/* Top Row: Big Circular Logo + College Name on Left, Selected Plan on Right */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
          {/* Left Side: Overlapping Big Circular Logo + Name */}
          <div className="flex items-end gap-4 sm:gap-5 min-w-0">
            {/* Big Circular Logo with High z-index */}
            <div className="relative z-20 size-28 sm:size-32 rounded-full bg-b-surface2 border-4 border-b-surface2 shadow-depth flex items-center justify-center overflow-hidden shrink-0">
              {c.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={c.logo} alt={c.name} className="size-full object-cover rounded-full" />
              ) : (
                <div className="size-full rounded-full bg-gradient-to-br from-primary-01/15 to-[#00a656]/15 flex items-center justify-center">
                  <span className="text-h3 font-black text-primary-01 font-mono tracking-wider select-none">
                    {getCollegeInitials(c.name, c.code)}
                  </span>
                </div>
              )}
            </div>

            {/* College Name */}
            <div className="min-w-0 pb-1">
              <h1 className="text-h4 sm:text-h3 font-bold text-t-primary tracking-tight truncate">
                {c.name}
              </h1>
            </div>
          </div>

          {/* Right Side: Plan Selected */}
          <div className="lg:text-right pb-1 shrink-0">
            <div className="flex items-center lg:justify-end gap-2">
              <span className="text-caption text-t-secondary font-semibold uppercase tracking-wider">
                Plan Selected:
              </span>
              <span className={`text-caption font-bold px-3 py-1 rounded-full border ${planInfo.classes}`}>
                {planInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Row: Left Side Small Info, Right Side Expires On */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-y-3 gap-x-6 pt-3 border-t border-s-subtle text-sub-title-2 text-t-secondary">
          {/* Left: Metadata coordinates (Code, Email, City, Website, Phone) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {c.code && (
              <div className="flex items-center gap-1.5 font-mono text-caption font-bold px-2.5 py-1 rounded-xl bg-b-depth2 border border-s-subtle text-t-primary">
                <span className="text-t-secondary font-normal uppercase text-[10px]">Code:</span>
                <span>{c.code}</span>
              </div>
            )}

            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-2 hover:text-primary-01 transition-colors"
                title="Official Email"
              >
                <Icon name="mail" className="size-4 text-t-secondary" />
                <span className="truncate max-w-[220px]">{c.email}</span>
              </a>
            )}

            {c.city && (
              <div className="flex items-center gap-2">
                <Icon name="location" className="size-4 text-t-secondary" />
                <span>{c.city}</span>
              </div>
            )}

            {c.website && (
              <a
                href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-01 hover:underline"
                title="Institution Website"
              >
                <Icon name="globe" className="size-4 text-primary-01" />
                <span className="truncate max-w-[200px]">{c.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            {c.phone && (
              <div className="flex items-center gap-2 font-mono">
                <Icon name="phone" className="size-4 text-t-secondary" />
                <span>{c.phone}</span>
              </div>
            )}
          </div>

          {/* Right: Expires On Date */}
          <div className="lg:text-right shrink-0">
            <div className="flex items-center lg:justify-end gap-1.5 font-mono text-caption">
              <span className="text-t-secondary uppercase font-sans text-[11px] font-semibold">
                Expires on:
              </span>
              <span className="font-bold text-t-primary">
                {c.subscription?.expiresAt
                  ? new Date(c.subscription.expiresAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Perpetual / No Expiry'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

