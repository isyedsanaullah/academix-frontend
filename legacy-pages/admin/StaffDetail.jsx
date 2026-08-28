import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineArrowLeft, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineCheck, 
  HiOutlineX, 
  HiOutlineKey, 
  HiOutlineBan, 
  HiOutlineCheckCircle 
} from 'react-icons/hi';

const roleColors = {
  admin:      'bg-violet-500/10 text-violet-400 border-violet-500/20',
  registrar:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  accountant: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  principal:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
  teacher:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  employee:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  student:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Only admin has write/modify permissions
  const isReadOnly = currentUser?.role !== 'admin';

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allSubjects, setAllSubjects] = useState([]);

  // Inline editing state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/users/${id}`);
      setStaff(data.data);
    } catch {
      toast.error('Failed to load staff account details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setAllSubjects(data.data || []);
    } catch {
      // Muted error
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [id]);

  useEffect(() => {
    if (staff && staff.role === 'teacher') {
      fetchSubjects();
    }
  }, [staff?.role]);

  const handleSubjectToggleInEdit = (subId) => {
    setEditValue(prev => {
      const currentArr = Array.isArray(prev) ? prev : [];
      return currentArr.includes(subId)
        ? currentArr.filter(id => id !== subId)
        : [...currentArr, subId];
    });
  };

  const handleStartInlineEdit = (key, val) => {
    setEditingField(key);
    setEditValue(val !== undefined && val !== null ? val : '');
  };

  const handleCancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveInlineEdit = async (key) => {
    try {
      // Validate email format if email is modified
      if (key === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editValue)) {
          return toast.error('Please enter a valid email address');
        }
      }

      await api.put(`/users/${id}`, { [key]: editValue });
      toast.success('Updated successfully');
      setEditingField(null);
      setEditValue('');
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update field');
    }
  };

  const toggleStatus = async () => {
    try {
      await api.put(`/users/${id}/toggle`);
      const newStatus = !staff.isActive;
      toast.success(newStatus ? 'Account activated' : 'Account deactivated');
      setStaff({ ...staff, isActive: newStatus });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }
    setResetting(true);
    try {
      await api.put(`/users/${id}/reset-password`, { password: newPassword });
      toast.success('Password updated successfully');
      setShowResetModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this staff account? This will suspend the user account.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Staff account suspended successfully');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove account');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 text-base font-semibold">Staff account not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  // Base profile fields visible to all
  const personalFields = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'phone', label: 'Phone Number', type: 'text' },
    { key: 'cnic', label: 'CNIC', type: 'text' },
  ];

  // Role-specific fields dynamically shown
  const professionalFields = [];
  if (staff.role === 'teacher') {
    professionalFields.push(
      { key: 'qualification', label: 'Qualification', type: 'text' },
      { key: 'specialization', label: 'Specialization', type: 'text' },
      { key: 'subjects', label: 'Subjects Taught', type: 'subjects' },
      { key: 'salary', label: 'Salary (PKR)', type: 'number' }
    );
  } else if (staff.role === 'employee') {
    professionalFields.push(
      { 
        key: 'department', 
        label: 'Department', 
        type: 'select', 
        options: ['security', 'canteen', 'administration', 'accounts', 'library', 'lab', 'other'] 
      },
      { key: 'designation', label: 'Designation', type: 'text' },
      { key: 'salary', label: 'Salary (PKR)', type: 'number' }
    );
  }

  const getDisplayValue = (field, val) => {
    if (val === undefined || val === null || val === '') return '—';
    if (field.key === 'salary') return `PKR ${Number(val).toLocaleString()}`;
    return String(val);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back & Actions header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button 
          onClick={() => navigate(`/${currentUser?.role || 'admin'}/staff`)} 
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-semibold"
        >
          <HiOutlineArrowLeft size={16} /> Back to Directory
        </button>

        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={toggleStatus} 
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition border shadow-sm ${
                staff.isActive 
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' 
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {staff.isActive ? (
                <>
                  <HiOutlineBan size={14} /> Deactivate Account
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle size={14} /> Activate Account
                </>
              )}
            </button>
            <button 
              onClick={() => setShowResetModal(true)} 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl transition border border-indigo-500/20 shadow-sm"
            >
              <HiOutlineKey size={14} /> Reset Password
            </button>
            <button 
              onClick={handleDelete} 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition border border-red-500/20 shadow-sm"
            >
              <HiOutlineTrash size={14} /> Delete Profile
            </button>
          </div>
        )}
      </div>

      {/* Header Profile Summary */}
      <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-3xl font-extrabold shadow-md shrink-0 select-none">
            {staff?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 space-y-2.5">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">{staff.name}</h1>
              <p className="text-white/40 text-xs font-medium mt-0.5">{staff.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${roleColors[staff.role] || ''}`}>
                {staff.role}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${
                staff.isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {staff.isActive ? 'Active' : 'Deactivated'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Forms / Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Personal Information</h3>
          <div className="space-y-4">
            {personalFields.map(field => {
              const isEditing = editingField === field.key;
              const rawValue = staff[field.key];

              return (
                <div 
                  key={field.key} 
                  className="group relative p-3 rounded-xl transition-all duration-150 hover:bg-white/[0.015] border border-transparent hover:border-white/[0.04]"
                >
                  <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    {field.label}
                    {!isReadOnly && !isEditing && (
                      <button
                        onClick={() => handleStartInlineEdit(field.key, rawValue)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300 ml-1"
                        title={`Edit ${field.label}`}
                      >
                        <HiOutlinePencil size={12} />
                      </button>
                    )}
                  </p>

                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2 w-full">
                      <input
                        type={field.type}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                        autoFocus
                        required={field.required}
                      />
                      <button 
                        onClick={() => handleSaveInlineEdit(field.key)} 
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/10"
                        title="Save changes"
                      >
                        <HiOutlineCheck size={14} />
                      </button>
                      <button 
                        onClick={handleCancelInlineEdit} 
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-all border border-white/5"
                        title="Cancel"
                      >
                        <HiOutlineX size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-white/80 font-semibold text-sm mt-1">
                      {getDisplayValue(field, rawValue)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Professional Details (dynamically renders if Teacher/Employee) */}
        {professionalFields.length > 0 && (
          <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Job & Professional Details</h3>
            <div className="space-y-4">
              {professionalFields.map(field => {
                const isEditing = editingField === field.key;
                const rawValue = staff[field.key];

                return (
                  <div 
                    key={field.key} 
                    className="group relative p-3 rounded-xl transition-all duration-150 hover:bg-white/[0.015] border border-transparent hover:border-white/[0.04]"
                  >
                    <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      {field.label}
                      {!isReadOnly && !isEditing && (
                        <button
                          onClick={() => {
                            if (field.type === 'subjects') {
                              const ids = (rawValue || []).map(s => s._id || s);
                              handleStartInlineEdit(field.key, ids);
                            } else {
                              handleStartInlineEdit(field.key, rawValue);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300 ml-1"
                          title={`Edit ${field.label}`}
                        >
                          <HiOutlinePencil size={12} />
                        </button>
                      )}
                    </p>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-2 w-full">
                        {field.type === 'subjects' ? (
                          <div className="w-full space-y-4">
                            <div className="max-h-60 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                              {Object.keys(
                                allSubjects.reduce((acc, sub) => {
                                  const groupName = sub.group || 'General';
                                  if (!acc[groupName]) acc[groupName] = [];
                                  acc[groupName].push(sub);
                                  return acc;
                                }, {})
                              ).map(groupName => {
                                const groupSubs = allSubjects.filter(s => (s.group || 'General') === groupName);
                                return (
                                  <div key={groupName} className="space-y-1.5">
                                    <h4 className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest pl-1">
                                      {groupName}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {groupSubs.map(sub => {
                                        const isSelected = Array.isArray(editValue) && editValue.includes(sub._id);
                                        return (
                                          <button
                                            key={sub._id}
                                            type="button"
                                            onClick={() => handleSubjectToggleInEdit(sub._id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center gap-1.5 ${
                                              isSelected
                                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-500/5 scale-[1.02]'
                                                : 'bg-slate-950/40 text-white/50 border-white/5 hover:border-white/10 hover:text-white/70'
                                            }`}
                                          >
                                            {sub.name}
                                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                              {allSubjects.length === 0 && (
                                <p className="text-xs text-white/30 italic pl-1">No active subjects available.</p>
                              )}
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                              <button 
                                onClick={() => handleSaveInlineEdit(field.key)} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
                                title="Save changes"
                              >
                                <HiOutlineCheck size={14} /> Save
                              </button>
                              <button 
                                onClick={handleCancelInlineEdit} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 text-xs font-bold transition-all border border-white/5"
                                title="Cancel"
                              >
                                <HiOutlineX size={14} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : field.type === 'select' ? (
                          <>
                            <select
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="flex-1 bg-slate-950 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                              autoFocus
                            >
                              {field.options.map(o => (
                                <option key={o} value={o} className="capitalize text-slate-900 bg-white">
                                  {o}
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => handleSaveInlineEdit(field.key)} 
                              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/10"
                              title="Save changes"
                            >
                              <HiOutlineCheck size={14} />
                            </button>
                            <button 
                              onClick={handleCancelInlineEdit} 
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-all border border-white/5"
                              title="Cancel"
                            >
                              <HiOutlineX size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type={field.type}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleSaveInlineEdit(field.key)} 
                              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/10"
                              title="Save changes"
                            >
                              <HiOutlineCheck size={14} />
                            </button>
                            <button 
                              onClick={handleCancelInlineEdit} 
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-all border border-white/5"
                              title="Cancel"
                            >
                              <HiOutlineX size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ) : field.type === 'subjects' ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Array.isArray(rawValue) && rawValue.length > 0 ? (
                          rawValue.map((sub) => (
                            <span 
                              key={sub._id || sub} 
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm"
                            >
                              {sub.name || 'Unknown Subject'}
                              {sub.group && <span className="text-[10px] text-white/40 ml-1 font-medium">({sub.group})</span>}
                            </span>
                          ))
                        ) : (
                          <p className="text-white/30 text-xs font-semibold">No subjects assigned</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-white/80 font-semibold text-sm mt-1 capitalize">
                        {getDisplayValue(field, rawValue)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">Reset Password</h2>
            <p className="text-white/30 text-xs mb-4">Set a new password for this staff member</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="New password (min 6 chars)" 
                className="input-field" 
                required 
                autoFocus
              />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={resetting} className="btn-primary flex-1 justify-center py-2.5 font-semibold text-xs">
                  {resetting ? 'Updating...' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary flex-1 justify-center py-2.5 font-semibold text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDetail;
