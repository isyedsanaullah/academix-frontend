import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineCheck, HiOutlineX, HiOutlineClock, HiOutlineShieldCheck, 
  HiOutlineAcademicCap, HiOutlineCash, HiOutlineUserAdd, HiOutlineUserRemove,
  HiOutlineFilter, HiOutlineRefresh
} from 'react-icons/hi';

const typeConfig = {
  student_admission: { icon: HiOutlineAcademicCap, color: '#818cf8', label: 'Student Admission' },
  salary_change: { icon: HiOutlineCash, color: '#fbbf24', label: 'Salary Change' },
  function_fee: { icon: HiOutlineCash, color: '#f97316', label: 'Function Fee' },
  teacher_add: { icon: HiOutlineUserAdd, color: '#4ade80', label: 'Add Teacher' },
  teacher_remove: { icon: HiOutlineUserRemove, color: '#f87171', label: 'Remove Teacher' },
  principal_delete: { icon: HiOutlineShieldCheck, color: '#ef4444', label: 'Delete Principal' },
};

const Approvals = () => {
  const [activeCategory, setActiveCategory] = useState('system'); // 'system' | 'early_exit'
  
  // System Approvals State
  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [systemFilter, setSystemFilter] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');

  // Early Exit Approvals State
  const [exitRequests, setExitRequests] = useState([]);
  const [loadingExit, setLoadingExit] = useState(true);
  const [exitFilter, setExitFilter] = useState('pending');
  const [exitRemarks, setExitRemarks] = useState({});

  useEffect(() => {
    fetchSystemApprovals();
    fetchExitRequests();
  }, [systemFilter, exitFilter]);

  const fetchSystemApprovals = async () => {
    setLoadingSystem(true);
    try {
      const { data } = await api.get('/approvals', { params: { status: systemFilter } });
      setApprovals(data.data || []);
      setStats(data.stats || {});
    } catch { 
      toast.error('Failed to load system approvals'); 
    } finally { 
      setLoadingSystem(false); 
    }
  };

  const fetchExitRequests = async () => {
    setLoadingExit(true);
    try {
      const { data } = await api.get('/gate/early-exit/pending', { params: { status: exitFilter } });
      setExitRequests(data.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingExit(false);
    }
  };

  const approveSystem = async (id) => {
    try {
      await api.put(`/approvals/${id}/approve`);
      toast.success('Approval granted!');
      fetchSystemApprovals();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to approve'); 
    }
  };

  const rejectSystem = async () => {
    if (!rejectId) return;
    try {
      await api.put(`/approvals/${rejectId}/reject`, { reason });
      toast.success('Request rejected');
      setRejectId(null); 
      setReason('');
      fetchSystemApprovals();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to reject'); 
    }
  };

  const handleReviewExit = async (id, status) => {
    try {
      await api.put(`/gate/early-exit/${id}/review`, { 
        status, 
        approvalRemarks: exitRemarks[id] || '' 
      });
      toast.success(`Early exit request ${status}`);
      fetchExitRequests();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to process exit request'); 
    }
  };

  const totalSystemPending = Object.values(stats).reduce((a, b) => a + b, 0);
  const pendingExitCount = exitRequests.filter(r => r.status === 'pending').length;

  const sc = { pending: '#fbbf24', approved: '#4ade80', rejected: '#f87171' };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header & Category Switcher */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HiOutlineShieldCheck className="text-indigo-400" size={28} /> Central Approvals Hub
          </h1>
          <p className="text-xs text-surface-400 mt-1">
            Review and approve administrative actions, financial changes, and gate early exit requests.
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
          <button
            onClick={() => setActiveCategory('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'system'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-md'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            <HiOutlineShieldCheck size={16} /> System Approvals
            {totalSystemPending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {totalSystemPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveCategory('early_exit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'early_exit'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-md'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            <HiOutlineClock size={16} /> Early Exit Approvals
            {pendingExitCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingExitCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Category 1: System Approvals ── */}
      {activeCategory === 'system' && (
        <div className="space-y-6">
          {/* Type Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <div key={key} className="glass-card p-3 flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" 
                  style={{ background: `${cfg.color}15`, color: cfg.color }}
                >
                  <cfg.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-surface-400 uppercase truncate">{cfg.label}</p>
                  <p className="text-base font-extrabold" style={{ color: cfg.color }}>{stats[key] || 0}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Status Buttons */}
          <div className="flex gap-2 border-b border-white/10 pb-3">
            {['pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setSystemFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                  systemFilter === s
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-sm'
                    : 'bg-transparent text-surface-400 border-transparent hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* System Approvals List */}
          {loadingSystem ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="glass-card p-12 text-center text-surface-400 text-sm">
              No {systemFilter} system approvals found.
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map(a => {
                const cfg = typeConfig[a.type] || { icon: HiOutlineClock, color: '#818cf8', label: a.type };
                return (
                  <div key={a._id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" 
                        style={{ background: `${cfg.color}15`, color: cfg.color }}
                      >
                        <cfg.icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{a.title}</h4>
                        <p className="text-xs text-surface-300 mt-0.5">{a.description}</p>
                        <p className="text-[10px] text-surface-400 mt-1">
                          Requested by <span className="text-indigo-400 font-semibold">{a.requestedBy?.name || 'System User'}</span> • {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {a.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => approveSystem(a._id)} 
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1.5"
                        >
                          <HiOutlineCheck size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => setRejectId(a._id)} 
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1.5"
                        >
                          <HiOutlineX size={14} /> Reject
                        </button>
                      </div>
                    )}

                    {a.status !== 'pending' && (
                      <span className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                        a.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {a.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Category 2: Early Exit Approvals ── */}
      {activeCategory === 'early_exit' && (
        <div className="space-y-6">
          {/* Filter Status Buttons */}
          <div className="flex gap-2 border-b border-white/10 pb-3">
            {['pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setExitFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                  exitFilter === s
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-sm'
                    : 'bg-transparent text-surface-400 border-transparent hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Early Exit Requests List */}
          {loadingExit ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : exitRequests.length === 0 ? (
            <div className="glass-card p-12 text-center text-surface-400 text-sm">
              No {exitFilter} early exit requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {exitRequests.map(r => (
                <div key={r._id || r.id} className="glass-card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-white">{r.personName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          r.personType === 'student'
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                            : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                        }`}>
                          {r.personType}
                        </span>
                        {r.qrCode && (
                          <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                            {r.qrCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-surface-300">
                        <strong className="text-white">Reason:</strong> {r.reason}
                      </p>
                      <p className="text-[10px] text-surface-400 mt-1">
                        📅 Exit Date: <span className="text-indigo-300 font-semibold">{new Date(r.exitDate).toLocaleDateString()}</span> {r.exitTime ? `at ${r.exitTime}` : ''} • Requested: {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 self-start sm:self-center ${
                      r.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : r.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.status} {r.used ? '✓ Used at Gate' : ''}
                    </span>
                  </div>

                  {r.status === 'pending' && (
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={exitRemarks[r._id || r.id] || ''}
                        onChange={e => setExitRemarks(p => ({ ...p, [r._id || r.id]: e.target.value }))}
                        placeholder="Add approval / rejection remarks (optional)..."
                        className="input-field text-xs py-1.5 px-3 flex-1"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                          onClick={() => handleReviewExit(r._id || r.id, 'approved')}
                          className="btn-primary text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 border-none flex-1 sm:flex-initial flex items-center justify-center gap-1"
                        >
                          <HiOutlineCheck size={14} /> Approve Exit
                        </button>
                        <button
                          onClick={() => handleReviewExit(r._id || r.id, 'rejected')}
                          className="btn-secondary text-xs py-1.5 px-4 bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 flex-1 sm:flex-initial flex items-center justify-center gap-1"
                        >
                          <HiOutlineX size={14} /> Reject Exit
                        </button>
                      </div>
                    </div>
                  )}

                  {r.approvalRemarks && (
                    <p className="text-[11px] text-surface-400 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      💬 <strong className="text-surface-300">Remarks:</strong> {r.approvalRemarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject System Modal */}
      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal-content max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-rose-400">Specify Rejection Reason</h3>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter reason for rejecting this request..."
              rows={3}
              className="input-field text-xs"
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1 text-xs">
                Cancel
              </button>
              <button onClick={rejectSystem} className="btn-primary flex-1 text-xs bg-rose-600 hover:bg-rose-500 border-none">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
