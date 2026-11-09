'use client';

import { useState } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Icon from '@/components/Icon';
import { useAccountingOverview } from '@/features/superAdminFinance/hooks/useFinance';
import { formatPKR, formatPKRCompact, formatMoM } from '@/lib/money';

function AccountingOverviewContent() {
  const [includeTest, setIncludeTest] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useAccountingOverview({ includeTest });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-t-secondary font-medium">Loading financial metrics...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-6 border-s-danger/30 text-center space-y-3">
        <p className="text-t-danger font-medium">Failed to load accounting overview.</p>
        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs px-3 py-1.5 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { cards, charts } = data || {};
  const mom = cards?.thisMonthVsLastMonth;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Accounting Overview</h1>
          <p className="text-sm text-t-secondary mt-0.5">
            Institutional revenue, settlement velocity, and subscription tier distributions (Asia/Karachi).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-t-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeTest}
              onChange={(e) => setIncludeTest(e.target.checked)}
              className="rounded border-s-stroke bg-b-surface1 text-accent focus:ring-accent"
            />
            Include Test Data
          </label>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5 rounded-xl"
            title="Refresh overview metrics"
          >
            <Icon name="refresh" className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue Collected */}
        <div className="card p-5 space-y-2 border-s-stroke hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between text-t-secondary text-xs font-medium">
            <span>Total Revenue Collected</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Icon name="wallet" className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-t-primary">
            {formatPKR(cards?.totalRevenueCollected)}
          </div>
          <p className="text-xs text-t-tertiary">
            Settled approved subscription payments
          </p>
        </div>

        {/* Card 2: Pending Amount */}
        <div className="card p-5 space-y-2 border-s-stroke hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between text-t-secondary text-xs font-medium">
            <span>Pending Amount</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Icon name="clock" className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-t-primary">
            {formatPKR(cards?.pendingAmount)}
          </div>
          <p className="text-xs text-t-tertiary">
            Awaiting Superadmin proof verification
          </p>
        </div>

        {/* Card 3: Billing Queue & SLA */}
        <div className="card p-5 space-y-2 border-s-stroke hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between text-t-secondary text-xs font-medium">
            <span>Billing Queue</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Icon name="layers" className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-t-primary">
            {cards?.billingQueue?.count ?? 0}
          </div>
          <div className="text-xs text-t-tertiary flex items-center justify-between">
            <span>SLA Breached (&gt;24h):</span>
            <span className={`font-semibold ${cards?.billingQueue?.slaBreached > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {cards?.billingQueue?.slaBreached ?? 0}
            </span>
          </div>
        </div>

        {/* Card 4: This Month vs Last Month */}
        <div className="card p-5 space-y-2 border-s-stroke hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between text-t-secondary text-xs font-medium">
            <span>This Month</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Icon name="sparkles" className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-t-primary">
            {formatPKRCompact(mom?.thisMonth)}
          </div>
          <div className="text-xs text-t-tertiary flex items-center gap-1.5">
            {mom?.isNewBaseline ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600">
                New Baseline
              </span>
            ) : (
              <span className={`font-semibold ${mom?.diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatMoM(mom?.percentage)}
              </span>
            )}
            <span>vs last month ({formatPKRCompact(mom?.lastMonth)})</span>
          </div>
        </div>
      </div>

      {/* Revenue by Subscription Plan Breakdown */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-t-primary">Revenue by Subscription Plan</h2>
          <span className="text-xs text-t-tertiary">All Canonical Tiers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { key: 'starter', label: 'Starter Tier', bg: 'bg-blue-500' },
            { key: 'standard', label: 'Standard Tier', bg: 'bg-emerald-500' },
            { key: 'premium', label: 'Premium Tier', bg: 'bg-purple-500' },
            { key: 'enterprise', label: 'Enterprise Tier', bg: 'bg-amber-500' },
            { key: 'addons_credits', label: 'Add-ons & Credits', bg: 'bg-cyan-500' },
          ].map((item) => {
            const planData = cards?.revenueByPlan?.[item.key] || { amount: 0, count: 0, percentage: 0 };
            return (
              <div key={item.key} className="p-4 rounded-xl bg-b-surface2/60 border border-s-stroke space-y-2">
                <div className="text-xs font-medium text-t-secondary">{item.label}</div>
                <div className="text-lg font-bold text-t-primary">{formatPKRCompact(planData.amount)}</div>
                <div className="w-full bg-b-surface1 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${item.bg}`}
                    style={{ width: `${Math.min(100, Math.max(0, planData.percentage))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-t-tertiary">
                  <span>{planData.count} payments</span>
                  <span>{planData.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Revenue Trend & Distribution Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Summary */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-t-primary">Monthly Revenue Trend (Last 6 Months)</h2>
            <span className="text-xs text-t-secondary font-mono">Asia/Karachi</span>
          </div>

          <div className="space-y-3 pt-2">
            {charts?.revenueTrend?.map((t) => (
              <div key={t.month} className="flex items-center justify-between py-2 border-b border-s-stroke last:border-0">
                <div className="text-sm font-medium text-t-primary">{t.label}</div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-t-tertiary">{t.count} payments</span>
                  <span className="text-sm font-semibold text-t-primary tabular-nums">{formatPKR(t.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-t-primary">Payment Status Breakdown</h2>
          <div className="space-y-4 pt-2">
            {charts?.statusDistribution?.map((s) => (
              <div key={s.status} className="p-3.5 rounded-xl bg-b-surface2/50 border border-s-stroke flex items-center justify-between">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    s.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' :
                    s.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-red-500/10 text-red-600'
                  }`}>
                    {s.status}
                  </span>
                  <div className="text-xs text-t-tertiary mt-1">{s.count} transactions</div>
                </div>
                <div className="text-base font-bold text-t-primary">
                  {formatPKR(s.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountingOverviewPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <AccountingOverviewContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

