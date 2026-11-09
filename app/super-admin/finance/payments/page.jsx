'use client';

import { useState } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Icon from '@/components/Icon';
import Modal from '@/components/ui/Modal';
import {
  usePaymentsHistory,
  useApprovePaymentMutation,
  useRejectPaymentMutation
} from '@/features/superAdminFinance/hooks/useFinance';
import financeApi from '@/features/superAdminFinance/api/financeApi';
import { formatPKR } from '@/lib/money';

function PaymentsHistoryContent() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [planId, setPlanId] = useState('ALL');
  const [q, setQ] = useState('');
  const [includeTest, setIncludeTest] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionModalPayment, setRejectionModalPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, isFetching, refetch } = usePaymentsHistory({
    page,
    limit: 20,
    status: status !== 'ALL' ? status : undefined,
    planId: planId !== 'ALL' ? planId : undefined,
    q: q.trim() || undefined,
    includeTest
  });

  const approveMutation = useApprovePaymentMutation();
  const rejectMutation = useRejectPaymentMutation();

  const handleApprove = (payment) => {
    if (confirm(`Approve payment of ${formatPKR(payment.amountPaid)} for ${payment.college?.name}?`)) {
      approveMutation.mutate({ id: payment.id, payload: {} });
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectionModalPayment || !rejectionReason.trim()) return;
    rejectMutation.mutate(
      { id: rejectionModalPayment.id, payload: { rejectionReason: rejectionReason.trim() } },
      {
        onSuccess: () => {
          setRejectionModalPayment(null);
          setRejectionReason('');
        }
      }
    );
  };

  const handleExport = () => {
    financeApi.downloadExportCsv({
      status: status !== 'ALL' ? status : undefined,
      planId: planId !== 'ALL' ? planId : undefined,
      includeTest
    });
  };

  const payments = data?.payments || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const summary = data?.summary || { totalCount: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Payments History</h1>
          <p className="text-sm text-t-secondary mt-0.5">
            Full ledger of institution subscription payments, proofs, and settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-t-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeTest}
              onChange={(e) => {
                setIncludeTest(e.target.checked);
                setPage(1);
              }}
              className="rounded border-s-stroke bg-b-surface1 text-accent focus:ring-accent"
            />
            Include Test Data
          </label>

          <button
            onClick={handleExport}
            className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5 rounded-xl"
            title="Download CSV ledger"
          >
            <Icon name="upload" className="w-3.5 h-3.5 rotate-180" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-b-surface1 border border-s-stroke">
          <div className="text-xs text-t-secondary font-medium">Total Matches</div>
          <div className="text-xl font-bold text-t-primary mt-1">{summary.totalCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="text-xs text-emerald-600 font-medium">Approved / Settled</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{summary.approvedCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="text-xs text-amber-600 font-medium">Pending Review</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{summary.pendingCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="text-xs text-red-600 font-medium">Rejected</div>
          <div className="text-xl font-bold text-red-600 mt-1">{summary.rejectedCount}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search receipt, TID, college..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
          />
          <Icon name="search" className="w-4 h-4 text-t-tertiary absolute left-2.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Plans</option>
            <option value="starter">Starter</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border border-s-stroke">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-t-primary">
            <thead className="bg-b-surface2/60 text-t-secondary border-b border-s-stroke uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt / TID</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Plan / Cycle</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-s-stroke">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-t-secondary">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-t-secondary">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-b-surface2/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-t-primary">{p.receiptNumber || '—'}</div>
                      <div className="text-[11px] text-t-tertiary">{p.transactionId || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-t-primary">{p.college?.name || '—'}</div>
                      <div className="text-[11px] text-t-tertiary font-mono">{p.college?.code || '—'}</div>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <div>{p.planId || 'starter'}</div>
                      <div className="text-[11px] text-t-tertiary">{p.billingCycle || 'MONTHLY'}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-t-primary">
                      {formatPKR(p.verifiedAmount != null ? p.verifiedAmount : p.amountPaid)}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] text-t-secondary font-medium">
                      {p.paymentMethod || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' :
                        p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-t-secondary text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="btn-secondary h-7 px-2.5 text-[11px] rounded-lg"
                        >
                          View
                        </button>
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(p)}
                              disabled={approveMutation.isPending}
                              className="btn-primary h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectionModalPayment(p)}
                              className="btn-secondary h-7 px-2.5 text-[11px] text-red-600 hover:bg-red-500/10 rounded-lg"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-b-surface2/30 border-t border-s-stroke flex items-center justify-between text-xs text-t-secondary">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary h-7 px-2.5 text-xs rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="btn-secondary h-7 px-2.5 text-xs rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <Modal
          open={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Proof: ${selectedPayment.receiptNumber || selectedPayment.transactionId || selectedPayment.id.slice(0, 8)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-b-surface2 border border-s-stroke">
              <div>
                <span className="text-t-tertiary">College:</span>
                <div className="font-semibold text-t-primary">{selectedPayment.college?.name}</div>
              </div>
              <div>
                <span className="text-t-tertiary">Amount Paid:</span>
                <div className="font-bold text-t-primary text-sm">{formatPKR(selectedPayment.amountPaid)}</div>
              </div>
              <div>
                <span className="text-t-tertiary">Transaction ID:</span>
                <div className="font-mono text-t-primary">{selectedPayment.transactionId}</div>
              </div>
              <div>
                <span className="text-t-tertiary">Method:</span>
                <div className="text-t-primary uppercase">{selectedPayment.paymentMethod}</div>
              </div>
            </div>

            {selectedPayment.screenshotUrl && (
              <div className="space-y-1">
                <span className="text-t-tertiary font-medium">Uploaded Proof Receipt:</span>
                <div className="max-h-[360px] overflow-auto rounded-xl border border-s-stroke bg-black/5 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPayment.screenshotUrl}
                    alt="Proof Receipt"
                    className="max-h-[340px] w-auto rounded object-contain"
                  />
                </div>
              </div>
            )}

            {selectedPayment.rejectionReason && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600">
                <span className="font-semibold">Rejection Reason:</span> {selectedPayment.rejectionReason}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalPayment && (
        <Modal
          open={Boolean(rejectionModalPayment)}
          onClose={() => setRejectionModalPayment(null)}
          title="Reject Payment Proof"
        >
          <div className="space-y-4 text-xs">
            <p className="text-t-secondary">
              Please enter the reason for rejecting this payment proof. The institution admin will see this reason in their portal.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Transaction ID could not be verified on bank portal..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-b-surface2 border border-s-stroke text-t-primary focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectionModalPayment(null)}
                className="btn-secondary h-8 px-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="btn-primary h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function PaymentsHistoryPage() {
  return (
    <AuthGuard allowedRoles={['superAdmin']}>
      <DashboardLayout>
        <PaymentsHistoryContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

