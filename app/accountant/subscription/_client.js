'use client';

/**
 * Accountant Subscription & Billing History — /accountant/subscription
 *
 * Read-focused financial view for the college accountant:
 *  - Subscription plan status & billing period
 *  - Quota usage & capacity meters
 *  - Dual-bucket credit balances (Message & AI pools)
 *  - Active add-on summary
 *  - Complete payment history with proof screenshots
 *  - One-click CSV export of payment records
 *
 * APIs used:
 *  GET /api/subscription/current
 *  GET /api/subscription/payment-history
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
  HiOutlineDownload,
  HiOutlineExternalLink,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineBadgeCheck,
  HiOutlineXCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import { apiGet, resolveFileUrl } from '@/lib/api';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  PENDING:  { label: 'Pending Verification', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40', icon: HiOutlineClock },
  APPROVED: { label: 'Approved',            cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40', icon: HiOutlineCheckCircle },
  REJECTED: { label: 'Rejected',            cls: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-300/40', icon: HiOutlineXCircle },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

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

function StatusBadge({ status }) {
  const t = STATUS_THEME[status] || STATUS_THEME.ACTIVE;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${t.cls}`}>
      {t.label}
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
          <span>Monthly plan allowance</span>
          <span className="font-semibold text-fg">{fmtNum(planPool || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Purchased pack (rolls over)</span>
          <span className="font-semibold text-fg">{fmtNum(purchasedPool || 0)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Screenshot Modal ─────────────────────────────────────────────────────────

function ScreenshotModal({ url, onClose }) {
  if (!url) return null;
  const fullUrl = resolveFileUrl(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative max-w-2xl w-full rounded-2xl bg-card border border-line shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-fg">Payment Proof Receipt</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-fg-muted hover:text-fg hover:bg-card-2 transition"
          >
            <HiOutlineX size={18} />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto flex items-center justify-center bg-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullUrl}
            alt="Payment receipt proof"
            className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.innerHTML = `<div class="p-8 text-center text-xs text-fg-muted">Unable to preview image directly. <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline ml-1">Open link</a></div>`;
            }}
          />
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 bg-card-2">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A4D94] dark:text-brand-blue-400 hover:underline"
          >
            <HiOutlineExternalLink size={14} /> Open Original URL
          </a>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccountantSubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

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
      setError(err.response?.data?.message || 'Failed to retrieve subscription billing details.');
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
      setError(err.response?.data?.message || 'Failed to retrieve subscription billing details.');
    }).finally(() => {
      if (!mounted) return;
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // Export payments as CSV
  const handleExportCSV = useCallback(() => {
    if (!payments || payments.length === 0) {
      toast.error('No payment records to export');
      return;
    }

    const headers = ['Date', 'Payment Type', 'Plan Tier', 'Billing Cycle', 'Method', 'Transaction ID', 'Amount (PKR)', 'Status', 'Submitted By'];
    const rows = payments.map(p => [
      `"${fmtDateTime(p.createdAt)}"`,
      `"${p.type || 'RENEWAL'}"`,
      `"${p.planId || ''}"`,
      `"${p.billingCycle || ''}"`,
      `"${p.paymentMethod || ''}"`,
      `"${p.transactionId || ''}"`,
      `"${p.amountPaid || p.expectedAmount || 0}"`,
      `"${p.status || ''}"`,
      `"${p.submittedBy || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `academix_subscription_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Subscription payment history exported to CSV');
  }, [payments]);

  if (loading) return <CollegesHubLoader size="md" text="Loading subscription & ledger history…" minHeight="min-h-[400px]" />;

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
    planId,
    billingCycle,
    subStatus,
    periodEnd,
    effectiveLimits,
    usage,
    credits,
    activeAddons,
    pendingPayment,
  } = sub;

  const lim = effectiveLimits || {};
  const storageUsedGb = (usage?.storageBytes || 0) / 1073741824;
  const storageLimitGb = (lim.maxStorageBytes || 0) / 1073741824;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0A4D94]/10 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0A4D94] dark:text-brand-blue-400">
              Accountant Ledger
            </span>
          </div>
          <h1 className="text-xl font-black text-fg tracking-tight">Subscription &amp; Institutional Quotas</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Audit platform tier costs, active capacity limits, and verification history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-fg-muted hover:text-fg hover:border-line-strong transition shadow-sm"
            title="Refresh Ledger"
          >
            <HiOutlineRefresh size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A4D94] hover:bg-[#083e78] px-3.5 py-2 text-xs font-bold text-white transition shadow-sm"
          >
            <HiOutlineDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Pending Verification Alert ── */}
      {pendingPayment && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-500/10 p-4 flex items-start gap-3">
          <HiOutlineClock size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Payment Under Verification: PKR {pendingPayment.amountPaid?.toLocaleString() || pendingPayment.expectedAmount?.toLocaleString()}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Submitted via {pendingPayment.paymentMethod} (Txn: {pendingPayment.transactionId}) on {fmtDate(pendingPayment.createdAt)}.
              The Super Admin team is currently verifying the funds before updating your tier expiration.
            </p>
            {pendingPayment.screenshotUrl && (
              <button
                type="button"
                onClick={() => setPreviewScreenshot(pendingPayment.screenshotUrl)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 underline mt-1.5"
              >
                <HiOutlineEye size={13} /> View Attached Slip
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Plan & Billing Summary Card ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineBadgeCheck size={18} className="text-[#0A4D94] dark:text-brand-blue-400 shrink-0" />
          <div>
            <h2 className="text-sm font-black text-fg">Contract &amp; Billing Period</h2>
            <p className="text-[11px] text-fg-muted">Institutional SaaS agreement with Collegeshub</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Contract Tier</p>
            <PlanChip planId={planId} />
          </div>
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Standing</p>
            <StatusBadge status={subStatus} />
          </div>
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Cadence</p>
            <p className="text-xs font-bold text-fg">{billingCycle === 'YEARLY' ? 'Annual (1 Mo Free)' : 'Monthly'}</p>
          </div>
          <div>
            <p className="text-[11px] text-fg-muted uppercase tracking-wider font-semibold mb-1">Coverage End</p>
            <p className="text-xs font-bold text-fg">{fmtDate(periodEnd)}</p>
          </div>
        </div>

        {sub.isReadOnly && (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-500/5 p-3 text-xs text-red-700 dark:text-red-400">
            <strong>System Notice:</strong> {sub.readOnlyReason || 'Subscription has expired. Write operations are temporarily suspended.'} Contact Principal / Admin to submit a renewal voucher.
          </div>
        )}
      </div>

      {/* ── Quota & Usage Overview ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineCollection size={18} className="text-[#0A4D94] dark:text-brand-blue-400 shrink-0" />
          <div>
            <h2 className="text-sm font-black text-fg">Quota Utilization</h2>
            <p className="text-[11px] text-fg-muted">Headcount, storage, and online admissions consumption</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UsageMeter icon={HiOutlineUsers} label="Student Accounts" used={usage?.students || 0} limit={lim.maxStudents || 0} />
          <UsageMeter icon={HiOutlineUsers} label="Staff Accounts" used={usage?.staff || 0} limit={lim.maxStaff || 0} />
          <UsageMeter icon={HiOutlineServer} label="Cloud Document Storage" used={Math.round(storageUsedGb * 100) / 100} limit={Math.round(storageLimitGb * 100) / 100} unit=" GB" />
          <UsageMeter icon={HiOutlineDocumentText} label="Online Applications (Annual Cycle)" used={usage?.applications || 0} limit={lim.maxApplications || 0} />
        </div>
      </div>

      {/* ── Dual-Bucket Credit Balances ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineCreditCard size={18} className="text-[#0A4D94] dark:text-brand-blue-400 shrink-0" />
          <div>
            <h2 className="text-sm font-black text-fg">Dual-Bucket Credit Pools</h2>
            <p className="text-[11px] text-fg-muted">Plan allowance resets monthly; purchased add-on packs roll over indefinitely</p>
          </div>
        </div>
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
            label="AI Processing Credits"
            planPool={credits?.ai?.plan?.balance}
            purchasedPool={credits?.ai?.purchased?.balance}
            iconColor="text-violet-500"
          />
        </div>
      </div>

      {/* ── Active Add-ons ── */}
      {activeAddons && activeAddons.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineCollection size={18} className="text-[#0A4D94] dark:text-brand-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-fg">Active Add-on Extensions</h2>
              <p className="text-[11px] text-fg-muted">Supplementary headcount, storage blocks, or special modules billed</p>
            </div>
          </div>
          <div className="space-y-2">
            {activeAddons.map((addon, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card-2 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-fg">{addon.name || addon.addonType}</p>
                  <p className="text-[11px] text-fg-muted">Units: {addon.quantity} · Valid until: {fmtDate(addon.expiresAt)}</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <HiOutlineCheckCircle size={13} /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Complete Payment History Ledger ── */}
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText size={18} className="text-[#0A4D94] dark:text-brand-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-fg">Institutional Payment Ledger</h2>
              <p className="text-[11px] text-fg-muted">All subscription deposits, renewals, and add-on transactions</p>
            </div>
          </div>
          <span className="text-xs text-fg-muted font-medium">
            {payments.length} record{payments.length === 1 ? '' : 's'}
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-10 text-fg-muted border border-dashed border-line rounded-xl">
            <HiOutlineDocumentText size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">No payment records found on file.</p>
            <p className="text-[11px] text-fg-faint mt-0.5">Renewals and add-on purchase submissions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="pb-2.5 pr-4 text-fg-muted font-semibold">Date &amp; Time</th>
                  <th className="pb-2.5 pr-4 text-fg-muted font-semibold">Transaction Type</th>
                  <th className="pb-2.5 pr-4 text-fg-muted font-semibold">Tier</th>
                  <th className="pb-2.5 pr-4 text-fg-muted font-semibold">Channel</th>
                  <th className="pb-2.5 pr-4 text-fg-muted font-semibold">Txn Reference</th>
                  <th className="pb-2.5 pr-4 text-right text-fg-muted font-semibold">Amount (PKR)</th>
                  <th className="pb-2.5 pr-4 text-center text-fg-muted font-semibold">Slip Proof</th>
                  <th className="pb-2.5 text-right text-fg-muted font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map(p => {
                  const st = PAYMENT_STATUS_THEME[p.status] || PAYMENT_STATUS_THEME.PENDING;
                  const StIcon = st.icon;
                  return (
                    <tr key={p.id} className="hover:bg-card-2 transition">
                      <td className="py-3 pr-4 text-fg-muted whitespace-nowrap">{fmtDateTime(p.createdAt)}</td>
                      <td className="py-3 pr-4 font-medium text-fg capitalize">
                        {p.type?.replace(/_/g, ' ').toLowerCase() || 'renewal'}
                      </td>
                      <td className="py-3 pr-4"><PlanChip planId={p.planId} /></td>
                      <td className="py-3 pr-4 text-fg">{p.paymentMethod || '—'}</td>
                      <td className="py-3 pr-4 font-mono text-[11px] text-fg-muted">{p.transactionId || '—'}</td>
                      <td className="py-3 pr-4 text-right font-black text-fg whitespace-nowrap">
                        PKR {fmtNum(p.amountPaid || p.expectedAmount)}
                      </td>
                      <td className="py-3 pr-4 text-center whitespace-nowrap">
                        {p.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewScreenshot(p.screenshotUrl)}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-card px-2 py-1 text-[11px] font-semibold text-fg-muted hover:text-fg hover:border-line-strong transition"
                            title="Inspect bank slip proof"
                          >
                            <HiOutlineEye size={12} /> View
                          </button>
                        ) : (
                          <span className="text-fg-faint">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${st.cls}`}>
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

      {/* ── Screenshot Modal ── */}
      {previewScreenshot && (
        <ScreenshotModal
          url={previewScreenshot}
          onClose={() => setPreviewScreenshot(null)}
        />
      )}
    </div>
  );
}
