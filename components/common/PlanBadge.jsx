'use client';

import { normalizePlanKey, PLAN_LABELS } from '../../lib/planTheme';

export const normalizePlanId = (rawPlan) => normalizePlanKey(rawPlan) || 'starter';

/**
 * PlanBadge — Displays the subscription plan or status with Core 2.0 token styling
 * Usage: <PlanBadge plan="premium" /> or <PlanBadge plan="basic" size="lg" /> or <PlanBadge status="active" />
 */
const PLAN_STYLES = {
  starter: {
    label: PLAN_LABELS.starter,
    className:
      'bg-[#E0F2FE] text-[#0E7490] border border-[#0891B2]/20 dark:bg-[#083344]/60 dark:text-[#22D3EE] dark:border-[#22D3EE]/25',
    dotClass: 'bg-[#0891B2] dark:bg-[#22D3EE]',
  },
  standard: {
    label: PLAN_LABELS.standard,
    className:
      'bg-[#EEF2FF] text-[#4338CA] border border-[#4F46E5]/20 dark:bg-[#1E1B4B]/60 dark:text-[#818CF8] dark:border-[#818CF8]/25',
    dotClass: 'bg-[#4F46E5] dark:bg-[#818CF8]',
  },
  premium: {
    label: PLAN_LABELS.premium,
    className:
      'bg-[#FEF3C7] text-[#B45309] border border-[#D97706]/25 dark:bg-[#451A03]/60 dark:text-[#FBBF24] dark:border-[#FBBF24]/25',
    dotClass: 'bg-[#D97706] dark:bg-[#FBBF24]',
  },
  enterprise: {
    label: PLAN_LABELS.enterprise,
    className:
      'bg-[#FAE8FF] text-[#A21CAF] border border-[#C026D3]/20 dark:bg-[#4A044E]/60 dark:text-[#E879F9] dark:border-[#E879F9]/25',
    dotClass: 'bg-[#C026D3] dark:bg-[#E879F9]',
  },
};

const STATUS_STYLES = {
  active: {
    label: 'Active',
    className: 'label-green',
    dotClass: 'bg-primary-02',
  },
  trial: {
    label: 'Trial',
    className: 'label-blue',
    dotClass: 'bg-primary-01',
  },
  grace: {
    label: 'Grace Period',
    className: 'label-yellow',
    dotClass: 'bg-primary-05',
  },
  suspended: {
    label: 'Suspended',
    className: 'label-red',
    dotClass: 'bg-primary-03',
  },
  expired: {
    label: 'Expired',
    className: 'label-gray',
    dotClass: 'bg-t-tertiary',
  },
};

const PlanBadge = ({ plan, status, size = 'sm', showDot = true, className = '' }) => {
  if (status) {
    const key = String(status).toLowerCase();
    const sc = STATUS_STYLES[key] || STATUS_STYLES.active;
    return (
      <span
        className={`label ${sc.className} ${
          size === 'lg' ? '!h-7 !px-3 !text-xs' : '!h-6 !px-2.5 !text-[11px]'
        } rounded-full gap-1.5 font-semibold tracking-tight whitespace-nowrap ${className}`}
      >
        {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dotClass}`} />}
        {sc.label}
      </span>
    );
  }

  const normalized = normalizePlanKey(plan) || 'starter';
  const pc = PLAN_STYLES[normalized] || PLAN_STYLES.starter;

  return (
    <span
      data-plan-badge={normalized}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-tight whitespace-nowrap ${
        size === 'lg' ? 'h-7 px-3 text-xs' : 'h-6 px-2.5 text-[11px]'
      } ${pc.className} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pc.dotClass}`} />}
      {pc.label}
    </span>
  );
};

export default PlanBadge;
