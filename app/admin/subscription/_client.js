'use client';

/**
 * Admin Subscription Dashboard — /admin/subscription
 *
 * Shows:
 *  - Current plan summary (plan, billing cycle, status, period dates, trial banner)
 *  - Usage meters (students, staff, storage, applications)
 *  - Credit balances (message credits, AI credits — plan + purchased)
 *  - Active add-ons list
 *  - Add-on purchase section with quantity selector & submit
 *  - Upgrade Plan section with payment proof form
 *  - Payment history table
 *
 * APIs used:
 *  GET  /api/subscription/current
 *  GET  /api/subscription/addon-catalog
 *  GET  /api/subscription/payment-history
 *  POST /api/subscription/submit-payment
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineServer,
  HiOutlineCollection,
  HiOutlineCreditCard,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineDocumentText,
  HiOutlineArrowUp,
  HiOutlinePlusCircle,
  HiOutlineBadgeCheck,
  HiOutlineXCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import { apiGet, apiPost } from '@/lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtBytes(bytes) {
  if (!bytes) return '0 GB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function fmtNum(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

const PLAN_THEME = {
  starter:    { badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600', dot: 'bg-slate-400' },
  standard:   { badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700', dot: 'bg-amber-400' },
  premium:    { badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700', dot: 'bg-violet-400' },
  enterprise: { badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500' },
};

const STATUS_THEME = {
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' },
  TRIAL:     { label: 'Trial',     cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700' },
  EXPIRED:   { label: 'Expired',   cls: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700' },
  PENDING:   { label: 'Pending',   cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' },
};

const PAYMENT_STATUS_THEME = {
  PENDING:  { label: 'Pending Review', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: HiOutlineClock },
  APPROVED: { label: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: HiOutlineCheckCircle },
  REJECTED: { label: 'Rejected',       cls: 'bg-red-500/10 text-red-700 dark:text-red-400', icon: HiOutlineXCircle },
};

const PLAN_ORDER = { starter: 1, standard: 2, premium: 3, enterprise: 4 };
const PLAN_PRICES = {
  starter:    { monthly: 2999,  yearly: 32989 },
  standard:   { monthly: 5999,  yearly: 65989 },
  premium:    { monthly: 10999, yearly: 120989 },
  enterprise: { monthly: 17999, yearly: 197989 },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const t = STATUS_THEME[status] || STATUS_THEME.ACTIVE;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${t.cls}`}>
      {t.label}
    </span>
  );
}

function PlanChip({ planId }) {
  const t = PLAN_THEME[planId] || PLAN_THEME.starter;
  const label = planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : '—';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${t.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  );
}

function UsageMeter({ icon: Icon, label, used, limit, unit = '' }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isWarn = pct >= 80;
  const isCrit = pct >= 95;
  return (
    <div className="rounded-xl border border-line bg-card p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-fg-muted shrink-0" />
          <span className="text-xs font-semibold text-fg">{label}</span>
        </div>
        <span className={`text-xs font-bold ${isCrit ? 'text-red-600 dark:text-red-400' : isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-fg-muted'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-card-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-[#0A4D94] dark:bg-brand-blue-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-fg-muted">
        <span>{fmtNum(used)}{unit} used</span>
        <span>of {limit > 0 ? fmtNum(limit) + unit : '∞'}</span>
      </div>
    </div>
  );
}

function CreditCard({ icon: Icon, label, planPool, purchasedPool, iconColor }) {
  const total = (planPool || 0) + (purchasedPool || 0);
  return (
    <div className="rounded-xl border border-line bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor + ' shrink-0'} />
        <span className="text-xs font-bold text-fg">{label}</span>
      </div>
      <div className="text-2xl font-black text-fg">{fmtNum(total)}</div>
      <div className="space-y-1 text-[11px] text-fg-muted">
        <div className="flex justify-between">
          <span>Plan pool</span><span className="font-semibold text-fg">{fmtNum(planPool || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Purchased (rolls over)</span><span className="font-semibold text-fg">{fmtNum(purchasedPool || 0)}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-[#0A4D94] dark:text-brand-blue-400 shrink-0" />
        <div>
          <h2 className="text-sm font-black text-fg">{title}</h2>
          {subtitle && <p className="text-[11px] text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Payment Proof Form ───────────────────────────────────────────────────────
function PaymentProofForm({ mode, currentPlan, billingCycle: currentCycle, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    type: mode === 'upgrade' ? 'UPGRADE' : mode === 'addon' ? 'ADDON_ORDER' : 'RENEWAL',
    planId: currentPlan,
    billingCycle: currentCycle || 'MONTHLY',
    paymentMethod: '',
    transactionId: '',
    screenshotUrl: '',
    amountPaid: '',
    lineItems: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.paymentMethod.trim()) { toast.error('Payment method is required'); return; }
    if (!formData.transactionId.trim()) { toast.error('Transaction ID is required'); return; }
    if (!formData.screenshotUrl.trim()) { toast.error('Screenshot URL is required'); return; }

    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        planId: formData.planId,
        billingCycle: formData.billingCycle,
        paymentMethod: formData.paymentMethod.trim(),
        transactionId: formData.transactionId.trim(),
        screenshotUrl: formData.screenshotUrl.trim(),
        amountPaid: formData.amountPaid ? Number(formData.amountPaid) : undefined,
        lineItems: formData.lineItems,
      };
      const res = await apiPost('/subscription/submit-payment', payload);
      if (res?.success) {
        toast.success('Payment proof submitted! Awaiting Super Admin verification.');
        onSuccess?.();
      } else {
        throw new Error(res?.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const upgradePlans = Object.keys(PLAN_PRICES).filter(p => PLAN_ORDER[p] > PLAN_ORDER[currentPlan]);
  const price = PLAN_PRICES[formData.planId]?.[formData.billingCycle === 'YEARLY' ? 'yearly' : 'monthly'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'upgrade' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-fg-muted mb-1.5 uppercase tracking-wider">Upgrade To *</label>
            <select
              name="planId" value={formData.planId}
              onChange={handleChange}
              className="w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-xs text-fg focus:border-[#0A4D94] focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
            >
              {upgradePlans.map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)} — PKR {
                    formData.billingCycle === 'YEARLY'
                      ? PLAN_PRICES[p].yearly.toLocaleString() + '/yr'
                      : PLAN_PRICES[p].monthly.toLocaleString() + '/mo'
                  }
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-muted mb-1.5 uppercase tracking-wider">Billing Cycle *</label>
            <select
              name="billingCycle" value={formData.billingCycle}
              onChange={handleChange}
              className="w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-xs text-fg focus:border-[#0A4D94] focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly (1 Month FREE)</option>
            </select>
          </div>
        </div>
      )}

      {mode === 'renewal' && (
        <div>
          <label className="block text-xs font-bold text-fg-muted mb-1.5 uppercase tracking-wider">Billing Cycle *</label>
          <select
            name="billingCycle" value={formData.billingCycle}
            onChange={handleChange}
            className="w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-xs text-fg focus:border-[#0A4D94] focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
          >
            <option value="MONTHLY">Monthly — PKR {PLAN_PRICES[currentPlan]?.monthly?.toLocaleString()}</option>
            <option value="YEARLY">Yearly — PKR {PLAN_PRICES[currentPlan]?.yearly?.toLocaleString()} (1 Month FREE)</option>
          </select>
        </div>
      )}

      {/* Expected amount info */}
      {price && (
        <div className="rounded-lg border border-blue-200/50 dark:border-brand-blue-400/20 bg-blue-50/60 dark:bg-brand-blue-500/5 px-3 py-2.5">
          <p className="text-xs text-fg-muted">
            Expected payment: <strong className="text-fg">PKR {price.toLocaleString()}</strong>
            {formData.billingCycle === 'YEARLY' && <span className="text-emerald-600 dark:text-emerald-400 ml-1">(saves 1 month)</span>}
          </p>
        </div>
      )}

      {/* Payment fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-fg-muted mb-1.5 uppercase tracking-wider">Payment Method *</label>
          <input
            type="text" name="paymentMethod" value={formData.paymentMethod}
            onChange={handleChange} disabled={submitting}
            placeholder="e.g. Bank Transfer, EasyPaisa, JazzCash"
            className="w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-fg-muted mb-1.5 uppercase tracking-wider">Transaction ID / Reference *</label>
          <input
            type="text" name="transactionId" value={formData.transactionId}
            onChange={handleChange} disabled={submitting}
            placeholder="e.g. TXN-123456789"
            className="w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-fg-muted mb-1.5 uppercase tracking-wider">Screenshot / Proof URL *</label>
          <input
            type="url" name="screenshotUrl" value={formData.screenshotUrl}
            onChange={handleChange} disabled={submitting}
            placeholder="https://drive.google.com/..."
            className="w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-fg-muted mb-1.5 uppercase tracking-wider">Amount Paid (PKR)</label>
          <input
            type="number" name="amountPaid" value={formData.amountPaid}
            onChange={handleChange} disabled={submitting}
            placeholder="Leave blank to use expected amount"
            className="w-full rounded-xl border border-line bg-card-2 px-3 py-2.5 text-xs text-fg placeholder:text-fg-faint focus:border-[#0A4D94] focus:outline-none focus:ring-4 focus:ring-[#0A4D94]/10 transition"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A4D94] hover:bg-[#083e78] py-2.5 px-5 text-xs font-bold text-white shadow transition disabled:opacity-50"
        >
          {submitting ? (
            <><div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Submitting…</>
          ) : (
            <><HiOutlineDocumentText size={14} /> Submit Payment Proof</>
          )}
        </button>
        <button
          type="button" onClick={onCancel}
          className="rounded-xl border border-line bg-card-2 px-4 py-2.5 text-xs font-semibold text-fg-muted hover:text-fg transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [addonCatalog, setAddonCatalog] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [showAddonSection, setShowAddonSection] = useState(false);
  const [addonQty, setAddonQty] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subRes, catalogRes, historyRes] = await Promise.all([
        apiGet('/subscription/current'),
        apiGet('/subscription/addon-catalog'),
        apiGet('/subscription/payment-history'),
      ]);
      if (subRes?.success) setSub(subRes.data);
      if (catalogRes?.success) setAddonCatalog(catalogRes.data?.items || []);
      if (historyRes?.success) setPayments(historyRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiGet('/subscription/current'),
      apiGet('/subscription/addon-catalog'),
      apiGet('/subscription/payment-history'),
    ]).then(([subRes, catalogRes, historyRes]) => {
      if (!mounted) return;
      if (subRes?.success) setSub(subRes.data);
      if (catalogRes?.success) setAddonCatalog(catalogRes.data?.items || []);
      if (historyRes?.success) setPayments(historyRes.data || []);
    }).catch(err => {
      if (!mounted) return;
      setError(err.response?.data?.message || 'Failed to load subscription data.');
    }).finally(() => {
      if (!mounted) return;
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowUpgradeForm(false);
    setShowRenewalForm(false);
    fetchAll();
  }, [fetchAll]);

  if (loading) return <CollegesHubLoader size="md" text="Loading subscription details…" minHeight="min-h-[400px]" />;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-500/5 p-6 text-center space-y-3">
        <HiOutlineExclamationCircle size={32} className="mx-auto text-red-500" />
        <p className="text-sm font-semibold text-fg">{error}</p>
        <button onClick={fetchAll} className="btn-secondary text-xs px-4 py-2">
          <HiOutlineRefresh className="inline mr-1" size={13} /> Retry
        </button>
      </div>
    );
  }

  if (!sub) return null;

  const {
    planId, billingCycle, subStatus, trialEndsAt, periodEnd,
    effectiveLimits, usage, credits, activeAddons, pendingPayment
  } = sub;

  const lim = effectiveLimits || {};
  const storageUsedGb = (usage?.storageBytes || 0) / 1073741824;
  const storageLimitGb = (lim.maxStorageBytes || 0) / 1073741824;
  const canUpgrade = PLAN_ORDER[planId] < PLAN_ORDER['enterprise'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-xl font-black text-fg tracking-tight">Subscription & Billing</h1>
        <p className="text-xs text-fg-muted mt-0.5">Manage your plan, usage, add-ons, and payment history.</p>
      </div>

      {/* ── Trial Banner ── */}
      {subStatus === 'TRIAL' && (
        <div className="rounded-2xl border border-sky-300 dark:border-sky-700 bg-sky-50/80 dark:bg-sky-500/10 p-4 flex items-start gap-3">
          <HiOutlineLightningBolt size={20} className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-sky-800 dark:text-sky-300">Free Trial Active</p>
            <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
              Your trial expires on <strong>{fmtDate(trialEndsAt || periodEnd)}</strong>. Submit payment proof to activate your subscription and retain all data.
            </p>
          </div>
        </div>
      )}

      {/* ── Read-Only Banner ── */}
      {sub.isReadOnly && (
        <div className="rounded-2xl border border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-500/10 p-4 flex items-start gap-3">
          <HiOutlineExclamationCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">Account in Read-Only Mode</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{sub.readOnlyReason || 'Your subscription has expired. Submit payment to restore full access.'}</p>
          </div>
        </div>
      )}

      {/* ── Pending Payment Banner ── */}
      {pendingPayment && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-500/10 p-4 flex items-start gap-3">
          <HiOutlineClock size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Payment Under Review</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              PKR {pendingPayment.amountPaid?.toLocaleString()} submitted via {pendingPayment.paymentMethod} on {fmtDate(pendingPayment.createdAt)}. Awaiting Super Admin verification.
            </p>
          </div>
        </div>
      )}

      {/* ── Plan Summary ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <SectionHeader icon={HiOutlineBadgeCheck} title="Current Plan" subtitle="Subscription overview and billing period" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Plan</p>
            <PlanChip planId={planId} />
          </div>
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Status</p>
            <StatusBadge status={subStatus} />
          </div>
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Billing</p>
            <p className="text-xs font-bold text-fg">{billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}</p>
          </div>
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Period Ends</p>
            <p className="text-xs font-bold text-fg">{fmtDate(periodEnd)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-2">
          {!pendingPayment && !showRenewalForm && !showUpgradeForm && (
            <>
              <button
                type="button"
                onClick={() => { setShowRenewalForm(true); setShowUpgradeForm(false); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card-2 px-4 py-2 text-xs font-semibold text-fg hover:border-line-strong transition"
              >
                <HiOutlineRefresh size={14} /> Renew Subscription
              </button>
              {canUpgrade && (
                <button
                  type="button"
                  onClick={() => { setShowUpgradeForm(true); setShowRenewalForm(false); }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A4D94] hover:bg-[#083e78] px-4 py-2 text-xs font-bold text-white transition"
                >
                  <HiOutlineArrowUp size={14} /> Upgrade Plan
                </button>
              )}
            </>
          )}
        </div>

        {/* Renewal form */}
        {showRenewalForm && (
          <div className="mt-5 rounded-xl border border-line bg-card-2 p-4">
            <h3 className="text-xs font-bold text-fg mb-3">Submit Renewal Payment</h3>
            <PaymentProofForm
              mode="renewal"
              currentPlan={planId}
              billingCycle={billingCycle}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowRenewalForm(false)}
            />
          </div>
        )}

        {/* Upgrade form */}
        {showUpgradeForm && canUpgrade && (
          <div className="mt-5 rounded-xl border border-line bg-card-2 p-4">
            <h3 className="text-xs font-bold text-fg mb-3">Submit Upgrade Payment</h3>
            <PaymentProofForm
              mode="upgrade"
              currentPlan={planId}
              billingCycle={billingCycle}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowUpgradeForm(false)}
            />
          </div>
        )}
      </div>

      {/* ── Usage Meters ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <SectionHeader
          icon={HiOutlineCollection}
          title="Quota Usage"
          subtitle="Live resource consumption for this billing period"
          action={
            <button onClick={fetchAll} className="text-fg-muted hover:text-fg transition" title="Refresh">
              <HiOutlineRefresh size={15} />
            </button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UsageMeter icon={HiOutlineUsers} label="Students" used={usage?.students || 0} limit={lim.maxStudents || 0} />
          <UsageMeter icon={HiOutlineUsers} label="Staff" used={usage?.staff || 0} limit={lim.maxStaff || 0} />
          <UsageMeter icon={HiOutlineServer} label="Storage" used={Math.round(storageUsedGb * 100) / 100} limit={Math.round(storageLimitGb * 100) / 100} unit=" GB" />
          <UsageMeter icon={HiOutlineDocumentText} label="Online Applications (yearly)" used={usage?.applications || 0} limit={lim.maxApplications || 0} />
        </div>
      </div>

      {/* ── Credit Balances ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <SectionHeader icon={HiOutlineCreditCard} title="Credit Balances" subtitle="Message and AI credit pools (plan resets monthly, purchased rolls over)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CreditCard
            icon={HiOutlineLightningBolt}
            label="Message Credits (SMS/WhatsApp)"
            planPool={credits?.messages?.plan?.balance}
            purchasedPool={credits?.messages?.purchased?.balance}
            iconColor="text-sky-500"
          />
          <CreditCard
            icon={HiOutlineSparkles}
            label="AI Credits"
            planPool={credits?.ai?.plan?.balance}
            purchasedPool={credits?.ai?.purchased?.balance}
            iconColor="text-violet-500"
          />
        </div>
      </div>

      {/* ── Active Add-ons ── */}
      {activeAddons && activeAddons.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-6">
          <SectionHeader icon={HiOutlinePlusCircle} title="Active Add-ons" subtitle="Capacity upgrades and module unlocks currently enabled" />
          <div className="space-y-2">
            {activeAddons.map((addon, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card-2 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-fg">{addon.name || addon.addonType}</p>
                  <p className="text-[11px] text-fg-muted">Quantity: {addon.quantity} · Expires: {fmtDate(addon.expiresAt)}</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <HiOutlineCheckCircle size={13} /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add-on Catalog ── */}
      {addonCatalog.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-6">
          <SectionHeader
            icon={HiOutlineCollection}
            title="Request Add-ons"
            subtitle="Expand capacity or unlock modules for your plan"
            action={
              <button
                type="button"
                onClick={() => setShowAddonSection(o => !o)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-fg-muted hover:text-fg transition"
              >
                {showAddonSection ? <><HiOutlineChevronUp size={15} /> Hide</> : <><HiOutlineChevronDown size={15} /> Show</>}
              </button>
            }
          />

          {showAddonSection && (
            <div className="space-y-3">
              <p className="text-xs text-fg-muted">
                Select the add-on(s) you need, then submit a payment proof. Super Admin will verify and activate.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addonCatalog.filter(a => a.isAvailable).map(addon => {
                  const qty = addonQty[addon.addonType] || 0;
                  return (
                    <div key={addon.id || addon.addonType} className="rounded-xl border border-line bg-card-2 p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs font-semibold text-fg">{addon.name}</p>
                          <p className="text-[11px] text-fg-muted">
                            PKR {addon.unitPriceMonthlyPkr?.toLocaleString()}/mo · Max: {addon.remainingUnitsAllowed ?? '—'} more
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#0A4D94] dark:text-brand-blue-400 shrink-0">
                          PKR {addon.unitPriceMonthlyPkr?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAddonQty(p => ({ ...p, [addon.addonType]: Math.max(0, (p[addon.addonType] || 0) - 1) }))}
                          className="w-7 h-7 rounded-lg border border-line bg-card flex items-center justify-center text-fg-muted hover:text-fg transition"
                        >−</button>
                        <span className="w-8 text-center text-xs font-bold text-fg">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setAddonQty(p => ({ ...p, [addon.addonType]: Math.min(addon.remainingUnitsAllowed ?? 99, (p[addon.addonType] || 0) + 1) }))}
                          className="w-7 h-7 rounded-lg border border-line bg-card flex items-center justify-center text-fg-muted hover:text-fg transition"
                        >+</button>
                        {qty > 0 && (
                          <span className="text-xs text-fg-muted ml-1">
                            = PKR {((addon.unitPriceMonthlyPkr || 0) * qty).toLocaleString()}/mo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.values(addonQty).some(q => q > 0) && (
                <div className="rounded-xl border border-blue-200/60 dark:border-brand-blue-400/20 bg-blue-50/60 dark:bg-brand-blue-500/5 p-4 mt-2">
                  <p className="text-xs font-semibold text-fg mb-3">
                    Submit payment for selected add-ons:
                  </p>
                  <PaymentProofForm
                    mode="addon"
                    currentPlan={planId}
                    billingCycle={billingCycle}
                    onSuccess={() => { setAddonQty({}); handleFormSuccess(); }}
                    onCancel={() => setAddonQty({})}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Payment History ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <SectionHeader icon={HiOutlineDocumentText} title="Payment History" subtitle="All submitted payment proofs and their verification status" />

        {payments.length === 0 ? (
          <div className="text-center py-8 text-fg-muted">
            <HiOutlineDocumentText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No payments submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left pb-2 pr-4 text-fg-muted font-semibold">Date</th>
                  <th className="text-left pb-2 pr-4 text-fg-muted font-semibold">Type</th>
                  <th className="text-left pb-2 pr-4 text-fg-muted font-semibold">Plan</th>
                  <th className="text-left pb-2 pr-4 text-fg-muted font-semibold">Method</th>
                  <th className="text-left pb-2 pr-4 text-fg-muted font-semibold">Txn ID</th>
                  <th className="text-right pb-2 pr-4 text-fg-muted font-semibold">Amount</th>
                  <th className="text-right pb-2 text-fg-muted font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map(p => {
                  const st = PAYMENT_STATUS_THEME[p.status] || PAYMENT_STATUS_THEME.PENDING;
                  const StIcon = st.icon;
                  return (
                    <tr key={p.id} className="hover:bg-card-2 transition">
                      <td className="py-2.5 pr-4 text-fg-muted whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                      <td className="py-2.5 pr-4 text-fg capitalize">{p.type?.replace(/_/g, ' ') || '—'}</td>
                      <td className="py-2.5 pr-4"><PlanChip planId={p.planId} /></td>
                      <td className="py-2.5 pr-4 text-fg">{p.paymentMethod}</td>
                      <td className="py-2.5 pr-4 text-fg-muted font-mono">{p.transactionId}</td>
                      <td className="py-2.5 pr-4 text-right font-bold text-fg whitespace-nowrap">
                        PKR {p.amountPaid?.toLocaleString() || '—'}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Services Link ── */}
      <div className="text-center pt-2">
        <p className="text-xs text-fg-muted">
          Curious about what&apos;s included in each plan?{' '}
          <Link href="/services" className="text-[#0A4D94] dark:text-brand-blue-400 font-semibold hover:underline">
            View all 162 services →
          </Link>
        </p>
      </div>
    </div>
  );
}

