'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useDebounce from '@/lib/useDebounce';
import Icon from '@/components/Icon';
import PaymentsHistoryStatsCards from '@/components/superAdmin/finance/PaymentsHistoryStatsCards';
import PaymentsHistoryTable from '@/components/superAdmin/finance/PaymentsHistoryTable';
import {
  usePaymentsHistory,
  useApprovePaymentMutation,
  useRejectPaymentMutation
} from '@/features/superAdminFinance/hooks/useFinance';
import financeApi from '@/features/superAdminFinance/api/financeApi';

const PaymentDetailModal = dynamic(
  () => import('@/components/superAdmin/finance/PaymentDetailModal'),
  { ssr: false }
);

export default function PaymentsHistoryContent() {
  const [page, setPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [planFilter, setPlanFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [includeTest, setIncludeTest] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const statusQuery = selectedCard && selectedCard !== 'ALL' ? selectedCard : undefined;

  const { data, isLoading, refetch, isFetching } = usePaymentsHistory({
    page,
    limit: 20,
    status: statusQuery,
    planId: planFilter !== 'ALL' ? planFilter : undefined,
    paymentMethod: methodFilter !== 'ALL' ? methodFilter : undefined,
    q: debouncedSearch.trim() || undefined,
    includeTest,
  });

  const approveMutation = useApprovePaymentMutation();
  const rejectMutation = useRejectPaymentMutation();

  const handleCardClick = (cardId) => {
    setSelectedCard((prev) => (prev === cardId ? null : cardId));
    setPage(1);
  };

  const handleResetCardView = () => {
    setSelectedCard(null);
    setPage(1);
  };

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setDetailModalOpen(true);
  };

  const handleApprove = (paymentId) => {
    approveMutation.mutate(
      { id: paymentId, payload: {} },
      {
        onSuccess: () => {
          setDetailModalOpen(false);
        },
      }
    );
  };

  const handleReject = (paymentId, reason) => {
    rejectMutation.mutate(
      { id: paymentId, payload: { rejectionReason: reason } },
      {
        onSuccess: () => {
          setDetailModalOpen(false);
        },
      }
    );
  };

  const handleExportCsv = () => {
    financeApi.downloadExportCsv({
      status: statusQuery,
      planId: planFilter !== 'ALL' ? planFilter : undefined,
      paymentMethod: methodFilter !== 'ALL' ? methodFilter : undefined,
      q: searchTerm.trim() || undefined,
      includeTest,
    });
  };

  const payments = data?.payments || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const summary = data?.summary || { totalCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-caption text-t-secondary flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Institution Payment Ledger &bull; Immutable Audit Logs</span>
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
            title="Refresh payments list"
          >
            <Icon name="refresh" className={`!size-4 fill-current ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Stats Cards with Segmented Tray + Big Chart */}
      <PaymentsHistoryStatsCards
        summary={summary}
        selectedCard={selectedCard}
        onCardClick={handleCardClick}
        onResetView={handleResetCardView}
      />

      {/* 2. Full Ledger Table */}
      <PaymentsHistoryTable
        payments={payments}
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
        methodFilter={methodFilter}
        onMethodFilterChange={(val) => {
          setMethodFilter(val);
          setPage(1);
        }}
        onRowClick={handleRowClick}
        onApprove={handleApprove}
        onOpenRejectModal={handleRowClick}
        onExportCsv={handleExportCsv}
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* 3. Detail & Verification Modal (lazy loaded) */}
      {detailModalOpen && (
        <PaymentDetailModal
          open={detailModalOpen}
          payment={selectedPayment}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedPayment(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </div>
  );
}
