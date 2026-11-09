'use client';

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

/* ── Custom Interactive Tooltip for Requests Telemetry ── */
const RequestsChartTooltip = ({ active, payload, label }) => {
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

export default function SubscriptionRequestsStatsCards({
  counts = { new: 0, contacted: 0, approved: 0, rejected: 0 },
  selectedCard = null,
  onCardClick,
  timeSeriesData = [],
  onResetView,
}) {
  const cards = [
    {
      id: 'new',
      label: 'New Requests',
      value: counts.new ?? 0,
      caption: 'Awaiting first contact',
      delta: 12.5,
      isUpgrade: true,
      sparkline: [
        { val: 1 }, { val: 2 }, { val: 1 }, { val: 3 }, { val: 2 }, { val: counts.new ?? 0 }
      ],
    },
    {
      id: 'contacted',
      label: 'Contacted',
      value: counts.contacted ?? 0,
      caption: 'Under qualification',
      delta: 5.0,
      isUpgrade: true,
      sparkline: [
        { val: 0 }, { val: 1 }, { val: 2 }, { val: 1 }, { val: 2 }, { val: counts.contacted ?? 0 }
      ],
    },
    {
      id: 'approved',
      label: 'Approved',
      value: counts.approved ?? 0,
      caption: 'Workspaces provisioned',
      delta: 24.8,
      isUpgrade: true,
      sparkline: [
        { val: 3 }, { val: 4 }, { val: 5 }, { val: 6 }, { val: 7 }, { val: counts.approved ?? 0 }
      ],
    },
    {
      id: 'rejected',
      label: 'Rejected',
      value: counts.rejected ?? 0,
      caption: 'Ineligible / declined',
      delta: -8.3,
      isUpgrade: false,
      sparkline: [
        { val: 3 }, { val: 2 }, { val: 2 }, { val: 1 }, { val: 2 }, { val: counts.rejected ?? 0 }
      ],
    },
  ];

  const isDefaultView = selectedCard === null;

  return (
    <section
      aria-label="Subscription requests overview and interactive telemetry"
      className="card p-6 max-md:p-4 space-y-6"
    >
      {/* 4 Stats Cards Segmented Tray (New, Contacted, Approved, Rejected) */}
      <div
        role="tablist"
        aria-label="Subscription request status filters"
        className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2.5 p-2 rounded-4xl bg-b-depth2 border border-s-subtle"
      >
        {cards.map((card, idx) => (
          <StatCardWithChart
            key={card.id}
            id={`req-tab-${card.id}`}
            label={card.label}
            value={card.value}
            caption={card.caption}
            delta={card.delta}
            sparkline={card.sparkline}
            isUpgrade={card.isUpgrade}
            isSelected={selectedCard === card.id}
            onClick={() => onCardClick(card.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick(card.id);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next = (idx + 1) % cards.length;
                document.getElementById(`stat-card-req-tab-${cards[next].id}`)?.focus();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = (idx - 1 + cards.length) % cards.length;
                document.getElementById(`stat-card-req-tab-${cards[prev].id}`)?.focus();
              }
            }}
            ariaControls="requests-trend-chart-panel"
          />
        ))}
      </div>

      {/* Horizontal Interactive Telemetry Chart */}
      <div
        id="requests-trend-chart-panel"
        role="tabpanel"
        aria-label="Subscription requests telemetry chart"
        className="pt-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
          <div>
            <h3 className="text-h6 text-t-primary">
              {isDefaultView
                ? 'Subscription Requests Volume & Pipeline Telemetry'
                : selectedCard === 'new'
                ? 'New Applicant Inflow Timeline'
                : selectedCard === 'contacted'
                ? 'Contacted & Engagement Conversion Timeline'
                : selectedCard === 'approved'
                ? 'Provisioned Institutional Workspaces Timeline'
                : 'Declined Applications Audit Trail'}
            </h3>
            <p className="text-caption text-t-secondary mt-0.5">
              {isDefaultView
                ? 'Interactive 12-month intake breakdown across all application lifecycle phases'
                : `Focused monthly telemetry filtered by ${selectedCard.toUpperCase()} requests`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isDefaultView && (
              <button
                type="button"
                onClick={onResetView}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-semibold bg-b-depth2 hover:bg-b-depth1 text-t-secondary hover:text-t-primary border border-s-stroke2 transition-colors cursor-pointer"
              >
                <span>Reset View</span>
                <span className="font-mono text-[11px] opacity-75">✕</span>
              </button>
            )}

            {/* Chart Series Legend */}
            <div className="flex items-center gap-4 text-caption font-semibold">
              {(isDefaultView || selectedCard === 'new') && (
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#EF9D0E]" />
                  <span className="text-t-secondary">New</span>
                </div>
              )}
              {(isDefaultView || selectedCard === 'contacted') && (
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#0B4D94]" />
                  <span className="text-t-secondary">Contacted</span>
                </div>
              )}
              {(isDefaultView || selectedCard === 'approved') && (
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#00a656]" />
                  <span className="text-t-secondary">Approved</span>
                </div>
              )}
              {(isDefaultView || selectedCard === 'rejected') && (
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ff381c]" />
                  <span className="text-t-secondary">Rejected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Big Area Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeSeriesData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reqGradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF9D0E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF9D0E" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="reqGradContacted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B4D94" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0B4D94" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="reqGradApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a656" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00a656" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="reqGradRejected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff381c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ff381c" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-s-subtle opacity-40"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-t-secondary"
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-t-secondary"
              />
              <Tooltip content={<RequestsChartTooltip />} />

              {(isDefaultView || selectedCard === 'approved') && (
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke="#00a656"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#reqGradApproved)"
                />
              )}

              {(isDefaultView || selectedCard === 'contacted') && (
                <Area
                  type="monotone"
                  dataKey="contacted"
                  name="Contacted"
                  stroke="#0B4D94"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#reqGradContacted)"
                />
              )}

              {(isDefaultView || selectedCard === 'new') && (
                <Area
                  type="monotone"
                  dataKey="new"
                  name="New"
                  stroke="#EF9D0E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#reqGradNew)"
                />
              )}

              {(isDefaultView || selectedCard === 'rejected') && (
                <Area
                  type="monotone"
                  dataKey="rejected"
                  name="Rejected"
                  stroke="#ff381c"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#reqGradRejected)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

