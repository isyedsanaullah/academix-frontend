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

/* ── Interactive Chart Tooltip ── */
const CollegesChartTooltip = ({ active, payload, label }) => {
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

export default function CollegesStatsCards({
  statsCards = [],
  selectedCard,
  onCardClick,
  collegeTimeSeries = [],
  isInvitationsMode,
  isDefaultView,
  activeCfg,
  suspendedCfg,
  expiredCfg,
  onResetView,
}) {
  return (
    <section
      aria-label="Colleges overview and interactive filters"
      className="card p-6 max-md:p-4 space-y-6"
    >
      {/* 4 Stats Cards Segmented Tray */}
      <div
        role="tablist"
        aria-label="College directory filters"
        className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2.5 p-2 rounded-4xl bg-b-depth2 border border-s-subtle"
      >
        {statsCards.map((tab, idx) => (
          <StatCardWithChart
            key={tab.id}
            id={`colleges-tab-${tab.id}`}
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
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next = (idx + 1) % statsCards.length;
                document
                  .getElementById(`stat-card-colleges-tab-${statsCards[next].id}`)
                  ?.focus();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev =
                  (idx - 1 + statsCards.length) % statsCards.length;
                document
                  .getElementById(`stat-card-colleges-tab-${statsCards[prev].id}`)
                  ?.focus();
              }
            }}
            ariaControls="colleges-trend-chart-panel"
          />
        ))}
      </div>

      {/* Interactive Chart Panel Under the 4 Cards */}
      <div
        id="colleges-trend-chart-panel"
        role="tabpanel"
        aria-label="Colleges telemetry chart"
        className="pt-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
          <div>
            <h3 className="text-h6 text-t-primary">
              {isInvitationsMode
                ? 'Onboarding Invitations Activity (12 Months)'
                : selectedCard === 'active'
                  ? 'Active Workspaces Focus vs Platform Total'
                  : selectedCard === 'suspended'
                    ? 'Suspended Workspaces Focus vs Platform Total'
                    : selectedCard === 'expired'
                      ? 'Expired & Grace Period Workspaces'
                      : 'Platform College Workspaces Telemetry'}
            </h3>
            <p className="text-caption text-t-secondary mt-0.5">
              {isDefaultView
                ? 'Click any stat card above to filter the table and isolate that category in the chart'
                : 'Filter active; click the selected card again or click "Reset view" to view all colleges'}
            </p>
          </div>

          {/* Interactive Legend + Reset Control */}
          <div className="flex flex-wrap items-center gap-4 text-caption">
            {!isInvitationsMode ? (
              <>
                <button
                  type="button"
                  onClick={() => onCardClick('active')}
                  className={`inline-flex items-center gap-2 font-medium transition-opacity cursor-pointer ${
                    isDefaultView || selectedCard === 'active'
                      ? 'opacity-100 text-t-primary'
                      : 'opacity-40 text-t-secondary hover:opacity-80'
                  }`}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: 'var(--chart-2)' }}
                  />
                  <span>Active</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCardClick('suspended')}
                  className={`inline-flex items-center gap-2 font-medium transition-opacity cursor-pointer ${
                    isDefaultView || selectedCard === 'suspended'
                      ? 'opacity-100 text-t-primary'
                      : 'opacity-40 text-t-secondary hover:opacity-80'
                  }`}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: 'var(--primary-03)' }}
                  />
                  <span>Suspended</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCardClick('expired')}
                  className={`inline-flex items-center gap-2 font-medium transition-opacity cursor-pointer ${
                    isDefaultView || selectedCard === 'expired'
                      ? 'opacity-100 text-t-primary'
                      : 'opacity-40 text-t-secondary hover:opacity-80'
                  }`}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: '#EF9D0E' }}
                  />
                  <span>Expired / Grace</span>
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-2 font-medium text-t-primary">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: 'var(--chart-1)' }}
                />
                <span>Invitations Pipeline</span>
              </span>
            )}

            {selectedCard !== null && (
              <button
                type="button"
                onClick={onResetView}
                className="ml-1 px-2.5 py-1 rounded-full bg-b-surface1 border border-s-subtle text-[11px] font-semibold text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
              >
                Reset view
              </button>
            )}
          </div>
        </div>

        <div className="h-64 max-md:h-52 w-full transition-opacity duration-250">
          <ResponsiveContainer width="100%" height="100%">
            {isInvitationsMode ? (
              <AreaChart
                data={collegeTimeSeries}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gInvLine" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.32}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  allowDecimals={false}
                  width={38}
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CollegesChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="invitations"
                  name="Invitations"
                  stroke="var(--chart-1)"
                  strokeWidth={2.75}
                  fill="url(#gInvLine)"
                  isAnimationActive
                  animationDuration={250}
                />
              </AreaChart>
            ) : (
              <AreaChart
                data={collegeTimeSeries}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gActiveCol" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-2)"
                      stopOpacity={activeCfg.fillOpacity}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="gSuspendedCol"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--primary-03)"
                      stopOpacity={suspendedCfg.fillOpacity}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary-03)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gExpiredCol" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="#EF9D0E"
                      stopOpacity={expiredCfg.fillOpacity}
                    />
                    <stop
                      offset="100%"
                      stopColor="#EF9D0E"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  allowDecimals={false}
                  width={38}
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CollegesChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="active"
                  name="Active Colleges"
                  stroke={activeCfg.stroke}
                  strokeOpacity={activeCfg.strokeOpacity}
                  strokeWidth={activeCfg.strokeWidth}
                  fill="url(#gActiveCol)"
                  isAnimationActive
                  animationDuration={250}
                />
                <Area
                  type="monotone"
                  dataKey="suspended"
                  name="Suspended Colleges"
                  stroke={suspendedCfg.stroke}
                  strokeOpacity={suspendedCfg.strokeOpacity}
                  strokeWidth={suspendedCfg.strokeWidth}
                  fill="url(#gSuspendedCol)"
                  isAnimationActive
                  animationDuration={250}
                />
                <Area
                  type="monotone"
                  dataKey="expired"
                  name="Expired / Grace"
                  stroke={expiredCfg.stroke}
                  strokeOpacity={expiredCfg.strokeOpacity}
                  strokeWidth={expiredCfg.strokeWidth}
                  fill="url(#gExpiredCol)"
                  isAnimationActive
                  animationDuration={250}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

