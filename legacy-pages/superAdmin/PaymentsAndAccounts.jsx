'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../../lib/useDebounce';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CollegesHubLoader from '../../components/common/CollegesHubLoader';
import PlanBadge, { normalizePlanId } from '../../components/common/PlanBadge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/Icon';
import Percentage from '../../components/ui/Percentage';

const formatPKR = (amount) => {
  const num = Number(amount || 0);
  return `PKR ${num.toLocaleString('en-PK')}`;
};

const formatDate = (value, includeTime = false) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(
    'en-PK',
    includeTime
      ? {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      : {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }
  );
};

const normalizePaymentStatus = (rawStatus) => {
  const s = String(rawStatus || '').toLowerCase();
  if (s === 'approved' || s === 'paid' || s === 'completed') return 'paid';
  if (s === 'pending' || s === 'unpaid' || s === 'processing') return 'pending';
  if (s === 'rejected' || s === 'failed' || s === 'cancelled') return 'rejected';
  if (s === 'refunded') return 'refunded';
  return 'pending';
};

const StatusBadge = ({ status }) => {
  const norm = normalizePaymentStatus(status);
  const map = {
    paid: { label: 'Paid', cls: 'label-green' },
    pending: { label: 'Pending', cls: 'label-yellow' },
    rejected: { label: 'Rejected', cls: 'label-red' },
    refunded: { label: 'Refunded', cls: 'label-blue' },
  };
  const cfg = map[norm] || map.pending;
  return <span className={`label ${cfg.cls}`}>{cfg.label}</span>;
};

