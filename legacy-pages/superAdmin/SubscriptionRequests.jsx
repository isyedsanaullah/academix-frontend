'use strict';
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineClock,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
  HiOutlineExternalLink,
  HiOutlineLockClosed,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineArrowRight
} from 'react-icons/hi';
import { ROOT_DOMAIN, buildTenantUrl } from '@/lib/host';
import { normalizeSlug } from '@/lib/reservedSlugs';

const STATUS_TABS = [
  { id: 'all', label: 'All Requests' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' }
];

const PLAN_LABELS = {
  free: 'Free Trial',
  basic: 'Basic Plan',
  standard: 'Standard Plan',
  premium: 'Premium Plan',
  enterprise: 'Enterprise Plan'
};

const DEFAULT_PLAN_FEATURES = {
  basic: [
    'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
    'sessions', 'attendance', 'timetable', 'exams-results', 'certificates', 'announcements'
  ],
  standard: [
    'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
    'sessions', 'attendance', 'timetable', 'exams-results', 'certificates', 'announcements',
    'fees', 'entry-system', 'visitors', 'employees', 'canteen', 'analytics-reports'
  ],
  premium: [
    'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
    'sessions', 'attendance', 'timetable', 'exams-results', 'certificates', 'announcements',
    'fees', 'entry-system', 'visitors', 'employees', 'canteen', 'analytics-reports',
    'ai-chat', 'ai-generators', 'ai-study-assistant', 'ai-paper-generator'
  ],
  enterprise: [
    'core-academic', 'students', 'teachers', 'subjects', 'classes', 'sections',
    'sessions', 'attendance', 'timetable', 'exams-results', 'certificates', 'announcements',
    'fees', 'entry-system', 'visitors', 'employees', 'canteen', 'analytics-reports',
    'ai-chat', 'ai-generators', 'ai-study-assistant', 'ai-paper-generator', 'advanced'
  ]
};

export default function SubscriptionRequests() {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, contacted: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Modals state
  const [contactModal, setContactModal] = useState({ open: false, request: null, note: '' });
  const [rejectModal, setRejectModal] = useState({ open: false, request: null, reason: '', notifyRequester: true });
  const [noteInput, setNoteInput] = useState('');

  // Approve & Provision Modal State (Phase 3)
  const [approveModal, setApproveModal] = useState({
    open: false,
    request: null,
    step: 1, // 1: Subdomain & Basic, 2: Plan & Features, 3: Confirmation
    collegeName: '',
    slug: '',
    slugStatus: null, // null | 'checking' | 'available' | 'unavailable'
    slugError: '',
    adminEmail: '',
    plan: 'standard',
    features: [],
    startsAt: new Date().toISOString().slice(0, 10),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  // College invite status for selected request
  const [inviteStatus, setInviteStatus] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Fetch list
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchTerm.trim() || undefined
      };

      const res = await api.get('/super-admin/subscription-requests', { params });
      if (res.data?.success) {
        setRequests(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, pages: 1 });
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load subscription requests:', err);
      toast.error(err.response?.data?.message || 'Failed to load subscription requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  // Fetch full details with timeline events and invite status
  const openDetailDrawer = async (request) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setInviteStatus(null);

    try {
      const res = await api.get(`/super-admin/subscription-requests/${request.id}`);
      if (res.data?.success) {
        setSelectedRequest(res.data.data);
      }

      // If approved, check if college invite info exists
      if (request.status === 'approved' && request.collegeId) {
        setInviteLoading(true);
        api.get(`/super-admin/colleges/${request.collegeId}/invite`)
          .then(iRes => {
            if (iRes.data?.success) setInviteStatus(iRes.data.data);
          })
          .catch(() => {})
          .finally(() => setInviteLoading(false));
      }
    } catch (err) {
      toast.error('Failed to load full request history');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Mark contacted
  const handleMarkContacted = async () => {
    if (!contactModal.request) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/super-admin/subscription-requests/${contactModal.request.id}/contact`, {
        note: contactModal.note
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Request marked as contacted');
        setContactModal({ open: false, request: null, note: '' });
        await fetchRequests();
        if (selectedRequest?.id === contactModal.request.id) {
          openDetailDrawer(contactModal.request);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update request status');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject request
  const handleReject = async () => {
    if (!rejectModal.request) return;
    if (!rejectModal.reason || rejectModal.reason.trim().length < 5) {
      toast.error('Please enter a valid rejection reason (minimum 5 characters)');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.patch(`/super-admin/subscription-requests/${rejectModal.request.id}/reject`, {
        reason: rejectModal.reason.trim(),
        notifyRequester: rejectModal.notifyRequester
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Request rejected');
        setRejectModal({ open: false, request: null, reason: '', notifyRequester: true });
        await fetchRequests();
        if (selectedRequest?.id === rejectModal.request.id) {
          openDetailDrawer(rejectModal.request);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reject request');
    } finally {
      setActionLoading(false);
    }
  };

  // Add internal note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteInput.trim() || !selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/super-admin/subscription-requests/${selectedRequest.id}/notes`, {
        note: noteInput.trim()
      });
      if (res.data?.success) {
        toast.success('Internal note added');
        setNoteInput('');
        openDetailDrawer(selectedRequest);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save note');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Approve Modal
  const openApproveModal = (request) => {
    const initialSlug = normalizeSlug(request.collegeName) || 'college';
    const planKey = (request.selectedPlan || 'standard').toLowerCase();
    const initialFeatures = DEFAULT_PLAN_FEATURES[planKey] || DEFAULT_PLAN_FEATURES.standard;

    setApproveModal({
      open: true,
      request,
      step: 1,
      collegeName: request.collegeName,
      slug: initialSlug,
      slugStatus: null,
      slugError: '',
      adminEmail: request.adminEmail,
      plan: planKey,
      features: initialFeatures,
      startsAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });

    // Check initial slug availability
    checkSlugDebounced(initialSlug);
  };

  // Live slug checking
  const checkSlugDebounced = useCallback((slugToCheck) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setApproveModal(prev => ({
        ...prev,
        slugStatus: 'unavailable',
        slugError: 'Subdomain must be at least 3 characters'
      }));
      return;
    }

    setApproveModal(prev => ({ ...prev, slugStatus: 'checking', slugError: '' }));

    api.get(`/super-admin/slugs/check?slug=${encodeURIComponent(slugToCheck)}`)
      .then(res => {
        if (res.data?.available) {
          setApproveModal(prev => ({ ...prev, slugStatus: 'available', slugError: '' }));
        } else {
          setApproveModal(prev => ({
            ...prev,
            slugStatus: 'unavailable',
            slugError: res.data?.reason || 'Subdomain is not available'
          }));
        }
      })
      .catch(err => {
        setApproveModal(prev => ({
          ...prev,
          slugStatus: 'unavailable',
          slugError: err.response?.data?.message || 'Could not verify subdomain availability'
        }));
      });
  }, []);

  const handleSlugChange = (newVal) => {
    const cleaned = normalizeSlug(newVal);
    setApproveModal(prev => ({ ...prev, slug: cleaned }));
    checkSlugDebounced(cleaned);
  };

  const handlePlanChange = (newPlan) => {
    const features = DEFAULT_PLAN_FEATURES[newPlan] || DEFAULT_PLAN_FEATURES.standard;
    setApproveModal(prev => ({
      ...prev,
      plan: newPlan,
      features
    }));
  };

  const handleFeatureToggle = (feature) => {
    setApproveModal(prev => {
      const exists = prev.features.includes(feature);
      const updated = exists ? prev.features.filter(f => f !== feature) : [...prev.features, feature];
      return { ...prev, features: updated };
    });
  };

  // Submit Approval & Provisioning
  const handleApproveSubmit = async () => {
    if (approveModal.slugStatus !== 'available') {
      toast.error('Please choose a valid and available subdomain slug');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/super-admin/subscription-requests/${approveModal.request.id}/approve`, {
        collegeName: approveModal.collegeName.trim(),
        slug: approveModal.slug.trim(),
        adminEmail: approveModal.adminEmail.trim(),
        plan: approveModal.plan,
        features: approveModal.features,
        startsAt: approveModal.startsAt,
        expiresAt: approveModal.expiresAt
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'College approved and provisioned successfully!');
        setApproveModal(prev => ({ ...prev, open: false }));
        await fetchRequests();
        if (selectedRequest?.id === approveModal.request.id) {
          openDetailDrawer(approveModal.request);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval and provisioning failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Resend College Invite
  const handleResendInvite = async (collegeId) => {
    if (!collegeId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/super-admin/colleges/${collegeId}/invite/resend`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Invitation email resent');
        if (selectedRequest) openDetailDrawer(selectedRequest);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend invite');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'new').toLowerCase();
    switch (s) {
      case 'new':
        return <span className="badge-warning">New Request</span>;
      case 'contacted':
        return <span className="badge-info">Contacted</span>;
      case 'approved':
        return <span className="badge-success">Approved</span>;
      case 'rejected':
        return <span className="badge-danger">Rejected</span>;
      default:
        return <span className="badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="page space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Subscription Requests</h1>
          <p className="text-sm text-muted mt-1">
            Review institution applications, track contact timelines, and provision college subdomains.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 self-start"
          aria-label="Refresh requests"
        >
          <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="tabs border-b border-line pb-1 overflow-x-auto flex-nowrap">
        {STATUS_TABS.map((tab) => {
          const count = counts[tab.id] ?? 0;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`tab whitespace-nowrap flex items-center gap-2 ${isActive ? 'tab-active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive ? 'bg-primary/20 text-primary font-bold' : 'bg-muted/15 text-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by college name, email, or contact number..."
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="card p-0 overflow-hidden hidden md:block">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>College / Applicant</th>
                <th>Plan Requested</th>
                <th>Students</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <div className="skeleton h-8 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12">
                    <div className="empty">
                      <HiOutlineDocumentText className="w-10 h-10 text-muted mx-auto mb-2" />
                      <p className="font-semibold text-fg">No subscription requests found</p>
                      <p className="text-xs text-muted mt-1">Try selecting another status tab or clearing your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/5 transition-colors">
                    <td>
                      <div className="font-semibold text-fg">{r.collegeName}</div>
                      <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <HiOutlineMail className="w-3.5 h-3.5" />
                          {r.adminEmail}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <HiOutlinePhone className="w-3.5 h-3.5" />
                          {r.phone}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-xs text-fg">
                        {PLAN_LABELS[r.selectedPlan?.toLowerCase()] || r.selectedPlan}
                      </span>
                    </td>
                    <td className="text-xs text-fg font-medium">
                      {r.studentCount ? r.studentCount.toLocaleString() : '—'}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td className="text-xs text-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailDrawer(r)}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Details
                        </button>
                        {r.status === 'new' && (
                          <button
                            onClick={() => setContactModal({ open: true, request: r, note: '' })}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            Mark Contacted
                          </button>
                        )}
                        {r.status === 'contacted' && (
                          <button
                            onClick={() => openApproveModal(r)}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <HiOutlineSparkles className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        {r.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2">
                            <HiOutlineCheckCircle className="w-4 h-4" />
                            Provisioned
                          </span>
                        )}
                        {r.status !== 'rejected' && r.status !== 'approved' && (
                          <button
                            onClick={() => setRejectModal({ open: true, request: r, reason: '', notifyRequester: true })}
                            className="btn-danger text-xs py-1.5 px-3"
                          >
                            Reject
                          </button>
                        )}
                        {r.status === 'rejected' && (
                          <button
                            onClick={() => setContactModal({ open: true, request: r, note: '' })}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            Re-open
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (<768px) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 skeleton h-32 rounded-xl" />
          ))
        ) : requests.length === 0 ? (
          <div className="card p-8 text-center">
            <HiOutlineDocumentText className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-fg">No requests found</p>
          </div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-fg text-sm">{r.collegeName}</h3>
                  <p className="text-xs text-muted mt-0.5">{r.adminEmail}</p>
                </div>
                {getStatusBadge(r.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-line py-2">
                <div>
                  <span className="text-muted block">Plan:</span>
                  <span className="font-medium text-fg">{PLAN_LABELS[r.selectedPlan] || r.selectedPlan}</span>
                </div>
                <div>
                  <span className="text-muted block">Students:</span>
                  <span className="font-medium text-fg">{r.studentCount || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => openDetailDrawer(r)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Details
                </button>
                {r.status === 'new' && (
                  <button
                    onClick={() => setContactModal({ open: true, request: r, note: '' })}
                    className="btn-primary flex-1 text-xs py-2"
                  >
                    Contact
                  </button>
                )}
                {r.status === 'contacted' && (
                  <button
                    onClick={() => openApproveModal(r)}
                    className="btn-primary flex-1 text-xs py-2"
                  >
                    Approve
                  </button>
                )}
                {r.status !== 'rejected' && r.status !== 'approved' && (
                  <button
                    onClick={() => setRejectModal({ open: true, request: r, reason: '', notifyRequester: true })}
                    className="btn-danger text-xs py-2 px-3"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Slide-out Drawer */}
      {drawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-card border-l border-line h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-line flex items-center justify-between sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-lg font-bold text-fg">{selectedRequest.collegeName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(selectedRequest.status)}
                  <span className="text-xs text-muted">ID: {selectedRequest.id.slice(0, 8)}</span>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn-ghost p-2 rounded-lg text-muted hover:text-fg"
                aria-label="Close drawer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 space-y-6 flex-1">
              {drawerLoading ? (
                <div className="space-y-4">
                  <div className="skeleton h-24 w-full rounded" />
                  <div className="skeleton h-40 w-full rounded" />
                </div>
              ) : (
                <>
                  {/* Contact Information */}
                  <div className="card p-4 space-y-2 text-xs">
                    <h3 className="font-bold text-fg uppercase tracking-wider text-[11px] mb-2">Requester Info</h3>
                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Administrator Email:</span>
                      <span className="font-semibold text-fg">{selectedRequest.adminEmail}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Phone Number:</span>
                      <span className="font-semibold text-fg">{selectedRequest.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line">
                      <span className="text-muted">Selected Plan:</span>
                      <span className="font-semibold text-fg">{PLAN_LABELS[selectedRequest.selectedPlan] || selectedRequest.selectedPlan}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted">Expected Students:</span>
                      <span className="font-semibold text-fg">{selectedRequest.studentCount}</span>
                    </div>
                  </div>

                  {/* If Approved, show Subdomain & Invite status card */}
                  {selectedRequest.status === 'approved' && (
                    <div className="card p-4 space-y-3 border-emerald-500/20 bg-emerald-500/5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                          Provisioned Workspace
                        </span>
                        <span className="badge-success">Ready</span>
                      </div>
                      <p className="text-muted">
                        College is provisioned. The administrator was sent a unique 7-day setup link.
                      </p>
                      {inviteStatus && (
                        <div className="border-t border-emerald-500/20 pt-2 space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-muted">Invite Link Status:</span>
                            <span className="font-semibold capitalize text-fg">{inviteStatus.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Email Delivery:</span>
                            <span className={`font-semibold capitalize ${inviteStatus.emailStatus === 'failed' ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {inviteStatus.emailStatus}
                            </span>
                          </div>
                          {inviteStatus.emailError && (
                            <p className="text-rose-500 text-[10px] mt-0.5">{inviteStatus.emailError}</p>
                          )}
                        </div>
                      )}
                      {selectedRequest.collegeId && (
                        <div className="pt-1">
                          <button
                            onClick={() => handleResendInvite(selectedRequest.collegeId)}
                            disabled={actionLoading}
                            className="btn-secondary text-xs w-full py-2 flex items-center justify-center gap-1.5"
                          >
                            <HiOutlineRefresh className="w-3.5 h-3.5" />
                            <span>Resend Setup Invite Email</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submitted Message */}
                  {selectedRequest.message && (
                    <div className="card p-4 space-y-1">
                      <h3 className="font-bold text-fg uppercase tracking-wider text-[11px]">Message from Applicant</h3>
                      <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{selectedRequest.message}</p>
                    </div>
                  )}

                  {/* Internal Notes Display */}
                  {selectedRequest.internal_notes && (
                    <div className="card p-4 space-y-1 border-amber-500/20 bg-amber-500/5">
                      <h3 className="font-bold text-amber-500 uppercase tracking-wider text-[11px]">Internal Notes</h3>
                      <p className="text-xs text-fg leading-relaxed whitespace-pre-wrap">{selectedRequest.internal_notes}</p>
                    </div>
                  )}

                  {/* Rejection Reason if applicable */}
                  {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                    <div className="card p-4 space-y-1 border-rose-500/20 bg-rose-500/5">
                      <h3 className="font-bold text-rose-500 uppercase tracking-wider text-[11px]">Rejection Reason</h3>
                      <p className="text-xs text-rose-200 leading-relaxed whitespace-pre-wrap">{selectedRequest.rejection_reason}</p>
                    </div>
                  )}

                  {/* Vertical Timeline of Events */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-fg uppercase tracking-wider text-[11px]">Lifecycle & Activity Timeline</h3>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                      {selectedRequest.events && selectedRequest.events.length > 0 ? (
                        selectedRequest.events.map((ev) => (
                          <div key={ev.id} className="relative text-xs">
                            <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
                            <div className="flex items-center justify-between text-[11px] text-muted">
                              <span className="font-semibold text-fg capitalize">{ev.type.replace('_', ' ')}</span>
                              <span>{new Date(ev.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-muted mt-0.5">
                              Actor: <strong className="text-fg">{ev.actor_name || 'System'}</strong>
                            </p>
                            {ev.note && (
                              <p className="bg-muted/10 p-2 rounded text-fg mt-1 text-[11px] whitespace-pre-wrap">
                                {ev.note}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted">No timeline events recorded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-line">
                    <label className="field-label text-xs">Add Administrative Note</label>
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Write an internal note or update about this applicant..."
                      className="input-field text-xs h-20 w-full"
                    />
                    <button
                      type="submit"
                      disabled={!noteInput.trim() || actionLoading}
                      className="btn-primary text-xs py-2 px-4 w-full"
                    >
                      {actionLoading ? 'Saving...' : 'Add Note'}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-line bg-card flex items-center gap-2">
              {selectedRequest.status === 'new' && (
                <button
                  onClick={() => setContactModal({ open: true, request: selectedRequest, note: '' })}
                  className="btn-primary flex-1 text-xs py-2.5"
                >
                  Mark Contacted
                </button>
              )}
              {selectedRequest.status === 'contacted' && (
                <button
                  onClick={() => openApproveModal(selectedRequest)}
                  className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <HiOutlineSparkles className="w-4 h-4" />
                  Approve & Provision
                </button>
              )}
              {selectedRequest.status !== 'rejected' && selectedRequest.status !== 'approved' && (
                <button
                  onClick={() => setRejectModal({ open: true, request: selectedRequest, reason: '', notifyRequester: true })}
                  className="btn-danger flex-1 text-xs py-2.5"
                >
                  Reject Request
                </button>
              )}
              {selectedRequest.status === 'rejected' && (
                <button
                  onClick={() => setContactModal({ open: true, request: selectedRequest, note: '' })}
                  className="btn-secondary flex-1 text-xs py-2.5"
                >
                  Re-open (Contact)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve & Provision Modal (Phase 3) */}
      {approveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
          <div className="card max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg">Approve & Provision College</h3>
                  <p className="text-xs text-muted">Step {approveModal.step} of 3</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModal(prev => ({ ...prev, open: false }))}
                className="btn-ghost p-1.5 text-muted hover:text-fg rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Subdomain & Basic Details */}
            {approveModal.step === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="field-label text-xs">College Name *</label>
                  <input
                    type="text"
                    value={approveModal.collegeName}
                    onChange={(e) => setApproveModal(prev => ({ ...prev, collegeName: e.target.value }))}
                    className="input-field text-sm w-full"
                    placeholder="e.g. Faisalabad Model College"
                  />
                </div>

                <div>
                  <label className="field-label text-xs">Subdomain Slug *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={approveModal.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="input-field text-sm font-mono flex-1 lowercase"
                      placeholder="e.g. fmc"
                    />
                    <span className="text-xs font-mono text-muted whitespace-nowrap">
                      .{ROOT_DOMAIN}
                    </span>
                  </div>

                  {/* Slug validation status indicator */}
                  <div className="mt-1.5">
                    {approveModal.slugStatus === 'checking' && (
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <HiOutlineRefresh className="w-3 h-3 animate-spin" /> Checking availability...
                      </span>
                    )}
                    {approveModal.slugStatus === 'available' && (
                      <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                        ✓ Available! Portal will be created at https://{approveModal.slug}.{ROOT_DOMAIN}
                      </span>
                    )}
                    {approveModal.slugStatus === 'unavailable' && (
                      <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        ✗ {approveModal.slugError}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="field-label text-xs">Administrator Email *</label>
                  <input
                    type="email"
                    value={approveModal.adminEmail}
                    onChange={(e) => setApproveModal(prev => ({ ...prev, adminEmail: e.target.value }))}
                    className="input-field text-sm w-full"
                    placeholder="admin@college.edu.pk"
                  />
                  <p className="text-[11px] text-muted mt-0.5">
                    The 7-day one-time invite setup link will be emailed directly to this address.
                  </p>
                </div>

                <div className="flex justify-end pt-3 border-t border-line">
                  <button
                    type="button"
                    disabled={approveModal.slugStatus !== 'available' || !approveModal.collegeName.trim()}
                    onClick={() => setApproveModal(prev => ({ ...prev, step: 2 }))}
                    className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5"
                  >
                    <span>Next: Plan & Features</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Plan & Feature Checklist */}
            {approveModal.step === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="field-label text-xs">Subscription Plan</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['basic', 'standard', 'premium', 'enterprise'].map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handlePlanChange(p)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          approveModal.plan === p
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-line bg-card text-muted hover:border-fg/30'
                        }`}
                      >
                        <span className="capitalize block">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label text-xs">Start Date</label>
                    <input
                      type="date"
                      value={approveModal.startsAt}
                      onChange={(e) => setApproveModal(prev => ({ ...prev, startsAt: e.target.value }))}
                      className="input-field text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="field-label text-xs">Expiry Date</label>
                    <input
                      type="date"
                      value={approveModal.expiresAt}
                      onChange={(e) => setApproveModal(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="input-field text-xs w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label text-xs">Included Features ({approveModal.features.length})</label>
                  <div className="max-h-48 overflow-y-auto border border-line rounded-xl p-3 space-y-2 bg-page">
                    {DEFAULT_PLAN_FEATURES.enterprise.map((feat) => {
                      const isChecked = approveModal.features.includes(feat);
                      return (
                        <label key={feat} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleFeatureToggle(feat)}
                            className="rounded border-line bg-card text-primary focus:ring-primary"
                          />
                          <span className={isChecked ? 'text-fg font-medium' : 'text-muted'}>
                            {feat}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setApproveModal(prev => ({ ...prev, step: 1 }))}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveModal(prev => ({ ...prev, step: 3 }))}
                    className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5"
                  >
                    <span>Next: Confirm</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Summary & Execution */}
            {approveModal.step === 3 && (
              <div className="space-y-4 text-xs">
                <div className="card p-4 space-y-2.5 border-primary/20 bg-primary/5">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-[11px]">
                    Provisioning Summary
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-primary/15">
                      <span className="text-muted">College Name:</span>
                      <strong className="text-fg">{approveModal.collegeName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-primary/15">
                      <span className="text-muted">Assigned Subdomain:</span>
                      <strong className="text-primary font-mono">{approveModal.slug}.{ROOT_DOMAIN}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-primary/15">
                      <span className="text-muted">Administrator:</span>
                      <strong className="text-fg">{approveModal.adminEmail}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-primary/15">
                      <span className="text-muted">Subscription Tier:</span>
                      <strong className="text-fg capitalize">{approveModal.plan} ({approveModal.features.length} features)</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted">Subscription Valid Until:</span>
                      <strong className="text-fg">{approveModal.expiresAt}</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  Upon clicking confirm, the platform will provision the database record in <span className="font-semibold text-fg">pending_setup</span> status and dispatch a single-use onboarding invite link to <strong className="text-fg">{approveModal.adminEmail}</strong>.
                </p>

                <div className="flex justify-between pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setApproveModal(prev => ({ ...prev, step: 2 }))}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleApproveSubmit}
                    className="btn-primary text-xs py-2.5 px-6 font-bold"
                  >
                    {actionLoading ? 'Provisioning...' : 'Confirm & Provision Workspace'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mark Contacted Modal */}
      {contactModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-fg">
              {contactModal.request?.status === 'rejected' ? 'Re-open Request' : 'Mark as Contacted'}
            </h3>
            <p className="text-xs text-muted">
              {contactModal.request?.status === 'rejected'
                ? 'Re-opening a rejected request requires an explanation note for audit compliance.'
                : 'Confirm you have reached out to the applicant. You can optionally attach an internal note.'}
            </p>
            <div className="space-y-1">
              <label className="field-label text-xs">
                {contactModal.request?.status === 'rejected' ? 'Explanation Note (Required)' : 'Note (Optional)'}
              </label>
              <textarea
                value={contactModal.note}
                onChange={(e) => setContactModal({ ...contactModal, note: e.target.value })}
                placeholder="Details of call or discussion..."
                className="input-field text-xs h-24 w-full"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContactModal({ open: false, request: null, note: '' })}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkContacted}
                disabled={actionLoading || (contactModal.request?.status === 'rejected' && !contactModal.note.trim())}
                className="btn-primary text-xs py-2 px-4"
              >
                {actionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-500">Reject Subscription Request</h3>
            <p className="text-xs text-muted">
              Please provide a clear reason for the rejection (5 to 500 characters). This will be recorded in the audit timeline.
            </p>
            <div className="space-y-1">
              <label className="field-label text-xs">Rejection Reason *</label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="e.g. Incomplete institutional documentation or duplicate application..."
                className="input-field text-xs h-24 w-full"
              />
              <span className="text-[11px] text-muted">{rejectModal.reason.length} / 500 characters</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-fg cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={rejectModal.notifyRequester}
                onChange={(e) => setRejectModal({ ...rejectModal, notifyRequester: e.target.checked })}
                className="rounded border-line bg-card text-primary focus:ring-primary"
              />
              <span>Send polite notification email to requester ({rejectModal.request?.adminEmail})</span>
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, request: null, reason: '', notifyRequester: true })}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || rejectModal.reason.trim().length < 5}
                className="btn-danger text-xs py-2 px-4"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
