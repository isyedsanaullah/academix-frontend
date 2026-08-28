import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft, HiOutlinePencil, HiOutlineBan, HiOutlineCheckCircle,
  HiOutlineOfficeBuilding, HiOutlineAcademicCap, HiOutlineUserGroup,
  HiOutlineCurrencyDollar, HiOutlineCalendar, HiOutlineMail, HiOutlinePhone,
  HiOutlineLocationMarker, HiOutlineGlobe, HiOutlineKey, HiOutlineTrash,
  HiOutlineRefresh, HiOutlineSave, HiOutlineX, HiOutlineCheck
} from 'react-icons/hi';

const planColors = {
  basic:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
  standard: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  premium:  'bg-violet-500/15 text-violet-400 border-violet-500/30',
};
const statusColors = {
  active:    'bg-emerald-500/15 text-emerald-400',
  suspended: 'bg-red-500/15 text-red-400',
  expired:   'bg-amber-500/15 text-amber-400',
};

const CollegeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { fetchCollege(); }, [id]);

  const fetchCollege = async () => {
    try {
      const { data } = await api.get(`/super-admin/colleges/${id}`);
      setCollege(data.data);
    } catch { toast.error('Failed to load college'); }
    finally { setLoading(false); }
  };

  const handleStartInlineEdit = (key, val) => {
    setEditingField(key);
    if (key === 'sub_expiresAt') {
      if (val) {
        setEditValue(new Date(val).toISOString().split('T')[0]);
      } else {
        setEditValue('');
      }
    } else {
      setEditValue(val || '');
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveInlineEdit = async (key) => {
    try {
      if (key.startsWith('sub_')) {
        const subKey = key.replace('sub_', '');
        if (subKey === 'plan') {
          await api.put(`/super-admin/colleges/${id}/plan`, { plan: editValue });
        } else if (subKey === 'status') {
          await api.put(`/super-admin/colleges/${id}/status`, { status: editValue });
        } else if (subKey === 'expiresAt') {
          const updatedSub = {
            ...(typeof college.subscription === 'object' ? college.subscription : {}),
            expiresAt: editValue || null
          };
          await api.put(`/super-admin/colleges/${id}`, { subscription: updatedSub });
        }
      } else {
        await api.put(`/super-admin/colleges/${id}`, { [key]: editValue });
      }
      toast.success('Updated successfully');
      setEditingField(null);
      fetchCollege();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update field');
    }
  };

  const toggleStatus = async () => {
    const newStatus = college.subscription?.status === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/super-admin/colleges/${id}/status`, { status: newStatus });
      toast.success(`College ${newStatus}`);
      fetchCollege();
    } catch { toast.error('Failed to update status'); }
  };

  const changePlan = async (newPlan) => {
    if (newPlan === college.subscription?.plan) return;
    try {
      const { data } = await api.put(`/super-admin/colleges/${id}/plan`, { plan: newPlan });
      toast.success(data.message || 'Plan updated!');
      fetchCollege();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change plan'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!college) return (
    <div className="text-center py-24 text-white/30">College not found</div>
  );

  const c = college;
  const stats = c.stats || {};
  const isActive = c.subscription?.status === 'active';

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={() => navigate('/super-admin/colleges')}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.07] transition shrink-0">
          <HiOutlineArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-lg shrink-0">
              {c.code?.slice(0, 2) || 'C'}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">{c.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-mono text-xs text-indigo-400">{c.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${planColors[c.subscription?.plan] || ''}`}>{c.subscription?.plan}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[c.subscription?.status] || 'bg-white/10 text-white/40'}`}>{c.subscription?.status}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={toggleStatus}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition
              ${isActive ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
            {isActive ? <HiOutlineBan size={15}/> : <HiOutlineCheckCircle size={15}/>}
            {isActive ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Students', value: stats.totalStudents ?? '—', icon: HiOutlineAcademicCap, color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Staff Members',  value: stats.totalStaff    ?? '—', icon: HiOutlineUserGroup,   color: '#4ade80', bg: 'rgba(34,197,94,0.10)' },
          { label: 'Fee Collected',  value: stats.totalFeeCollected != null ? `Rs. ${stats.totalFeeCollected.toLocaleString()}` : '—', icon: HiOutlineCurrencyDollar, color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#0d1117] border border-white/[0.06]">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-extrabold text-white mt-1">{s.value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* College Info */}
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5 space-y-4">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider">College Information</p>
          {[
            { key: 'name',    label: 'College Name', icon: HiOutlineOfficeBuilding, type: 'text', required: true },
            { key: 'code',    label: 'College Code', icon: HiOutlineKey,            type: 'text', required: true },
            { key: 'email',   label: 'Email',        icon: HiOutlineMail,           type: 'email' },
            { key: 'phone',   label: 'Phone',        icon: HiOutlinePhone,          type: 'text' },
            { key: 'city',    label: 'City',         icon: HiOutlineLocationMarker, type: 'text' },
            { key: 'address', label: 'Address',      icon: HiOutlineOfficeBuilding, type: 'text' },
            { key: 'website', label: 'Website',      icon: HiOutlineGlobe,          type: 'text' },
          ].map((field) => {
            const isEditing = editingField === field.key;
            const rawValue = college[field.key];

            return (
              <div key={field.key} className="group relative p-2.5 rounded-xl transition-all hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04]">
                <div className="flex items-start gap-3">
                  <field.icon size={15} className="text-white/20 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/25 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      {field.label}
                      {!isEditing && (
                        <button
                          onClick={() => handleStartInlineEdit(field.key, rawValue)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300 animate-fade-in"
                          title={`Edit ${field.label}`}
                        >
                          <HiOutlinePencil size={11} className="inline-block" />
                        </button>
                      )}
                    </p>

                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 mt-1.5 w-full">
                        <input
                          type={field.type || 'text'}
                          value={editValue}
                          onChange={e => setEditValue(field.key === 'code' ? e.target.value.toUpperCase() : e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 animate-fade-in"
                          required={field.required}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveInlineEdit(field.key)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition border border-emerald-500/20 shrink-0"
                            title="Save"
                          >
                            <HiOutlineCheck size={13} />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelInlineEdit}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/20 shrink-0"
                            title="Cancel"
                          >
                            <HiOutlineX size={13} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/70 mt-0.5 truncate font-medium">
                        {rawValue || <span className="text-white/20 italic">Not set</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscription Info */}
        <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] p-5 space-y-4">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Subscription</p>
          {[
            {
              key: 'sub_plan',
              label: 'Plan',
              value: college.subscription?.plan,
              type: 'select',
              options: [
                { value: 'basic', label: 'Basic' },
                { value: 'standard', label: 'Standard' },
                { value: 'premium', label: 'Premium AI' }
              ],
              renderDisplay: (val) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${planColors[val] || ''}`}>
                  {val}
                </span>
              )
            },
            {
              key: 'sub_status',
              label: 'Status',
              value: college.subscription?.status,
              type: 'select',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'expired', label: 'Expired' }
              ],
              renderDisplay: (val) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[val] || 'bg-white/10 text-white/40'}`}>
                  {val}
                </span>
              )
            },
            {
              key: 'sub_expiresAt',
              label: 'Expires At',
              value: college.subscription?.expiresAt,
              type: 'date',
              renderDisplay: (val) => val
                ? new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Not set'
            }
          ].map((field) => {
            const isEditing = editingField === field.key;
            const rawValue = field.value;

            return (
              <div key={field.key} className="group relative p-2.5 rounded-xl transition-all hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      {field.label}
                      {!isEditing && (
                        <button
                          onClick={() => handleStartInlineEdit(field.key, rawValue)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300"
                          title={`Edit ${field.label}`}
                        >
                          <HiOutlinePencil size={11} className="inline-block" />
                        </button>
                      )}
                    </p>
                    {!isEditing && (
                      <div className="mt-1">
                        {field.renderDisplay ? field.renderDisplay(rawValue) : <span className="text-sm text-white/70">{rawValue}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex flex-col gap-1.5 mt-2 w-full">
                    {field.type === 'select' ? (
                      <select
                         value={editValue}
                         onChange={e => setEditValue(e.target.value)}
                         className="w-full bg-slate-900 border border-white/10 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 animate-fade-in"
                         autoFocus
                      >
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg text-sm text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 animate-fade-in"
                        autoFocus
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveInlineEdit(field.key)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition border border-emerald-500/20 shrink-0"
                        title="Save"
                      >
                        <HiOutlineCheck size={13} />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelInlineEdit}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/20 shrink-0"
                        title="Cancel"
                      >
                        <HiOutlineX size={13} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-3 border-t border-white/[0.05] px-2.5">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1 font-semibold">Registered</p>
            <p className="text-sm text-white/60">
              {new Date(college.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Plan Change */}
          <div className="pt-3 border-t border-white/[0.05] px-2.5">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2 font-semibold">Change Plan</p>
            <div className="flex gap-2">
              {['basic', 'standard', 'premium'].map(p => (
                <button key={p} onClick={() => changePlan(p)}
                  className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold capitalize transition border ${
                    college.subscription?.plan === p
                      ? planColors[p] + ' cursor-default'
                      : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60 bg-white/[0.02]'
                  }`}>
                  {p === 'premium' ? 'Premium AI' : p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDetail;
