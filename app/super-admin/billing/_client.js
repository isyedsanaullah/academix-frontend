'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api, { apiGet, apiPost } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import PlanBadge from '@/components/common/PlanBadge';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import {
  HiOutlineCreditCard,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineExternalLink,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineClipboardList,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi';

function fmtPkr(val) {
  return `PKR ${Number(val || 0).toLocaleString()}`;
}

function fmtDate(d, withTime = false) {
  if (!d) return '—';
  const opts = withTime
    ? { timeZone: 'Asia/Karachi', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { timeZone: 'Asia/Karachi', year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(d).toLocaleString('en-PK', opts);
}

const SUB_STATUS_META = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  TRIAL: { label: 'Free Trial', cls: 'bg-sky-50 border-sky-200 text-[#0A4D94]' },
  PENDING_PAYMENT: { label: 'Pending Payment', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
  EXPIRED: { label: 'Expired', cls: 'bg-red-50 border-red-200 text-red-700' },
  DEACTIVATED: { label: 'Deactivated', cls: 'bg-slate-100 border-slate-300 text-slate-700' },
};

const INV_STATUS_META = {
  UNPAID: { label: 'Unpaid', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'bg-blue-50 border-blue-200 text-[#0A4D94]' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-50 border-emerald-200 text-[#1F7A3A]' },
  PAID: { label: 'Paid', cls: 'bg-emerald-50 border-emerald-200 text-[#1F7A3A]' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 border-red-200 text-red-700' },
  VOID: { label: 'Void', cls: 'bg-slate-100 border-slate-200 text-slate-500' },
};

function StatusPill({ status, map }) {
  const key = String(status || '').toUpperCase();
  const meta = map[key] || { label: key || '—', cls: 'bg-slate-100 border-slate-200 text-slate-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export default function SuperAdminBillingClient() {
  const [activeTab, setActiveTab] = useState('colleges'); // 'colleges' | 'pending' | 'plans' | 'audit'
  const [overview, setOverview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);

  // Plan pricing management (3 fixed plans)
  const [planList, setPlanList] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planDrafts, setPlanDrafts] = useState({});
  const [savingPlanId, setSavingPlanId] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [invoiceFilter, setInvoiceFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Invoice detail drawer state
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyBox, setShowDenyBox] = useState(false);
  const [processingInvoiceAction, setProcessingInvoiceAction] = useState(false);

  // College history + manual activate/deactivate drawer state
  const [collegeHistory, setCollegeHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [manualPlanId, setManualPlanId] = useState('standard');
  const [manualCycle, setManualCycle] = useState('MONTHLY');
  const [manualReason, setManualReason] = useState('');
  const [processingToggle, setProcessingToggle] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const res = await api.get('/super-admin/billing/overview', {
        params: {
          status: statusFilter,
          invoiceStatus: activeTab === 'pending' ? 'PENDING_REVIEW' : invoiceFilter,
          planId: planFilter,
          search: searchQuery.trim() || undefined,
          limit: 100,
        },
      });
      if (res?.data?.success) {
        setOverview(res.data.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load billing overview.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, invoiceFilter, planFilter, searchQuery, activeTab]);

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await apiGet('/super-admin/billing/audit-logs?limit=100');
      if (res?.success) {
        setAuditLogs(res.data?.logs || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await apiGet('/super-admin/plans');
      if (res?.success && Array.isArray(res.plans)) {
        setPlanList(res.plans);
        const drafts = {};
        for (const p of res.plans) {
          drafts[p.id] = {
            monthlyPricePkr: String(p.currentPrices?.monthly ?? 0),
            yearlyPricePkr: String(p.currentPrices?.yearly ?? 0),
          };
        }
        setPlanDrafts(drafts);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load plan pricing.');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const handleSavePlanPrice = async (planId) => {
    const draft = planDrafts[planId];
    if (!draft) return;
    const monthlyPricePkr = Number(draft.monthlyPricePkr);
    const yearlyPricePkr = Number(draft.yearlyPricePkr);
    if (!Number.isFinite(monthlyPricePkr) || monthlyPricePkr < 0 || !Number.isFinite(yearlyPricePkr) || yearlyPricePkr < 0) {
      toast.error('Enter valid non-negative PKR prices.');
      return;
    }
    setSavingPlanId(planId);
    try {
      const { data } = await api.put(`/super-admin/plans/${planId}`, {
        monthlyPricePkr,
        yearlyPricePkr,
      });
      if (data?.success) {
        toast.success(data.message || `Updated ${planId} pricing.`);
        await loadPlans();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update plan pricing.');
    } finally {
      setSavingPlanId('');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      if (activeTab === 'audit') {
        await loadAuditLogs();
      } else if (activeTab === 'plans') {
        await loadPlans();
      } else {
        await loadOverview();
      }
    })();
    return () => { mounted = false; };
  }, [activeTab, loadOverview, loadAuditLogs, loadPlans]);

  const openInvoiceDetail = async (invoiceId) => {
    if (!invoiceId) return;
    setInvoiceLoading(true);
    setShowDenyBox(false);
    setDenyReason('');
    setApproveNote('');
    setInvoiceDetail({ loading: true });
    try {
      const res = await apiGet(`/super-admin/billing/invoices/${invoiceId}`);
      if (res?.success) {
        setInvoiceDetail(res.data);
      } else {
        throw new Error(res?.message || 'Failed to fetch invoice');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Unable to inspect invoice.');
      setInvoiceDetail(null);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const openCollegeHistory = async (collegeId) => {
    if (!collegeId) return;
    setHistoryLoading(true);
    setManualReason('');
    setCollegeHistory({ loading: true });
    try {
      const res = await apiGet(`/super-admin/billing/colleges/${collegeId}/history`);
      if (res?.success) {
        setCollegeHistory(res.data);
        setManualPlanId(res.data.college?.planId || 'standard');
        setManualCycle(res.data.college?.billingCycle || 'MONTHLY');
      } else {
        throw new Error(res?.message || 'Failed to load billing history');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Unable to load history.');
      setCollegeHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApproveInvoice = async () => {
    const invId = invoiceDetail?.invoice?.id;
    if (!invId) return;
    setProcessingInvoiceAction(true);
    try {
      const res = await apiPost(`/super-admin/billing/invoices/${invId}/approve`, {
        note: approveNote.trim() || undefined,
      });
      if (res?.success) {
        toast.success(res.message || 'Payment approved and subscription activated.');
        setInvoiceDetail(null);
        await loadOverview();
      } else {
        throw new Error(res?.message || 'Approval failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to approve invoice.');
    } finally {
      setProcessingInvoiceAction(false);
    }
  };

  const handleDenyInvoice = async () => {
    const invId = invoiceDetail?.invoice?.id;
    if (!invId) return;
    if (denyReason.trim().length < 3) {
      toast.error('Please enter a denial reason (at least 3 characters).');
      return;
    }
    setProcessingInvoiceAction(true);
    try {
      const res = await apiPost(`/super-admin/billing/invoices/${invId}/deny`, {
        reason: denyReason.trim(),
      });
      if (res?.success) {
        toast.success(res.message || 'Payment rejected and college notified.');
        setInvoiceDetail(null);
        await loadOverview();
      } else {
        throw new Error(res?.message || 'Rejection failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to reject invoice.');
    } finally {
      setProcessingInvoiceAction(false);
    }
  };

  const handleManualToggle = async (action) => {
    const collegeId = collegeHistory?.college?.id;
    if (!collegeId) return;
    if (action === 'DEACTIVATE' && manualReason.trim().length < 3) {
      toast.error('Please provide a reason before deactivating a college.');
      return;
    }
    setProcessingToggle(true);
    try {
      const endpoint =
        action === 'ACTIVATE'
          ? `/super-admin/billing/colleges/${collegeId}/activate`
          : `/super-admin/billing/colleges/${collegeId}/deactivate`;
      const payload =
        action === 'ACTIVATE'
          ? { planId: manualPlanId, billingCycle: manualCycle, reason: manualReason.trim() || undefined }
          : { reason: manualReason.trim() };

      const res = await apiPost(endpoint, payload);
      if (res?.success) {
        toast.success(res.message || 'Subscription status updated.');
        await Promise.all([openCollegeHistory(collegeId), loadOverview()]);
      } else {
        throw new Error(res?.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setProcessingToggle(false);
    }
  };

  const summary = overview?.summary || {
    totalColleges: 0,
    TRIAL: 0,
    PENDING_PAYMENT: 0,
    ACTIVE: 0,
    EXPIRED: 0,
    DEACTIVATED: 0,
    pendingReviewInvoicesCount: 0,
    totalApprovedRevenuePkr: 0,
  };
  const rows = overview?.rows || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0A4D94]">
            <HiOutlineCreditCard size={14} /> Accounts / Billing
          </span>
          <h1 className="text-2xl font-black text-[#0E2238] tracking-tight mt-0.5">
            Subscriptions, Invoices &amp; Price-Lock Control
          </h1>
          <p className="text-xs text-[#52657C] mt-0.5">
            Verify bank transfer proofs, activate/deactivate college access, inspect locked term snapshots, and audit all billing events.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activeTab === 'audit' ? loadAuditLogs() : activeTab === 'plans' ? loadPlans() : loadOverview())}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDE6F0] bg-white hover:bg-slate-50 text-xs font-bold text-[#0E2238] cursor-pointer"
        >
          <HiOutlineRefresh size={15} /> Refresh
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active Colleges', value: summary.ACTIVE, accent: 'text-[#299A49] border-emerald-200 bg-emerald-50/50' },
          { label: 'Free Trial', value: summary.TRIAL, accent: 'text-[#0A4D94] border-blue-200 bg-blue-50/50' },
          { label: 'Pending Payment', value: summary.PENDING_PAYMENT, accent: 'text-amber-700 border-amber-200 bg-amber-50/50' },
          { label: 'Expired / Deactivated', value: (summary.EXPIRED || 0) + (summary.DEACTIVATED || 0), accent: 'text-red-700 border-red-200 bg-red-50/50' },
          { label: 'Proofs Pending Review', value: summary.pendingReviewInvoicesCount, accent: 'text-[#0A4D94] border-sky-200 bg-sky-50/60' },
          { label: 'Approved Revenue', value: fmtPkr(summary.totalApprovedRevenuePkr), accent: 'text-[#1F7A3A] border-emerald-200 bg-white' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-4 shadow-xs ${kpi.accent}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{kpi.label}</p>
            <p className="text-lg font-black mt-1 text-[#0E2238]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DDE6F0] pb-3">
        {[
          { id: 'colleges', label: 'All Colleges & Subscriptions', icon: HiOutlineShieldCheck },
          {
            id: 'pending',
            label: `Pending Proof Reviews${summary.pendingReviewInvoicesCount > 0 ? ` (${summary.pendingReviewInvoicesCount})` : ''}`,
            icon: HiOutlineClock,
          },
          { id: 'plans', label: 'Plan Pricing (3 Fixed Plans)', icon: HiOutlineCurrencyRupee },
          { id: 'audit', label: 'Billing Audit Log', icon: HiOutlineClipboardList },
        ].map((tab) => {
          const IconComp = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                active
                  ? 'bg-[#0A4D94] text-white shadow-sm'
                  : 'bg-white border border-[#DDE6F0] text-[#52657C] hover:text-[#0E2238]'
              }`}
            >
              <IconComp size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' ? (
        <div className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#0E2238]">Fixed 3 Plans — Super Admin Price Control</h2>
            <p className="text-xs text-[#52657C] mt-0.5">
              CollegesHub uses 3 fixed plans (Starter, Standard, Premium). Updating a price publishes a new Plan Version for new checkouts and renewals while keeping existing active subscribers price-locked until their current term ends.
            </p>
          </div>
          {plansLoading ? (
            <CollegesHubLoader size="md" text="Loading plan pricing…" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planList.map((p) => {
                const draft = planDrafts[p.id] || { monthlyPricePkr: '', yearlyPricePkr: '' };
                const isSaving = savingPlanId === p.id;
                return (
                  <div key={p.id} className="rounded-2xl border border-[#DDE6F0] bg-[#F8FAFD] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <PlanBadge plan={p.id} />
                      <span className="text-[11px] font-bold text-[#52657C]">
                        v{p.currentVersion || 0} · {p.totalCollegesOnPlan || 0} college(s)
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0E2238] mb-1">
                          Monthly Price (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={draft.monthlyPricePkr}
                          onChange={(e) =>
                            setPlanDrafts((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], monthlyPricePkr: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#DDE6F0] bg-white text-xs font-bold text-[#0E2238] focus:border-[#0A4D94] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#0E2238] mb-1">
                          Yearly Price (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={draft.yearlyPricePkr}
                          onChange={(e) =>
                            setPlanDrafts((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], yearlyPricePkr: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#DDE6F0] bg-white text-xs font-bold text-[#0E2238] focus:border-[#0A4D94] focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSavePlanPrice(p.id)}
                      className="w-full py-2 px-3 rounded-xl bg-[#0A4D94] hover:bg-[#083B74] text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Publishing Version…' : `Save ${p.name} Pricing`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'audit' ? (
        <div className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-extrabold text-[#0E2238] mb-4">Platform Billing &amp; Entitlement Audit Trail</h2>
          {auditLoading ? (
            <CollegesHubLoader size="md" text="Loading audit logs…" />
          ) : auditLogs.length === 0 ? (
            <p className="text-xs text-[#52657C] py-8 text-center">No billing audit entries recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#DDE6F0] text-[#52657C]">
                    <th className="text-left pb-2.5 pr-3 font-bold">When (PKT)</th>
                    <th className="text-left pb-2.5 pr-3 font-bold">College</th>
                    <th className="text-left pb-2.5 pr-3 font-bold">Actor</th>
                    <th className="text-left pb-2.5 pr-3 font-bold">Action</th>
                    <th className="text-left pb-2.5 font-bold">Details / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE6F0]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pr-3 text-[#52657C] whitespace-nowrap">{fmtDate(log.createdAt, true)}</td>
                      <td className="py-2.5 pr-3 font-bold text-[#0E2238] whitespace-nowrap">
                        {log.college?.name || log.college_id}
                      </td>
                      <td className="py-2.5 pr-3 text-[#0E2238] whitespace-nowrap">
                        {log.actorEmail || log.actorUserId}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-[#0A4D94]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#52657C] max-w-md">{log.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-5 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <HiOutlineSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52657C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search college, code, email, invoice #, or bank ref…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] text-xs text-[#0E2238] focus:bg-white focus:border-[#0A4D94] focus:outline-none"
              />
            </div>

            {activeTab === 'colleges' && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#DDE6F0] bg-white text-xs font-semibold text-[#0E2238]"
                >
                  <option value="ALL">All Sub Statuses</option>
                  <option value="TRIAL">Free Trial</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>

                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#DDE6F0] bg-white text-xs font-semibold text-[#0E2238]"
                >
                  <option value="ALL">All Invoice Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </>
            )}

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#DDE6F0] bg-white text-xs font-semibold text-[#0E2238]"
            >
              <option value="ALL">All Plans</option>
              <option value="starter">Starter</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <CollegesHubLoader size="md" text="Loading colleges & billing records…" />
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#52657C]">
              No colleges match the active filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#DDE6F0] text-[#52657C]">
                    <th className="text-left pb-2.5 pr-3 font-bold">College</th>
                    <th className="text-left pb-2.5 pr-3 font-bold">Sub Status</th>
                    <th className="text-left pb-2.5 pr-3 font-bold">Plan &amp; Term</th>
                    <th className="text-left pb-2.5 pr-3 font-bold">Days Left / Dates</th>
                    <th className="text-left pb-2.5 pr-3 font-bold">Invoice</th>
                    <th className="text-right pb-2.5 pr-3 font-bold">Amount</th>
                    <th className="text-right pb-2.5 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE6F0]">
                  {rows.map((row) => {
                    const { college, activeSubscription, latestInvoice, pendingReviewInvoice } = row;
                    const inspectTarget = pendingReviewInvoice || latestInvoice;
                    return (
                      <tr key={college.id} className="hover:bg-slate-50/80">
                        <td className="py-3 pr-3">
                          <p className="font-extrabold text-[#0E2238]">{college.name}</p>
                          <p className="text-[11px] text-[#52657C]">{college.code} · {college.email}</p>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          <StatusPill status={college.effectiveSubStatus} map={SUB_STATUS_META} />
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <PlanBadge plan={activeSubscription?.planId || college.planId || 'standard'} />
                            <span className="text-[11px] font-semibold text-[#52657C]">
                              {activeSubscription?.billingCycle || college.billingCycle || 'MONTHLY'}
                            </span>
                          </div>
                          {activeSubscription?.status === 'ACTIVE' && (
                            <p className="text-[10px] text-[#299A49] font-bold mt-0.5">
                              Price Locked: {fmtPkr(activeSubscription.totalPkr)}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-[#52657C] whitespace-nowrap">
                          {college.effectiveSubStatus === 'TRIAL' ? (
                            <span className="font-bold text-[#0A4D94]">
                              {college.daysRemaining ?? 0} trial days left
                              <span className="block text-[10px] font-normal text-[#52657C]">
                                Ends {fmtDate(college.trialEndsAt)}
                              </span>
                            </span>
                          ) : college.periodEnd ? (
                            <span>
                              Ends {fmtDate(college.periodEnd)}
                              {typeof college.daysRemaining === 'number' && college.daysRemaining > 0 && (
                                <span className="block text-[10px] text-[#299A49] font-semibold">
                                  {college.daysRemaining}d remaining
                                </span>
                              )}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {inspectTarget ? (
                            <div>
                              <p className="font-mono font-bold text-[#0E2238]">{inspectTarget.invoiceNo}</p>
                              <div className="mt-0.5">
                                <StatusPill status={inspectTarget.status} map={INV_STATUS_META} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#52657C]">No invoice</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right font-extrabold text-[#0E2238] whitespace-nowrap">
                          {inspectTarget
                            ? fmtPkr(inspectTarget.amount)
                            : activeSubscription
                            ? fmtPkr(activeSubscription.totalPkr)
                            : '—'}
                        </td>
                        <td className="py-3 text-right whitespace-nowrap space-x-1.5">
                          {inspectTarget && (
                            <button
                              type="button"
                              onClick={() => openInvoiceDetail(inspectTarget.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                                inspectTarget.status === 'PENDING_REVIEW'
                                  ? 'bg-[#0A4D94] text-white hover:bg-[#083D77]'
                                  : 'border border-[#DDE6F0] bg-white text-[#0E2238] hover:bg-slate-50'
                              }`}
                            >
                              <HiOutlineEye size={13} />
                              {inspectTarget.status === 'PENDING_REVIEW' ? 'Review Proof' : 'Invoice'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openCollegeHistory(college.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DDE6F0] bg-white hover:bg-slate-50 text-[11px] font-bold text-[#0E2238] cursor-pointer"
                          >
                            <HiOutlineDocumentText size={13} /> History
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

      {/* ── INVOICE DETAIL & APPROVAL/DENIAL MODAL ── */}
      <Modal
        open={Boolean(invoiceDetail)}
        onClose={() => !processingInvoiceAction && setInvoiceDetail(null)}
        title={invoiceDetail?.invoice ? `Invoice ${invoiceDetail.invoice.invoiceNo}` : 'Invoice Details'}
        subtitle={invoiceDetail?.college?.name || 'Inspect payment proof and line items'}
        width="w-full sm:max-w-2xl"
      >
        {invoiceLoading || invoiceDetail?.loading ? (
          <CollegesHubLoader size="md" text="Loading invoice & payment proof…" />
        ) : invoiceDetail?.invoice && (
          <div className="space-y-5 text-xs">
            {/* Summary card */}
            <div className="rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#52657C]">Status</p>
                <div className="mt-1">
                  <StatusPill status={invoiceDetail.invoice.status} map={INV_STATUS_META} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#52657C]">Total Payable</p>
                <p className="text-sm font-black text-[#0A4D94] mt-0.5">{fmtPkr(invoiceDetail.invoice.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#52657C]">Issued / Due</p>
                <p className="font-semibold text-[#0E2238] mt-0.5">
                  {fmtDate(invoiceDetail.invoice.createdAt)} · Due {fmtDate(invoiceDetail.invoice.dueDate)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-3 pt-2 border-t border-[#DDE6F0]">
                <p className="text-[10px] font-bold uppercase text-[#52657C]">Purpose</p>
                <p className="font-semibold text-[#0E2238] mt-0.5">{invoiceDetail.invoice.purpose || '—'}</p>
              </div>
              {invoiceDetail.invoice.referenceNumber && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#52657C]">Bank Ref #</p>
                  <p className="font-mono font-bold text-[#0E2238] mt-0.5">{invoiceDetail.invoice.referenceNumber}</p>
                </div>
              )}
              {invoiceDetail.invoice.submissionNote && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase text-[#52657C]">College Note</p>
                  <p className="text-[#0E2238] mt-0.5">{invoiceDetail.invoice.submissionNote}</p>
                </div>
              )}
            </div>

            {/* Uploaded Proof Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-[#0E2238]">Uploaded Bank Transfer Proof (R2)</h4>
                {invoiceDetail.proofUrl && (
                  <a
                    href={invoiceDetail.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#0A4D94] hover:underline"
                  >
                    Open Full File <HiOutlineExternalLink size={13} />
                  </a>
                )}
              </div>
              {invoiceDetail.proofUrl ? (
                invoiceDetail.invoice.proofMimeType === 'application/pdf' ? (
                  <iframe
                    src={invoiceDetail.proofUrl}
                    title="Payment Receipt PDF"
                    className="w-full h-72 rounded-xl border border-[#DDE6F0] bg-slate-50"
                  />
                ) : (
                  <div className="rounded-xl border border-[#DDE6F0] bg-slate-50 p-2 flex justify-center">
                    <img
                      src={invoiceDetail.proofUrl}
                      alt="Bank transfer proof"
                      className="max-h-80 rounded-lg object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-dashed border-[#DDE6F0] p-6 text-center text-[#52657C]">
                  No payment screenshot has been uploaded for this invoice yet.
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-[#DDE6F0] overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#F4F7FB] border-b border-[#DDE6F0] text-[#52657C]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Line Item</th>
                    <th className="text-center px-2 py-2 font-bold">Qty</th>
                    <th className="text-right px-3 py-2 font-bold">Amount</th>
                    <th className="text-right px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE6F0]">
                  {(Array.isArray(invoiceDetail.invoice.lineItems) ? invoiceDetail.invoice.lineItems : []).map((li, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-[#0E2238]">{li.name || li.addonType || 'Plan'}</td>
                      <td className="px-2 py-2 text-center text-[#52657C]">{li.quantity ?? 1}</td>
                      <td className="px-3 py-2 text-right font-bold text-[#0E2238]">{fmtPkr(li.subtotalPkr ?? li.subtotal)}</td>
                      <td className="px-3 py-2 text-right font-bold text-[#52657C]">{li.status || invoiceDetail.invoice.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approve / Deny Actions */}
            {!['APPROVED', 'PAID', 'VOID'].includes(String(invoiceDetail.invoice.status).toUpperCase()) && (
              <div className="rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] p-4 space-y-3">
                <h4 className="font-extrabold text-[#0E2238]">Verification Decision</h4>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#52657C] mb-1">
                    Approval Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    placeholder="e.g. Verified in UBL statement"
                    className="w-full rounded-xl border border-[#DDE6F0] bg-white px-3 py-2 text-xs text-[#0E2238]"
                  />
                </div>

                {showDenyBox && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-red-700 mb-1">
                      Rejection Reason (Sent to College Admin) *
                    </label>
                    <textarea
                      rows={2}
                      value={denyReason}
                      onChange={(e) => setDenyReason(e.target.value)}
                      placeholder="e.g. Transaction reference not visible or amount short"
                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-[#0E2238]"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={processingInvoiceAction}
                    onClick={handleApproveInvoice}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#299A49] hover:bg-[#1F7A3A] text-white font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineCheckCircle size={15} />
                    {processingInvoiceAction ? 'Processing…' : 'Approve Payment & Activate Term'}
                  </button>

                  {!showDenyBox ? (
                    <button
                      type="button"
                      disabled={processingInvoiceAction}
                      onClick={() => setShowDenyBox(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold cursor-pointer"
                    >
                      <HiOutlineXCircle size={15} /> Deny Payment
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={processingInvoiceAction}
                      onClick={handleDenyInvoice}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      <HiOutlineXCircle size={15} /> Confirm Rejection
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Proof submission attempts history */}
            {Array.isArray(invoiceDetail.submissions) && invoiceDetail.submissions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-[#0E2238]">Submission Attempts</h4>
                <div className="space-y-1.5">
                  {invoiceDetail.submissions.map((subm) => (
                    <div key={subm.id} className="rounded-lg border border-[#DDE6F0] px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-[#0E2238]">{fmtDate(subm.createdAt, true)}</span>
                        {subm.referenceNumber && <span className="ml-2 font-mono text-[#52657C]">Ref: {subm.referenceNumber}</span>}
                        {subm.rejectionReason && <p className="text-red-700 text-[11px]">Rejected: {subm.rejectionReason}</p>}
                      </div>
                      <StatusPill status={subm.status} map={INV_STATUS_META} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── COLLEGE HISTORY & MANUAL CONTROLS MODAL ── */}
      <Modal
        open={Boolean(collegeHistory)}
        onClose={() => !processingToggle && setCollegeHistory(null)}
        title={collegeHistory?.college ? collegeHistory.college.name : 'College Billing History'}
        subtitle="Subscription terms, price locks, manual activation controls, and audit log"
        width="w-full sm:max-w-2xl"
      >
        {historyLoading || collegeHistory?.loading ? (
          <CollegesHubLoader size="md" text="Loading college billing history…" />
        ) : collegeHistory?.college && (
          <div className="space-y-5 text-xs">
            {/* Manual Activate / Deactivate Controls */}
            <div className="rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-extrabold text-[#0E2238]">Manual Subscription Control</h4>
                <StatusPill status={collegeHistory.college.snapshot?.effectiveSubStatus} map={SUB_STATUS_META} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  value={manualPlanId}
                  onChange={(e) => setManualPlanId(e.target.value)}
                  className="rounded-xl border border-[#DDE6F0] bg-white px-3 py-2 text-xs font-semibold text-[#0E2238]"
                >
                  <option value="starter">Starter</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select
                  value={manualCycle}
                  onChange={(e) => setManualCycle(e.target.value)}
                  className="rounded-xl border border-[#DDE6F0] bg-white px-3 py-2 text-xs font-semibold text-[#0E2238]"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Audit reason (required to deactivate)"
                  className="rounded-xl border border-[#DDE6F0] bg-white px-3 py-2 text-xs text-[#0E2238]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={processingToggle}
                  onClick={() => handleManualToggle('ACTIVATE')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#299A49] hover:bg-[#1F7A3A] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  <HiOutlineLockOpen size={14} /> Manually Activate Subscription
                </button>
                <button
                  type="button"
                  disabled={processingToggle}
                  onClick={() => handleManualToggle('DEACTIVATE')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold cursor-pointer disabled:opacity-50"
                >
                  <HiOutlineLockClosed size={14} /> Deactivate College Access
                </button>
              </div>
            </div>

            {/* Subscription Snapshots (Price Lock) */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-[#0E2238]">Price-Locked Subscription Terms</h4>
              {collegeHistory.subscriptions?.length ? (
                <div className="space-y-2">
                  {collegeHistory.subscriptions.map((s) => (
                    <div key={s.id} className="rounded-xl border border-[#DDE6F0] p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-[#0E2238]">
                          {s.planName} ({s.billingCycle}) — Locked Total: {fmtPkr(s.totalPkr)}
                        </p>
                        <p className="text-[11px] text-[#52657C]">
                          Base plan: {fmtPkr(s.planPricePkr)} · Term: {fmtDate(s.startsAt)} → {fmtDate(s.endsAt)}
                        </p>
                      </div>
                      <StatusPill status={s.status} map={SUB_STATUS_META} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#52657C]">No subscription term records yet.</p>
              )}
            </div>

            {/* Invoices History */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-[#0E2238]">Invoice History</h4>
              {collegeHistory.invoices?.length ? (
                <div className="space-y-1.5">
                  {collegeHistory.invoices.map((inv) => (
                    <div key={inv.id} className="rounded-xl border border-[#DDE6F0] px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-mono font-bold text-[#0E2238]">{inv.invoiceNo} · {fmtPkr(inv.amount)}</p>
                        <p className="text-[11px] text-[#52657C]">{fmtDate(inv.createdAt)} · {inv.purpose}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={inv.status} map={INV_STATUS_META} />
                        <button
                          type="button"
                          onClick={() => { setCollegeHistory(null); openInvoiceDetail(inv.id); }}
                          className="px-2.5 py-1 rounded-lg border border-[#DDE6F0] font-bold text-[#0A4D94] hover:bg-slate-50 cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#52657C]">No invoices generated yet.</p>
              )}
            </div>

            {/* Audit Log */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-[#0E2238]">Audit Log</h4>
              {collegeHistory.auditLogs?.length ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {collegeHistory.auditLogs.map((a) => (
                    <div key={a.id} className="rounded-lg border border-[#DDE6F0] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[#0A4D94]">{a.action}</span>
                        <span className="text-[10px] text-[#52657C]">{fmtDate(a.createdAt, true)}</span>
                      </div>
                      <p className="text-[#52657C] mt-0.5">{a.reason || '—'} · By {a.actorEmail || a.actorUserId}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#52657C]">No audit entries for this college.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
