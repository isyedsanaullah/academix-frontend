'use client';

import { formatPKR, formatPKRCompact } from '@/lib/money';

const TIERS = [
  { key: 'starter', label: 'Starter Tier', bg: 'bg-blue-500', barBg: 'bg-blue-500/20' },
  { key: 'standard', label: 'Standard Tier', bg: 'bg-emerald-500', barBg: 'bg-emerald-500/20' },
  { key: 'premium', label: 'Premium Tier', bg: 'bg-purple-500', barBg: 'bg-purple-500/20' },
  { key: 'enterprise', label: 'Enterprise Tier', bg: 'bg-amber-500', barBg: 'bg-amber-500/20' },
  { key: 'addons_credits', label: 'Add-ons & Credits', bg: 'bg-cyan-500', barBg: 'bg-cyan-500/20' },
];

export default function RevenuePlanBreakdown({ planBreakdown = {}, totalRevenue = 0 }) {
  return (
    <section className="card p-6 max-md:p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sub-title-1 font-bold text-t-primary">
            Revenue by Subscription Plan
          </h3>
          <p className="text-caption text-t-secondary">
            Settled collections categorized across all canonical institutional subscription tiers
          </p>
        </div>
        <span className="text-caption font-semibold px-2.5 py-1 rounded-full bg-b-depth2 border border-s-subtle text-t-secondary">
          5 Buckets Active
        </span>
      </div>

      <div className="grid grid-cols-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-xs:grid-cols-1 gap-3 pt-1">
        {TIERS.map((tier) => {
          const item = planBreakdown[tier.key] || { amount: 0, count: 0, percentage: 0 };
          return (
            <div
              key={tier.key}
              className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle hover:border-s-highlight transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-caption font-semibold text-t-secondary">
                  {tier.label}
                </span>
                <span
                  className={`size-2.5 rounded-full shrink-0 ${tier.bg}`}
                  aria-hidden="true"
                />
              </div>

              <div className="text-h6 font-bold text-t-primary tabular-nums">
                {formatPKRCompact(item.amount)}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-b-depth2 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${tier.bg}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-caption text-t-tertiary pt-0.5">
                <span>{item.count} payments</span>
                <span className="font-semibold text-t-primary">{item.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

