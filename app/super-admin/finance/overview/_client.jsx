'use client';

import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import AccountingOverviewStatsCards from '@/components/superAdmin/finance/AccountingOverviewStatsCards';
import RevenuePlanBreakdown from '@/components/superAdmin/finance/RevenuePlanBreakdown';
import { useAccountingOverview } from '@/features/superAdminFinance/hooks/useFinance';
import { formatPKR } from '@/lib/money';

export default function AccountingOverviewContent() {
  const [includeTest, setIncludeTest] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [, startTransition] = useTransition();

  const { data, isLoading, isError, refetch, isFetching } = useAccountingOverview({ includeTest });

  const handleCardClick = (id) => {
    setSelectedCard((prev) => (prev === id ? null : id));
  };

  const handleResetView = () => {
    setSelectedCard(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
        <div className="size-9 border-3 border-[var(--accent,var(--primary-01))] border-t-transparent rounded-full animate-spin" />
        <p className="text-body-2 text-t-secondary font-medium">Loading institutional financial telemetry...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-8 text-center space-y-3 border-s-danger/30">
        <div className="size-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
          <Icon name="warning" className="!size-6 fill-red-600" />
        </div>
        <p className="text-sub-title-1 font-bold text-t-primary">Failed to load accounting overview</p>
        <p className="text-caption text-t-secondary">Unable to connect to the finance service. Check backend connection.</p>
        <button
          onClick={() => refetch()}
          className="btn-secondary h-9 px-4 text-caption rounded-xl mx-auto"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { cards = {}, charts = {} } = data || {};

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Bar (Right-aligned toggle & refresh, no duplicate page heading) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-caption text-t-secondary flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Financial Telemetry &bull; Asia/Karachi (UTC+5)</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-b-depth2 border border-s-subtle text-caption text-t-secondary cursor-pointer select-none hover:text-t-primary transition-colors">
            <input
              type="checkbox"
              checked={includeTest}
              onChange={(e) => {
                const checked = e.target.checked;
                startTransition(() => {
                  setIncludeTest(checked);
                });
              }}
              className="rounded border-s-stroke bg-b-surface1 text-[var(--accent,var(--primary-01))] focus:ring-0 cursor-pointer"
            />
            <span>Include Test Data</span>
          </label>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary h-9 px-3.5 text-caption flex items-center gap-2 rounded-2xl"
            title="Refresh overview metrics"
          >
            <Icon name="refresh" className={`!size-4 fill-current ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Stats Cards with Segmented Tray + Big Chart */}
      <AccountingOverviewStatsCards
        cards={cards}
        charts={charts}
        selectedCard={selectedCard}
        onCardClick={handleCardClick}
        onResetView={handleResetView}
      />

      {/* 2. Revenue by Subscription Plan Breakdown */}
      <RevenuePlanBreakdown
        planBreakdown={cards.revenueByPlan}
        totalRevenue={cards.totalRevenueCollected}
      />

      {/* 3. Status Breakdown Cards & Settlement Velocity */}
      <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-4">
        {charts.statusDistribution?.map((s) => (
          <div
            key={s.status}
            className="card p-5 border border-s-subtle flex items-center justify-between"
          >
            <div className="space-y-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-caption font-bold ${s.status === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                    : s.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
                      : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                  }`}
              >
                {s.status}
              </span>
              <p className="text-caption text-t-tertiary">
                {s.count} total transactions
              </p>
            </div>
            <div className="text-right">
              <div className="text-h6 font-bold text-t-primary tabular-nums">
                {formatPKR(s.amount)}
              </div>
              <p className="text-caption text-t-secondary font-mono text-[11px]">
                {s.status === 'APPROVED' ? 'Settled revenue' : s.status === 'PENDING' ? 'Under review' : 'Declined proofs'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