const PaymentsAndAccounts = () => {
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('history'); // 'history' | 'colleges' | 'accountants'
  const [loading, setLoading] = useState(true);
  const [accountantsLoading, setAccountantsLoading] = useState(false);

  const [billingPayments, setBillingPayments] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [platformInvoices, setPlatformInvoices] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [accountants, setAccountants] = useState([]);

  // Filters & Sorting for Payments History
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'amount' | 'college' | 'status'
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Filters for Per-College Billing & Accountants
  const [collegeSearch, setCollegeSearch] = useState('');
  const [accountantSearch, setAccountantSearch] = useState('');

  // Modals: Receipt / Proof Modal & Per-College Statement Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [proofUrl, setProofUrl] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [statementCollege, setStatementCollege] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [allBillingRes, pendingRes, invoicesRes, collegesRes] =
          await Promise.all([
            api
              .get('/super-admin/billing/all?limit=500')
              .catch(() => ({ data: { payments: [] } })),
            api
              .get('/super-admin/billing/pending')
              .catch(() => ({ data: { payments: [] } })),
            api
              .get('/super-admin/invoices')
              .catch(() => ({ data: { data: [] } })),
            api
              .get('/super-admin/colleges?limit=1000')
              .catch(() => ({ data: { data: [] } })),
          ]);

        const rawPayments =
          allBillingRes.data?.payments || allBillingRes.data?.data || [];
        const rawPending =
          pendingRes.data?.payments || pendingRes.data?.data || [];
        const rawInvoices =
          invoicesRes.data?.data || invoicesRes.data?.invoices || [];
        const rawColleges =
          collegesRes.data?.data?.colleges ||
          collegesRes.data?.data ||
          collegesRes.data?.colleges ||
          [];

        setBillingPayments(Array.isArray(rawPayments) ? rawPayments : []);
        setPendingQueue(Array.isArray(rawPending) ? rawPending : []);
        setPlatformInvoices(Array.isArray(rawInvoices) ? rawInvoices : []);
        const collegeList = Array.isArray(rawColleges) ? rawColleges : [];
        setColleges(collegeList);

        // Fetch Accountant user accounts across colleges via existing /users?role=accountant&college_id=<id>
        if (collegeList.length > 0) {
          setAccountantsLoading(true);
          const results = await Promise.all(
            collegeList.map(async (c) => {
              const cid = c.id || c._id;
              try {
                const res = await api.get(
                  `/users?role=accountant&college_id=${cid}&limit=50`
                );
                const users =
                  res.data?.data?.users ||
                  res.data?.data ||
                  res.data?.users ||
                  [];
                if (Array.isArray(users) && users.length > 0) {
                  return users.map((u) => ({
                    id: u.id || u._id,
                    name: u.name || 'Accountant',
                    email: u.email || c.email || '—',
                    phone: u.phone || c.phone || '—',
                    isActive: u.isActive !== false,
                    lastLogin: u.lastLogin || u.lastLoginAt || null,
                    createdAt: u.createdAt,
                    accountType: 'Dedicated Accountant',
                    collegeId: cid,
                    collegeName: c.name,
                    collegeCode: c.code,
                  }));
                }
              } catch {
                // Ignore per-college fetch error and fall back to institutional billing contact
              }
              return [
                {
                  id: `primary-${cid}`,
                  name: c.principalName || `${c.name} Billing Desk`,
                  email: c.email || '—',
                  phone: c.phone || '—',
                  isActive: c.isActive !== false,
                  lastLogin: null,
                  createdAt: c.createdAt,
                  accountType: 'Primary Billing Contact (No separate Accountant user)',
                  collegeId: cid,
                  collegeName: c.name,
                  collegeCode: c.code,
                },
              ];
            })
          );
          setAccountants(results.flat());
          setAccountantsLoading(false);
        }
      } catch {
        toast.error('Failed to load payments and accounting data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Unified Ledger of Subscription Payments + Platform Invoices ── */
  const unifiedPayments = useMemo(() => {
    const collegeMap = new Map();
    colleges.forEach((c) => {
      collegeMap.set(c.id || c._id, c);
    });

    const fromBilling = billingPayments.map((p) => {
      const col = p.college || collegeMap.get(p.college_id) || {};
      const status = normalizePaymentStatus(p.status);
      const effectiveAmount =
        status === 'paid'
          ? Number(p.verifiedAmount ?? p.amountPaid ?? p.expectedAmount ?? 0)
          : Number(p.amountPaid ?? p.expectedAmount ?? 0);
      return {
        id: `pay-${p.id}`,
        rawId: p.id,
        source: 'subscription_payment',
        date: p.reviewedAt || p.createdAt,
        createdAt: p.createdAt,
        collegeId: p.college_id || col.id || col._id,
        collegeName: col.name || 'Unknown College',
        collegeCode: col.code || '—',
        planId: normalizePlanId(p.planId || col.subscription?.plan || 'starter'),
        billingCycle: p.billingCycle || 'monthly',
        amount: effectiveAmount,
        expectedAmount: Number(p.expectedAmount || effectiveAmount),
        method: p.paymentMethod || 'Bank Transfer',
        reference: p.transactionId || p.receiptNumber || '—',
        receiptNumber: p.receiptNumber || null,
        status,
        rawStatus: p.status,
        hasProof: Boolean(p.screenshotUrl || p.id),
        overrideNote: p.overrideNote || null,
        rejectionReason: p.rejectionReason || null,
      };
    });

    // Include Platform Invoices that aren't already duplicated by reference
    const existingRefs = new Set(
      fromBilling.map((b) => b.reference).filter((r) => r && r !== '—')
    );
    const fromInvoices = platformInvoices
      .filter((inv) => !inv.reference || !existingRefs.has(inv.reference))
      .map((inv) => {
        const col = inv.college || collegeMap.get(inv.college_id) || {};
        const status = normalizePaymentStatus(inv.status);
        return {
          id: `inv-${inv.id}`,
          rawId: inv.id,
          source: 'platform_invoice',
          date: inv.paidAt || inv.createdAt,
          createdAt: inv.createdAt,
          collegeId: inv.college_id || col.id || col._id,
          collegeName: col.name || 'Unknown College',
          collegeCode: col.code || '—',
          planId: normalizePlanId(
            inv.planId || col.subscription?.plan || 'starter'
          ),
          billingCycle: 'invoice',
          amount: Number(inv.amount || 0),
          expectedAmount: Number(inv.amount || 0),
          method: inv.method || 'Invoice',
          reference: inv.reference || inv.invoiceNo || '—',
          receiptNumber: inv.invoiceNo || null,
          status,
          rawStatus: inv.status,
          hasProof: false,
          invoiceId: inv.id,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
        };
      });

    return [...fromBilling, ...fromInvoices].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
  }, [billingPayments, platformInvoices, colleges]);

  /* ── Top Accounting Summary Metrics ── */
  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    let totalCollected = 0;
    let pendingAmount = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    const byPlan = {
      starter: 0,
      standard: 0,
      premium: 0,
      enterprise: 0,
    };

    unifiedPayments.forEach((item) => {
      const amt = Number(item.amount || 0);
      const d = item.date ? new Date(item.date) : null;

      if (item.status === 'paid') {
        totalCollected += amt;
        byPlan[item.planId] = (byPlan[item.planId] || 0) + amt;

        if (d && !Number.isNaN(d.getTime())) {
          if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            thisMonthRevenue += amt;
          } else if (
            d.getMonth() === lastMonth &&
            d.getFullYear() === lastMonthYear
          ) {
            lastMonthRevenue += amt;
          }
        }
      } else if (item.status === 'pending') {
        pendingAmount += amt;
      }
    });

    const monthDeltaPct =
      lastMonthRevenue > 0
        ? Math.round(
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          )
        : thisMonthRevenue > 0
          ? 100
          : 0;

    return {
      totalCollected,
      pendingAmount,
      queueCount: pendingQueue.length,
      thisMonthRevenue,
      lastMonthRevenue,
      monthDeltaPct,
      byPlan,
    };
  }, [unifiedPayments, pendingQueue]);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedCollegeSearch = useDebounce(collegeSearch, 300);
  const debouncedAccountantSearch = useDebounce(accountantSearch, 300);

  /* ── Filtered & Sorted Payments History ── */
  const filteredPayments = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    const list = unifiedPayments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (planFilter !== 'all' && item.planId !== planFilter) return false;
      if (
        collegeFilter !== 'all' &&
        String(item.collegeId) !== String(collegeFilter)
      ) {
        return false;
      }
      if (fromTime || toTime) {
        const t = item.date ? new Date(item.date).getTime() : 0;
        if (fromTime && t < fromTime) return false;
        if (toTime && t > toTime) return false;
      }
      if (q) {
        const hay = `${item.collegeName} ${item.collegeCode} ${item.reference} ${item.receiptNumber || ''} ${item.method} ${item.planId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      } else if (sortBy === 'amount') {
        cmp = (a.amount || 0) - (b.amount || 0);
      } else if (sortBy === 'college') {
        cmp = (a.collegeName || '').localeCompare(b.collegeName || '');
      } else if (sortBy === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [
    unifiedPayments,
    debouncedSearch,
    statusFilter,
    planFilter,
    collegeFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, planFilter, collegeFilter, dateFrom, dateTo]);

  /* ── Per-College Billing Rollup ── */
  const collegeLedgers = useMemo(() => {
    const q = debouncedCollegeSearch.trim().toLowerCase();
    return colleges
      .map((c) => {
        const cid = c.id || c._id;
        const ledger = unifiedPayments.filter(
          (p) => String(p.collegeId) === String(cid)
        );
        const totalPaid = ledger
          .filter((p) => p.status === 'paid')
          .reduce((acc, p) => acc + (p.amount || 0), 0);
        const outstandingDues = ledger
          .filter((p) => p.status === 'pending')
          .reduce((acc, p) => acc + (p.expectedAmount || p.amount || 0), 0);
        const planId = normalizePlanId(
          c.subscription?.plan || c.planId || 'starter'
        );
        const subStatus = (
          c.subscription_status ||
          c.subscription?.status ||
          (c.isActive === false ? 'suspended' : 'active')
        ).toLowerCase();
        const renewalDate =
          c.expiryDate ||
          c.subscription?.periodEnd ||
          c.subscription?.expiryDate ||
          null;

        return {
          id: cid,
          name: c.name,
          code: c.code,
          city: c.city || '—',
          email: c.email || '—',
          phone: c.phone || '—',
          planId,
          subStatus,
          renewalDate,
          daysLeft: c.daysLeft ?? null,
          totalPaid,
          outstandingDues,
          paymentsCount: ledger.length,
          lastPaymentDate: ledger[0]?.date || null,
          ledger,
        };
      })
      .filter((row) => {
        if (!q) return true;
        return `${row.name} ${row.code} ${row.city} ${row.planId}`
          .toLowerCase()
          .includes(q);
      });
  }, [colleges, unifiedPayments, debouncedCollegeSearch]);

  /* ── Filtered Accountants List ── */
  const filteredAccountants = useMemo(() => {
    const q = debouncedAccountantSearch.trim().toLowerCase();
    if (!q) return accountants;
    return accountants.filter((a) =>
      `${a.name} ${a.collegeName} ${a.collegeCode} ${a.email} ${a.phone}`
        .toLowerCase()
        .includes(q)
    );
  }, [accountants, debouncedAccountantSearch]);

  /* ── Sort Toggle Helper ── */
  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  /* ── CSV Export for Payments History ── */
  const handleExportCSV = () => {
    if (!filteredPayments.length) {
      toast.error('No payment records to export');
      return;
    }
    const headers = [
      'Date',
      'College Name',
      'College Code',
      'Plan',
      'Amount (PKR)',
      'Method',
      'Reference / TxID',
      'Receipt Number',
      'Status',
    ];
    const rows = filteredPayments.map((r) => [
      formatDate(r.date),
      `"${(r.collegeName || '').replace(/"/g, '""')}"`,
      r.collegeCode,
      r.planId.toUpperCase(),
      r.amount,
      `"${(r.method || '').replace(/"/g, '""')}"`,
      `"${(r.reference || '').replace(/"/g, '""')}"`,
      r.receiptNumber || '',
      r.status.toUpperCase(),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collegeshub-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredPayments.length} payment records to CSV`);
  };

  /* ── Open Proof / Receipt Modal ── */
  const handleOpenProofModal = async (record) => {
    setSelectedRecord(record);
    setProofUrl(null);
    if (record.source === 'subscription_payment' && record.rawId) {
      setProofLoading(true);
      try {
        const res = await api.get(
          `/super-admin/billing/receipt/${record.rawId}`
        );
        if (res.data?.url) {
          setProofUrl(res.data.url);
        }
      } catch {
        // No screenshot uploaded or expired
      } finally {
        setProofLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div
        className="page flex items-center justify-center min-h-[420px]"
        aria-busy="true"
      >
        <CollegesHubLoader
          size="md"
          text="Loading platform payments & accounting…"
          minHeight="min-h-[380px]"
        />
      </div>
    );
  }

  const planRevenueItems = [
    {
      id: 'starter',
      label: 'Starter',
      amount: summary.byPlan.starter || 0,
      color: 'var(--chart-1)',
    },
    {
      id: 'standard',
      label: 'Standard',
      amount: summary.byPlan.standard || 0,
      color: 'var(--chart-2)',
    },
    {
      id: 'premium',
      label: 'Premium',
      amount: summary.byPlan.premium || 0,
      color: 'var(--chart-3)',
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      amount: summary.byPlan.enterprise || 0,
      color: 'var(--chart-4)',
    },
  ];

  return (
    <div className="page space-y-3">
      {/* ══════════════════════════════════════════════════════════════
         1. ACCOUNTING SUMMARY STRIP + REVENUE BY PLAN
         ══════════════════════════════════════════════════════════════ */}
      <section className="card p-6 max-md:p-4 space-y-5">
        <div className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-2 p-1.5 rounded-4xl bg-b-depth2 border border-s-subtle">
          {/* Card 1: Total Revenue Collected */}
          <div className="flex items-start gap-3.5 p-5 max-xl:p-4 rounded-3xl bg-b-surface2 border border-s-stroke2 shadow-depth-toggle">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-02/15 text-[var(--brand-green-text)] border border-primary-02/30 shrink-0">
              <Icon name="wallet" className="!size-5 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sub-title-2 text-t-secondary block truncate">
                Total Revenue Collected
              </span>
              <div className="mt-1 text-h4 font-mono tabular-nums text-t-primary">
                {formatPKR(summary.totalCollected)}
              </div>
              <span className="mt-1.5 inline-block text-caption text-t-tertiary">
                Verified platform settlements
              </span>
            </div>
          </div>

          {/* Card 2: Pending Amount */}
          <div className="flex items-start gap-3.5 p-5 max-xl:p-4 rounded-3xl bg-b-surface2/70 border border-s-subtle">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-05/15 text-t-primary border border-primary-05/30 shrink-0">
              <Icon name="clock" className="!size-5 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sub-title-2 text-t-secondary block truncate">
                Pending Amount
              </span>
              <div className="mt-1 text-h4 font-mono tabular-nums text-t-primary">
                {formatPKR(summary.pendingAmount)}
              </div>
              <span className="mt-1.5 inline-block text-caption text-t-tertiary">
                Awaiting verification or unpaid
              </span>
            </div>
          </div>

          {/* Card 3: Settlement / Billing Queue Count */}
          <div
            onClick={() => navigate('/super-admin/billing')}
            className="flex items-start gap-3.5 p-5 max-xl:p-4 rounded-3xl bg-b-surface2/70 border border-s-subtle hover:border-s-highlight transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-01/12 text-t-blue border border-primary-01/25 shrink-0">
              <Icon name="file-text" className="!size-5 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sub-title-2 text-t-secondary block truncate">
                Settlement / Billing Queue
              </span>
              <div className="mt-1 text-h4 font-mono tabular-nums text-t-primary">
                {summary.queueCount.toLocaleString()}{' '}
                <span className="text-body-2 font-normal text-t-secondary">
                  requests
                </span>
              </div>
              <span className="mt-1.5 inline-flex items-center gap-1 text-caption font-semibold text-t-blue">
                Review pending proofs →
              </span>
            </div>
          </div>

          {/* Card 4: This Month vs Last Month */}
          <div className="flex items-start gap-3.5 p-5 max-xl:p-4 rounded-3xl bg-b-surface2/70 border border-s-subtle">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-b-surface1 text-t-primary border border-s-subtle shrink-0">
              <Icon name="trending-up" className="!size-5 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sub-title-2 text-t-secondary block truncate">
                This Month vs Last Month
              </span>
              <div className="mt-1 text-h4 font-mono tabular-nums text-t-primary">
                {formatPKR(summary.thisMonthRevenue)}
              </div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <Percentage value={summary.monthDeltaPct} />
                <span className="text-caption text-t-tertiary font-mono tabular-nums">
                  prev: {formatPKR(summary.lastMonthRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Plan Breakdown Bar */}
        <div className="pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-sub-title-2 text-t-primary">
              Revenue Collected by Subscription Plan
            </span>
            <span className="text-caption font-mono tabular-nums text-t-secondary">
              Total Collected: {formatPKR(summary.totalCollected)}
            </span>
          </div>
          <div className="grid grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-1 gap-3">
            {planRevenueItems.map((p) => {
              const pct =
                summary.totalCollected > 0
                  ? Math.round((p.amount / summary.totalCollected) * 100)
                  : 0;
              return (
                <div
                  key={p.id}
                  className="rounded-3xl bg-b-surface1 border border-s-subtle p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <PlanBadge plan={p.id} />
                    <span className="font-mono text-caption font-semibold text-t-secondary tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="text-sub-title-1 font-mono font-bold tabular-nums text-t-primary">
                    {formatPKR(p.amount)}
                  </div>
                  <div className="h-2 w-full rounded-full bg-b-surface2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(pct, p.amount > 0 ? 6 : 0)}%`,
                        background: p.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
         2. VIEW SWITCHER TABS (Payments History | Per-College Billing | Accountant Details)
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Payments and accounting sections"
          className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-b-depth2 border border-s-subtle"
        >
          {[
            {
              id: 'history',
              label: 'Payments History',
              count: unifiedPayments.length,
              icon: 'credit-card',
            },
            {
              id: 'colleges',
              label: 'Per-College Billing',
              count: colleges.length,
              icon: 'building',
            },
            {
              id: 'accountants',
              label: 'Accountant Details',
              count: accountants.length,
              icon: 'users',
            },
          ].map((tab) => {
            const active = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveView(tab.id)}
                className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-button transition-all cursor-pointer ${
                  active
                    ? 'bg-b-surface2 text-t-primary shadow-depth-toggle border border-s-stroke2'
                    : 'text-t-secondary hover:text-t-primary'
                }`}
              >
                <Icon name={tab.icon} className="!size-4 fill-current" />
                <span>{tab.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-b-surface1 text-caption font-mono tabular-nums text-t-secondary">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          isStroke
          icon="download"
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         VIEW 1: PAYMENTS HISTORY TABLE
         ══════════════════════════════════════════════════════════════ */}
      {activeView === 'history' && (
        <section className="card p-6 max-md:p-4 space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2 relative flex items-center">
              <Icon
                name="search"
                className="!size-4 fill-t-tertiary absolute left-3.5 pointer-events-none"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search college, TxID, receipt #, or method..."
                aria-label="Search payment records"
                className="input !pl-10 w-full"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by payment status"
              className="input"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid / Approved</option>
              <option value="pending">Pending / Unpaid</option>
              <option value="rejected">Rejected</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              aria-label="Filter by subscription plan"
              className="input"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              aria-label="Filter by college"
              className="input"
            >
              <option value="all">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Filter from date"
                className="input !px-2.5 text-caption flex-1 min-w-0"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Filter to date"
                className="input !px-2.5 text-caption flex-1 min-w-0"
              />
            </div>
          </div>

          {/* Table */}
          {filteredPayments.length === 0 ? (
            <div className="empty py-14">
              No subscription payment records match your current filters.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        onClick={() => handleSort('date')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-t-primary cursor-pointer"
                      >
                        <span>Date</span>
                        {sortBy === 'date' && (
                          <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        onClick={() => handleSort('college')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-t-primary cursor-pointer"
                      >
                        <span>College</span>
                        {sortBy === 'college' && (
                          <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th>Plan</th>
                    <th>
                      <button
                        type="button"
                        onClick={() => handleSort('amount')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-t-primary cursor-pointer"
                      >
                        <span>Amount</span>
                        {sortBy === 'amount' && (
                          <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th>Method</th>
                    <th>Reference / TxID</th>
                    <th>
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-t-primary cursor-pointer"
                      >
                        <span>Status</span>
                        {sortBy === 'status' && (
                          <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-right">Proof / Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono text-caption tabular-nums whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            row.collegeId &&
                            navigate(`/super-admin/colleges/${row.collegeId}`)
                          }
                          className="text-left group cursor-pointer"
                        >
                          <p className="font-semibold text-t-primary group-hover:text-t-blue transition-colors">
                            {row.collegeName}
                          </p>
                          <p className="text-caption font-mono text-t-tertiary">
                            {row.collegeCode}
                          </p>
                        </button>
                      </td>
                      <td>
                        <PlanBadge plan={row.planId} />
                      </td>
                      <td className="font-mono font-semibold tabular-nums text-t-primary whitespace-nowrap">
                        {formatPKR(row.amount)}
                      </td>
                      <td className="text-caption text-t-secondary capitalize">
                        {row.method}
                      </td>
                      <td className="font-mono text-caption text-t-secondary">
                        <div>{row.reference}</div>
                        {row.receiptNumber &&
                          row.receiptNumber !== row.reference && (
                            <div className="text-[11px] text-t-tertiary">
                              Receipt: {row.receiptNumber}
                            </div>
                          )}
                      </td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <Button
                          isStroke
                          size="sm"
                          icon="eye"
                          onClick={() => handleOpenProofModal(row)}
                        >
                          Receipt / Proof
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {filteredPayments.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-s-subtle text-caption text-t-secondary">
              <span>
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filteredPayments.length)} of{' '}
                {filteredPayments.length} payment records
              </span>
              <div className="flex items-center gap-2">
                <Button
                  isStroke
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="font-mono px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  isStroke
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
         VIEW 2: PER-COLLEGE BILLING LEDGER
         ══════════════════════════════════════════════════════════════ */}
      {activeView === 'colleges' && (
        <section className="card p-6 max-md:p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-h6 text-t-primary">
                Per-College Subscription & Billing Ledger
              </h3>
              <p className="text-caption text-t-secondary mt-0.5">
                Current subscription plan, renewal schedule, total collected,
                and outstanding dues per tenant
              </p>
            </div>
            <div className="relative flex items-center w-full sm:w-80">
              <Icon
                name="search"
                className="!size-4 fill-t-tertiary absolute left-3.5 pointer-events-none"
              />
              <input
                type="search"
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                placeholder="Search college by name, code, or city..."
                aria-label="Search per-college billing"
                className="input !pl-10 w-full"
              />
            </div>
          </div>

          {collegeLedgers.length === 0 ? (
            <div className="empty py-14">No matching colleges found.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>Current Plan</th>
                    <th>Sub Status</th>
                    <th>Renewal / Expiry</th>
                    <th>Total Paid</th>
                    <th>Outstanding Dues</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collegeLedgers.map((col) => (
                    <tr key={col.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/super-admin/colleges/${col.id}`)
                          }
                          className="text-left group cursor-pointer"
                        >
                          <p className="font-semibold text-t-primary group-hover:text-t-blue transition-colors">
                            {col.name}
                          </p>
                          <p className="text-caption font-mono text-t-tertiary">
                            {col.code} · {col.city}
                          </p>
                        </button>
                      </td>
                      <td>
                        <PlanBadge plan={col.planId} status={col.subStatus} />
                      </td>
                      <td>
                        <span
                          className={`label capitalize ${
                            col.subStatus === 'active'
                              ? 'label-green'
                              : col.subStatus === 'grace'
                                ? 'label-yellow'
                                : 'label-red'
                          }`}
                        >
                          {col.subStatus}
                        </span>
                      </td>
                      <td className="font-mono text-caption tabular-nums">
                        <div>{formatDate(col.renewalDate)}</div>
                        {typeof col.daysLeft === 'number' && (
                          <div
                            className={`text-[11px] ${
                              col.daysLeft < 0
                                ? 'text-primary-03 font-semibold'
                                : col.daysLeft <= 14
                                  ? 'text-primary-05 font-semibold'
                                  : 'text-t-tertiary'
                            }`}
                          >
                            {col.daysLeft < 0
                              ? `${Math.abs(col.daysLeft)}d overdue`
                              : `${col.daysLeft}d remaining`}
                          </div>
                        )}
                      </td>
                      <td className="font-mono font-semibold tabular-nums text-t-primary">
                        {formatPKR(col.totalPaid)}
                      </td>
                      <td className="font-mono font-semibold tabular-nums">
                        <span
                          className={
                            col.outstandingDues > 0
                              ? 'text-primary-03'
                              : 'text-t-secondary'
                          }
                        >
                          {formatPKR(col.outstandingDues)}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            isStroke
                            size="sm"
                            icon="file-text"
                            onClick={() => setStatementCollege(col)}
                          >
                            Ledger ({col.paymentsCount})
                          </Button>
                          <Button
                            isStroke
                            size="sm"
                            icon="arrow"
                            onClick={() =>
                              navigate(`/super-admin/colleges/${col.id}`)
                            }
                          >
                            College Detail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
         VIEW 3: ACCOUNTANT DETAILS DIRECTORY
         ══════════════════════════════════════════════════════════════ */}
      {activeView === 'accountants' && (
        <section className="card p-6 max-md:p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-h6 text-t-primary">
                College Accountant Accounts & Billing Contacts
              </h3>
              <p className="text-caption text-t-secondary mt-0.5">
                Directory of institutional accountant users and primary billing
                contacts across all tenant colleges
              </p>
            </div>
            <div className="relative flex items-center w-full sm:w-80">
              <Icon
                name="search"
                className="!size-4 fill-t-tertiary absolute left-3.5 pointer-events-none"
              />
              <input
                type="search"
                value={accountantSearch}
                onChange={(e) => setAccountantSearch(e.target.value)}
                placeholder="Search accountant name, college, email, phone..."
                aria-label="Search accountant accounts"
                className="input !pl-10 w-full"
              />
            </div>
          </div>

          {accountantsLoading ? (
            <div className="py-12">
              <CollegesHubLoader
                size="sm"
                text="Loading college accountant accounts…"
                minHeight="min-h-[200px]"
              />
            </div>
          ) : filteredAccountants.length === 0 ? (
            <div className="empty py-14">No accountant records found.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Accountant Name</th>
                    <th>College</th>
                    <th>Contact Details</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th className="text-right">College Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccountants.map((acc) => (
                    <tr key={acc.id}>
                      <td>
                        <p className="font-semibold text-t-primary">
                          {acc.name}
                        </p>
                        <p className="text-caption text-t-tertiary">
                          {acc.accountType}
                        </p>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/super-admin/colleges/${acc.collegeId}`)
                          }
                          className="text-left group cursor-pointer"
                        >
                          <p className="font-semibold text-t-primary group-hover:text-t-blue transition-colors">
                            {acc.collegeName}
                          </p>
                          <p className="text-caption font-mono text-t-tertiary">
                            {acc.collegeCode}
                          </p>
                        </button>
                      </td>
                      <td>
                        <div className="text-caption text-t-primary">
                          {acc.email}
                        </div>
                        <div className="text-caption font-mono text-t-secondary">
                          {acc.phone}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`label ${
                            acc.isActive ? 'label-green' : 'label-red'
                          }`}
                        >
                          {acc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="font-mono text-caption text-t-secondary">
                        {acc.lastLogin
                          ? formatDate(acc.lastLogin, true)
                          : 'Not recorded'}
                      </td>
                      <td className="text-right">
                        <Button
                          isStroke
                          size="sm"
                          icon="arrow"
                          onClick={() =>
                            navigate(`/super-admin/colleges/${acc.collegeId}`)
                          }
                        >
                          View College
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
         MODAL 1: PAYMENT PROOF & PRINTABLE RECEIPT
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Subscription Payment Receipt & Verification Proof"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div
              data-print-surface
              className="rounded-3xl border border-s-subtle bg-b-surface1 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-s-subtle pb-3">
                <div>
                  <p className="text-caption font-mono uppercase tracking-wider text-t-tertiary">
                    CollegesHub Platform Treasury Receipt
                  </p>
                  <h4 className="text-h6 text-t-primary mt-0.5">
                    {selectedRecord.collegeName} ({selectedRecord.collegeCode})
                  </h4>
                </div>
                <StatusBadge status={selectedRecord.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-caption">
                <div>
                  <span className="text-t-tertiary block">Transaction Date</span>
                  <span className="font-mono font-semibold text-t-primary">
                    {formatDate(selectedRecord.date, true)}
                  </span>
                </div>
                <div>
                  <span className="text-t-tertiary block">
                    Reference / Transaction ID
                  </span>
                  <span className="font-mono font-semibold text-t-primary">
                    {selectedRecord.reference}
                  </span>
                </div>
                <div>
                  <span className="text-t-tertiary block">Subscription Plan</span>
                  <div className="mt-0.5">
                    <PlanBadge plan={selectedRecord.planId} />
                  </div>
                </div>
                <div>
                  <span className="text-t-tertiary block">Payment Method</span>
                  <span className="font-semibold text-t-primary capitalize">
                    {selectedRecord.method} ({selectedRecord.billingCycle})
                  </span>
                </div>
                <div>
                  <span className="text-t-tertiary block">Amount</span>
                  <span className="text-sub-title-1 font-mono font-bold text-t-primary">
                    {formatPKR(selectedRecord.amount)}
                  </span>
                </div>
                {selectedRecord.receiptNumber && (
                  <div>
                    <span className="text-t-tertiary block">Receipt Number</span>
                    <span className="font-mono font-semibold text-t-primary">
                      {selectedRecord.receiptNumber}
                    </span>
                  </div>
                )}
              </div>

              {selectedRecord.overrideNote && (
                <div className="rounded-2xl bg-b-surface2 p-3 text-caption text-t-secondary">
                  <strong>Verification Note:</strong>{' '}
                  {selectedRecord.overrideNote}
                </div>
              )}
              {selectedRecord.rejectionReason && (
                <div className="rounded-2xl bg-primary-03/10 p-3 text-caption text-primary-03">
                  <strong>Rejection Reason:</strong>{' '}
                  {selectedRecord.rejectionReason}
                </div>
              )}
            </div>

            {/* Proof Screenshot Preview */}
            {proofLoading ? (
              <div className="py-6 text-center text-caption text-t-secondary">
                Loading uploaded payment proof…
              </div>
            ) : proofUrl ? (
              <div className="space-y-2">
                <p className="text-caption font-semibold text-t-secondary">
                  Uploaded Payment Proof Screenshot
                </p>
                <div className="rounded-2xl border border-s-subtle overflow-hidden bg-b-surface1 max-h-80 flex items-center justify-center">
                  <img
                    src={proofUrl}
                    alt="Payment proof screenshot"
                    className="max-h-80 w-auto object-contain"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                isStroke
                icon="printer"
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <Button
                isPrimary
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
         MODAL 2: PER-COLLEGE PAYMENT LEDGER & STATEMENT
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={Boolean(statementCollege)}
        onClose={() => setStatementCollege(null)}
        title={
          statementCollege
            ? `Billing Ledger — ${statementCollege.name}`
            : 'College Billing Ledger'
        }
      >
        {statementCollege && (
          <div className="space-y-4">
            <div
              data-print-surface
              className="rounded-3xl border border-s-subtle bg-b-surface1 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-s-subtle pb-3">
                <div>
                  <h4 className="text-sub-title-1 font-bold text-t-primary">
                    {statementCollege.name} ({statementCollege.code})
                  </h4>
                  <p className="text-caption text-t-secondary">
                    Renewal: {formatDate(statementCollege.renewalDate)}
                  </p>
                </div>
                <PlanBadge
                  plan={statementCollege.planId}
                  status={statementCollege.subStatus}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-caption">
                <div className="rounded-2xl bg-b-surface2 p-3">
                  <span className="text-t-tertiary block">Total Paid</span>
                  <span className="text-sub-title-1 font-mono font-bold text-t-primary">
                    {formatPKR(statementCollege.totalPaid)}
                  </span>
                </div>
                <div className="rounded-2xl bg-b-surface2 p-3">
                  <span className="text-t-tertiary block">
                    Outstanding Dues
                  </span>
                  <span className="text-sub-title-1 font-mono font-bold text-primary-03">
                    {formatPKR(statementCollege.outstandingDues)}
                  </span>
                </div>
              </div>

              {statementCollege.ledger.length === 0 ? (
                <p className="py-6 text-center text-caption text-t-tertiary">
                  No payment transactions recorded for this college yet.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {statementCollege.ledger.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-b-surface2 p-3 text-caption"
                    >
                      <div>
                        <p className="font-mono font-semibold text-t-primary">
                          {formatPKR(tx.amount)} · {tx.method}
                        </p>
                        <p className="text-t-tertiary font-mono">
                          {formatDate(tx.date)} · Ref: {tx.reference}
                        </p>
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                isStroke
                icon="printer"
                onClick={() => window.print()}
              >
                Print Statement
              </Button>
              <Button
                isPrimary
                icon="arrow"
                onClick={() => {
                  const id = statementCollege.id;
                  setStatementCollege(null);
                  navigate(`/super-admin/colleges/${id}`);
                }}
              >
                Open College Detail
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsAndAccounts;

