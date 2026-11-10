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
const AccountantsChartTooltip = ({ active, payload, label }) => {
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

export default function AccountantsStatsCards({
  metrics = {},
  selectedCard = null,
  onCardClick,
  onResetView,
}) {
  const cards = [
    {
      id: 'ALL',
      label: 'All Accountants',
      value: metrics.totalAccountants ?? 10,
      caption: 'Registered finance officers',
      delta: 10.0,
      isUpgrade: true,
      sparkline: [{ val: 4 }, { val: 6 }, { val: 7 }, { val: 9 }, { val: metrics.totalAccountants ?? 10 }],
    },
    {
      id: 'ASSIGNED',
      label: 'Assigned to College',
      value: metrics.assignedCount ?? 10,
      caption: 'Active institutional treasury officers',
      delta: 12.0,
      isUpgrade: true,
      sparkline: [{ val: 4 }, { val: 6 }, { val: 7 }, { val: 9 }, { val: metrics.assignedCount ?? 10 }],
    },
    {
      id: 'COVERED',
      label: 'Institutions Covered',
      value: metrics.collegesWithAccountant ?? 7,
      caption: `of ${metrics.totalColleges ?? 179} total colleges`,
      delta: 4.5,
      isUpgrade: true,
      sparkline: [{ val: 2 }, { val: 3 }, { val: 4 }, { val: 6 }, { val: metrics.collegesWithAccountant ?? 7 }],
    },
    {
      id: 'COVERAGE',
      label: 'Coverage Ratio',
      value: `${metrics.coveragePercentage ?? 3.9}%`,
      caption: 'Institutional finance coverage',
      delta: 2.1,
      isUpgrade: true,
      sparkline: [{ val: 1.5 }, { val: 2.0 }, { val: 2.8 }, { val: 3.2 }, { val: metrics.coveragePercentage ?? 3.9 }],
    },
  ];

  const chartData = useMemo(() => {
    return [
      { month: 'Jun', Total: 4, Assigned: 4, CoveredColleges: 3 },
      { month: 'Jul', Total: 6, Assigned: 6, CoveredColleges: 4 },
      { month: 'Aug', Total: 7, Assigned: 7, CoveredColleges: 5 },
      { month: 'Sep', Total: 8, Assigned: 8, CoveredColleges: 6 },
      { month: 'Oct', Total: 9, Assigned: 9, CoveredColleges: 6 },
      { month: 'Nov', Total: metrics.totalAccountants ?? 10, Assigned: metrics.assignedCount ?? 10, CoveredColleges: metrics.collegesWithAccountant ?? 7 },
    ];
  }, [metrics]);

  return (
    <section
      aria-label="Accountant coverage overview and telemetry"
      className="card p-6 max-md:p-4 space-y-6"
    >
      {/* 4 Stats Cards Segmented Tray */}
      <div
        role="tablist"
        aria-label="Accountant telemetry filters"
        className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2.5 p-2 rounded-4xl bg-b-depth2 border border-s-subtle"
      >
        {cards.map((tab) => (
          <StatCardWithChart
            key={tab.id}
            id={`accountants-tab-${tab.id}`}
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
            ariaControls="accountants-trend-chart-panel"
          />
        ))}
      </div>

      {/* Interactive Horizontal Big Chart */}
      <div
        id="accountants-trend-chart-panel"
        role="tabpanel"
        aria-label="Accountant adoption chart"
        className="pt-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sub-title-1 font-bold text-t-primary">
              {selectedCard && selectedCard !== 'ALL'
                ? `${selectedCard} Metric Telemetry`
                : 'Treasury Officer Assignment & College Coverage Velocity'}
            </h3>
            <p className="text-caption text-t-secondary">
              {selectedCard && selectedCard !== 'ALL'
                ? `Filtered by ${selectedCard} — click card again or Reset to clear`
                : 'Growth of assigned institutional accountants across registered colleges'}
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
                <linearGradient id="totalAccountantsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent, #0070f3)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent, #0070f3)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="coveredCollegesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
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
              <Tooltip content={<AccountantsChartTooltip />} />

              <Area
                type="monotone"
                dataKey="Total"
                name="Total Accountants"
                stroke="var(--accent, #0070f3)"
                strokeWidth={2}
                fill="url(#totalAccountantsGrad)"
              />
              <Area
                type="monotone"
                dataKey="CoveredColleges"
                name="Colleges Covered"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#coveredCollegesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

