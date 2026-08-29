import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineMail,
  HiOutlineRefresh,
  HiOutlineBan,
  HiOutlineClipboardCopy,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlineFilter,
  HiOutlineSparkles,
  HiOutlineExclamationCircle,
  HiOutlineAcademicCap,
  HiOutlineCheck
} from 'react-icons/hi';

// Dynamic Badge Styling Helpers for Light & Dark Themes
const getPlanBadgeClass = (planId) => {
  const p = (planId || '').toLowerCase();
  switch (p) {
    case 'basic':
      return 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/20';
    case 'standard':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    case 'premium':
      return 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20';
    case 'enterprise':
      return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
    default:
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
  }
};

const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'active':
    case 'accepted':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    case 'pending':
    case 'trial':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    case 'suspended':
    case 'cancelled':
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
    case 'expired':
      return 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
    default:
      return 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
  }
};

const formatPlanLabel = (planId) => {
  if (!planId) return 'Basic Plan';
  return planId.charAt(0).toUpperCase() + planId.slice(1) + (planId.toLowerCase().includes('plan') ? '' : ' Plan');
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

  const [availablePlans, setAvailablePlans] = useState([
    { id: 'basic', name: 'Basic Plan' },
    { id: 'standard', name: 'Standard Plan' },
    { id: 'premium', name: 'Premium Plan' },
    { id: 'enterprise', name: 'Enterprise Plan' }
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', planId: 'basic' });
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchColleges();
    fetchInvitations();
    fetchDynamicPlans();
  }, []);

  const fetchDynamicPlans = async () => {
    try {
      const { data } = await api.get('/super-admin/subscriptions');
      if (data.data?.planDistribution) {
        const planKeys = Object.keys(data.data.planDistribution);
        if (planKeys.length > 0) {
          const formatted = planKeys.map(key => ({
            id: key,
            name: formatPlanLabel(key)
          }));
          setAvailablePlans(prev => {
            const combinedMap = new Map();
            [...prev, ...formatted].forEach(p => combinedMap.set(p.id, p));
            return Array.from(combinedMap.values());
          });
        }
      }
    } catch {
      // Fallback to static base set if API is not available
    }
  };

  const fetchColleges = async () => {
    try {
      const { data } = await api.get('/super-admin/colleges');
      const loadedColleges = data.data || [];
      setColleges(loadedColleges);

      // Extract any unique plans present in existing colleges dynamically
      const uniqueCollegePlans = Array.from(
        new Set(loadedColleges.map(c => c.subscription?.plan).filter(Boolean))
      );
      if (uniqueCollegePlans.length > 0) {
        setAvailablePlans(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          uniqueCollegePlans.forEach(planId => {
            if (!map.has(planId)) {
              map.set(planId, { id: planId, name: formatPlanLabel(planId) });
            }
          });
          return Array.from(map.values());
        });
      }
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
      const loadedInvites = data.data || [];
      setInvitations(loadedInvites);

      // Extract unique plans from invitations dynamically
      const uniqueInvitePlans = Array.from(
        new Set(loadedInvites.map(i => i.planId).filter(Boolean))
      );
      if (uniqueInvitePlans.length > 0) {
        setAvailablePlans(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          uniqueInvitePlans.forEach(planId => {
            if (!map.has(planId)) {
              map.set(planId, { id: planId, name: formatPlanLabel(planId) });
            }
          });
          return Array.from(map.values());
        });
      }
    } catch {
      // Quiet fallback
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email) return toast.error('Please enter official email address');

    setSubmittingInvite(true);
    setCopied(false);
    try {
      const { data } = await api.post('/super-admin/invitations', inviteForm);
      toast.success(data.message || 'Invitation sent successfully!');
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
      await api.post(`/super-admin/invitations/${id}/resend`);
      toast.success('Invitation resent with fresh 48h token!');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvite = async (id) => {
    try {
      await api.delete(`/super-admin/invitations/${id}`);
      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const filteredColleges = useMemo(() => {
    return colleges.filter(c => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.name?.toLowerCase().includes(query) ||
        c.code?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.city?.toLowerCase().includes(query);
      const matchesPlan = !planFilter || c.subscription?.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [colleges, search, planFilter]);

  const activeCollegesCount = useMemo(() => {
    return colleges.filter(c => c.subscription?.status === 'active').length;
  }, [colleges]);

  const suspendedCollegesCount = useMemo(() => {
    return colleges.filter(c => c.subscription?.status === 'suspended').length;
  }, [colleges]);

  const pendingInvitesCount = useMemo(() => {
    return invitations.filter(i => i.status === 'pending').length;
  }, [invitations]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0d1117] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold shrink-0">
              <HiOutlineOfficeBuilding size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                College Management Directory
              </h1>
              <p className="text-slate-500 dark:text-white/40 text-xs sm:text-sm mt-0.5">
                Invite new institutions and manage active college workspaces
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setCreatedInviteUrl('');
            setInviteForm({ email: '', planId: availablePlans[0]?.id || 'basic' });
            setShowInviteModal(true);
          }}
          className="btn-primary self-start sm:self-center shadow-lg shadow-indigo-500/25"
        >
          <HiOutlineMail size={18} className="shrink-0" />
          <span>Invite College</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Total Colleges
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {colleges.length}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">Registered institutions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/15 shrink-0">
            <HiOutlineOfficeBuilding size={24} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Active Status
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {activeCollegesCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">Operating workspaces</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/15 shrink-0">
            <HiOutlineCheckCircle size={24} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Suspended
            </p>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {suspendedCollegesCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">Inactive or restricted</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/15 shrink-0">
            <HiOutlineBan size={24} />
          </div>
        </div>
      </div>

      {/* Visually Polished Navigation Tabs (Only Two Tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3">
        <button
          onClick={() => setTab('colleges')}
          className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            tab === 'colleges'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <HiOutlineOfficeBuilding size={16} className="shrink-0" />
          <span>Active Colleges</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              tab === 'colleges'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/70'
            }`}
          >
            {colleges.length}
          </span>
        </button>

        <button
          onClick={() => setTab('invitations')}
          className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            tab === 'invitations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <HiOutlineMail size={16} className="shrink-0" />
          <span>College Invitations</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              tab === 'invitations'
                ? 'bg-white/20 text-white'
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            {pendingInvitesCount} Pending
          </span>
        </button>
      </div>

      {/* TAB 1: Active Colleges */}
      {tab === 'colleges' && (
        <div className="space-y-4">
          {/* Search & Dynamic Filter Bar */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-lg">
              <HiOutlineSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 pr-9"
                placeholder="Search colleges by name, code, city, or email..."
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/80 transition"
                  title="Clear search"
                >
                  <HiOutlineX size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" size={16} />
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  className="input-field pl-9 capitalize text-xs font-semibold"
                >
                  <option value="">All Subscription Plans</option>
                  {availablePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {(search || planFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPlanFilter('');
                  }}
                  className="btn-secondary py-2.5 px-3 text-xs shrink-0"
                  title="Reset filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Active Colleges Data Table */}
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
                <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium">Loading colleges database...</p>
              </div>
            ) : filteredColleges.length === 0 ? (
              <div className="text-center py-16 px-4">
                <HiOutlineOfficeBuilding size={40} className="mx-auto text-slate-300 dark:text-white/15 mb-3" />
                <p className="font-bold text-slate-800 dark:text-white/80 text-base">No colleges match your filter</p>
                <p className="text-xs text-slate-500 dark:text-white/40 mt-1 max-w-sm mx-auto">
                  Try broadening your search term or clearing the plan filter option.
                </p>
                {(search || planFilter) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setPlanFilter('');
                    }}
                    className="btn-secondary text-xs mt-4"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="pl-5">College Info</th>
                      <th>Code</th>
                      <th>Subscription Plan</th>
                      <th>Onboarding</th>
                      <th>Status</th>
                      <th>City</th>
                      <th className="pr-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredColleges.map(c => (
                      <tr
                        key={c._id}
                        className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition"
                        onClick={() => navigate(`/super-admin/colleges/${c._id}`)}
                      >
                        <td className="pl-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xs shrink-0 shadow-sm">
                              {c.code?.slice(0, 2)?.toUpperCase() || 'CO'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-white/40 truncate">
                                {c.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide inline-block">
                            {c.code}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${getPlanBadgeClass(
                              c.subscription?.plan
                            )}`}
                          >
                            {formatPlanLabel(c.subscription?.plan)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${
                              c.onboardingStatus === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            }`}
                          >
                            {c.onboardingStatus === 'completed' ? (
                              <HiOutlineCheckCircle size={13} />
                            ) : (
                              <HiOutlineClock size={13} />
                            )}
                            {c.onboardingStatus || 'completed'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${getStatusBadgeClass(
                              c.subscription?.status
                            )}`}
                          >
                            {c.subscription?.status || 'active'}
                          </span>
                        </td>

                        <td className="text-slate-600 dark:text-white/60 text-xs font-medium">
                          {c.city || '—'}
                        </td>

                        <td className="pr-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/super-admin/colleges/${c._id}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:text-white/30 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                            title="View college details"
                          >
                            <HiOutlineChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: College Invitations */}
      {tab === 'invitations' && (
        <div className="glass-card overflow-hidden">
          {invitesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
              <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium">Loading invitation queue...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <HiOutlineMail size={24} />
              </div>
              <p className="font-bold text-slate-800 dark:text-white/80 text-base">No invitations sent yet</p>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-1 max-w-sm mx-auto">
                Click "Invite College" above to generate single-use onboarding invitations for new institutions.
              </p>
              <button
                onClick={() => {
                  setCreatedInviteUrl('');
                  setInviteForm({ email: '', planId: availablePlans[0]?.id || 'basic' });
                  setShowInviteModal(true);
                }}
                className="btn-primary text-xs mt-4 inline-flex items-center gap-1.5"
              >
                <HiOutlinePlus size={16} /> Send First Invitation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="pl-5">Official Email</th>
                    <th>Selected Plan</th>
                    <th>Status</th>
                    <th>Expires At</th>
                    <th className="pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition">
                      <td className="pl-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <HiOutlineMail size={16} />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {inv.email}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${getPlanBadgeClass(
                            inv.planId
                          )}`}
                        >
                          {formatPlanLabel(inv.planId)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${getStatusBadgeClass(
                            inv.status
                          )}`}
                        >
                          {inv.status === 'accepted' && <HiOutlineCheckCircle size={13} />}
                          {inv.status === 'pending' && <HiOutlineClock size={13} />}
                          {inv.status === 'expired' && <HiOutlineExclamationCircle size={13} />}
                          {inv.status === 'cancelled' && <HiOutlineBan size={13} />}
                          {inv.status}
                        </span>
                      </td>

                      <td className="text-slate-500 dark:text-white/50 text-xs font-mono">
                        {inv.expiresAt
                          ? new Date(inv.expiresAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>

                      <td className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleResend(inv._id)}
                                className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                                title="Resend invitation with fresh 48h token"
                              >
                                <HiOutlineRefresh size={14} />
                                <span>Resend</span>
                              </button>
                              <button
                                onClick={() => handleCancelInvite(inv._id)}
                                className="btn-danger py-1 px-2.5 text-xs inline-flex items-center gap-1"
                                title="Cancel invitation"
                              >
                                <HiOutlineBan size={14} />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}

                          {inv.status === 'expired' && (
                            <button
                              onClick={() => handleResend(inv._id)}
                              className="btn-primary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                            >
                              <HiOutlineRefresh size={14} />
                              <span>Re-issue Invite</span>
                            </button>
                          )}

                          {inv.status === 'accepted' && (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1">
                              <HiOutlineCheckCircle size={15} /> Joined Platform
                            </span>
                          )}

                          {inv.status === 'cancelled' && (
                            <span className="text-slate-400 dark:text-white/20 text-xs font-medium">
                              Cancelled
                            </span>
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
          <div className="modal-content relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition p-1 rounded-lg"
              title="Close modal"
            >
              <HiOutlineX size={20} />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <HiOutlineMail size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Invite College to Academix
                </h2>
                <p className="text-slate-500 dark:text-white/40 text-xs">
                  Generate a secure single-use token for institution self-onboarding
                </p>
              </div>
            </div>

            {!createdInviteUrl ? (
              <form onSubmit={handleSendInvite} className="space-y-4 mt-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider mb-1.5">
                    Official College Email *
                  </label>
                  <div className="relative">
                    <HiOutlineMail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none"
                      size={18}
                    />
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="input-field pl-10"
                      placeholder="e.g. principal@punjabcollege.edu.pk"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-white/30 mt-1">
                    An invitation token valid for 48 hours will be generated for this official address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider mb-1.5">
                    Initial Subscription Plan *
                  </label>
                  <div className="relative">
                    <HiOutlineSparkles
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none"
                      size={18}
                    />
                    <select
                      value={inviteForm.planId}
                      onChange={e => setInviteForm({ ...inviteForm, planId: e.target.value })}
                      className="input-field pl-10 capitalize text-sm font-medium"
                    >
                      {availablePlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.06] border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed flex items-start gap-2.5">
                  <span className="shrink-0 text-base">🔒</span>
                  <span>
                    The College Administrator will securely set up their own account password and complete college details during onboarding.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="btn-primary flex-1 justify-center py-2.5 text-sm"
                  >
                    {submittingInvite ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating Token...
                      </span>
                    ) : (
                      'Send Secure Invitation'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="btn-secondary py-2.5 px-4 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 mt-5">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/20 text-center">
                  <HiOutlineCheckCircle size={36} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                    Invitation Link Ready!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-white/60 mt-1">
                    Token valid for 48 hours generated for <strong>{inviteForm.email}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider mb-1.5">
                    Single-Use Invitation URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={createdInviteUrl}
                      className="input-field text-xs font-mono select-all flex-1 py-2"
                    />
                    <button
                      onClick={() => copyToClipboard(createdInviteUrl)}
                      className={`btn-primary py-2 px-3 text-xs shrink-0 inline-flex items-center gap-1.5 transition ${
                        copied ? 'bg-emerald-600 text-white' : ''
                      }`}
                    >
                      {copied ? <HiOutlineCheck size={16} /> : <HiOutlineClipboardCopy size={16} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary w-full justify-center py-2.5 text-sm mt-2"
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
