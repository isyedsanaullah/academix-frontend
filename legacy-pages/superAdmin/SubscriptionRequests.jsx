import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding,
  HiOutlineUserGroup, HiOutlineClock, HiOutlineChevronRight, HiOutlineFilter,
  HiOutlineClipboardList, HiOutlineChatAlt, HiOutlineBadgeCheck, HiOutlineXCircle
} from 'react-icons/hi';

const PLAN_BADGES = {
  standard: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  professional: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  premium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ownership: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const PLAN_LABELS = {
  standard: 'Standard',
  professional: 'Professional',
  premium: 'Premium',
  ownership: 'Full Ownership',
};

const STATUS_BADGES = {
  new: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  contacted: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  in_review: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  approved: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  converted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
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
    } catch (err) {
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
    setUpdateForm({
      status: req.status,
      notes: req.notes || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;

    setUpdating(true);
    try {
      const { data } = await api.put(`/super-admin/subscription-requests/${selected.id}`, updateForm);
      toast.success(data.message || 'Request updated successfully');
      
      // Update selected reference
      setSelected(data.data);
      
      // Refresh list
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
      toast.success(`Marked request as ${status}`);
      fetchRequests();
      if (selected && selected.id === id) {
        setSelected(data.data);
        setUpdateForm(prev => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Subscription Requests</h1>
          <p className="text-xs text-white/40 mt-1">Manage onboarding requests from colleges evaluating Academix</p>
        </div>
      </div>

      {/* Main Grid: Filters & Table + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Table Column (70%) */}
        <div className="flex-1 w-full space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <HiOutlineSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search college, email or phone..."
                className="input-field pl-9 text-xs py-2"
              />
            </form>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={planFilter}
                onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                className="input-field text-xs py-2 bg-[#1a2230] flex-1 md:flex-initial"
              >
                <option value="">All Plans</option>
                <option value="standard">Standard</option>
                <option value="professional">Professional</option>
                <option value="premium">Premium</option>
                <option value="ownership">Full System Ownership</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="input-field text-xs py-2 bg-[#1a2230] flex-1 md:flex-initial"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-white/40">Loading subscription requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/15">
                  <HiOutlineClipboardList size={24} />
                </div>
                <h3 className="text-sm font-bold text-white/70">No requests found</h3>
                <p className="text-xs text-white/30 max-w-xs leading-relaxed">No pending requests matched your criteria. New request notifications are automatically delivered here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>College Name</th>
                      <th>Admin Contact</th>
                      <th>Plan</th>
                      <th>Students</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => selectRequest(req)}
                        className={`cursor-pointer ${selected?.id === req.id ? 'bg-white/[0.03]' : ''}`}
                      >
                        <td className="font-bold text-white text-xs">{req.collegeName}</td>
                        <td>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-white/60">
                              <HiOutlineMail size={12} className="text-white/20" />
                              <span>{req.adminEmail}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-white/40">
                              <HiOutlinePhone size={12} className="text-white/20" />
                              <span>{req.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge border ${PLAN_BADGES[req.selectedPlan?.toLowerCase()] || 'bg-white/5 text-white/50 border-white/10'}`}>
                            {PLAN_LABELS[req.selectedPlan?.toLowerCase()] || req.selectedPlan || '—'}
                          </span>
                        </td>
                        <td className="text-xs font-semibold text-white/75">{req.studentCount?.toLocaleString()}</td>
                        <td className="text-[11px] text-white/40 font-medium">
                          <div className="flex items-center gap-1">
                            <HiOutlineClock size={11} className="text-white/20" />
                            <span>{new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge border ${STATUS_BADGES[req.status] || ''}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleQuickStatusChange(req.id, 'contacted')}
                              className="btn-secondary px-2 py-1 text-[10px] bg-[#1a2230] border-white/5 hover:text-white"
                              title="Mark as Contacted"
                            >
                              Contact
                            </button>
                            <button
                              onClick={() => handleQuickStatusChange(req.id, 'approved')}
                              className="btn-secondary px-2 py-1 text-[10px] bg-emerald-500/10 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20"
                              title="Approve"
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

            {/* Pagination footer */}
            {pages > 1 && (
              <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                <p className="text-[10px] text-white/35 font-medium">Showing page {page} of {pages} ({total} entries)</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="btn-secondary px-2.5 py-1 text-[10px] disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                    disabled={page === pages}
                    className="btn-secondary px-2.5 py-1 text-[10px] disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Details Pane (30%) */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-[350px] bg-[#0d1117] border border-white/[0.06] rounded-2xl p-5 space-y-6 shrink-0"
            >
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                <h3 className="text-sm font-extrabold text-white">Request Details</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition"
                >
                  <HiOutlineX size={16} />
                </button>
              </div>

              {/* Stats & Contacts block */}
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">College Workspace</p>
                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">{selected.collegeName}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Selected Plan</p>
                    <span className={`inline-block mt-1 badge border ${PLAN_BADGES[selected.selectedPlan?.toLowerCase()] || 'bg-white/5 text-white/50 border-white/10'}`}>
                      {PLAN_LABELS[selected.selectedPlan?.toLowerCase()] || selected.selectedPlan || '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Student Count</p>
                    <p className="font-bold text-white mt-1 text-sm">{selected.studentCount?.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Contact Details</p>
                  <div className="mt-1.5 space-y-2">
                    <a
                      href={`mailto:${selected.adminEmail}`}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-indigo-400 hover:bg-white/[0.04] transition-colors"
                    >
                      <HiOutlineMail size={14} />
                      <span className="truncate">{selected.adminEmail}</span>
                    </a>
                    <a
                      href={`tel:${selected.phone}`}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-indigo-400 hover:bg-white/[0.04] transition-colors"
                    >
                      <HiOutlinePhone size={14} />
                      <span>{selected.phone}</span>
                    </a>
                  </div>
                </div>

                {selected.message && (
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Message / Requirements</p>
                    <div className="mt-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-white/70 italic text-[11px] leading-relaxed max-h-32 overflow-y-auto">
                      {selected.message}
                    </div>
                  </div>
                )}

                {selected.reviewedBy && (
                  <div className="p-3 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10 text-[10px] text-indigo-400/80 space-y-0.5">
                    <p className="font-bold uppercase tracking-wider text-[8px] text-white/40">Review Information</p>
                    <p>By: {selected.reviewedBy}</p>
                    <p>On: {new Date(selected.reviewedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <hr className="border-white/[0.05]" />

              {/* Review & update form */}
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label htmlFor="update-status" className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1.5">
                    Update Request Status
                  </label>
                  <select
                    id="update-status"
                    value={updateForm.status}
                    onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}
                    className="input-field text-xs bg-[#1a2230]"
                    disabled={updating}
                  >
                    <option value="new">New Request</option>
                    <option value="contacted">Contacted Applicant</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved Request</option>
                    <option value="rejected">Rejected Request</option>
                    <option value="converted">Converted to Client</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="update-notes" className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1.5">
                    Internal Notes / Comments
                  </label>
                  <textarea
                    id="update-notes"
                    value={updateForm.notes}
                    onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
                    placeholder="Enter private review log or applicant comments..."
                    className="input-field text-xs min-h-20"
                    disabled={updating}
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full btn-primary py-2 justify-center text-xs font-bold transition-all disabled:opacity-50"
                >
                  {updating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    'Save Status & Notes'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SubscriptionRequests;
