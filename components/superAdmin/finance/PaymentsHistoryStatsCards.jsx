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
const PaymentsChartTooltip = ({ active, payload, label }) => {
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

export default function PaymentsHistoryStatsCards({
  summary = { totalCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 },
  selectedCard = null,
  onCardClick,
  onResetView,
}) {
  const cards = [
    {
      id: 'ALL',
      label: 'All Payments',
      value: summary.totalCount ?? 0,
      caption: 'Full payment ledger count',
      delta: 8.5,
      isUpgrade: true,
      sparkline: [{ val: 120 }, { val: 140 }, { val: 165 }, { val: 180 }, { val: summary.totalCount ?? 200 }],
    },
    {
      id: 'APPROVED',
      label: 'Approved Settled',
      value: summary.approvedCount ?? 0,
      caption: 'Verified revenue proofs',
      delta: 12.0,
      isUpgrade: true,
      sparkline: [{ val: 80 }, { val: 95 }, { val: 110 }, { val: 120 }, { val: summary.approvedCount ?? 131 }],
    },
    {
      id: 'PENDING',
      label: 'Pending Queue',
      value: summary.pendingCount ?? 0,
      caption: 'Awaiting admin verification',
      delta: -4.2,
      isUpgrade: (summary.pendingCount || 0) === 0,
      sparkline: [{ val: 40 }, { val: 60 }, { val: 50 }, { val: 58 }, { val: summary.pendingCount ?? 55 }],
    },
    {
      id: 'REJECTED',
      label: 'Rejected Proofs',
      value: summary.rejectedCount ?? 0,
      caption: 'Declined transactions',
      delta: -1.5,
      isUpgrade: false,
      sparkline: [{ val: 5 }, { val: 8 }, { val: 10 }, { val: 12 }, { val: summary.rejectedCount ?? 14 }],
    },
  ];

  // Dummy monthly telemetry based on actual counts for visualization
  const telemetryData = useMemo(() => {
    return [
      { month: 'Jun', Total: Math.round(summary.totalCount * 0.4), Approved: Math.round(summary.approvedCount * 0.4), Pending: 10 },
      { month: 'Jul', Total: Math.round(summary.totalCount * 0.55), Approved: Math.round(summary.approvedCount * 0.55), Pending: 18 },
      { month: 'Aug', Total: Math.round(summary.totalCount * 0.7), Approved: Math.round(summary.approvedCount * 0.7), Pending: 24 },
      { month: 'Sep', Total: Math.round(summary.totalCount * 0.8), Approved: Math.round(summary.approvedCount * 0.8), Pending: 35 },
      { month: 'Oct', Total: Math.round(summary.totalCount * 0.9), Approved: Math.round(summary.approvedCount * 0.9), Pending: 45 },
      { month: 'Nov', Total: summary.totalCount, Approved: summary.approvedCount, Pending: summary.pendingCount },
    ];
  }, [summary]);

  return (
    <section
      aria-label="Payments ledger overview and telemetry"
      className="card p-6 max-md:p-4 space-y-6"
    >
      {/* 4 Stats Cards Segmented Tray */}
      <div
        role="tablist"
        aria-label="Payment status filters"
        className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2.5 p-2 rounded-4xl bg-b-depth2 border border-s-subtle"
      >
        {cards.map((tab) => (
          <StatCardWithChart
            key={tab.id}
            id={`payments-tab-${tab.id}`}
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
            ariaControls="payments-trend-chart-panel"
          />
        ))}
      </div>

      {/* Interactive Horizontal Big Chart */}
      <div
        id="payments-trend-chart-panel"
        role="tabpanel"
        aria-label="Payments volume telemetry chart"
        className="pt-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sub-title-1 font-bold text-t-primary">
              {selectedCard && selectedCard !== 'ALL'
                ? `${selectedCard} Payments Velocity`
                : 'Payment Proof Submissions & Settlement Velocity'}
            </h3>
            <p className="text-caption text-t-secondary">
              {selectedCard && selectedCard !== 'ALL'
                ? `Filtered by ${selectedCard} status — click card again or Reset to clear`
                : 'Aggregated monthly submission and verification volume across all colleges'}
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
              data={telemetryData}
              margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="totalPaymentsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent, #0070f3)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent, #0070f3)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="approvedPaymentsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pendingPaymentsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
              <Tooltip content={<PaymentsChartTooltip />} />

              {selectedCard === 'APPROVED' ? (
                <Area
                  type="monotone"
                  dataKey="Approved"
                  name="Approved"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#approvedPaymentsGrad)"
                />
              ) : selectedCard === 'PENDING' ? (
                <Area
                  type="monotone"
                  dataKey="Pending"
                  name="Pending Queue"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#pendingPaymentsGrad)"
                />
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="Total"
                    name="Total Submissions"
                    stroke="var(--accent, #0070f3)"
                    strokeWidth={2}
                    fill="url(#totalPaymentsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Approved"
                    name="Settled Approved"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#approvedPaymentsGrad)"
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

