'use client';

import { useState, useMemo } from 'react';
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
import { formatPKR, formatPKRCompact } from '@/lib/money';

/* ── Interactive Chart Tooltip ── */
const AccountingChartTooltip = ({ active, payload, label }) => {
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
              {formatPKR(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AccountingOverviewStatsCards({
  cards = {},
  charts = {},
  selectedCard = null,
  onCardClick,
  onResetView,
}) {
  const [chartMode, setChartMode] = useState('monthly'); // 'monthly' | 'daily'

  const mom = cards.thisMonthVsLastMonth || {};
  const queue = cards.billingQueue || {};

  // Sparkline data generation based on trend
  const revenueTrend = charts.revenueTrend || [];
  const monthlyComparison = charts.monthlyComparison || [];

  const sparklineData = useMemo(() => {
    if (revenueTrend.length > 0) {
      return revenueTrend.map((m) => ({ val: m.amount || 0 }));
    }
    return [{ val: 10 }, { val: 25 }, { val: 18 }, { val: 32 }, { val: 40 }];
  }, [revenueTrend]);

  const queueSparkline = useMemo(() => {
    return [
      { val: Math.max(0, (queue.count || 0) - 4) },
      { val: Math.max(0, (queue.count || 0) - 2) },
      { val: Math.max(0, (queue.count || 0) - 1) },
      { val: queue.count || 0 },
    ];
  }, [queue.count]);

  const statsCards = [
    {
      id: 'total',
      label: 'Total Revenue',
      value: formatPKRCompact(cards.totalRevenueCollected || 0),
      caption: 'Settled approved proofs',
      delta: mom.percentage ?? (mom.isNewBaseline ? 100 : 0),
      isUpgrade: (mom.diff || 0) >= 0,
      sparkline: sparklineData,
    },
    {
      id: 'pending',
      label: 'Pending Settlement',
      value: formatPKRCompact(cards.pendingAmount || 0),
      caption: 'Proofs awaiting review',
      delta: 0,
      isUpgrade: false,
      sparkline: [{ val: 5 }, { val: 12 }, { val: 8 }, { val: 15 }],
    },
    {
      id: 'queue',
      label: 'Billing Queue',
      value: String(queue.count || 0),
      caption: `${queue.slaBreached || 0} SLA breached (>24h)`,
      delta: queue.slaBreached > 0 ? -12.5 : 5.0,
      isUpgrade: (queue.slaBreached || 0) === 0,
      sparkline: queueSparkline,
    },
    {
      id: 'mom',
      label: 'This Month',
      value: formatPKRCompact(mom.thisMonth || 0),
      caption: `vs last month (${formatPKRCompact(mom.lastMonth || 0)})`,
      delta: mom.percentage ?? (mom.isNewBaseline ? 100 : 0),
      isUpgrade: (mom.diff || 0) >= 0,
      sparkline: sparklineData,
    },
  ];

  // Dynamic Chart Title & Configuration based on selection
  const chartTitle = useMemo(() => {
    if (selectedCard === 'pending') return 'Pending Queue Settlement Volume';
    if (selectedCard === 'queue') return 'Billing Queue Telemetry';
    if (selectedCard === 'mom') return 'Current vs Previous Month Performance (Day-by-Day)';
    return 'Institutional Revenue Telemetry (Asia/Karachi)';
  }, [selectedCard]);

  // Chart dataset switch:
  const chartData = useMemo(() => {
    if (selectedCard === 'mom' || chartMode === 'daily') {
      return monthlyComparison.map((d) => ({
        label: `Day ${d.day}`,
        Current: d.currentMonth || 0,
        Previous: d.previousMonth || 0,
      }));
    }
    return revenueTrend.map((m) => ({
      label: m.label || m.month,
      Revenue: m.amount || 0,
      Payments: m.count || 0,
    }));
  }, [selectedCard, chartMode, monthlyComparison, revenueTrend]);

  return (
    <section
      aria-label="Accounting overview and interactive metrics"
      className="card p-6 max-md:p-4 space-y-6"
    >
      {/* 4 Stats Cards Segmented Tray */}
      <div
        role="tablist"
        aria-label="Finance telemetry filters"
        className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2.5 p-2 rounded-4xl bg-b-depth2 border border-s-subtle"
      >
        {statsCards.map((tab, idx) => (
          <StatCardWithChart
            key={tab.id}
            id={`finance-tab-${tab.id}`}
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
            ariaControls="finance-telemetry-chart-panel"
          />
        ))}
      </div>

      {/* Interactive Chart Panel Under the 4 Cards */}
      <div
        id="finance-telemetry-chart-panel"
        role="tabpanel"
        aria-label="Financial telemetry charts"
        className="pt-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sub-title-1 font-bold text-t-primary">
              {chartTitle}
            </h3>
            <p className="text-caption text-t-secondary">
              {selectedCard
                ? `Filtered by ${statsCards.find((c) => c.id === selectedCard)?.label} metric`
                : 'Aggregated cross-college institutional subscription billing performance'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedCard && (
              <button
                type="button"
                onClick={onResetView}
                className="btn-secondary h-8 px-3 text-caption font-semibold rounded-xl text-t-secondary hover:text-t-primary"
              >
                Reset View
              </button>
            )}

            <div className="flex items-center p-1 rounded-xl bg-b-surface1 border border-s-subtle text-caption">
              <button
                type="button"
                onClick={() => setChartMode('monthly')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartMode === 'monthly' && selectedCard !== 'mom'
                    ? 'bg-b-surface2 text-t-primary shadow-xs'
                    : 'text-t-secondary hover:text-t-primary'
                }`}
              >
                Last 6 Months
              </button>
              <button
                type="button"
                onClick={() => setChartMode('daily')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartMode === 'daily' || selectedCard === 'mom'
                    ? 'bg-b-surface2 text-t-primary shadow-xs'
                    : 'text-t-secondary hover:text-t-primary'
                }`}
              >
                Daily View
              </button>
            </div>
          </div>
        </div>

        {/* Big Horizontal Chart Area */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent, #0070f3)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent, #0070f3)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="var(--stroke2, #e5e7eb)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="var(--secondary, #6b7280)"
                tickLine={false}
                axisLine={false}
                className="text-[11px] font-mono"
              />
              <YAxis
                stroke="var(--secondary, #6b7280)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatPKRCompact(val)}
                className="text-[11px] font-mono"
              />
              <Tooltip content={<AccountingChartTooltip />} />

              {selectedCard === 'mom' || chartMode === 'daily' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="Current"
                    name="This Month"
                    stroke="var(--accent, #0070f3)"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Previous"
                    name="Last Month"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="url(#previousGradient)"
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  name="Settled Revenue"
                  stroke="var(--accent, #0070f3)"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

