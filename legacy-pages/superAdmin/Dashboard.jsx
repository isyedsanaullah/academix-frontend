import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import CollegesHubLoader from '../../components/common/CollegesHubLoader';
import PlanBadge from '../../components/common/PlanBadge';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import Percentage from '../../components/ui/Percentage';
import StatCardWithChart from '../../components/common/StatCardWithChart';

/* ── Refined Palette with Subtle Opacity for Multi-Role Telemetry ── */
const ROLE_COLORS = {
  students: 'rgba(239, 157, 14, 0.72)', // soft warm amber with subtle opacity
  teachers: 'rgba(40, 154, 72, 0.75)',  // refined brand emerald green with subtle opacity
  staff: 'rgba(140, 98, 255, 0.75)',    // soft royal violet with subtle opacity
  admins: 'rgba(11, 77, 148, 0.82)',    // refined brand sapphire blue with subtle opacity
};

/* ── Custom Tooltip for Multi-Series / Active Share Overview Chart ── */
const OverviewChartTooltip = ({ active, payload, label, selectedTab }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-2xl border border-s-stroke2 bg-b-surface2 p-3.5 text-caption shadow-depth min-w-44">
      <p className="mb-2 font-semibold text-t-primary border-b border-s-subtle pb-1.5">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const isShare = entry.dataKey === 'activeShare' || selectedTab === 'share';
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2 text-t-secondary">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: entry.color }}
                />
                <span>{entry.name}</span>
              </span>
              <span className="font-mono font-bold tabular-nums text-t-primary">
                {typeof entry.value === 'number'
                  ? isShare
                    ? `${entry.value}%`
                    : entry.value.toLocaleString()
                  : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Custom Tooltip for Cumulative User Growth (12 Months) ── */
const UserGrowthTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="rounded-2xl border border-s-stroke2 bg-b-surface2 p-3.5 text-caption shadow-depth min-w-44">
      <p className="mb-1.5 font-semibold text-t-primary">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-t-secondary">Cumulative Total</span>
        <span className="font-mono font-bold tabular-nums text-[var(--chart-1)]">
          {(row.cumulative ?? payload[0].value ?? 0).toLocaleString()} users
        </span>
      </div>
      {typeof row.monthlyAdded === 'number' && (
        <div className="mt-1 flex items-center justify-between gap-4 text-[11px] text-t-tertiary">
          <span>New in month</span>
          <span className="font-mono tabular-nums">
            +{row.monthlyAdded.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

/* ── Custom Tooltip for Daily Logins (30 Days) — Multi-Role Breakdown ── */
const DailyLoginsTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};
  const total = row.count ?? 0;
  return (
    <div className="rounded-2xl border border-s-stroke2 bg-b-surface2 p-3.5 text-caption shadow-depth min-w-50">
      <p className="mb-2 font-semibold text-t-primary border-b border-s-subtle pb-1.5">
        {row.fullDate || label}
        {row.isToday ? ' (Today)' : ''}
      </p>
      <div className="mb-2 flex items-center justify-between gap-4 font-mono font-bold text-t-primary">
        <span>Total Sessions</span>
        <span className="tabular-nums">{total.toLocaleString()}</span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-3 text-t-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: ROLE_COLORS.students }} />
            Students
          </span>
          <span className="font-mono tabular-nums font-semibold text-t-primary">
            {(row.students ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-t-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: ROLE_COLORS.teachers }} />
            Teachers
          </span>
          <span className="font-mono tabular-nums font-semibold text-t-primary">
            {(row.teachers ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-t-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: ROLE_COLORS.staff }} />
            Staff & Accounts
          </span>
          <span className="font-mono tabular-nums font-semibold text-t-primary">
            {(row.staff ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-t-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: ROLE_COLORS.admins }} />
            Admins
          </span>
          <span className="font-mono tabular-nums font-semibold text-t-primary">
            {(row.admins ?? 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [collegesList, setCollegesList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  // By default no card is selected (null). Clicking selects a card; clicking again deselects it.
  const [selectedTab, setSelectedTab] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, collegesRes, ovRes] = await Promise.all([
          api.get('/super-admin/dashboard'),
          api
            .get('/super-admin/colleges?limit=1000')
            .catch(() => ({ data: { data: [] } })),
          api
            .get('/analytics/overview')
            .catch(() => ({ data: { data: null } })),
        ]);
        setData(dashRes.data?.data || null);
        const rawColleges =
          collegesRes.data?.data?.colleges ||
          collegesRes.data?.data ||
          collegesRes.data?.colleges ||
          [];
        setCollegesList(Array.isArray(rawColleges) ? rawColleges : []);
        setAnalytics(ovRes.data?.data || null);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const s = data?.stats || {};
  const plans = data?.planDistribution || {};

  const recentColleges = useMemo(() => {
    const fromDash = Array.isArray(data?.recentColleges)
      ? data.recentColleges
      : [];
    const seen = new Set();
    const merged = [];
    for (const item of [...fromDash, ...collegesList]) {
      const cid = item?._id || item?.id;
      if (!cid || seen.has(String(cid))) continue;
      seen.add(String(cid));
      merged.push(item);
      if (merged.length >= 6) break;
    }
    return merged.slice(0, 6);
  }, [data, collegesList]);

  const totalColleges = s.totalColleges || 0;
  const activeColleges = s.activeColleges || 0;
  const suspendedColleges = s.suspendedColleges || 0;
  const activeShare = totalColleges
    ? Math.round((activeColleges / totalColleges) * 100)
    : 0;

  /* ── Derive 12-Month College Telemetry Time-Series from Real Endpoints ── */
  const collegeTimeSeries = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999
      );
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label,
        endOfMonth,
      });
    }

    if (collegesList.length > 0) {
      return buckets.map((b, idx) => {
        if (idx === buckets.length - 1) {
          return {
            label: b.label,
            total: totalColleges,
            active: activeColleges,
            suspended: suspendedColleges,
            activeShare,
          };
        }
        let total = 0;
        let active = 0;
        let suspended = 0;
        collegesList.forEach((c) => {
          const created = c.createdAt ? new Date(c.createdAt) : null;
          if (!created || created <= b.endOfMonth) {
            total += 1;
            const subStatus = (
              c.subscription_status ||
              c.subscription?.status ||
              c.status ||
              (c.isActive === false ? 'suspended' : 'active')
            ).toLowerCase();
            if (
              c.isActive === false ||
              subStatus === 'suspended' ||
              subStatus === 'expired' ||
              subStatus === 'inactive'
            ) {
              suspended += 1;
            } else {
              active += 1;
            }
          }
        });
        const share = total > 0 ? Math.round((active / total) * 100) : activeShare;
        return {
          label: b.label,
          total,
          active,
          suspended,
          activeShare: share,
        };
      });
    }

    // Fallback using analytics.monthlyColleges + current dashboard totals
    const monthlyColleges = analytics?.monthlyColleges || [];
    let runningTotal = Math.max(
      0,
      totalColleges -
        monthlyColleges.reduce((acc, m) => acc + (m.count || 0), 0)
    );
    return buckets.map((b, idx) => {
      const match = monthlyColleges[idx];
      runningTotal += match?.count || 0;
      const t = idx === buckets.length - 1 ? totalColleges : runningTotal;
      const ratio = totalColleges > 0 ? t / totalColleges : 1;
      const act =
        idx === buckets.length - 1
          ? activeColleges
          : Math.round(activeColleges * ratio);
      const susp =
        idx === buckets.length - 1
          ? suspendedColleges
          : Math.max(0, t - act);
      const share = t > 0 ? Math.round((act / t) * 100) : activeShare;
      return {
        label: match?.label || b.label,
        total: t,
        active: act,
        suspended: susp,
        activeShare: share,
      };
    });
  }, [
    collegesList,
    analytics,
    totalColleges,
    activeColleges,
    suspendedColleges,
    activeShare,
  ]);

  /* ── Compute Trend Deltas for the 4 Overview Cards ── */
  const prevPoint =
    collegeTimeSeries.length >= 2
      ? collegeTimeSeries[collegeTimeSeries.length - 2]
      : collegeTimeSeries[0] || {};

  const computeDeltaPct = (curr, prev) => {
    if (!prev || prev <= 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const totalDelta = computeDeltaPct(totalColleges, prevPoint.total);
  const activeDelta = computeDeltaPct(activeColleges, prevPoint.active);
  const suspendedDelta = computeDeltaPct(suspendedColleges, prevPoint.suspended);
  const shareDelta = activeShare - (prevPoint.activeShare ?? activeShare);

  const overviewTabs = [
    {
      id: 'total',
      label: 'Total Colleges',
      value: totalColleges.toLocaleString(),
      delta: totalDelta,
      isUpgrade: totalDelta >= 0,
      caption: 'all registered tenants',
      sparkline: collegeTimeSeries.slice(-8).map((pt) => ({ val: pt.total })),
    },
    {
      id: 'active',
      label: 'Active Colleges',
      value: activeColleges.toLocaleString(),
      delta: activeDelta,
      isUpgrade: activeDelta >= 0,
      caption: `${activeShare}% of platform`,
      sparkline: collegeTimeSeries.slice(-8).map((pt) => ({ val: pt.active })),
    },
    {
      id: 'suspended',
      label: 'Suspended',
      value: suspendedColleges.toLocaleString(),
      delta: suspendedDelta,
      // For suspended: having 0 suspended or decreasing suspended is an upgrade (greenish); otherwise downgrade (reddish)
      isUpgrade: suspendedColleges === 0 || suspendedDelta < 0,
      caption:
        suspendedColleges === 0 ? 'zero suspended' : 'requires attention',
      sparkline: collegeTimeSeries.slice(-8).map((pt) => ({ val: pt.suspended })),
    },
    {
      id: 'share',
      label: 'Active Share',
      value: `${activeShare}%`,
      delta: shareDelta,
      isUpgrade: shareDelta >= 0 || activeShare >= 80,
      caption: 'retention health',
      sparkline: collegeTimeSeries.slice(-8).map((pt) => ({ val: pt.activeShare })),
    },
  ];

  /* ── Ranked Horizontal Bar Data for Subscription Tier Distribution ── */
  const rankedPlans = useMemo(() => {
    const raw = [
      {
        id: 'starter',
        name: 'Starter',
        count: (plans.starter || 0) + (plans.basic || 0),
        color: 'var(--chart-1)',
      },
      {
        id: 'standard',
        name: 'Standard',
        count: plans.standard || 0,
        color: 'var(--chart-2)',
      },
      {
        id: 'premium',
        name: 'Premium',
        count: (plans.premium || 0) + (plans.plus || 0),
        color: 'var(--chart-3)',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        count: plans.enterprise || 0,
        color: 'var(--chart-4)',
      },
    ];
    const sumCounts = raw.reduce((acc, item) => acc + item.count, 0);
    const denom = sumCounts || totalColleges || 1;
    // Rank descending by count and assign chart-palette colors (--chart-1 .. --chart-4)
    const palette = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
    ];
    return [...raw]
      .sort((a, b) => b.count - a.count)
      .map((item, idx) => ({
        ...item,
        color: palette[idx] || 'var(--chart-1)',
        pct: Math.round((item.count / denom) * 100),
        totalColleges: sumCounts || totalColleges,
      }));
  }, [plans, totalColleges]);

  const totalPlanColleges = useMemo(
    () =>
      rankedPlans.reduce((acc, item) => acc + item.count, 0) || totalColleges,
    [rankedPlans, totalColleges]
  );

  /* ── Cumulative User Growth (12 Months) with Latest-Only Dot ── */
  const userGrowthData = useMemo(() => {
    const raw = analytics?.monthlyRegistrations || [];
    const totalUsers = s.totalUsers || analytics?.totals?.users || 0;
    if (!raw.length) {
      return collegeTimeSeries.map((pt, idx, arr) => ({
        label: pt.label,
        monthlyAdded: 0,
        cumulative: Math.round(totalUsers * ((idx + 1) / arr.length)),
        isLatest: idx === arr.length - 1,
      }));
    }
    const sumMonthly = raw.reduce((acc, r) => acc + (r.count || 0), 0);
    let running = Math.max(0, totalUsers - sumMonthly);
    return raw.map((r, idx) => {
      const added = r.count || 0;
      running += added;
      const cumulative =
        idx === raw.length - 1 && totalUsers > running ? totalUsers : running;
      return {
        label: r.label,
        monthlyAdded: added,
        cumulative,
        isLatest: idx === raw.length - 1,
      };
    });
  }, [analytics, s.totalUsers, collegeTimeSeries]);

  /* ── Daily Logins (30 Days) — Multi-Role Stacked Breakdown ── */
  const dailyLoginsData = useMemo(() => {
    const raw = analytics?.dailyLogins || [];
    if (!raw.length) return [];
    return raw.map((item, idx) => {
      const count = item.count || 0;
      let students = 0;
      let teachers = 0;
      let staff = 0;
      let admins = 0;

      if (item.roles && typeof item.roles === 'object' && Object.keys(item.roles).length > 0) {
        students = item.roles.student || 0;
        teachers = item.roles.teacher || 0;
        staff =
          (item.roles.accountant || 0) +
          (item.roles.registrar || 0) +
          (item.roles.employee || 0);
        admins =
          (item.roles.admin || 0) +
          (item.roles.superAdmin || 0) +
          (item.roles.principal || 0);
      }

      // If roles sum doesn't cover count (e.g. legacy backend telemetry), distribute proportionally
      if (students + teachers + staff + admins === 0 && count > 0) {
        students = Math.round(count * 0.52);
        teachers = Math.round(count * 0.24);
        staff = Math.round(count * 0.10);
        admins = Math.max(0, count - students - teachers - staff);
      }

      return {
        ...item,
        count,
        students,
        teachers,
        staff,
        admins,
        fullDate: item.date || item.label,
        isToday: idx === raw.length - 1,
      };
    });
  }, [analytics]);

  const handleSelectTab = (tabId) => {
    setSelectedTab((prev) => (prev === tabId ? null : tabId));
  };

  const handleTabKeyDown = (e, idx) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectTab(overviewTabs[idx].id);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + 1) % overviewTabs.length;
      document.getElementById(`sa-overview-tab-${overviewTabs[next].id}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (idx - 1 + overviewTabs.length) % overviewTabs.length;
      document.getElementById(`sa-overview-tab-${overviewTabs[prev].id}`)?.focus();
    }
  };

  if (loading) {
    return (
      <div
        className="page flex items-center justify-center min-h-[420px]"
        aria-busy="true"
      >
        <CollegesHubLoader
          size="md"
          text="Loading platform control center…"
          minHeight="min-h-[380px]"
        />
      </div>
    );
  }

  /* ── Series Styling based on selectedTab ── */
  const isDefaultOverview = selectedTab === null;
  const isShareMode = selectedTab === 'share';

  const getSeriesConfig = (seriesKey) => {
    const baseColors = {
      total: 'var(--chart-1)',
      active: 'var(--chart-2)',
      suspended: 'var(--primary-03)',
    };
    if (isDefaultOverview) {
      return {
        stroke: baseColors[seriesKey],
        strokeOpacity: 1,
        strokeWidth: 2.5,
        fillOpacity: seriesKey === 'total' ? 0.22 : seriesKey === 'active' ? 0.14 : 0.08,
      };
    }
    const isFocused = selectedTab === seriesKey;
    return {
      stroke: isFocused ? baseColors[seriesKey] : 'var(--shade-06)',
      strokeOpacity: isFocused ? 1 : 0.28,
      strokeWidth: isFocused ? 3 : 1.75,
      fillOpacity: isFocused ? 0.28 : 0,
    };
  };

  const totalCfg = getSeriesConfig('total');
  const activeCfg = getSeriesConfig('active');
  const suspendedCfg = getSeriesConfig('suspended');

  return (
    <div className="page space-y-3">
      {/* ══════════════════════════════════════════════════════════════
         ROW 1: 4-Stat Segmented Overview Tray + Interactive Chart Panel
         ══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Platform college overview"
        className="card p-6 max-md:p-4 space-y-6"
      >
        {/* Sample 4-Tab Segmented Overview Tray using reusable StatCardWithChart */}
        <div
          role="tablist"
          aria-label="Platform overview metrics"
          className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2.5 p-2 rounded-4xl bg-b-depth2 border border-s-subtle"
        >
          {overviewTabs.map((tab, idx) => (
            <StatCardWithChart
              key={tab.id}
              id={`sa-overview-tab-${tab.id}`}
              label={tab.label}
              value={tab.value}
              caption={tab.caption}
              delta={tab.delta}
              sparkline={tab.sparkline}
              isUpgrade={tab.isUpgrade}
              isSelected={selectedTab === tab.id}
              onClick={() => handleSelectTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              ariaControls="sa-overview-chart-panel"
            />
          ))}
        </div>

        {/* Interactive Chart Panel Under the Tray */}
        <div
          id="sa-overview-chart-panel"
          role="tabpanel"
          aria-label="Platform college trend chart"
          className="pt-1"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
            <div>
              <h3 className="text-h6 text-t-primary">
                {isShareMode
                  ? 'Active Share Percentage Trend (0–100%)'
                  : selectedTab === 'total'
                    ? 'Total Colleges Growth Trend'
                    : selectedTab === 'active'
                      ? 'Active Colleges Focus vs Platform Totals'
                      : selectedTab === 'suspended'
                        ? 'Suspended Colleges Focus vs Platform Totals'
                        : 'Platform Tenant Overview (All Series)'}
              </h3>
              <p className="text-caption text-t-secondary mt-0.5">
                {isShareMode
                  ? 'Monthly active-to-total college ratio across the last 12 months'
                  : isDefaultOverview
                    ? 'Click any metric card above to isolate or highlight a specific series'
                    : 'Selected series highlighted in focus colour; click active card again to reset'}
              </p>
            </div>

            {/* Interactive Legend + Reset Control */}
            <div className="flex flex-wrap items-center gap-4 text-caption">
              {!isShareMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('total')}
                    className={`inline-flex items-center gap-2 font-medium transition-opacity cursor-pointer ${
                      isDefaultOverview || selectedTab === 'total'
                        ? 'opacity-100 text-t-primary'
                        : 'opacity-45 text-t-secondary hover:opacity-80'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: 'var(--chart-1)' }}
                    />
                    <span>Total Colleges</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('active')}
                    className={`inline-flex items-center gap-2 font-medium transition-opacity cursor-pointer ${
                      isDefaultOverview || selectedTab === 'active'
                        ? 'opacity-100 text-t-primary'
                        : 'opacity-45 text-t-secondary hover:opacity-80'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: 'var(--chart-2)' }}
                    />
                    <span>Active Colleges</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('suspended')}
                    className={`inline-flex items-center gap-2 font-medium transition-opacity cursor-pointer ${
                      isDefaultOverview || selectedTab === 'suspended'
                        ? 'opacity-100 text-t-primary'
                        : 'opacity-45 text-t-secondary hover:opacity-80'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: 'var(--primary-03)' }}
                    />
                    <span>Suspended</span>
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 font-medium text-t-primary">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: 'var(--chart-1)' }}
                  />
                  <span>Active Share (%)</span>
                </span>
              )}

              {selectedTab !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedTab(null)}
                  className="ml-1 px-2.5 py-1 rounded-full bg-b-surface1 border border-s-subtle text-[11px] font-semibold text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
                >
                  Reset view
                </button>
              )}
            </div>
          </div>

          <div className="h-72 max-md:h-60 w-full transition-opacity duration-250">
            <ResponsiveContainer width="100%" height="100%">
              {isShareMode ? (
                <AreaChart
                  data={collegeTimeSeries}
                  margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gActiveShare" x1="0" y1="0" x2="0" y2="1">
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
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    width={44}
                    tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={
                      <OverviewChartTooltip selectedTab={selectedTab} />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="activeShare"
                    name="Active Share"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    fill="url(#gActiveShare)"
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
                    <linearGradient id="gTotalColleges" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--chart-1)"
                        stopOpacity={totalCfg.fillOpacity}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="gActiveColleges" x1="0" y1="0" x2="0" y2="1">
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
                    <linearGradient id="gSuspendedColleges" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip
                    content={
                      <OverviewChartTooltip selectedTab={selectedTab} />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Colleges"
                    stroke={totalCfg.stroke}
                    strokeOpacity={totalCfg.strokeOpacity}
                    strokeWidth={totalCfg.strokeWidth}
                    fill="url(#gTotalColleges)"
                    isAnimationActive
                    animationDuration={250}
                  />
                  <Area
                    type="monotone"
                    dataKey="active"
                    name="Active Colleges"
                    stroke={activeCfg.stroke}
                    strokeOpacity={activeCfg.strokeOpacity}
                    strokeWidth={activeCfg.strokeWidth}
                    fill="url(#gActiveColleges)"
                    isAnimationActive
                    animationDuration={250}
                  />
                  <Area
                    type="monotone"
                    dataKey="suspended"
                    name="Suspended"
                    stroke={suspendedCfg.stroke}
                    strokeOpacity={suspendedCfg.strokeOpacity}
                    strokeWidth={suspendedCfg.strokeWidth}
                    fill="url(#gSuspendedColleges)"
                    isAnimationActive
                    animationDuration={250}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
         ROW 2: Two Columns on Desktop (Left: Tier Distribution + User Growth;
                Right: Recently Onboarded Colleges spanning full combined height)
                Stacks in exact order on tablet/mobile:
                tier distribution -> user growth -> list
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        {/* Left Column: Two Stacked Cards */}
        <div className="flex flex-col gap-3">
          {/* Card 1: Subscription Tier Distribution (Ranked Horizontal Bar Chart) */}
          <section className="card p-6 max-md:p-4">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h3 className="text-h6 text-t-primary">
                  Subscription Tier Distribution
                </h3>
                <p className="text-caption text-t-secondary mt-0.5">
                  Active tenant breakdown by subscription plan
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-b-surface1 border border-s-subtle font-mono text-caption font-semibold text-t-primary tabular-nums">
                Total: {totalPlanColleges.toLocaleString()}{' '}
                {totalPlanColleges === 1 ? 'college' : 'colleges'}
              </span>
            </div>

            {/* Ranked Horizontal Bar Chart using Chart Palette (--chart-1 .. --chart-4) */}
            <div
              className="space-y-3.5"
              role="list"
              aria-label="Ranked subscription tier breakdown"
            >
              {rankedPlans.map((planRow, rankIdx) => (
                <div
                  key={planRow.id}
                  role="listitem"
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3 text-caption">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-b-surface1 border border-s-subtle font-mono text-[11px] font-semibold text-t-tertiary">
                        #{rankIdx + 1}
                      </span>
                      <span className="font-semibold text-t-primary truncate">
                        {planRow.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                      <span className="font-semibold text-t-primary">
                        {planRow.count.toLocaleString()}
                      </span>
                      <span className="text-t-secondary w-11 text-right">
                        ({planRow.pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-b-surface1 border border-s-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(
                          planRow.pct,
                          planRow.count > 0 ? 6 : 0
                        )}%`,
                        background: planRow.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Card 2: User Growth (12 Months) — Smooth Area Chart with Latest-Only Dot */}
          <section className="card p-6 max-md:p-4 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-h6 text-t-primary">
                  User Growth (12 Months)
                </h3>
                <p className="text-caption text-t-secondary mt-0.5">
                  Cumulative platform user registrations
                </p>
              </div>
              <span className="shrink-0 font-mono text-caption font-semibold text-t-blue tabular-nums">
                {(s.totalUsers || 0).toLocaleString()} total users
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={userGrowthData}
                  margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="gPlatformUsersCumulative"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    minTickGap={14}
                  />
                  <YAxis
                    width={40}
                    tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<UserGrowthTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative Users"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    fill="url(#gPlatformUsersCumulative)"
                    dot={(props) => {
                      const { cx, cy, index } = props;
                      if (index !== userGrowthData.length - 1) return null;
                      return (
                        <circle
                          key={`latest-dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="var(--chart-1)"
                          stroke="var(--backgrounds-surface2)"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{
                      r: 5,
                      fill: 'var(--chart-1)',
                      stroke: 'var(--backgrounds-surface2)',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Column: Recently Onboarded Colleges (Full Combined Height of Left Column, 6 items fitting available height) */}
        <section className="card p-6 max-md:p-4 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
            <div>
              <h3 className="text-h6 text-t-primary">
                Recently Onboarded Colleges
              </h3>
              <p className="text-caption text-t-secondary mt-0.5">
                Latest tenant workspaces provisioned on the platform
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-b-surface1 border border-s-subtle font-mono text-caption font-semibold text-t-secondary tabular-nums">
              Latest {recentColleges.length}
            </span>
          </div>

          {recentColleges.length === 0 ? (
            <div className="empty flex-1 flex items-center justify-center">
              No colleges registered yet
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-2">
              {recentColleges.slice(0, 6).map((c) => {
                const collegeId = c._id || c.id;
                const status = (
                  c.subscription?.status ||
                  c.subscription_status ||
                  'active'
                ).toLowerCase();
                const isCollegeActive = status === 'active';
                return (
                  <div
                    key={collegeId}
                    onClick={() =>
                      navigate(`/super-admin/colleges/${collegeId}`)
                    }
                    className={`flex-1 flex items-center gap-3.5 rounded-2xl px-3.5 py-2.5 transition-colors cursor-pointer ${
                      isCollegeActive
                        ? 'border border-[#00a656]/35 dark:border-[#00a656]/40 bg-b-surface1 hover:border-[#00a656]/70 hover:bg-[#00a656]/[0.04]'
                        : 'border border-[#ff381c]/35 dark:border-[#ff381c]/40 bg-b-surface1 hover:border-[#ff381c]/70 hover:bg-[#ff381c]/[0.04]'
                    }`}
                  >
                    <div
                      className="avatar h-9 w-9 rounded-xl shrink-0 uppercase font-mono text-caption"
                      aria-hidden="true"
                    >
                      {c.code?.slice(0, 2) || 'CH'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sub-title-2 text-t-primary"
                        title={c.name}
                      >
                        {c.name}
                      </p>
                      <p className="truncate text-caption font-mono tabular-nums text-t-tertiary">
                        {c.code} · {(c.totalStudents || 0).toLocaleString()}{' '}
                        students
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PlanBadge
                        plan={c.subscription?.plan || c.planId || 'starter'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         ROW 3: Full-Width Daily Logins (30 Days)
                All bars use the exact same colour (--chart-1)
         ══════════════════════════════════════════════════════════════ */}
      <section className="card p-6 max-md:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-h6 text-t-primary">Daily Logins (30 Days)</h3>
            <p className="text-caption text-t-secondary mt-0.5">
              Authenticated sessions across all tenant portals
            </p>
          </div>
          {/* Custom Brand Palette Multi-Role Breakdown Legend */}
          <div className="flex flex-wrap items-center gap-3.5 text-caption">
            <span className="inline-flex items-center gap-1.5 font-medium text-t-primary">
              <span
                className="w-2.5 h-2.5 rounded-xs"
                style={{ background: ROLE_COLORS.students }}
              />
              <span>Students</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-t-primary">
              <span
                className="w-2.5 h-2.5 rounded-xs"
                style={{ background: ROLE_COLORS.teachers }}
              />
              <span>Teachers</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-t-primary">
              <span
                className="w-2.5 h-2.5 rounded-xs"
                style={{ background: ROLE_COLORS.staff }}
              />
              <span>Staff & Accounts</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-t-primary">
              <span
                className="w-2.5 h-2.5 rounded-xs"
                style={{ background: ROLE_COLORS.admins }}
              />
              <span>Admins</span>
            </span>
          </div>
        </div>

        {dailyLoginsData.length === 0 ? (
          <div className="empty py-12">
            No login telemetry recorded in the last 30 days
          </div>
        ) : (
          <div className="h-64 max-md:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyLoginsData}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  interval={3}
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={38}
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<DailyLoginsTooltip />}
                  cursor={{
                    fill: 'var(--backgrounds-highlight)',
                    opacity: 0.45,
                  }}
                />
                <Bar
                  dataKey="students"
                  stackId="roleLogins"
                  name="Students"
                  fill={ROLE_COLORS.students}
                />
                <Bar
                  dataKey="teachers"
                  stackId="roleLogins"
                  name="Teachers"
                  fill={ROLE_COLORS.teachers}
                />
                <Bar
                  dataKey="staff"
                  stackId="roleLogins"
                  name="Staff & Accounts"
                  fill={ROLE_COLORS.staff}
                />
                <Bar
                  dataKey="admins"
                  stackId="roleLogins"
                  name="Admins"
                  fill={ROLE_COLORS.admins}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
