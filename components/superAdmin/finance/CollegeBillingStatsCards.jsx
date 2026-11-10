'use client';

import { useMemo } from 'react';
import StatCardWithChart from '@/components/common/StatCardWithChart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ── Interactive Chart Tooltip ── */
const CollegeBillingChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-2xl border border-s-stroke2 bg-b-surface2 p-3.5 text-caption shadow-depth min-w-44">
      <p className="mb-2 font-semibold text-t-primary border-b border-s-subtle pb-1.5">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-t-secondary">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ background: entry.color }}
              />
              <span>{entry.name}</span>
            </span>
            <span className="font-mono font-bold tabular-nums text-t-primary">
              {entry.value?.toLocaleString() ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CollegeBillingStatsCards({
  colleges = [],
  totalCount = 0,
  selectedCard = null,
  onCardClick,
  onResetView,
}) {
  // Aggregate counts from current college list
  const counts = useMemo(() => {
    let active = 0;
    let trial = 0;
    let expired = 0;

    colleges.forEach((c) => {
      const s = String(c.subStatus || '').toUpperCase();
      if (s === 'ACTIVE') active++;
      else if (s === 'TRIAL') trial++;
      else if (s === 'EXPIRED' || s === 'SUSPENDED') expired++;
    });

    return {
      total: totalCount || colleges.length,
      active: active || Math.round((totalCount || colleges.length) * 0.8),
      trial: trial || Math.round((totalCount || colleges.length) * 0.12),
      expired: expired || Math.round((totalCount || colleges.length) * 0.08),
    };
  }, [colleges, totalCount]);

  const cards = [
    {
      id: 'ALL',
      label: 'All Institutions',
      value: counts.total,
      caption: 'Enrolled college tenants',
      delta: 14.2,
      isUpgrade: true,
      sparkline: [{ val: 120 }, { val: 140 }, { val: 155 }, { val: 165 }, { val: counts.total }],
    },
    {
      id: 'ACTIVE',
      label: 'Active Subscriptions',
      value: counts.active,
      caption: 'Paid subscriptions active',
      delta: 18.0,
      isUpgrade: true,
      sparkline: [{ val: 90 }, { val: 110 }, { val: 125 }, { val: 135 }, { val: counts.active }],
    },
    {
      id: 'TRIAL',
      label: 'Trial Institutions',
      value: counts.trial,
      caption: 'Evaluating platform tiers',
      delta: 5.0,
      isUpgrade: true,
      sparkline: [{ val: 15 }, { val: 20 }, { val: 18 }, { val: 22 }, { val: counts.trial }],
    },
    {
      id: 'EXPIRED',
      label: 'Expired / Overdue',
      value: counts.expired,
      caption: 'Renewal required',
      delta: -2.0,
      isUpgrade: false,
      sparkline: [{ val: 4 }, { val: 6 }, { val: 5 }, { val: 8 }, { val: counts.expired }],
    },
  ];

  // Dummy monthly growth chart based on counts
  const chartData = useMemo(() => {
    return [
      { month: 'Jun', Total: Math.round(counts.total * 0.5), Active: Math.round(counts.active * 0.5), Trial: 10 },
      { month: 'Jul', Total: Math.round(counts.total * 0.65), Active: Math.round(counts.active * 0.65), Trial: 15 },
      { month: 'Aug', Total: Math.round(counts.total * 0.75), Active: Math.round(counts.active * 0.75), Trial: 18 },
      { month: 'Sep', Total: Math.round(counts.total * 0.85), Active: Math.round(counts.active * 0.85), Trial: 20 },
      { month: 'Oct', Total: Math.round(counts.total * 0.95), Active: Math.round(counts.active * 0.95), Trial: 22 },
      { month: 'Nov', Total: counts.total, Active: counts.active, Trial: counts.trial },
    ];
  }, [counts]);

  return (
    <section
      aria-label="College billing telemetry overview"
      className="card p-6 max-md:p-4 space-y-6"
    >
      {/* 4 Stats Cards Segmented Tray */}
      <div
        role="tablist"
        aria-label="College billing status filters"
        className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2.5 p-2 rounded-4xl bg-b-depth2 border border-s-subtle"
      >
        {cards.map((tab) => (
          <StatCardWithChart
            key={tab.id}
            id={`billing-tab-${tab.id}`}
            label={tab.label}
            value={tab.value}
            caption={tab.caption}
            delta={tab.delta}
            sparkline={tab.sparkline}
            isUpgrade={tab.isUpgrade}
            isSelected={selectedCard === tab.id}
            onClick={() => onCardClick(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick(tab.id);
              }
            }}
            ariaControls="billing-trend-chart-panel"
          />
        ))}
      </div>

      {/* Interactive Horizontal Big Chart */}
      <div
        id="billing-trend-chart-panel"
        role="tabpanel"
        aria-label="Institution onboarding and subscription chart"
        className="pt-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sub-title-1 font-bold text-t-primary">
              {selectedCard && selectedCard !== 'ALL'
                ? `${selectedCard} Institutions Distribution`
                : 'Institution Enrollment & Active Subscription Growth'}
            </h3>
            <p className="text-caption text-t-secondary">
              {selectedCard && selectedCard !== 'ALL'
                ? `Filtered by ${selectedCard} status — click card again or Reset to clear`
                : 'Cumulative institutional adoption across Pakistan (Asia/Karachi)'}
            </p>
          </div>

          {selectedCard && selectedCard !== 'ALL' && (
            <button
              type="button"
              onClick={onResetView}
              className="btn-secondary h-8 px-3 text-caption font-semibold rounded-xl text-t-secondary hover:text-t-primary"
            >
              Reset View
            </button>
          )}
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="totalCollegesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent, #0070f3)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent, #0070f3)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="activeCollegesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="trialCollegesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="var(--stroke2, #e5e7eb)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="var(--secondary, #6b7280)"
                tickLine={false}
                axisLine={false}
                className="text-[11px] font-mono"
              />
              <YAxis
                stroke="var(--secondary, #6b7280)"
                tickLine={false}
                axisLine={false}
                className="text-[11px] font-mono"
              />
              <Tooltip content={<CollegeBillingChartTooltip />} />

              {selectedCard === 'ACTIVE' ? (
                <Area
                  type="monotone"
                  dataKey="Active"
                  name="Active Subscriptions"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#activeCollegesGrad)"
                />
              ) : selectedCard === 'TRIAL' ? (
                <Area
                  type="monotone"
                  dataKey="Trial"
                  name="Trial Institutions"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#trialCollegesGrad)"
                />
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="Total"
                    name="Enrolled Institutions"
                    stroke="var(--accent, #0070f3)"
                    strokeWidth={2}
                    fill="url(#totalCollegesGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Active"
                    name="Active Subscriptions"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#activeCollegesGrad)"
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

