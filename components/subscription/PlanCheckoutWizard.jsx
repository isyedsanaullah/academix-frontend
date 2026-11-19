'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api, { apiGet, apiPost } from '@/lib/api';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import {
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineCreditCard,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineShieldCheck,
  HiOutlineOfficeBuilding,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineX,
} from 'react-icons/hi';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];

function fmtPkr(n) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtAiCredits(val) {
  const num = Number(val || 0);
  if (num <= 0) return 'None';
  if (num >= 1000000) return `${Math.round(num / 1000000)}M / mo`;
  return `${num.toLocaleString()} / mo`;
}

const INVOICE_STATUS_META = {
  UNPAID: {
    label: 'Unpaid',
    badge: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: HiOutlineClock,
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    badge: 'bg-sky-50 border-sky-200 text-sky-800',
    icon: HiOutlineClock,
  },
  APPROVED: {
    label: 'Approved',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: HiOutlineCheckCircle,
  },
  REJECTED: {
    label: 'Rejected — Re-upload Required',
    badge: 'bg-red-50 border-red-200 text-red-700',
    icon: HiOutlineXCircle,
  },
  VOID: {
    label: 'Void',
    badge: 'bg-slate-100 border-slate-200 text-slate-600',
    icon: HiOutlineXCircle,
  },
};

