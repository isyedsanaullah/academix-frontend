'use client';

import React, { useState, useEffect } from 'react';
import axios from '@/lib/api';
import {
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineShieldCheck
} from 'react-icons/hi';

export default function SuperAdminBillingClient() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [pendingPayments, setPendingPayments] = useState([]);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals state
  const [inspectModal, setInspectModal] = useState(null); // payment object
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
  const [historySearch, setHistorySearch] = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/super-admin/billing/pending');
      setPendingPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load pending payments:', err);
      setError(err.response?.data?.message || err.message || 'Error loading billing queue');
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
      const res = await axios.get('/api/super-admin/billing/all', { params });
      setHistoryPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
      setError(err.response?.data?.message || err.message || 'Error loading history');
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
          const res = await axios.get('/api/super-admin/billing/pending');
          if (isMounted) setPendingPayments(res.data.payments || []);
        } else {
          const params = {};
          if (historyFilterStatus) params.status = historyFilterStatus;
          const res = await axios.get('/api/super-admin/billing/all', { params });
          if (isMounted) setHistoryPayments(res.data.payments || []);
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || err.message || 'Error loading billing data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [activeTab, historyFilterStatus]);

  const handleInspect = async (payment) => {
    setInspectModal(payment);
    setProofUrl('');
    setLoadingProof(true);
    try {
      const res = await axios.get(`/api/super-admin/billing/receipt/${payment.id}`);
      setProofUrl(res.data.url || payment.screenshotUrl);
    } catch (e) {
      setProofUrl(payment.screenshotUrl);
    } finally {
      setLoadingProof(false);
    }
  };

  const openApproveModal = (payment) => {
    setApproveModal(payment);
    setVerifiedAmount(payment.amountPaid.toString());
    setOverrideNote(payment.overrideNote || '');
  };

  const handleConfirmApprove = async () => {
    if (!approveModal) return;
    const isUnderpaid = Number(verifiedAmount) < approveModal.expectedAmount;
    if (isUnderpaid && !overrideNote.trim()) {
      alert('An override note is mandatory when settled amount is less than expected amount.');
      return;
    }

    try {
      setSubmittingApprove(true);
      setError(null);
      await axios.post(`/api/super-admin/billing/approve/${approveModal.id}`, {
        verifiedAmountOverride: Number(verifiedAmount),
        overrideNote: overrideNote.trim()
      });
      setSuccessMsg(`Payment ${approveModal.transactionId} settled successfully.`);
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
      await axios.post(`/api/super-admin/billing/reject/${rejectModal.id}`, {
        reason: rejectReason.trim()
      });
      setSuccessMsg(`Payment ${rejectModal.transactionId} marked as REJECTED.`);
      setRejectModal(null);
      fetchPending();
    } catch (err) {
      alert(`Rejection Failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmittingReject(false);
    }
  };

  const slaBreachedCount = pendingPayments.filter((p) => p.slaSlaBreached).length;
  const duplicateSuspectedCount = pendingPayments.filter((p) => p.isDuplicateSuspected).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <HiOutlineCreditCard className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Settlement Engine</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Super Admin settlement authority: verify offline bank proofs, approve renewals/upgrades, and dispatch receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (activeTab === 'pending' ? fetchPending() : fetchHistory())}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{pendingPayments.length}</p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <HiOutlineClock className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA Breached (&gt;24h)</p>
            <p className={`text-2xl font-bold mt-1 ${slaBreachedCount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {slaBreachedCount}
            </p>
          </div>
          <span className={`p-3 rounded-lg ${slaBreachedCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
            <HiOutlineExclamation className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duplicate Suspected</p>
            <p className={`text-2xl font-bold mt-1 ${duplicateSuspectedCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {duplicateSuspectedCount}
            </p>
          </div>
          <span className={`p-3 rounded-lg ${duplicateSuspectedCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
            <HiOutlineShieldCheck className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Auto-Receipt Engine</p>
            <p className="text-sm font-semibold text-emerald-600 mt-1">Sequential RCP-YYYY</p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-5 text-sm font-medium border-b-2 transition ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Pending Review Queue ({pendingPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-5 text-sm font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Settled / Archive History
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-between text-sm">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center justify-between text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">×</button>
        </div>
      )}

      {/* Tab 1: Pending Queue */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading && pendingPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Loading pending settlements...</div>
          ) : pendingPayments.length === 0 ? (
            <div className="p-12 text-center">
              <HiOutlineCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-semibold text-gray-900">Billing Queue Clear</p>
              <p className="text-sm text-gray-500">There are no offline subscription payments waiting for review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">College & Order</th>
                    <th className="px-4 py-3">Channel / TxID</th>
                    <th className="px-4 py-3 text-right">Amount (PKR)</th>
                    <th className="px-4 py-3">Discrepancy / Flags</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingPayments.map((p) => {
                    const diff = p.amountPaid - p.expectedAmount;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900">{p.college?.name || 'Unknown College'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded">
                              {p.type}
                            </span>
                            {p.planId && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {p.planId} ({p.billingCycle})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-xs">
                          <span className="font-semibold text-gray-800">{p.paymentMethod}</span>
                          <p className="text-gray-500 mt-0.5">{p.transactionId}</p>
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                          PKR {p.amountPaid.toLocaleString()}
                          {p.expectedAmount !== p.amountPaid && (
                            <p className="text-xs font-normal text-gray-400">
                              Exp: PKR {p.expectedAmount.toLocaleString()}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            {p.isDuplicateSuspected && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium">
                                <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                                Duplicate Suspected
                              </span>
                            )}
                            {diff < 0 && (
                              <span className="text-xs text-rose-600 font-medium">
                                Underpaid: -PKR {Math.abs(diff).toLocaleString()}
                              </span>
                            )}
                            {diff > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">
                                Overpaid: +PKR {diff.toLocaleString()}
                              </span>
                            )}
                            {diff === 0 && !p.isDuplicateSuspected && (
                              <span className="text-xs text-gray-400">Exact Match</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-xs text-gray-700">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                          {p.slaSlaBreached ? (
                            <span className="inline-block text-xs font-bold text-rose-600 mt-0.5">
                              SLA Breached (&gt;24h)
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Under SLA</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleInspect(p)}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="Inspect Proof"
                          >
                            <HiOutlineEye className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => openApproveModal(p)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectModal(p);
                              setRejectReason('');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Settled / Archive History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <select
              value={historyFilterStatus}
              onChange={(e) => setHistoryFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Receipt / ID</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Channel & Ref</th>
                  <th className="px-4 py-3 text-right">Settled Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Settled At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historyPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">
                      {p.receiptNumber || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {p.college?.name || p.college_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.paymentMethod} • {p.transactionId}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      PKR {(p.verifiedAmount || p.amountPaid).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.reviewedAt ? new Date(p.reviewedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Proof Modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-900">Inspect Bank Transfer Proof</h3>
              <button onClick={() => setInspectModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-gray-600">College:</span> {inspectModal.college?.name}</p>
                <p><span className="font-semibold text-gray-600">Method:</span> {inspectModal.paymentMethod}</p>
                <p><span className="font-semibold text-gray-600">Tx ID:</span> <code className="bg-gray-100 px-1 py-0.5 rounded">{inspectModal.transactionId}</code></p>
                <p><span className="font-semibold text-gray-600">Amount Paid:</span> PKR {inspectModal.amountPaid.toLocaleString()}</p>
                <p><span className="font-semibold text-gray-600">Expected:</span> PKR {inspectModal.expectedAmount.toLocaleString()}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-2 flex items-center justify-center bg-gray-50 min-h-[260px]">
                {loadingProof ? (
                  <p className="text-sm text-gray-400">Loading signed receipt URL...</p>
                ) : proofUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={proofUrl} alt="Bank Proof" className="max-h-[300px] object-contain rounded" />
                ) : (
                  <p className="text-sm text-gray-400">No screenshot available</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-900">Confirm Payment Settlement</h3>
              <button onClick={() => setApproveModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">{approveModal.college?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Order: {approveModal.type} • Expected: PKR {approveModal.expectedAmount.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Verified Settled Amount (PKR)
                </label>
                <input
                  type="number"
                  value={verifiedAmount}
                  onChange={(e) => setVerifiedAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Override / Settlement Note {Number(verifiedAmount) < approveModal.expectedAmount && <span className="text-rose-500">* (Mandatory for Underpayment)</span>}
                </label>
                <textarea
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Authorized 10% director concession..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={submittingApprove}
                onClick={handleConfirmApprove}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
              >
                {submittingApprove ? 'Settling...' : 'Confirm & Issue Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-900">Reject Payment</h3>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                Rejecting this payment allows the college to re-submit with correct proof. The normalized transaction ID will be unblocked for resubmission.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Screenshot unreadable / transaction ID not found in bank statement..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={submittingReject}
                onClick={handleConfirmReject}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                {submittingReject ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
