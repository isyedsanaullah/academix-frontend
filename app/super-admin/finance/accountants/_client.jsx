'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useDebounce from '@/lib/useDebounce';
import Icon from '@/components/Icon';
import AccountantsStatsCards from '@/components/superAdmin/finance/AccountantsStatsCards';
import AccountantsTable from '@/components/superAdmin/finance/AccountantsTable';
import { useAccountants } from '@/features/superAdminFinance/hooks/useFinance';

const AccountantDetailModal = dynamic(
  () => import('@/components/superAdmin/finance/AccountantDetailModal'),
  { ssr: false }
);

export default function AccountantsContent() {
  const [page, setPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [includeTest, setIncludeTest] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Detail Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState(null);

  const { data, isLoading, refetch, isFetching } = useAccountants({
    page,
    limit: 20,
    q: debouncedSearch.trim() || undefined,
    status: statusFilter !== 'ALL' ? statusFilter.toLowerCase() : undefined,
    includeTest,
  });

  const accountants = data?.accountants || [];
  const metrics = data?.metrics || {
    totalAccountants: 0,
    assignedCount: 0,
    unassignedCount: 0,
    totalColleges: 0,
    collegesWithAccountant: 0,
    coveragePercentage: 0,
  };
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  const handleCardClick = (cardId) => {
    setSelectedCard((prev) => (prev === cardId ? null : cardId));
    setPage(1);
  };

  const handleResetCardView = () => {
    setSelectedCard(null);
    setPage(1);
  };

  const handleRowClick = (accountant) => {
    setSelectedAccountant(accountant);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-caption text-t-secondary flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Institutional Finance Officers &bull; Treasury &amp; Account Management</span>
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
            title="Refresh accountants list"
          >
            <Icon name="refresh" className={`!size-4 fill-current ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Stats Cards with Segmented Tray + Big Chart */}
      <AccountantsStatsCards
        metrics={metrics}
        selectedCard={selectedCard}
        onCardClick={handleCardClick}
        onResetView={handleResetCardView}
      />

      {/* 2. Accountants Table */}
      <AccountantsTable
        accountants={accountants}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        onRowClick={handleRowClick}
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* 3. Detail Profile Modal (lazy loaded) */}
      {modalOpen && (
        <AccountantDetailModal
          accountant={selectedAccountant}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedAccountant(null);
          }}
        />
      )}
    </div>
  );
}
