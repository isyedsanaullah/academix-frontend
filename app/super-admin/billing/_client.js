'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/api';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PlanBadge from '@/components/common/PlanBadge';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';

export default function SuperAdminBillingClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [pendingPayments, setPendingPayments] = useState([]);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals state
  const [inspectModal, setInspectModal] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [loadingProof, setLoadingProof] = useState(false);

  const [approveModal, setApproveModal] = useState(null);
  const [verifiedAmount, setVerifiedAmount] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [submittingApprove, setSubmittingApprove] = useState(false);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // History filters
  const [historyFilterStatus, setHistoryFilterStatus] = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/super-admin/billing/pending');
      setPendingPayments(res.data.payments || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Error loading billing queue'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (historyFilterStatus) params.status = historyFilterStatus;
      const res = await axios.get('/super-admin/billing/all', { params });
      setHistoryPayments(res.data.payments || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Error loading history'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (activeTab === 'pending') {
          const res = await axios.get('/super-admin/billing/pending');
          if (isMounted) setPendingPayments(res.data.payments || []);
        } else {
          const params = {};
          if (historyFilterStatus) params.status = historyFilterStatus;
          const res = await axios.get('/super-admin/billing/all', { params });
          if (isMounted) setHistoryPayments(res.data.payments || []);
        }
      } catch (err) {
        if (isMounted)
          setError(
            err.response?.data?.message ||
              err.message ||
              'Error loading billing data'
          );
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [activeTab, historyFilterStatus]);

  const handleInspect = async (payment) => {
    setInspectModal(payment);
    setProofUrl('');
    setLoadingProof(true);
    try {
      const res = await axios.get(`/super-admin/billing/receipt/${payment.id}`);
      setProofUrl(res.data.url || payment.screenshotUrl);
    } catch {
      setProofUrl(payment.screenshotUrl);
    } finally {
      setLoadingProof(false);
    }
  };

  const openApproveModal = (payment) => {
    setApproveModal(payment);
    setVerifiedAmount(String(payment.amountPaid || ''));
    setOverrideNote(payment.overrideNote || '');
  };

  const handleConfirmApprove = async () => {
    if (!approveModal) return;
    const isUnderpaid = Number(verifiedAmount) < approveModal.expectedAmount;
    if (isUnderpaid && !overrideNote.trim()) {
      alert(
        'An override note is mandatory when settled amount is less than expected amount.'
      );
      return;
    }

    try {
      setSubmittingApprove(true);
      setError(null);
      await axios.post(`/super-admin/billing/approve/${approveModal.id}`, {
        verifiedAmountOverride: Number(verifiedAmount),
        overrideNote: overrideNote.trim(),
      });
      setSuccessMsg(
        `Payment ${approveModal.transactionId} settled successfully.`
      );
      setApproveModal(null);
      fetchPending();
    } catch (err) {
      alert(`Approval Failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      alert('A rejection reason is mandatory.');
      return;
    }

    try {
      setSubmittingReject(true);
      setError(null);
      await axios.post(`/super-admin/billing/reject/${rejectModal.id}`, {
        reason: rejectReason.trim(),
      });
      setSuccessMsg(
        `Payment ${rejectModal.transactionId} marked as REJECTED.`
      );
      setRejectModal(null);
      fetchPending();
    } catch (err) {
      alert(`Rejection Failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmittingReject(false);
    }
  };

  const slaBreachedCount = pendingPayments.filter(
    (p) => p.slaSlaBreached
  ).length;
  const duplicateSuspectedCount = pendingPayments.filter(
    (p) => p.isDuplicateSuspected
  ).length;

  return (
    <div className="page space-y-3">
      {/* Top Header */}
      <div className="page-head">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="page-title">Subscription Settlement Queue</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-b-surface2 border border-s-subtle px-3 py-1 text-caption font-semibold text-t-blue shadow-widget">
              <Icon name="credit-card" className="!size-4 fill-current" />
              Offline Proof Verification
            </span>
          </div>
          <p className="page-sub">
            Verify offline bank proofs, approve renewals and upgrades, and
            dispatch sequential receipts
          </p>
        </div>

        <div className="page-actions">
          <Button
            isStroke
            icon="wallet"
            onClick={() => router.push('/super-admin/payments')}
          >
            Payments & Accounts
          </Button>
          <Button
            isPrimary
            icon="refresh"
            onClick={() =>
              activeTab === 'pending' ? fetchPending() : fetchHistory()
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-4xl bg-b-depth2 border border-s-subtle">
          <div className="rounded-3xl bg-b-surface2 border border-s-stroke2 p-4 flex items-center justify-between shadow-depth-toggle">
            <div>
              <p className="text-caption font-semibold text-t-secondary">
                Pending Orders
              </p>
              <p className="text-h4 font-mono tabular-nums text-t-primary mt-1">
                {pendingPayments.length}
              </p>
            </div>
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-01/12 text-t-blue border border-primary-01/25">
              <Icon name="clock" className="!size-5 fill-current" />
            </span>
          </div>

          <div className="rounded-3xl bg-b-surface2/70 border border-s-subtle p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-semibold text-t-secondary">
                SLA Breached (&gt;24h)
              </p>
              <p
                className={`text-h4 font-mono tabular-nums mt-1 ${
                  slaBreachedCount > 0 ? 'text-primary-03' : 'text-t-primary'
                }`}
              >
                {slaBreachedCount}
              </p>
            </div>
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-03/12 text-primary-03 border border-primary-03/25">
              <Icon name="alert" className="!size-5 fill-current" />
            </span>
          </div>

          <div className="rounded-3xl bg-b-surface2/70 border border-s-subtle p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-semibold text-t-secondary">
                Duplicate Suspected
              </p>
              <p
                className={`text-h4 font-mono tabular-nums mt-1 ${
                  duplicateSuspectedCount > 0
                    ? 'text-primary-05'
                    : 'text-t-primary'
                }`}
              >
                {duplicateSuspectedCount}
              </p>
            </div>
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-05/15 text-t-primary border border-primary-05/30">
              <Icon name="shield" className="!size-5 fill-current" />
            </span>
          </div>

          <div className="rounded-3xl bg-b-surface2/70 border border-s-subtle p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-semibold text-t-secondary">
                Auto-Receipt Engine
              </p>
              <p className="text-sub-title-1 font-mono font-bold text-[var(--brand-green-text)] mt-1">
                Sequential RCP-YYYY
              </p>
            </div>
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-02/15 text-[var(--brand-green-text)] border border-primary-02/30">
              <Icon name="check-circle" className="!size-5 fill-current" />
            </span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-b-depth2 border border-s-subtle">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`h-10 px-5 rounded-full text-button transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-b-surface2 text-t-primary shadow-depth-toggle border border-s-stroke2'
              : 'text-t-secondary hover:text-t-primary'
          }`}
        >
          Pending Review Queue ({pendingPayments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`h-10 px-5 rounded-full text-button transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-b-surface2 text-t-primary shadow-depth-toggle border border-s-stroke2'
              : 'text-t-secondary hover:text-t-primary'
          }`}
        >
          Settled / Archive History
        </button>
      </div>

      {successMsg && (
        <div className="card p-4 border-primary-02/40 flex items-center justify-between text-body-2 text-[var(--brand-green-text)]">
          <span>{successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-t-secondary hover:text-t-primary cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="card p-4 border-primary-03/40 flex items-center justify-between text-body-2 text-primary-03">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-t-secondary hover:text-t-primary cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab 1: Pending Queue */}
      {activeTab === 'pending' && (
        <section className="card p-6 max-md:p-4">
          {loading && pendingPayments.length === 0 ? (
            <CollegesHubLoader
              size="sm"
              text="Loading pending settlements…"
              minHeight="min-h-[220px]"
            />
          ) : pendingPayments.length === 0 ? (
            <div className="empty py-14">
              <div className="mx-auto mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-primary-02/15 text-[var(--brand-green-text)]">
                <Icon name="check-circle" className="!size-6 fill-current" />
              </div>
              <p className="text-sub-title-1 text-t-primary">
                Billing Queue Clear
              </p>
              <p className="text-caption text-t-secondary mt-1">
                There are no offline subscription payments waiting for review.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>College & Order</th>
                    <th>Channel / TxID</th>
                    <th className="text-right">Amount (PKR)</th>
                    <th>Discrepancy / Flags</th>
                    <th>Submitted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((p) => {
                    const diff =
                      Number(p.amountPaid || 0) - Number(p.expectedAmount || 0);
                    return (
                      <tr key={p.id}>
                        <td>
                          <p className="font-semibold text-t-primary">
                            {p.college?.name || 'Unknown College'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="label label-blue">{p.type}</span>
                            {p.planId && <PlanBadge plan={p.planId} />}
                          </div>
                        </td>
                        <td className="font-mono text-caption">
                          <span className="font-semibold text-t-primary">
                            {p.paymentMethod}
                          </span>
                          <p className="text-t-secondary mt-0.5">
                            {p.transactionId}
                          </p>
                        </td>
                        <td className="text-right font-mono font-semibold tabular-nums text-t-primary">
                          PKR {Number(p.amountPaid || 0).toLocaleString()}
                          {p.expectedAmount !== p.amountPaid && (
                            <p className="text-caption font-normal text-t-tertiary">
                              Exp: PKR{' '}
                              {Number(p.expectedAmount || 0).toLocaleString()}
                            </p>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            {p.isDuplicateSuspected && (
                              <span className="label label-yellow">
                                Duplicate Suspected
                              </span>
                            )}
                            {diff < 0 && (
                              <span className="text-caption text-primary-03 font-semibold">
                                Underpaid: -PKR {Math.abs(diff).toLocaleString()}
                              </span>
                            )}
                            {diff > 0 && (
                              <span className="text-caption text-[var(--brand-green-text)] font-semibold">
                                Overpaid: +PKR {diff.toLocaleString()}
                              </span>
                            )}
                            {diff === 0 && !p.isDuplicateSuspected && (
                              <span className="text-caption text-t-tertiary">
                                Exact Match
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-caption">
                          <p className="text-t-primary">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                          {p.slaSlaBreached ? (
                            <span className="text-primary-03 font-bold">
                              SLA Breached (&gt;24h)
                            </span>
                          ) : (
                            <span className="text-t-tertiary">Under SLA</span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              isStroke
                              size="sm"
                              icon="eye"
                              onClick={() => handleInspect(p)}
                            >
                              Proof
                            </Button>
                            <Button
                              isPrimary
                              size="sm"
                              onClick={() => openApproveModal(p)}
                            >
                              Approve
                            </Button>
                            <Button
                              isStroke
                              size="sm"
                              onClick={() => {
                                setRejectModal(p);
                                setRejectReason('');
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Settled / Archive History */}
      {activeTab === 'history' && (
        <section className="card p-6 max-md:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <select
              value={historyFilterStatus}
              onChange={(e) => setHistoryFilterStatus(e.target.value)}
              aria-label="Filter history by status"
              className="input w-full sm:w-56"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt / ID</th>
                  <th>College</th>
                  <th>Channel & Ref</th>
                  <th className="text-right">Settled Amount</th>
                  <th>Status</th>
                  <th>Settled At</th>
                </tr>
              </thead>
              <tbody>
                {historyPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-caption font-bold text-t-primary">
                      {p.receiptNumber || '—'}
                    </td>
                    <td className="font-semibold text-t-primary">
                      {p.college?.name || p.college_id}
                    </td>
                    <td className="font-mono text-caption text-t-secondary">
                      {p.paymentMethod} • {p.transactionId}
                    </td>
                    <td className="text-right font-mono font-semibold tabular-nums text-t-primary">
                      PKR{' '}
                      {Number(
                        p.verifiedAmount || p.amountPaid || 0
                      ).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`label ${
                          p.status === 'APPROVED' ? 'label-green' : 'label-red'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="font-mono text-caption text-t-secondary">
                      {p.reviewedAt
                        ? new Date(p.reviewedAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Inspect Proof Modal */}
      <Modal
        open={Boolean(inspectModal)}
        onClose={() => setInspectModal(null)}
        title="Inspect Bank Transfer Proof"
      >
        {inspectModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-caption">
                <p>
                  <span className="font-semibold text-t-secondary">
                    College:
                  </span>{' '}
                  <span className="text-t-primary">
                    {inspectModal.college?.name}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-t-secondary">
                    Method:
                  </span>{' '}
                  <span className="text-t-primary">
                    {inspectModal.paymentMethod}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-t-secondary">Tx ID:</span>{' '}
                  <code className="bg-b-surface1 px-2 py-0.5 rounded font-mono text-t-primary">
                    {inspectModal.transactionId}
                  </code>
                </p>
                <p>
                  <span className="font-semibold text-t-secondary">
                    Amount Paid:
                  </span>{' '}
                  <span className="font-mono font-bold text-t-primary">
                    PKR {Number(inspectModal.amountPaid || 0).toLocaleString()}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-t-secondary">
                    Expected:
                  </span>{' '}
                  <span className="font-mono text-t-secondary">
                    PKR{' '}
                    {Number(inspectModal.expectedAmount || 0).toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="border border-s-subtle rounded-2xl p-3 flex items-center justify-center bg-b-surface1 min-h-[240px]">
                {loadingProof ? (
                  <p className="text-caption text-t-secondary">
                    Loading signed receipt URL…
                  </p>
                ) : proofUrl ? (
                  <img
                    src={proofUrl}
                    alt="Bank Proof"
                    className="max-h-[280px] object-contain rounded-xl"
                  />
                ) : (
                  <p className="text-caption text-t-tertiary">
                    No screenshot available
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button isStroke onClick={() => setInspectModal(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        open={Boolean(approveModal)}
        onClose={() => setApproveModal(null)}
        title="Confirm Payment Settlement"
      >
        {approveModal && (
          <div className="space-y-4">
            <div className="p-3.5 bg-b-surface1 border border-s-subtle rounded-2xl">
              <p className="font-semibold text-t-primary">
                {approveModal.college?.name}
              </p>
              <p className="text-caption text-t-secondary mt-0.5 font-mono">
                Order: {approveModal.type} • Expected: PKR{' '}
                {Number(approveModal.expectedAmount || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-caption font-semibold text-t-secondary mb-1.5">
                Verified Settled Amount (PKR)
              </label>
              <input
                type="number"
                value={verifiedAmount}
                onChange={(e) => setVerifiedAmount(e.target.value)}
                className="input w-full font-mono"
              />
            </div>

            <div>
              <label className="block text-caption font-semibold text-t-secondary mb-1.5">
                Override / Settlement Note{' '}
                {Number(verifiedAmount) < approveModal.expectedAmount && (
                  <span className="text-primary-03">
                    * (Mandatory for Underpayment)
                  </span>
                )}
              </label>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="e.g. Authorized 10% director concession..."
                className="input w-full min-h-20 py-2.5"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button isStroke onClick={() => setApproveModal(null)}>
                Cancel
              </Button>
              <Button
                isPrimary
                disabled={submittingApprove}
                onClick={handleConfirmApprove}
              >
                {submittingApprove ? 'Settling…' : 'Confirm & Issue Receipt'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={Boolean(rejectModal)}
        onClose={() => setRejectModal(null)}
        title="Reject Payment"
      >
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-body-2 text-t-secondary">
              Rejecting this payment allows the college to resubmit with a
              valid proof. The transaction ID will be unblocked for
              resubmission.
            </p>

            <div>
              <label className="block text-caption font-semibold text-t-secondary mb-1.5">
                Rejection Reason <span className="text-primary-03">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Screenshot unreadable / transaction ID not found in bank statement..."
                className="input w-full min-h-24 py-2.5"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button isStroke onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button
                isPrimary
                disabled={submittingReject}
                onClick={handleConfirmReject}
              >
                {submittingReject ? 'Rejecting…' : 'Reject Payment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
