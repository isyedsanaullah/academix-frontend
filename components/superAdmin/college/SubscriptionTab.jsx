'use strict';
'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineExclamation,
  HiOutlineShieldCheck,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText
} from 'react-icons/hi';

export default function SubscriptionTab({ collegeId, collegeName, onSubscriptionChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'assign' | 'renew' | 'editExpiry' | 'suspend' | null
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [assignForm, setAssignForm] = useState({
    plan: 'starter',
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amountNote: '',
    paymentNote: '',
    reason: ''
  });

  const [renewForm, setRenewForm] = useState({
    extendFrom: 'current_expiry',
    months: '12',
    newExpiry: '',
    amountNote: '',
    paymentNote: '',
    reason: ''
  });

  const [editExpiryForm, setEditExpiryForm] = useState({
    newExpiry: '',
    reason: ''
  });

  const [suspendReason, setSuspendReason] = useState('');

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/super-admin/colleges/${collegeId}/subscription`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) {
      fetchSubscription();
    }
  }, [collegeId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post(`/super-admin/colleges/${collegeId}/subscription/assign`, assignForm);
      toast.success('Subscription plan assigned successfully');
      setActiveModal(null);
      fetchSubscription();
      if (onSubscriptionChanged) onSubscriptionChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post(`/super-admin/colleges/${collegeId}/subscription/renew`, renewForm);
      toast.success('Subscription renewed successfully');
      setActiveModal(null);
      fetchSubscription();
      if (onSubscriptionChanged) onSubscriptionChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to renew subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExpiry = async (e) => {
    e.preventDefault();
    if (!editExpiryForm.reason.trim()) {
      toast.error('A reason is required to modify expiry date');
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/super-admin/colleges/${collegeId}/subscription/expiry`, editExpiryForm);
      toast.success('Subscription expiry updated successfully');
      setActiveModal(null);
      fetchSubscription();
      if (onSubscriptionChanged) onSubscriptionChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update expiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post(`/super-admin/colleges/${collegeId}/suspend`, { reason: suspendReason });
      toast.success('College suspended successfully');
      setActiveModal(null);
      fetchSubscription();
      if (onSubscriptionChanged) onSubscriptionChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suspend college');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm('Are you sure you want to reactivate this college? Access will be restored immediately.')) return;
    try {
      setSubmitting(true);
      await api.post(`/super-admin/colleges/${collegeId}/reactivate`);
      toast.success('College reactivated successfully');
      fetchSubscription();
      if (onSubscriptionChanged) onSubscriptionChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reactivate college');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const { currentPeriod, status, graceUntil, daysLeft, history } = data || {};
  const isSuspended = status === 'suspended';
  const isGrace = status === 'grace';

  // Progress percentage calculation
  let progressPct = 0;
  if (currentPeriod && currentPeriod.starts_at && currentPeriod.expires_at) {
    const total = new Date(currentPeriod.expires_at) - new Date(currentPeriod.starts_at);
    const elapsed = Date.now() - new Date(currentPeriod.starts_at);
    progressPct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  return (
    <div className="space-y-6">
      {/* Top Banner if in Grace or Suspended */}
      {isSuspended && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <HiOutlineBan size={22} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">College Subscription is Suspended</h4>
            <p className="text-xs mt-1">Non-admin staff, teachers, and students are blocked from logging in. Public profile shows a neutral unavailable notice.</p>
          </div>
          <button
            onClick={handleReactivate}
            disabled={submitting}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            Reactivate Access
          </button>
        </div>
      )}

      {isGrace && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <HiOutlineExclamation size={22} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">College in Grace Period</h4>
            <p className="text-xs mt-1">
              Subscription expired. 7-day grace period active until {graceUntil ? new Date(graceUntil).toLocaleDateString() : 'N/A'}. All roles see an expiry warning.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-100 dark:border-indigo-900/50">
              <HiOutlineCreditCard size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                  {currentPeriod ? `${currentPeriod.plan} Plan` : 'No Active Plan'}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : status === 'grace'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                {currentPeriod
                  ? `Active period: ${new Date(currentPeriod.starts_at).toLocaleDateString()} — ${new Date(currentPeriod.expires_at).toLocaleDateString()}`
                  : 'Assign a subscription plan to enable institutional features'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveModal('assign')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition"
            >
              <HiOutlinePlus size={15} />
              Assign Plan
            </button>
            <button
              onClick={() => {
                setRenewForm(f => ({
                  ...f,
                  newExpiry: currentPeriod ? new Date(new Date(currentPeriod.expires_at).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''
                }));
                setActiveModal('renew');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
            >
              <HiOutlineRefresh size={15} />
              Renew
            </button>
            {currentPeriod && (
              <button
                onClick={() => {
                  setEditExpiryForm({
                    newExpiry: new Date(currentPeriod.expires_at).toISOString().split('T')[0],
                    reason: ''
                  });
                  setActiveModal('editExpiry');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
              >
                <HiOutlineCalendar size={15} />
                Edit Expiry
              </button>
            )}
            {isSuspended ? (
              <button
                onClick={handleReactivate}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
              >
                <HiOutlineCheckCircle size={15} />
                Reactivate
              </button>
            ) : (
              <button
                onClick={() => setActiveModal('suspend')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-rose-200 dark:border-rose-900/50"
              >
                <HiOutlineBan size={15} />
                Suspend
              </button>
            )}
          </div>
        </div>

        {/* Days Left & Progress Section */}
        {currentPeriod && (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-white/60">Subscription Lifecycle</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {daysLeft !== null && daysLeft > 0 ? `${daysLeft} days remaining` : daysLeft === 0 ? 'Expires today' : `${Math.abs(daysLeft)} days overdue`}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    daysLeft <= 7 ? 'bg-rose-500' : daysLeft <= 30 ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-400'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-white/40 pt-1">
                <span>Start: {new Date(currentPeriod.starts_at).toLocaleDateString()}</span>
                <span>Expiry: {new Date(currentPeriod.expires_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Payment / Notes</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-white/80 mt-1">
                  {currentPeriod.amount_note || 'Standard Plan Fee'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-white/50 truncate max-w-[200px]">
                  Ref: {currentPeriod.payment_note || 'Direct Bank/Cash'}
                </p>
              </div>
              <HiOutlineCurrencyDollar size={24} className="text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* Subscription Period History Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Subscription Period History</h3>
            <p className="text-xs text-slate-500 dark:text-white/50">
              Audit log of all past and active subscription periods. Records are permanently archived.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60">
            {history?.length || 0} Periods
          </span>
        </div>

        {(!history || history.length === 0) ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No subscription periods recorded yet. Use &ldquo;Assign Plan&rdquo; above to create the initial subscription.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-white/[0.06] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Period Range</th>
                  <th className="py-3 px-4">Amount / Reference</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {history.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white capitalize">
                      {p.plan}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          p.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : p.status === 'scheduled'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-white/60'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-white/70 whitespace-nowrap">
                      {new Date(p.starts_at).toLocaleDateString()} — {new Date(p.expires_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-white/70">
                      <div>{p.amount_note || '—'}</div>
                      {p.payment_note && (
                        <div className="text-[10px] text-slate-400">{p.payment_note}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-white/50 max-w-xs truncate">
                      {p.reason || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <div>{new Date(p.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{p.created_by || 'system'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: ASSIGN PLAN ─────────────────────────────────────────── */}
      {activeModal === 'assign' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Subscription Plan</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Select Plan</label>
                <select
                  value={assignForm.plan}
                  onChange={e => setAssignForm({ ...assignForm, plan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="starter">Starter / Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom Plan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Starts At</label>
                  <input
                    type="date"
                    required
                    value={assignForm.startsAt}
                    onChange={e => setAssignForm({ ...assignForm, startsAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Expires At</label>
                  <input
                    type="date"
                    required
                    value={assignForm.expiresAt}
                    onChange={e => setAssignForm({ ...assignForm, expiresAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Amount Note</label>
                  <input
                    type="text"
                    placeholder="e.g. PKR 150,000 / yr"
                    value={assignForm.amountNote}
                    onChange={e => setAssignForm({ ...assignForm, amountNote: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Payment Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Transfer #98231"
                    value={assignForm.paymentNote}
                    onChange={e => setAssignForm({ ...assignForm, paymentNote: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional context for this assignment..."
                  value={assignForm.reason}
                  onChange={e => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Assigning...' : 'Assign Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: RENEW SUBSCRIPTION ──────────────────────────────────── */}
      {activeModal === 'renew' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Renew Subscription</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleRenew} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Extend From</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRenewForm({ ...renewForm, extendFrom: 'current_expiry' })}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                      renewForm.extendFrom === 'current_expiry'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60'
                    }`}
                  >
                    Current Expiry Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewForm({ ...renewForm, extendFrom: 'today' })}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                      renewForm.extendFrom === 'today'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60'
                    }`}
                  >
                    From Today
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Duration (Months)</label>
                  <select
                    value={renewForm.months}
                    onChange={e => setRenewForm({ ...renewForm, months: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (2 Years)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Or Specific New Expiry</label>
                  <input
                    type="date"
                    value={renewForm.newExpiry}
                    onChange={e => setRenewForm({ ...renewForm, newExpiry: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Amount Note</label>
                  <input
                    type="text"
                    placeholder="e.g. PKR 180,000"
                    value={renewForm.amountNote}
                    onChange={e => setRenewForm({ ...renewForm, amountNote: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Payment Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Cheque #49281"
                    value={renewForm.paymentNote}
                    onChange={e => setRenewForm({ ...renewForm, paymentNote: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Renewing...' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EDIT EXPIRY ─────────────────────────────────────────── */}
      {activeModal === 'editExpiry' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Subscription Expiry</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleEditExpiry} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">New Expiry Date</label>
                <input
                  type="date"
                  required
                  value={editExpiryForm.newExpiry}
                  onChange={e => setEditExpiryForm({ ...editExpiryForm, newExpiry: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  Reason for Change <span className="text-rose-500">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why the expiry date is being altered..."
                  value={editExpiryForm.reason}
                  onChange={e => setEditExpiryForm({ ...editExpiryForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Saving...' : 'Update Expiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SUSPEND COLLEGE ─────────────────────────────────────── */}
      {activeModal === 'suspend' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center bg-rose-50/50 dark:bg-rose-950/20">
              <h3 className="text-base font-bold text-rose-700 dark:text-rose-400">Suspend College Access</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleSuspend} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-white/70">
                Suspending will immediately block students, teachers, and staff. College administrators can still log in to view the renewal notice.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Suspension Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Non-payment of subscription dues after grace period"
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
                >
                  {submitting ? 'Suspending...' : 'Suspend College'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
