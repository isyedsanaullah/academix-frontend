'use client';

import React, { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';

export default function PaymentProofsQueue() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedProof, setSelectedProof] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchProofs();
    fetchDailyReport();
  }, [statusFilter]);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/payment-proofs?status=${statusFilter}`);
      if (res.success) {
        setProofs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load proofs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    try {
      const res = await apiGet('/payment-proofs/daily-report');
      if (res.success) {
        setDailyStats(res.data);
      }
    } catch {}
  };

  const handleVerify = async (proofId) => {
    if (!confirm('Are you sure you want to verify this payment proof? This will generate an official Payment record, update the fee balance, and issue a verified paid receipt.')) return;

    setActionLoading(true);
    try {
      const res = await apiPut(`/payment-proofs/${proofId}/verify`, {});
      if (res.success) {
        setFeedback({ type: 'success', message: 'Payment successfully verified and recorded into ledger!' });
        setSelectedProof(null);
        fetchProofs();
        fetchDailyReport();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Verification failed' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Verification error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (proofId) => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiPut(`/payment-proofs/${proofId}/reject`, { reason: rejectReason.trim() });
      if (res.success) {
        setFeedback({ type: 'success', message: 'Payment proof rejected and student notified.' });
        setSelectedProof(null);
        setRejectReason('');
        fetchProofs();
        fetchDailyReport();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Rejection failed' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Rejection error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (proofId) => {
    if (!confirm('Mark this payment proof as duplicate?')) return;

    setActionLoading(true);
    try {
      const res = await apiPut(`/payment-proofs/${proofId}/duplicate`, {});
      if (res.success) {
        setFeedback({ type: 'success', message: 'Marked as duplicate transaction.' });
        setSelectedProof(null);
        fetchProofs();
        fetchDailyReport();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Verification Queue</h1>
          <p className="text-sm text-slate-500">
            Audit and verify mobile wallet and bank deposit screenshots submitted by students.
          </p>
        </div>
        <button
          onClick={() => { fetchProofs(); fetchDailyReport(); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
        >
          🔄 Refresh Queue
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Daily Summary Cards */}
      {dailyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pending Queue</span>
            <span className="text-2xl font-bold text-amber-600">{dailyStats.pending?.count || 0}</span>
            <span className="text-xs text-slate-500 block mt-1">Rs. {(dailyStats.pending?.amount || 0).toLocaleString()}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Verified Today</span>
            <span className="text-2xl font-bold text-emerald-600">{dailyStats.verified?.count || 0}</span>
            <span className="text-xs text-slate-500 block mt-1">Rs. {(dailyStats.verified?.amount || 0).toLocaleString()}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Rejected Today</span>
            <span className="text-2xl font-bold text-rose-600">{dailyStats.rejected?.count || 0}</span>
            <span className="text-xs text-slate-500 block mt-1">Rs. {(dailyStats.rejected?.amount || 0).toLocaleString()}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
            <span className="text-2xl font-bold text-indigo-600">{dailyStats.totalSubmitted || 0}</span>
            <span className="text-xs text-slate-500 block mt-1">Today's Inflow</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {['pending', 'verified', 'rejected', 'duplicate', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition -mb-px ${statusFilter === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Proofs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading verification queue...
          </div>
        ) : proofs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">🎉</span>
            <p className="font-semibold text-slate-800">No payment proofs in this tab</p>
            <p className="text-xs text-slate-400 mt-1">New student submissions will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Voucher</th>
                  <th className="py-3 px-4">Method & Tx ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Warnings</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {proofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{proof.student?.name || 'Unknown Student'}</span>
                      <span className="text-xs text-slate-500">{proof.student?.rollNumber} • {proof.student?.class}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-slate-800 block">{proof.fee?.challanNumber}</span>
                      <span className="text-xs text-slate-500">{proof.fee?.month}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                        {proof.method}
                      </span>
                      <span className="block font-mono text-xs text-slate-600 mt-1">{proof.transactionId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">Rs. {Number(proof.amount).toLocaleString()}</span>
                      {proof.fee && (
                        <span className="text-xs text-slate-400">Bal: Rs. {(proof.fee.totalAmount - (proof.fee.paidAmount || 0)).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {proof.warnings && proof.warnings.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {proof.warnings.map((w, idx) => (
                            <span
                              key={idx}
                              title={w.message}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${w.severity === 'danger' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
                            >
                              ⚠️ {w.code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">✓ Clean</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${proof.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : proof.status === 'rejected' ? 'bg-rose-50 text-rose-700' : proof.status === 'duplicate' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'}`}>
                        {proof.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => { setSelectedProof(proof); setRejectReason(''); }}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                      >
                        Inspect & Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Verification Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">
                Inspect Payment Proof — {selectedProof.student?.name}
              </h2>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 flex-1">
              {/* Left Column: Screenshot Viewer */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col items-center justify-center min-h-[350px]">
                {selectedProof.screenshotUrl ? (
                  <img
                    src={selectedProof.screenshotUrl}
                    alt="Payment Screenshot"
                    className="max-h-[450px] w-auto object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-sm">
                    <span className="text-3xl block mb-2">🖼️</span>
                    Screenshot preview not available
                  </div>
                )}
                {selectedProof.screenshotUrl && (
                  <a
                    href={selectedProof.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    Open Full Image in New Tab ↗
                  </a>
                )}
              </div>

              {/* Right Column: Forensic Details & Verification Controls */}
              <div className="space-y-4">
                {/* Forensic Warnings */}
                {selectedProof.warnings && selectedProof.warnings.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5 text-rose-800">
                    <span className="font-bold block uppercase tracking-wider">Forensic Alerts:</span>
                    {selectedProof.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span>•</span>
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Details Breakdown */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Student Roll:</span>
                    <span className="font-semibold text-slate-800">{selectedProof.student?.rollNumber} ({selectedProof.student?.class})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Voucher Challan No:</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedProof.fee?.challanNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold uppercase text-slate-800">{selectedProof.method}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono font-bold text-indigo-700">{selectedProof.transactionId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Sender Phone:</span>
                    <span className="font-medium text-slate-800">{selectedProof.senderPhone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Claimed Amount:</span>
                    <span className="font-bold text-slate-900 text-sm">Rs. {Number(selectedProof.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Voucher Balance:</span>
                    <span className="font-bold text-slate-700">
                      Rs. {(Number(selectedProof.fee?.totalAmount || 0) - Number(selectedProof.fee?.paidAmount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rejection Reason Input */}
                {selectedProof.status === 'pending' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Rejection Reason (required only if rejecting):
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Invalid transaction ID / Screenshot unreadable"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Actions */}
                {selectedProof.status === 'pending' ? (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleVerify(selectedProof.id)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : '✓ Verify & Credit'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedProof.id)}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleDuplicate(selectedProof.id)}
                      disabled={actionLoading}
                      className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      Mark Duplicate
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-600 font-semibold">
                    Proof is already {selectedProof.status.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
