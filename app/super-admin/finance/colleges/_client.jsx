'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useDebounce from '@/lib/useDebounce';
import Icon from '@/components/Icon';
import CollegeBillingStatsCards from '@/components/superAdmin/finance/CollegeBillingStatsCards';
import CollegeBillingTable from '@/components/superAdmin/finance/CollegeBillingTable';
import {
  useCollegeBilling,
  useCollegeBillingDetail,
} from '@/features/superAdminFinance/hooks/useFinance';

const CollegeBillingDetailModal = dynamic(
  () => import('@/components/superAdmin/finance/CollegeBillingDetailModal'),
  { ssr: false }
);

const PlanMigrationDrawer = dynamic(
  () => import('@/components/superAdmin/college/PlanMigrationDrawer'),
  { ssr: false }
);

export default function PerCollegeBillingContent() {
  const [page, setPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [planFilter, setPlanFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [includeTest, setIncludeTest] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailCollegeId, setDetailCollegeId] = useState(null);

  // Plan Migration Drawer State
  const [migrateTarget, setMigrateTarget] = useState(null);

  const statusQuery = selectedCard && selectedCard !== 'ALL' ? selectedCard : undefined;

  const { data, isLoading, refetch, isFetching } = useCollegeBilling({
    page,
    limit: 20,
    subStatus: statusQuery,
    planId: planFilter !== 'ALL' ? planFilter : undefined,
    q: debouncedSearch.trim() || undefined,
    includeTest,
  });

  const { data: detailData, isLoading: detailLoading } = useCollegeBillingDetail(detailCollegeId);

  const handleCardClick = (cardId) => {
    setSelectedCard((prev) => (prev === cardId ? null : cardId));
    setPage(1);
  };

  const handleResetCardView = () => {
    setSelectedCard(null);
    setPage(1);
  };

  const handleRowClick = (college) => {
    setDetailCollegeId(college.id);
    setDetailModalOpen(true);
  };

  const handleOpenMigrate = (college) => {
    setMigrateTarget(college);
  };

  const colleges = data?.colleges || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-caption text-t-secondary flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Institutional Billing Accounts &bull; Automated Tier Pricing</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-b-depth2 border border-s-subtle text-caption text-t-secondary cursor-pointer select-none hover:text-t-primary transition-colors">
            <input
              type="checkbox"
              checked={includeTest}
              onChange={(e) => {
                setIncludeTest(e.target.checked);
                setPage(1);
              }}
              className="rounded border-s-stroke bg-b-surface1 text-[var(--accent,var(--primary-01))] focus:ring-0 cursor-pointer"
            />
            <span>Include Test Data</span>
          </label>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary h-9 px-3.5 text-caption flex items-center gap-2 rounded-2xl"
            title="Refresh college setups"
          >
            <Icon name="refresh" className={`!size-4 fill-current ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Stats Cards with Segmented Tray + Big Chart */}
      <CollegeBillingStatsCards
        colleges={colleges}
        totalCount={pagination.total}
        selectedCard={selectedCard}
        onCardClick={handleCardClick}
        onResetView={handleResetCardView}
      />

      {/* 2. Colleges Billing Setup Table */}
      <CollegeBillingTable
        colleges={colleges}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        planFilter={planFilter}
        onPlanFilterChange={(val) => {
          setPlanFilter(val);
          setPage(1);
        }}
        statusFilter={selectedCard || 'ALL'}
        onStatusFilterChange={(val) => {
          setSelectedCard(val === 'ALL' ? null : val);
          setPage(1);
        }}
        onRowClick={handleRowClick}
        onOpenMigrate={handleOpenMigrate}
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* 3. Detail & Ledger Modal (lazy loaded) */}
      {detailModalOpen && (
        <CollegeBillingDetailModal
          open={detailModalOpen}
          collegeData={detailData}
          loading={detailLoading}
          onClose={() => {
            setDetailModalOpen(false);
            setDetailCollegeId(null);
          }}
          onMigratePlan={handleOpenMigrate}
        />
      )}

      {/* 4. Plan Migration Drawer (lazy loaded) */}
      {migrateTarget && (
        <PlanMigrationDrawer
          open={Boolean(migrateTarget)}
          onClose={() => setMigrateTarget(null)}
          collegeId={migrateTarget.id}
          collegeName={migrateTarget.name}
          currentPlan={migrateTarget.planId}
          targetPlan={migrateTarget.planId === 'premium' ? 'enterprise' : 'premium'}
          onConfirmed={() => {
            setMigrateTarget(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
