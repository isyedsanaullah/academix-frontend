import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineFilter,
  HiOutlineClipboardList,
  HiOutlineChatAlt,
  HiOutlineBadgeCheck,
  HiOutlineXCircle,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
  HiOutlineChat,
  HiOutlineCheck
} from 'react-icons/hi';

const PLAN_LABELS = {
  free: 'Free Plan',
  basic: 'Basic Plan',
  standard: 'Standard Plan',
  professional: 'Professional Plan',
  premium: 'Premium Plan',
  ownership: 'Full System Ownership',
  enterprise: 'Enterprise Plan'
};

const STATUS_LABELS = {
  new: 'New Request',
  contacted: 'Contacted Applicant',
  in_review: 'In Review',
  approved: 'Approved Request',
  rejected: 'Rejected Request',
  converted: 'Converted Client'
};

// Dynamic Badge Styling Helpers for Light & Dark Themes
const getPlanBadgeClass = (planId) => {
  const p = (planId || '').toLowerCase();
  switch (p) {
    case 'free':
    case 'basic':
      return 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/20';
    case 'standard':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    case 'professional':
    case 'premium':
      return 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20';
    case 'ownership':
    case 'enterprise':
      return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
    default:
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
  }
};

const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'new':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    case 'contacted':
      return 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20';
    case 'in_review':
      return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
    case 'approved':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    case 'rejected':
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
    case 'converted':
      return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
    default:
      return 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
  }
};

// Helper to separate "Preferred Contact: Method" from true admin notes
const parseNotesAndContact = (rawNotes) => {
  if (!rawNotes) return { preferredContact: null, adminNotes: '' };
  
  if (rawNotes.startsWith('Preferred Contact:')) {
    const lines = rawNotes.split('\n');
    const preferredContact = lines[0].replace('Preferred Contact:', '').trim();
    const adminNotes = lines.slice(1).join('\n').trim();
    return { preferredContact, adminNotes };
  }

  return { preferredContact: null, adminNotes: rawNotes };
};

const SubscriptionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected request for details view
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: ''
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/super-admin/subscription-requests', {
        params: {
          search: search || undefined,
          plan: planFilter || undefined,
          status: statusFilter || undefined,
          page,
          limit
        }
      });
      setRequests(data.data || []);
      setTotal(data.pagination?.total || 0);
      setPages(data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load subscription requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, planFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const selectRequest = (req) => {
    setSelected(req);
    const { adminNotes } = parseNotesAndContact(req.notes);
    setUpdateForm({
      status: req.status || 'new',
      notes: adminNotes || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;

    setUpdating(true);
    try {
      const { preferredContact } = parseNotesAndContact(selected.notes);
      
      // Re-attach preferred contact prefix if it existed originally
      let finalNotes = updateForm.notes.trim();
      if (preferredContact) {
        finalNotes = finalNotes
          ? `Preferred Contact: ${preferredContact}\n${finalNotes}`
          : `Preferred Contact: ${preferredContact}`;
      }

      const { data } = await api.put(`/super-admin/subscription-requests/${selected.id}`, {
        status: updateForm.status,
        notes: finalNotes
      });
      toast.success(data.message || 'Request updated successfully');

      setSelected(data.data);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickStatusChange = async (id, status) => {
    try {
      const { data } = await api.put(`/super-admin/subscription-requests/${id}`, { status });
      toast.success(`Marked request as ${STATUS_LABELS[status] || status}`);
      fetchRequests();
      if (selected && selected.id === id) {
        setSelected(data.data);
        const { adminNotes } = parseNotesAndContact(data.data.notes);
        setUpdateForm(prev => ({ ...prev, status, notes: adminNotes }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // KPI Metrics calculation
  const newCount = useMemo(() => requests.filter(r => r.status === 'new').length, [requests]);
  const inReviewCount = useMemo(() => requests.filter(r => r.status === 'in_review' || r.status === 'contacted').length, [requests]);
  const approvedCount = useMemo(() => requests.filter(r => r.status === 'approved' || r.status === 'converted').length, [requests]);

  const activeSelectedInfo = useMemo(() => {
    if (!selected) return null;
    const { preferredContact, adminNotes } = parseNotesAndContact(selected.notes);
    return {
      preferredContact,
      adminNotes
    };
  }, [selected]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0d1117] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold shrink-0">
            <HiOutlineClipboardList size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Subscription Requests
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-xs sm:text-sm mt-0.5">
              Review institution onboarding applications and plan evaluations
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Total Inquiries
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {total}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">Submitted requests</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/15 shrink-0">
            <HiOutlineClipboardList size={22} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              New Requests
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {newCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">Awaiting first contact</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/15 shrink-0">
            <HiOutlineClock size={22} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              In Review / Contacted
            </p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {inReviewCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">Active conversations</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/15 shrink-0">
            <HiOutlineChatAlt size={22} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Approved / Converted
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {approvedCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">Onboarded workspace</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/15 shrink-0">
            <HiOutlineBadgeCheck size={22} />
          </div>
        </div>
      </div>

      {/* Main Container: Filters & Table + Responsive Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Table & Filters Column */}
        <div className="flex-1 w-full space-y-4 min-w-0">
          
          {/* Filters Bar */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <HiOutlineSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search college, admin email, or phone..."
                className="input-field pl-10 pr-9 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); fetchRequests(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white transition"
                  title="Clear search"
                >
                  <HiOutlineX size={16} />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2">
              <select
                value={planFilter}
                onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                className="input-field text-xs capitalize py-2.5"
              >
                <option value="">All Plans</option>
                <option value="free">Free Plan</option>
                <option value="standard">Standard Plan</option>
                <option value="premium">Premium Plan</option>
                <option value="ownership">Full Ownership</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="input-field text-xs capitalize py-2.5"
              >
                <option value="">All Statuses</option>
                <option value="new">New Request</option>
                <option value="contacted">Contacted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted</option>
              </select>

              {(search || planFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPlanFilter('');
                    setStatusFilter('');
                    setPage(1);
                  }}
                  className="btn-secondary py-2.5 px-3 text-xs shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
                <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium">Loading subscription inquiries...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineClipboardList size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No requests found</h3>
                <p className="text-xs text-slate-500 dark:text-white/40 mt-1 max-w-sm mx-auto">
                  No subscription inquiries matched your search or status filter criteria.
                </p>
                {(search || planFilter || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setPlanFilter('');
                      setStatusFilter('');
                      setPage(1);
                    }}
                    className="btn-secondary text-xs mt-4"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="pl-5">College Name</th>
                      <th>Admin Contact</th>
                      <th>Selected Plan</th>
                      <th>Students</th>
                      <th>Request Date</th>
                      <th>Status</th>
                      <th className="pr-5 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => selectRequest(req)}
                        className={`cursor-pointer transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${
                          selected?.id === req.id ? 'bg-indigo-50/60 dark:bg-white/[0.04]' : ''
                        }`}
                      >
                        <td className="pl-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                              {req.collegeName?.slice(0, 2)?.toUpperCase() || 'CO'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                {req.collegeName}
                              </p>
                              {req.message && (
                                <p className="text-[11px] text-slate-400 dark:text-white/30 truncate max-w-xs">
                                  💬 {req.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-white/80 font-medium">
                              <HiOutlineMail size={13} className="text-slate-400 dark:text-white/30 shrink-0" />
                              <span className="truncate">{req.adminEmail}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/40">
                              <HiOutlinePhone size={13} className="text-slate-400 dark:text-white/30 shrink-0" />
                              <span>{req.phone}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${getPlanBadgeClass(
                              req.selectedPlan
                            )}`}
                          >
                            {PLAN_LABELS[req.selectedPlan?.toLowerCase()] || req.selectedPlan || '—'}
                          </span>
                        </td>

                        <td className="text-xs font-bold text-slate-800 dark:text-white/80">
                          {req.studentCount?.toLocaleString()}
                        </td>

                        <td className="text-slate-500 dark:text-white/50 text-xs font-mono">
                          {new Date(req.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${getStatusBadgeClass(
                              req.status
                            )}`}
                          >
                            {req.status === 'approved' || req.status === 'converted' ? (
                              <HiOutlineCheckCircle size={13} />
                            ) : req.status === 'rejected' ? (
                              <HiOutlineXCircle size={13} />
                            ) : (
                              <HiOutlineClock size={13} />
                            )}
                            {req.status}
                          </span>
                        </td>

                        <td className="pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleQuickStatusChange(req.id, 'contacted')}
                              className="btn-secondary py-1 px-2.5 text-[11px]"
                              title="Mark as Contacted"
                            >
                              Contact
                            </button>
                            <button
                              onClick={() => handleQuickStatusChange(req.id, 'approved')}
                              className="btn-primary py-1 px-2.5 text-[11px]"
                              title="Approve Request"
                            >
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {pages > 1 && (
              <div className="px-5 py-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.01]">
                <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
                  Showing page <strong>{page}</strong> of <strong>{pages}</strong> ({total} inquiries)
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                    disabled={page === pages}
                    className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Pane / Sidebar Drawer (Desktop: Sticky Panel; Mobile: Modal Overlay) */}
        <AnimatePresence>
          {selected && (
            <>
              {/* Mobile Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelected(null)}
                className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs z-40 lg:hidden"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto w-full max-w-md lg:w-[380px] bg-white dark:bg-[#0d1117] border-l lg:border border-slate-200 dark:border-white/[0.08] lg:rounded-2xl p-5 space-y-5 shadow-2xl lg:shadow-sm overflow-y-auto shrink-0"
              >
                {/* Pane Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <HiOutlineClipboardList className="text-indigo-600 dark:text-indigo-400" size={18} />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Request Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                    title="Close details"
                  >
                    <HiOutlineX size={18} />
                  </button>
                </div>

                {/* College & Contact Information */}
                <div className="space-y-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                      College Workspace Name
                    </p>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                      {selected.collegeName}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                        Selected Plan
                      </p>
                      <span
                        className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getPlanBadgeClass(
                          selected.selectedPlan
                        )}`}
                      >
                        {PLAN_LABELS[selected.selectedPlan?.toLowerCase()] || selected.selectedPlan || '—'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                        Student Count
                      </p>
                      <p className="font-extrabold text-slate-900 dark:text-white mt-1 text-sm">
                        {selected.studentCount?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Contact Methods & Preferred Channel */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                        Admin Contact Channels
                      </p>
                      {activeSelectedInfo?.preferredContact && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                          <HiOutlineSparkles size={12} /> Prefers: {activeSelectedInfo.preferredContact}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <a
                        href={`mailto:${selected.adminEmail}`}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
                      >
                        <HiOutlineMail size={16} className="shrink-0" />
                        <span className="truncate">{selected.adminEmail}</span>
                      </a>

                      <a
                        href={`tel:${selected.phone}`}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.05] transition"
                      >
                        <HiOutlinePhone size={16} className="shrink-0" />
                        <span>{selected.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Applicant Message / Requirements Box */}
                  {selected.message && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">
                        Applicant Message / Requirements
                      </p>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-white/80 text-xs italic leading-relaxed max-h-36 overflow-y-auto">
                        "{selected.message}"
                      </div>
                    </div>
                  )}

                  {/* Audit Review Info */}
                  {selected.reviewedBy && (
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.05] border border-indigo-200 dark:border-indigo-500/15 text-[11px] text-indigo-800 dark:text-indigo-300 space-y-0.5">
                      <p className="font-bold uppercase tracking-wider text-[9px] text-indigo-600 dark:text-indigo-400">
                        Review History
                      </p>
                      <p>Reviewed By: <strong>{selected.reviewedBy}</strong></p>
                      <p>Reviewed On: {new Date(selected.reviewedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <hr className="border-slate-200 dark:border-white/[0.06]" />

                {/* Review & Update Status Form */}
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label
                      htmlFor="update-status"
                      className="block text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider mb-1.5"
                    >
                      Update Request Status *
                    </label>
                    <select
                      id="update-status"
                      value={updateForm.status}
                      onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}
                      className="input-field text-xs font-semibold py-2.5 capitalize"
                      disabled={updating}
                    >
                      <option value="new">New Request</option>
                      <option value="contacted">Contacted Applicant</option>
                      <option value="in_review">In Review</option>
                      <option value="approved">Approved Request</option>
                      <option value="rejected">Rejected Request</option>
                      <option value="converted">Converted Client</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="update-notes"
                      className="block text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider mb-1.5"
                    >
                      Internal Notes / Admin Log
                    </label>
                    <textarea
                      id="update-notes"
                      value={updateForm.notes}
                      onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
                      placeholder="Type private admin review notes or internal comments..."
                      className="input-field text-xs min-h-24 py-2"
                      disabled={updating}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full btn-primary py-2.5 justify-center text-xs font-bold shadow-lg shadow-indigo-500/20"
                  >
                    {updating ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving Updates...
                      </span>
                    ) : (
                      'Save Status & Internal Notes'
                    )}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SubscriptionRequests;