export default function PlanCheckoutWizard({ lockedMode = false, onStatusChange }) {
  const [catalog, setCatalog] = useState(null);
  const [sub, setSub] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Selection state (one plan unfolded & selected at a time; others folded)
  const [selectedPlanId, setSelectedPlanId] = useState('standard');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  // activeAddonQty tracks only add-ons explicitly expanded by clicking their '+' button
  const [addonQty, setAddonQty] = useState({});

  // Live server quote
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Active invoice & actions
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);

  // Proof upload form state
  const [proofFile, setProofFile] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');
  const fileInputRef = useRef(null);

  const loadData = useCallback(async ({ preserveSelection = true } = {}) => {
    setLoadError('');
    try {
      const [catRes, subRes, invRes] = await Promise.all([
        apiGet('/subscription/plans-catalog'),
        apiGet('/subscription/current'),
        apiGet('/subscription/invoices'),
      ]);

      const catData = catRes?.data || null;
      const subData = subRes?.data || null;
      const invList = invRes?.data || [];

      setCatalog(catData);
      setSub(subData);
      setInvoices(invList);

      if (!preserveSelection && catData?.plans?.length) {
        const preferredPlan =
          (subData?.planId && catData.plans.some(p => p.planId === subData.planId) && subData.planId) ||
          (catData.plans.some(p => p.planId === 'standard') && 'standard') ||
          catData.plans[0].planId;
        setSelectedPlanId(preferredPlan);
        if (subData?.billingCycle === 'YEARLY' || subData?.billingCycle === 'MONTHLY') {
          setBillingCycle(subData.billingCycle);
        }
      }

      if (invList.length > 0) {
        const openInvoice = invList.find(inv => ['UNPAID', 'REJECTED', 'PENDING_REVIEW'].includes(inv.status)) || invList[0];
        setActiveInvoiceId(prev => (prev && invList.some(i => i.id === prev) ? prev : openInvoice.id));
      } else {
        setActiveInvoiceId(null);
      }

      onStatusChange?.(subData);
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Failed to load plans and billing catalog.');
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await loadData({ preserveSelection: false });
    })();
    return () => { active = false; };
  }, [loadData]);

  // Fetch authoritative server quote on plan, cycle, or add-on changes
  useEffect(() => {
    if (!catalog?.plans?.length || !selectedPlanId) return;
    let cancelled = false;

    const lineItems = Object.entries(addonQty)
      .filter(([, q]) => q > 0)
      .map(([addonType, quantity]) => ({ addonType, quantity }));

    const quoteType =
      sub?.subStatus === 'ACTIVE' && sub?.planId && sub.planId !== selectedPlanId
        ? 'UPGRADE'
        : 'RENEWAL';

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const res = await apiPost('/subscription/calculate-total', {
          type: quoteType,
          planId: selectedPlanId,
          billingCycle,
          lineItems,
        });
        if (!cancelled && res?.success) {
          setQuote(res.data);
        }
      } catch {
        // Checkout recalculates authoritatively
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [catalog, selectedPlanId, billingCycle, addonQty, sub?.subStatus, sub?.planId]);

  const plans = catalog?.plans || [];
  const selectedPlan = plans.find(p => p.planId === selectedPlanId) || plans[0] || null;
  const availableAddons = selectedPlan?.addons || [];

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    const nextPlan = plans.find(p => p.planId === planId);
    if (!nextPlan) return;
    const allowedMap = new Map((nextPlan.addons || []).map(a => [a.addonType, a]));
    setAddonQty(prev => {
      const next = {};
      for (const [key, qty] of Object.entries(prev)) {
        const rule = allowedMap.get(key);
        if (rule && rule.isAvailable && rule.isPurchasable !== false && qty > 0) {
          next[key] = Math.min(qty, rule.maxUnitsAllowed ?? 99);
        }
      }
      return next;
    });
  };

  const handleActivateAddon = (addon) => {
    if (!addon?.isPurchasable) return;
    setAddonQty((prev) => ({
      ...prev,
      [addon.addonType]: prev[addon.addonType] > 0 ? prev[addon.addonType] : 1,
    }));
  };

  const handleSetAddonQty = (addonType, rawValue, maxUnits) => {
    const parsed = parseInt(rawValue, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setAddonQty((prev) => ({ ...prev, [addonType]: 1 }));
      return;
    }
    const clamped = maxUnits !== null && maxUnits !== undefined ? Math.min(maxUnits, parsed) : parsed;
    setAddonQty((prev) => ({ ...prev, [addonType]: clamped }));
  };

  const handleRemoveAddon = (addonType) => {
    setAddonQty((prev) => {
      const next = { ...prev };
      delete next[addonType];
      return next;
    });
  };

  const pendingReviewInvoice = invoices.find(inv => inv.status === 'PENDING_REVIEW');
  const activeInvoice = invoices.find(inv => inv.id === activeInvoiceId) || null;
  const bankDetails = activeInvoice?.bankDetailsSnapshot || catalog?.bankDetails || {
    bankName: 'UBL (United Bank Limited)',
    accountTitle: 'CollegesHub Technologies (Dummy Account)',
    accountNumber: '0123-4567890123',
  };

  const handleConfirmCheckout = async () => {
    if (!selectedPlan) return;
    if (pendingReviewInvoice) {
      toast.error('You already have a payment under Super Admin review.');
      setActiveInvoiceId(pendingReviewInvoice.id);
      return;
    }

    setCheckingOut(true);
    try {
      const lineItems = Object.entries(addonQty)
        .filter(([, q]) => q > 0)
        .map(([addonType, quantity]) => ({ addonType, quantity }));

      const res = await apiPost('/subscription/checkout', {
        planId: selectedPlan.planId,
        billingCycle,
        lineItems,
      });

      if (res?.success && res?.data?.invoice) {
        toast.success(`Voucher ${res.data.invoice.invoiceNo} generated! Download PDF & upload proof.`);
        setActiveInvoiceId(res.data.invoice.id);
        setProofFile(null);
        setReferenceNumber('');
        setSubmissionNote('');
        await loadData({ preserveSelection: true });
      } else {
        throw new Error(res?.message || 'Failed to generate invoice');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Checkout failed.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleDownloadVoucher = async (invoice) => {
    if (!invoice?.id) return;
    setDownloadingId(invoice.id);
    try {
      const response = await api.get(`/subscription/invoices/${invoice.id}/voucher.pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `voucher_${invoice.invoiceNo || invoice.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('3-Copy Bank Pay Voucher downloaded.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to download pay voucher PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProofFile(null);
      return;
    }
    if (!ALLOWED_PROOF_MIMES.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, or PDF files are accepted.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error('File exceeds the 5 MB upload limit.');
      e.target.value = '';
      return;
    }
    setProofFile(file);
  };

  const handleUploadProof = async (e, invoice) => {
    e.preventDefault();
    if (!invoice?.id) return;
    if (!proofFile) {
      toast.error('Please select your bank transfer screenshot or receipt PDF first.');
      return;
    }

    setUploadingId(invoice.id);
    try {
      const formData = new FormData();
      formData.append('proof', proofFile);
      if (referenceNumber.trim()) formData.append('referenceNumber', referenceNumber.trim());
      if (submissionNote.trim()) formData.append('note', submissionNote.trim());

      const res = await api.post(`/subscription/invoices/${invoice.id}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.success) {
        toast.success('Payment proof sent to Super Admin for verification.');
        setProofFile(null);
        setReferenceNumber('');
        setSubmissionNote('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadData({ preserveSelection: true });
      } else {
        throw new Error(res?.data?.message || 'Upload failed.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to upload payment proof.');
    } finally {
      setUploadingId(null);
    }
  };

  const handlePreviewProof = async (invoice) => {
    if (!invoice?.id) return;
    setPreviewingId(invoice.id);
    try {
      const res = await apiGet(`/subscription/invoices/${invoice.id}/proof-url`);
      if (res?.success && res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error(res?.message || 'Proof URL unavailable.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Unable to open proof.');
    } finally {
      setPreviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#DDE6F0] rounded-2xl p-8">
        <CollegesHubLoader size="md" text="Loading plans & billing catalog…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3">
        <HiOutlineExclamationCircle size={32} className="mx-auto text-red-600" />
        <p className="text-sm font-bold text-[#0E2238]">{loadError}</p>
        <button
          type="button"
          onClick={() => loadData({ preserveSelection: false })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A4D94] text-white text-xs font-bold hover:bg-[#083D77] cursor-pointer"
        >
          <HiOutlineRefresh size={14} /> Retry
        </button>
      </div>
    );
  }

  const effectiveStatus = sub?.effectiveSubStatus || sub?.subStatus;
  const basePriceFallback = selectedPlan
    ? (billingCycle === 'YEARLY' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice)
    : 0;
  const displayedQuote = quote || {
    basePlanAmount: basePriceFallback,
    prorationCredit: 0,
    netBaseAmount: basePriceFallback,
    addonSubtotal: 0,
    expectedAmount: basePriceFallback,
    lineItems: [],
  };

  const activeSub = sub?.activeSubscription || null;
  const canUploadOnActive = activeInvoice && ['UNPAID', 'REJECTED'].includes(activeInvoice.status);
  const priceChangedOnRenewal = Boolean(
    sub?.priceChangedOnRenewal ||
    (activeSub &&
      selectedPlan &&
      activeSub.planId === selectedPlan.planId &&
      activeSub.billingCycle === billingCycle &&
      activeSub.planPricePkr !== basePriceFallback)
  );
  const addonQuoteLines = (displayedQuote.lineItems || []).filter(
    (li) => li.itemType && li.itemType !== 'PLAN_SUBSCRIPTION' && li.itemType !== 'PLAN_UPGRADE'
  );

  const selectedAddonsList = availableAddons.filter(
    (a) => a.isAvailable && a.isPurchasable !== false && (addonQty[a.addonType] || 0) > 0
  );
  const availablePlusButtons = availableAddons.filter(
    (a) => a.isAvailable && !(addonQty[a.addonType] > 0)
  );

  return (
    <div className="space-y-6">
      {/* Active Price-Lock Context */}
      {activeSub && effectiveStatus === 'ACTIVE' && (
        <div className="rounded-2xl border border-[#299A49]/30 bg-emerald-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <HiOutlineShieldCheck size={22} className="text-[#299A49] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-[#0E2238]">
                Active Price-Locked Subscription: {String(activeSub.planName || activeSub.planId).toUpperCase()} ({activeSub.billingCycle})
              </p>
              <p className="text-xs text-[#52657C] mt-0.5">
                Locked price: <strong className="text-[#0E2238]">{fmtPkr(activeSub.totalPkr ?? activeSub.planPricePkr)}</strong> ·
                Term ends: <strong className="text-[#0E2238]">{fmtDate(activeSub.endsAt || sub?.periodEnd)}</strong>.
                Renewing creates a new subscription term at the catalog rate shown below.
              </p>
            </div>
          </div>
          {priceChangedOnRenewal && (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
              List price updated since your lock ({fmtPkr(activeSub.planPricePkr)} → {fmtPkr(basePriceFallback)})
            </span>
          )}
        </div>
      )}

      {/* Pending Review Alert */}
      {pendingReviewInvoice && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <HiOutlineClock size={22} className="text-[#0A4D94] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-[#0E2238]">
                Payment Proof Under Super Admin Review ({pendingReviewInvoice.invoiceNo})
              </p>
              <p className="text-xs text-[#52657C] mt-0.5">
                Submitted on {fmtDate(pendingReviewInvoice.submittedAt || pendingReviewInvoice.createdAt)} for{' '}
                <strong className="text-[#0E2238]">{fmtPkr(pendingReviewInvoice.amount ?? pendingReviewInvoice.amountPkr)}</strong>.
                We will notify you by email as soon as your subscription is activated.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadVoucher(pendingReviewInvoice)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DDE6F0] text-xs font-bold text-[#0A4D94] hover:bg-slate-50 cursor-pointer"
          >
            <HiOutlineDownload size={14} /> Download Voucher
          </button>
        </div>
      )}

      {/* ── SECTION A: FOLDABLE PLAN ACCORDION + ADD-ON '+' BUTTONS ── */}
      <div className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE6F0] pb-5">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#0A4D94]">
              Step 1 · Select Plan &amp; Add-Ons
            </span>
            <h2 className="text-xl font-extrabold text-[#0E2238] mt-0.5">
              {lockedMode ? 'Choose a plan to reactivate your college' : 'Choose your Academix plan'}
            </h2>
            <p className="text-xs text-[#52657C] mt-0.5">
              Select a plan below to inspect full included limits and services. Click any folded plan to switch and unfold its details.
            </p>
          </div>

          {/* Sleek Monthly / Yearly Term Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#F4F7FB] border border-[#DDE6F0] self-start sm:self-auto">
            {['MONTHLY', 'YEARLY'].map((term) => {
              const active = billingCycle === term;
              return (
                <button
                  key={term}
                  type="button"
                  onClick={() => setBillingCycle(term)}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0A4D94] text-white shadow-sm'
                      : 'text-[#52657C] hover:text-[#0E2238]'
                  }`}
                >
                  {term === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Foldable Plan Cards Accordion */}
        <div className="space-y-3">
          {plans.map((plan) => {
            const isSelected = plan.planId === selectedPlan?.planId;
            const lim = plan.limits || {};
            const original12Mo = Number(plan.monthlyPrice || 0) * 12;
            const yearlySavings = Math.max(0, original12Mo - Number(plan.yearlyPrice || 0));
            const finalPrice = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.planId}
                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                  isSelected
                    ? 'border-[#0A4D94] bg-white shadow-md ring-4 ring-[#0A4D94]/10'
                    : 'border-[#DDE6F0] bg-[#F8FAFC] hover:border-[#0A4D94]/40'
                }`}
              >
                {/* Plan Header (Always visible; clicking unfolds this plan & folds others) */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.planId)}
                  aria-expanded={isSelected}
                  className="w-full px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#0A4D94] bg-[#0A4D94]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-[#0E2238]">{plan.name}</span>
                        {plan.recommended && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#299A49] text-white text-[10px] font-bold uppercase tracking-wider">
                            Most Popular
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-[#EEF4FB] text-[#0A4D94] text-[10px] font-bold">
                          {plan.liveServicesCount || 0} live / {plan.servicesCount || 0} services
                        </span>
                      </div>
                      <p className="text-xs text-[#52657C] mt-0.5 truncate">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price block (with thin red strikethrough + Save Rs X on Yearly) */}
                  <div className="flex items-center gap-4 ml-auto shrink-0">
                    <div className="text-right">
                      {billingCycle === 'YEARLY' ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#52657C] line-through decoration-red-500 decoration-[1.5px]">
                              Rs. {original12Mo.toLocaleString()}
                            </span>
                            {yearlySavings > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#1F7A3A] text-[10px] font-extrabold">
                                Save Rs. {yearlySavings.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-black text-[#0A4D94]">
                              PKR {Number(finalPrice || 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-[#52657C]">/yr</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-[#0A4D94]">
                            PKR {Number(finalPrice || 0).toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-[#52657C]">/mo</span>
                        </div>
                      )}
                    </div>

                    <span className="w-8 h-8 rounded-lg border border-[#DDE6F0] bg-white flex items-center justify-center text-[#52657C]">
                      {isSelected ? <HiOutlineChevronUp size={16} /> : <HiOutlineChevronDown size={16} />}
                    </span>
                  </div>
                </button>

                {/* Unfolded Plan Details (Shown ONLY for the currently selected plan) */}
                {isSelected && (
                  <div className="border-t border-[#DDE6F0] bg-blue-50/20 px-5 py-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">Students Included</p>
                        <p className="text-sm font-black text-[#0E2238] mt-0.5">
                          {Number(lim.maxStudents || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">Staff &amp; Admins</p>
                        <p className="text-sm font-black text-[#0E2238] mt-0.5">
                          {Number(lim.maxStaff || 0).toLocaleString()} staff · {lim.maxAdmins || 2} admins
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">Campuses</p>
                        <p className="text-sm font-black text-[#0E2238] mt-0.5">
                          {lim.maxCampuses || 1} campus{(lim.maxCampuses || 1) > 1 ? 'es' : ''}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">Cloud Storage</p>
                        <p className="text-sm font-black text-[#0E2238] mt-0.5">
                          {lim.maxStorageGb || 0} GB ({lim.maxUploadMb || 10} MB max file)
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">Online Admissions</p>
                        <p className="text-sm font-black text-[#0E2238] mt-0.5">
                          {lim.maxApplications > 0 ? `${Number(lim.maxApplications).toLocaleString()} / yr` : 'Manual desk only'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">AI Credits</p>
                        <p className="text-sm font-black text-[#0E2238] mt-0.5">
                          {fmtAiCredits(lim.aiCreditsMonthly)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">Emails &amp; SMS</p>
                        <p className="text-sm font-black text-[#0E2238] mt-0.5">
                          {Number(lim.emailsMonthly || 0).toLocaleString()} emails · {lim.messageCreditsMonthly || 0} msg
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#DDE6F0] bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-[#52657C]">Included Modules</p>
                        <p className="text-sm font-black text-[#299A49] mt-0.5 flex items-center gap-1">
                          <HiOutlineSparkles size={14} /> {plan.liveServicesCount || 0} live ({plan.servicesCount || 0} total)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add-Ons Section: '+' buttons that reveal quantity needed on click */}
        {availableAddons.length > 0 && (
          <div className="pt-4 border-t border-[#DDE6F0] space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#0E2238]">
                Optional Add-Ons for {selectedPlan?.name}
              </h3>
              <p className="text-xs text-[#52657C]">
                Click a <strong className="text-[#0A4D94]">+</strong> add-on button to specify how many units you need.
              </p>
            </div>

            {/* Active Add-Ons (expanded after clicking '+') */}
            {selectedAddonsList.length > 0 && (
              <div className="space-y-2.5">
                {selectedAddonsList.map((addon) => {
                  const qty = addonQty[addon.addonType] || 1;
                  const unitPrice = billingCycle === 'YEARLY' ? addon.unitPriceYearlyPkr : addon.unitPriceMonthlyPkr;
                  const maxUnits = addon.maxUnitsAllowed;

                  return (
                    <div
                      key={addon.addonType}
                      className="rounded-xl border border-[#0A4D94]/30 bg-blue-50/30 p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#0E2238]">{addon.name}</p>
                        <p className="text-[11px] text-[#52657C]">
                          {fmtPkr(unitPrice)} {addon.unitLabel || 'per unit'}
                          {maxUnits !== null && maxUnits !== undefined ? ` · Max ${maxUnits}` : ''}
                          {' · '}
                          <strong className="text-[#0A4D94]">Subtotal: {fmtPkr(unitPrice * qty)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-[#52657C]">Qty needed:</span>
                        <button
                          type="button"
                          onClick={() => handleSetAddonQty(addon.addonType, Math.max(1, qty - 1), maxUnits)}
                          disabled={qty <= 1}
                          className="w-7 h-7 rounded-lg border border-[#DDE6F0] bg-white flex items-center justify-center text-[#0E2238] hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          aria-label={`Decrease ${addon.name}`}
                        >
                          <HiOutlineMinus size={13} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={maxUnits ?? 9999}
                          value={qty}
                          onChange={(e) => handleSetAddonQty(addon.addonType, e.target.value, maxUnits)}
                          className="w-16 rounded-lg border border-[#DDE6F0] bg-white px-2 py-1 text-center text-xs font-extrabold text-[#0E2238] focus:border-[#0A4D94] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSetAddonQty(addon.addonType, qty + 1, maxUnits)}
                          disabled={maxUnits !== null && maxUnits !== undefined && qty >= maxUnits}
                          className="w-7 h-7 rounded-lg border border-[#DDE6F0] bg-white flex items-center justify-center text-[#0E2238] hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          aria-label={`Increase ${addon.name}`}
                        >
                          <HiOutlinePlus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddon(addon.addonType)}
                          className="ml-1 p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Remove add-on"
                          aria-label={`Remove ${addon.name}`}
                        >
                          <HiOutlineX size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compact '+' Buttons for Remaining Add-Ons */}
            {availablePlusButtons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availablePlusButtons.map((addon) => {
                  const purchasable = addon.isPurchasable !== false;
                  const unitPrice = billingCycle === 'YEARLY' ? addon.unitPriceYearlyPkr : addon.unitPriceMonthlyPkr;
                  return (
                    <button
                      key={addon.addonType}
                      type="button"
                      disabled={!purchasable}
                      onClick={() => handleActivateAddon(addon)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                        purchasable
                          ? 'border-[#DDE6F0] bg-[#F4F7FB] text-[#0E2238] hover:border-[#0A4D94] hover:bg-blue-50/40 cursor-pointer'
                          : 'border-dashed border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${purchasable ? 'bg-[#0A4D94] text-white' : 'bg-slate-200 text-slate-500'}`}>
                        <HiOutlinePlus size={12} />
                      </span>
                      <span>{addon.name}</span>
                      <span className="text-[11px] font-semibold text-[#52657C]">
                        {purchasable ? `${fmtPkr(unitPrice)} ${addon.unitLabel || ''}` : 'Coming soon'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live Price Breakdown & Confirm Checkout */}
        <div className="rounded-2xl border border-[#0A4D94]/20 bg-[#F4F7FB] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#0E2238]">Order Summary &amp; Price Breakdown</h3>
            {quoteLoading && (
              <span className="text-[11px] font-semibold text-[#0A4D94]">Updating calculation…</span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#0E2238]">
              <span>
                {selectedPlan?.name} Plan ({billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'})
              </span>
              <div className="flex items-center gap-2">
                {billingCycle === 'YEARLY' && selectedPlan && (
                  <span className="text-[11px] text-[#52657C] line-through decoration-red-500 decoration-[1.5px]">
                    Rs. {(Number(selectedPlan.monthlyPrice || 0) * 12).toLocaleString()}
                  </span>
                )}
                <span className="font-bold">{fmtPkr(displayedQuote.basePlanAmount)}</span>
              </div>
            </div>

            {displayedQuote.prorationCredit > 0 && (
              <div className="flex items-center justify-between text-[#299A49]">
                <span>Mid-Term Locked Plan Proration Credit</span>
                <span className="font-bold">− {fmtPkr(displayedQuote.prorationCredit)}</span>
              </div>
            )}

            {addonQuoteLines.map((li, idx) => (
              <div key={li.addonType || idx} className="flex items-center justify-between text-[#52657C]">
                <span>
                  {li.name || li.addonType} × {li.quantity || 1} ({fmtPkr(li.unitPrice ?? li.unitPricePkr)} each)
                </span>
                <span className="font-semibold text-[#0E2238]">{fmtPkr(li.subtotal ?? li.subtotalPkr)}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-[#DDE6F0] flex items-center justify-between text-xs text-[#52657C]">
              <span>Subtotal</span>
              <span className="font-bold text-[#0E2238]">
                {fmtPkr((displayedQuote.netBaseAmount ?? displayedQuote.basePlanAmount) + (displayedQuote.addonSubtotal || 0))}
              </span>
            </div>

            <div className="pt-2 border-t border-[#DDE6F0] flex items-center justify-between text-base font-black text-[#0A4D94]">
              <span>Total Payable ({catalog?.currency || 'PKR'})</span>
              <span>{fmtPkr(displayedQuote.expectedAmount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-[#52657C]">
              Confirming generates your subscription invoice and 3-copy UBL Bank Pay Voucher (status: <strong>UNPAID</strong>).
            </p>
            <button
              type="button"
              disabled={checkingOut || !selectedPlan || Boolean(pendingReviewInvoice)}
              onClick={handleConfirmCheckout}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-xs font-extrabold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <HiOutlineCreditCard size={16} />
              {checkingOut ? 'Generating Voucher…' : 'Confirm Plan & Generate Pay Voucher'}
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION B: PAY VOUCHER & R2 PAYMENT PROOF UPLOAD ── */}
      {activeInvoice && (
        <div className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE6F0] pb-4">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#299A49]">
                Step 2 · Bank Transfer Voucher &amp; Proof Upload
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <h2 className="text-lg font-extrabold text-[#0E2238]">
                  Invoice {activeInvoice.invoiceNo}
                </h2>
                {(() => {
                  const st = INVOICE_STATUS_META[activeInvoice.status] || INVOICE_STATUS_META.UNPAID;
                  const StIcon = st.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${st.badge}`}>
                      <StIcon size={13} /> {st.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-[#52657C] mt-0.5">
                {activeInvoice.purpose || `Academix subscription — ${activeInvoice.planId}`} ·
                Issued {fmtDate(activeInvoice.createdAt || activeInvoice.issuedAt)} · Due {fmtDate(activeInvoice.dueDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={downloadingId === activeInvoice.id}
                onClick={() => handleDownloadVoucher(activeInvoice)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#299A49] hover:bg-[#1F7A3A] text-white text-xs font-extrabold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <HiOutlineDownload size={16} />
                {downloadingId === activeInvoice.id ? 'Preparing PDF…' : 'Download 3-Copy Pay Voucher (PDF)'}
              </button>

              {activeInvoice.proofObjectKey && (
                <button
                  type="button"
                  disabled={previewingId === activeInvoice.id}
                  onClick={() => handlePreviewProof(activeInvoice)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#DDE6F0] bg-white hover:bg-slate-50 text-xs font-bold text-[#0A4D94] cursor-pointer"
                >
                  <HiOutlineEye size={15} />
                  {previewingId === activeInvoice.id ? 'Opening…' : 'View Uploaded Proof'}
                </button>
              )}
            </div>
          </div>

          {activeInvoice.status === 'REJECTED' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <HiOutlineXCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-red-800">Payment Proof Rejected by Super Admin</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Reason: <strong>{activeInvoice.rejectionReason || 'Verification failed — please re-upload a clear transfer receipt.'}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#DDE6F0] bg-[#F4F7FB] p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <HiOutlineOfficeBuilding size={16} className="text-[#0A4D94]" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0E2238]">
                  Bank Transfer Destination
                </h4>
              </div>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#52657C]">Bank Name</dt>
                  <dd className="font-bold text-[#0E2238] text-right">{bankDetails.bankName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#52657C]">Account Title</dt>
                  <dd className="font-bold text-[#0E2238] text-right">{bankDetails.accountTitle}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#52657C]">Account Number</dt>
                  <dd className="font-mono font-bold text-[#0A4D94] text-right">{bankDetails.accountNumber}</dd>
                </div>
                {bankDetails.iban && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#52657C]">IBAN</dt>
                    <dd className="font-mono font-semibold text-[#0E2238] text-right">{bankDetails.iban}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2 pt-2 border-t border-[#DDE6F0]">
                  <dt className="font-bold text-[#0E2238]">Payable Amount</dt>
                  <dd className="font-black text-sm text-[#0A4D94] text-right">{fmtPkr(activeInvoice.amount ?? activeInvoice.amountPkr)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-[#DDE6F0] bg-white overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#F4F7FB] border-b border-[#DDE6F0]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold text-[#52657C]">Item</th>
                    <th className="text-center px-2 py-2 font-bold text-[#52657C]">Qty</th>
                    <th className="text-right px-3 py-2 font-bold text-[#52657C]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE6F0]">
                  {(Array.isArray(activeInvoice.lineItems) ? activeInvoice.lineItems : []).map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-[#0E2238] font-medium">{row.name || row.label || row.addonType || 'Item'}</td>
                      <td className="px-2 py-2 text-center text-[#52657C]">{row.quantity ?? 1}</td>
                      <td className="px-3 py-2 text-right font-bold text-[#0E2238]">{fmtPkr(row.subtotalPkr ?? row.subtotal ?? row.lineTotalPkr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {canUploadOnActive && (
            <form onSubmit={(e) => handleUploadProof(e, activeInvoice)} className="rounded-2xl border border-[#0A4D94]/25 bg-blue-50/30 p-5 space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-[#0E2238]">
                  {activeInvoice.status === 'REJECTED' ? 'Re-Upload Bank Transfer Proof' : 'Upload Payment Screenshot / Receipt'}
                </h4>
                <p className="text-xs text-[#52657C]">
                  Accepted formats: JPG, PNG, or PDF (max 5 MB). Stored securely on Cloudflare R2.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52657C] mb-1.5">
                    Receipt File (JPG / PNG / PDF) *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={handleProofFileChange}
                    className="block w-full text-xs text-[#0E2238] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0A4D94] file:text-white hover:file:bg-[#083D77] file:cursor-pointer bg-white border border-[#DDE6F0] rounded-xl p-1"
                  />
                  {proofFile && (
                    <p className="text-[11px] font-semibold text-[#299A49] mt-1">
                      Selected: {proofFile.name} ({Math.ceil(proofFile.size / 1024)} KB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52657C] mb-1.5">
                    Bank Reference / TID (Optional)
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UBL-TXN-849201"
                    maxLength={120}
                    className="w-full rounded-xl border border-[#DDE6F0] bg-white px-3 py-2.5 text-xs text-[#0E2238] focus:border-[#0A4D94] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52657C] mb-1.5">
                    Note for Super Admin (Optional)
                  </label>
                  <input
                    type="text"
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Branch name, transfer time, or remarks"
                    maxLength={500}
                    className="w-full rounded-xl border border-[#DDE6F0] bg-white px-3 py-2.5 text-xs text-[#0E2238] focus:border-[#0A4D94] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadingId === activeInvoice.id || !proofFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-xs font-extrabold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HiOutlineUpload size={16} />
                  {uploadingId === activeInvoice.id ? 'Uploading to R2…' : 'Send to Super Admin'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── SECTION C: INVOICE LIST ── */}
      {invoices.length > 0 && (
        <div className="bg-white border border-[#DDE6F0] rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HiOutlineDocumentText size={18} className="text-[#0A4D94]" />
              <h3 className="text-sm font-extrabold text-[#0E2238]">Subscription Invoices &amp; Vouchers</h3>
            </div>
            {!lockedMode && (
              <Link href="/admin/subscription" className="text-xs font-bold text-[#0A4D94] hover:underline">
                View Usage &amp; Billing History →
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#DDE6F0] text-[#52657C]">
                  <th className="text-left pb-2 pr-3 font-bold">Invoice #</th>
                  <th className="text-left pb-2 pr-3 font-bold">Plan / Term</th>
                  <th className="text-left pb-2 pr-3 font-bold">Issued / Due</th>
                  <th className="text-right pb-2 pr-3 font-bold">Amount</th>
                  <th className="text-left pb-2 pr-3 font-bold">Status</th>
                  <th className="text-right pb-2 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE6F0]">
                {invoices.map((inv) => {
                  const st = INVOICE_STATUS_META[inv.status] || INVOICE_STATUS_META.UNPAID;
                  const isCurrent = activeInvoice?.id === inv.id;
                  return (
                    <tr key={inv.id} className={isCurrent ? 'bg-blue-50/40' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 pr-3 font-mono font-bold text-[#0E2238] whitespace-nowrap">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-2.5 pr-3 text-[#0E2238] capitalize whitespace-nowrap">
                        {inv.planId} ({inv.billingCycle || 'MONTHLY'})
                      </td>
                      <td className="py-2.5 pr-3 text-[#52657C] whitespace-nowrap">
                        {fmtDate(inv.createdAt || inv.issuedAt)} · Due {fmtDate(inv.dueDate)}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-extrabold text-[#0E2238] whitespace-nowrap">
                        {fmtPkr(inv.amount ?? inv.amountPkr)}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${st.badge}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => setActiveInvoiceId(inv.id)}
                          className="px-2.5 py-1 rounded-lg border border-[#DDE6F0] bg-white text-[11px] font-bold text-[#0E2238] hover:bg-slate-50 cursor-pointer"
                        >
                          {['UNPAID', 'REJECTED'].includes(inv.status) ? 'Pay / Upload' : 'Details'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadVoucher(inv)}
                          className="px-2.5 py-1 rounded-lg bg-[#0A4D94] text-white text-[11px] font-bold hover:bg-[#083D77] cursor-pointer"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
