import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlineSearch, HiOutlineMail,
  HiOutlineRefresh, HiOutlineBan, HiOutlineClipboardCopy,
  HiOutlineCheckCircle, HiOutlineClock
} from 'react-icons/hi';

const planBadge = {
  basic:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  standard: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  premium:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  enterprise:'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const statusBadge = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const Colleges = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('colleges'); // 'colleges' | 'invitations'
  const [colleges, setColleges] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', planId: 'basic' });
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState('');

  useEffect(() => {
    fetchColleges();
    fetchInvitations();
  }, []);

  const fetchColleges = async () => {
    try {
      const { data } = await api.get('/super-admin/colleges');
      setColleges(data.data || []);
    } catch {
      toast.error('Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setInvitesLoading(true);
    try {
      const { data } = await api.get('/super-admin/invitations');
      setInvitations(data.data || []);
    } catch {
      // quiet fallback
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email) return toast.error('Please enter official email address');

    setSubmittingInvite(true);
    try {
      const { data } = await api.post('/super-admin/invitations', inviteForm);
      toast.success(data.message || 'Invitation sent!');
      setCreatedInviteUrl(data.data?.inviteUrl || '');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleResend = async (id) => {
    try {
      const { data } = await api.post(`/super-admin/invitations/${id}/resend`);
      toast.success('Invitation resent with fresh 48h token!');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    }
  };

  const handleCancelInvite = async (id) => {
    try {
      await api.delete(`/super-admin/invitations/${id}`);
      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Invitation link copied to clipboard!');
  };

  const filteredColleges = colleges.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = !planFilter || c.subscription?.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">College Platform Directory</h1>
          <p className="text-white/30 text-sm mt-1">Invite new institutions and manage active college workspaces</p>
        </div>
        <button
          onClick={() => {
            setCreatedInviteUrl('');
            setInviteForm({ email: '', planId: 'basic' });
            setShowInviteModal(true);
          }}
          className="btn-primary"
        >
          <HiOutlineMail size={18} /> Invite College
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-3">
        <button
          onClick={() => setTab('colleges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'colleges'
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
          }`}
        >
          Active Colleges ({colleges.length})
        </button>
        <button
          onClick={() => setTab('invitations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'invitations'
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
          }`}
        >
          College Invitations ({invitations.filter(i => i.status === 'pending').length} Pending)
        </button>
      </div>

      {tab === 'colleges' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Colleges', value: colleges.length, color: 'text-white' },
              { label: 'Active Status', value: colleges.filter(c => c.subscription?.status === 'active').length, color: 'text-emerald-400' },
              { label: 'Suspended', value: colleges.filter(c => c.subscription?.status === 'suspended').length, color: 'text-red-400' },
            ].map((s, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-white/30 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search & Plan Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={17} />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" placeholder="Search colleges by name, code or email..." />
            </div>
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
              <option value="">All Plans</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredColleges.length === 0 ? (
              <div className="text-center py-12 text-white/30"><p>No colleges found matching criteria</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>College</th><th>Code</th><th>Plan</th><th>Onboarding</th><th>Status</th><th>City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredColleges.map(c => (
                      <tr key={c._id} className="cursor-pointer" onClick={() => navigate(`/super-admin/colleges/${c._id}`)}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs border border-indigo-500/20 shrink-0">
                              {c.code?.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-white/80">{c.name}</p>
                              <p className="text-[10px] text-white/30">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="font-mono text-indigo-400 text-xs font-bold">{c.code}</span></td>
                        <td>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${planBadge[c.subscription?.plan] || 'bg-white/5 text-white/30'}`}>
                            {c.subscription?.plan}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            c.onboardingStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {c.onboardingStatus || 'completed'}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.subscription?.status === 'active'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            c.subscription?.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {c.subscription?.status || 'active'}
                          </span>
                        </td>
                        <td className="text-white/40 text-sm">{c.city || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'invitations' && (
        <div className="glass-card overflow-hidden">
          {invitesLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <HiOutlineMail size={32} className="mx-auto mb-2 opacity-40 text-indigo-400" />
              <p className="font-semibold text-white/60">No invitations sent yet</p>
              <p className="text-xs text-white/30 mt-1">Click "Invite College" above to invite an institution</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Official Email</th><th>Plan</th><th>Status</th><th>Expires At</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv._id}>
                      <td className="font-medium text-white/80">{inv.email}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${planBadge[inv.planId] || 'bg-white/5 text-white/40'}`}>
                          {inv.planId}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusBadge[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-white/40 text-xs font-mono">
                        {new Date(inv.expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {inv.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleResend(inv._id)}
                                className="btn-secondary py-1 px-2.5 text-[11px]"
                                title="Resend invitation with fresh token"
                              >
                                <HiOutlineRefresh size={13} /> Resend
                              </button>
                              <button
                                onClick={() => handleCancelInvite(inv._id)}
                                className="btn-danger py-1 px-2.5 text-[11px]"
                                title="Cancel invitation"
                              >
                                <HiOutlineBan size={13} /> Cancel
                              </button>
                            </>
                          )}
                          {inv.status === 'expired' && (
                            <button
                              onClick={() => handleResend(inv._id)}
                              className="btn-primary py-1 px-2.5 text-[11px]"
                            >
                              <HiOutlineRefresh size={13} /> Re-issue Invite
                            </button>
                          )}
                          {inv.status === 'accepted' && (
                            <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                              <HiOutlineCheckCircle size={14} /> Accepted
                            </span>
                          )}
                          {inv.status === 'cancelled' && (
                            <span className="text-white/20 text-xs font-medium">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invite College Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <HiOutlineMail size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Invite College to Academix</h2>
                <p className="text-white/30 text-xs">Send a secure single-use onboarding invitation</p>
              </div>
            </div>

            {!createdInviteUrl ? (
              <form onSubmit={handleSendInvite} className="space-y-4 mt-5">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                    Official College Email *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="input-field"
                    placeholder="e.g. principal@punjabcollege.edu.pk"
                    required
                  />
                  <p className="text-[10px] text-white/30 mt-1">
                    An invitation token link will be generated for this official address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                    Subscription Plan *
                  </label>
                  <select
                    value={inviteForm.planId}
                    onChange={e => setInviteForm({ ...inviteForm, planId: e.target.value })}
                    className="input-field"
                  >
                    <option value="basic">Basic Plan</option>
                    <option value="standard">Standard Plan</option>
                    <option value="premium">Premium AI Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/[0.12] text-xs text-indigo-300/80 leading-relaxed">
                  🔒 The College Admin will securely set their own password and complete their profile during self-onboarding.
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submittingInvite} className="btn-primary flex-1 justify-center py-2.5">
                    {submittingInvite ? 'Generating Token...' : 'Send Secure Invitation'}
                  </button>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary py-2.5">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 mt-5">
                <div className="p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-center">
                  <HiOutlineCheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-emerald-400">Invitation Generated!</h3>
                  <p className="text-xs text-white/50 mt-1">
                    An invitation token valid for 48 hours was created for <strong>{inviteForm.email}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
                    Invitation URL (Single-Use Token)
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={createdInviteUrl}
                      className="input-field text-xs font-mono select-all flex-1"
                    />
                    <button
                      onClick={() => copyToClipboard(createdInviteUrl)}
                      className="btn-primary py-2 px-3 text-xs flex-shrink-0"
                    >
                      <HiOutlineClipboardCopy size={16} /> Copy
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary w-full justify-center py-2.5 mt-2"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Colleges;
