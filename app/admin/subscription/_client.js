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
  HiOutlineDocumentText,
  HiOutlineArrowUp,
  HiOutlinePlusCircle,
  HiOutlineBadgeCheck,
  HiOutlineXCircle,
} from 'react-icons/hi';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import PlanCheckoutWizard from '@/components/subscription/PlanCheckoutWizard';
import { apiGet } from '@/lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', year: 'numeric', month: 'short', day: 'numeric' });
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
  ACTIVE:          { label: 'Active',          cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' },
  TRIAL:           { label: 'Free Trial',      cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700' },
  PENDING_PAYMENT: { label: 'Pending Payment', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' },
  EXPIRED:         { label: 'Expired',         cls: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700' },
  DEACTIVATED:     { label: 'Deactivated',     cls: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700' },
  SUSPENDED:       { label: 'Suspended',       cls: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700' },
  PENDING:         { label: 'Pending',         cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' },
};

const PAYMENT_STATUS_THEME = {
  PENDING:  { label: 'Pending Review', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: HiOutlineClock },
  APPROVED: { label: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: HiOutlineCheckCircle },
  REJECTED: { label: 'Rejected',       cls: 'bg-red-500/10 text-red-700 dark:text-red-400', icon: HiOutlineXCircle },
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckoutWizard, setShowCheckoutWizard] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subRes, historyRes] = await Promise.all([
        apiGet('/subscription/current'),
        apiGet('/subscription/payment-history'),
      ]);
      if (subRes?.success) setSub(subRes.data);
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
      apiGet('/subscription/payment-history'),
    ]).then(([subRes, historyRes]) => {
      if (!mounted) return;
      if (subRes?.success) setSub(subRes.data);
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

  const handleWizardStatusChange = useCallback((nextSub) => {
    if (nextSub) setSub(nextSub);
  }, []);

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
    daysRemaining, activeSubscription,
    effectiveLimits, usage, credits, activeAddons, pendingPayment
  } = sub;

  const lim = effectiveLimits || {};
  const storageUsedGb = (usage?.storageBytes || 0) / 1073741824;
  const storageLimitGb = (lim.maxStorageBytes || 0) / 1073741824;

  // Compute >=80% quota utilization warnings across meters
  const highUsageAlerts = [];
  const pushAlert = (label, used, limit) => {
    if (limit > 0 && (used / limit) >= 0.8) {
      highUsageAlerts.push({ label, pct: Math.min(100, Math.round((used / limit) * 100)) });
    }
  };
  pushAlert('Students', usage?.students || 0, lim.maxStudents || 0);
  pushAlert('Staff', usage?.staff || 0, lim.maxStaff || 0);
  pushAlert('Storage', storageUsedGb, storageLimitGb);
  pushAlert('Online Applications', usage?.applications || 0, lim.maxApplications || 0);
  pushAlert('Monthly Emails', usage?.emailsSent || 0, lim.emailsMonthly || 0);
  if (credits?.ai?.warning80Pct) {
    highUsageAlerts.push({ label: 'Monthly AI Credits', pct: Math.round(credits.ai.utilizationPct || 80) });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-fg tracking-tight">Subscription &amp; Billing</h1>
          <p className="text-xs text-fg-muted mt-0.5">Manage your plan, usage, add-ons, and payment history.</p>
        </div>
        {sub.isCustomQuote && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 dark:border-indigo-700 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            Custom Quote Deal
          </span>
        )}
      </div>

      {/* ── Grandfathering Countdown Banner ── */}
      {sub.grandfatheredUntil && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-500/10 p-4 flex items-start gap-3">
          <HiOutlineClock size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Legacy Allowance Grandfathering Active</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Your legacy capacity limits remain protected until <strong>{fmtDate(sub.grandfatheredUntil)}</strong>. Standard 3-plan renewal pricing applies at your next billing renewal.
            </p>
          </div>
        </div>
      )}

      {/* ── >=80% High Utilization Alert Banner ── */}
      {highUsageAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-500/10 p-4 flex items-start gap-3">
          <HiOutlineExclamationCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Approaching Plan Quota Limit (&ge;80%)</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {highUsageAlerts.map(a => `${a.label} (${a.pct}%)`).join(' · ')} — consider an add-on block or plan upgrade before reaching 100%.
            </p>
          </div>
        </div>
      )}

      {/* ── Trial Banner ── */}
      {subStatus === 'TRIAL' && (
        <div className="rounded-2xl border border-sky-300 dark:border-sky-700 bg-sky-50/80 dark:bg-sky-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <HiOutlineLightningBolt size={20} className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-sky-800 dark:text-sky-300">
                Free Trial Active{typeof daysRemaining === 'number' ? ` · ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining` : ''}
              </p>
              <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
                Your trial expires on <strong>{fmtDate(trialEndsAt || periodEnd)}</strong>. Choose a plan and submit your UBL bank transfer proof to activate your subscription.
              </p>
            </div>
          </div>
          <Link
            href="/admin/choose-plan"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] px-4 py-2 text-xs font-bold text-white shadow transition"
          >
            Choose Plan &amp; Pay →
          </Link>
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
        <SectionHeader icon={HiOutlineBadgeCheck} title="Current Plan" subtitle="Subscription overview, price lock, and billing period" />
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

        {activeSubscription && (
          <div className="mt-4 rounded-xl border border-[#299A49]/30 bg-emerald-50/60 dark:bg-emerald-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#1F7A3A] dark:text-emerald-300 font-bold">
              <HiOutlineShieldCheck size={16} />
              <span>
                Term Price Locked: PKR {Number(activeSubscription.totalPkr ?? activeSubscription.planPricePkr ?? 0).toLocaleString()} ({activeSubscription.billingCycle})
              </span>
            </div>
            <span className="text-[11px] text-fg-muted">
              Protected through {fmtDate(activeSubscription.endsAt || periodEnd)}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/admin/choose-plan"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A4D94] hover:bg-[#083e78] px-4 py-2 text-xs font-bold text-white transition"
          >
            <HiOutlineArrowUp size={14} /> Choose Plan, Add-Ons &amp; Voucher
          </Link>
          <button
            type="button"
            onClick={() => setShowCheckoutWizard(v => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card-2 px-4 py-2 text-xs font-semibold text-fg hover:border-line-strong transition cursor-pointer"
          >
            <HiOutlineRefresh size={14} /> {showCheckoutWizard ? 'Hide Checkout & Invoices' : 'Manage Invoices & Upload Proof'}
          </button>
        </div>

        {showCheckoutWizard && (
          <div className="mt-6 pt-6 border-t border-line">
            <PlanCheckoutWizard onStatusChange={handleWizardStatusChange} />
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
          <UsageMeter icon={HiOutlineLightningBolt} label="Monthly Bulk Emails (2FA exempt)" used={usage?.emailsSent || 0} limit={lim.emailsMonthly || 0} />
          <UsageMeter icon={HiOutlineShieldCheck} label="Administrator Seats (Fixed Cap)" used={usage?.admins || 0} limit={lim.maxAdmins || 0} />
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

      {/* ── Choose Add-ons CTA ── */}
      <div className="rounded-2xl border border-line bg-card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-fg">Need Extra Students, Storage, or Campuses?</h3>
          <p className="text-xs text-fg-muted mt-0.5">
            Select add-ons dynamically from the live catalog and include them in your bank transfer voucher.
          </p>
        </div>
        <Link
          href="/admin/choose-plan"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card-2 px-4 py-2 text-xs font-bold text-[#0A4D94] dark:text-brand-blue-400 hover:border-[#0A4D94]/40 transition"
        >
          <HiOutlinePlusCircle size={15} /> Configure Plan &amp; Add-Ons
        </Link>
      </div>

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

