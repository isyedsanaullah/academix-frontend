import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';

const roleColors = {
  admin:      'bg-violet-500/10 text-violet-400 border-violet-500/20',
  registrar:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  accountant: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  principal:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
  teacher:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  employee:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  student:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const defaultForm = {
  name: '',
  email: '',
  password: '',
  role: 'teacher',
  phone: '',
  cnic: '',
  qualification: '',
  specialization: '',
  salary: '',
  department: 'administration',
  designation: ''
};

const Staff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination states
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: debouncedSearch,
      };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.status = statusFilter;

      const { data } = await api.get('/users', { params });
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, debouncedSearch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', form);
      toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created!`);
      setShowModal(false);
      setForm(defaultForm);
      setPage(1);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Manage Accounts</h1>
          <p className="text-white/30 text-xs mt-1">Configure user accounts and detailed directory information</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <HiOutlinePlus size={16} /> Add Staff
          </button>
        )}
      </div>

      {/* Role hierarchy info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { role: 'principal',  label: 'Principal',  desc: 'Academic oversight', color: 'border-sky-500/20 bg-sky-500/5' },
          { role: 'registrar',  label: 'Registrar',  desc: 'Registration & Admissions', color: 'border-emerald-500/20 bg-emerald-500/5' },
          { role: 'accountant', label: 'Accountant', desc: 'Fees & Payroll', color: 'border-amber-500/20 bg-amber-500/5' },
          { role: 'teacher',    label: 'Teacher',    desc: 'Attendance & LMS', color: 'border-blue-500/20 bg-blue-500/5' },
          { role: 'employee',   label: 'Employee',   desc: 'Security & Staff', color: 'border-orange-500/20 bg-orange-500/5' },
          { role: 'student',    label: 'Student',    desc: 'Self-service portal', color: 'border-rose-500/20 bg-rose-500/5' },
        ].map(r => (
          <div key={r.role} className={`rounded-2xl border p-3.5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${r.color}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColors[r.role]}`}>{r.label}</span>
            </div>
            <p className="text-white/30 text-[10px] font-medium leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Row 1: Search & Status Selector */}
        <div className="flex gap-4 items-center flex-wrap bg-slate-900/40 border border-white/5 p-4 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, cnic, phone..."
              className="input-field pl-9 w-full bg-slate-950/40 border-white/10 hover:border-white/20 focus:border-indigo-500 transition-colors"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-auto bg-slate-950/40 border-white/10 hover:border-white/20 focus:border-indigo-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {/* Row 2: Horizontal Role Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {[
            { code: '', label: 'All Roles' },
            { code: 'principal', label: 'Principal' },
            { code: 'registrar', label: 'Registrar' },
            { code: 'accountant', label: 'Accountant' },
            { code: 'teacher', label: 'Teacher' },
            { code: 'employee', label: 'Employee' },
            { code: 'student', label: 'Student' }
          ].map(tab => {
            const isActive = roleFilter === tab.code;
            return (
              <button
                key={tab.code}
                type="button"
                onClick={() => { setRoleFilter(tab.code); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-md shadow-indigo-500/5' 
                    : 'bg-slate-900/40 border-white/5 text-white/40 hover:text-white/70 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden rounded-2xl shadow-2xl border border-white/5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm font-medium">No staff accounts found matching your filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/20">
                  <th className="text-left py-3 px-4 text-xs font-bold text-white/40 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-white/40 uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-white/40 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr 
                    key={u._id}
                    onClick={() => {
                      const cleanPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
                      navigate(`${cleanPath}/${u._id}`);
                    }}
                    className="group border-b border-white/[0.04] hover:bg-white/[0.02] active:bg-white/[0.04] cursor-pointer transition-all duration-150"
                  >
                    <td className="py-3.5 px-4 font-semibold text-white/80 group-hover:text-indigo-400 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shadow-md">
                          {u?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span>{u.name}</span>
                          {!u.isActive && (
                            <span className="text-[9px] text-red-400 font-extrabold uppercase mt-0.5 tracking-wide">Suspended</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-white/50 font-medium group-hover:text-white/75 transition-colors">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase shadow-sm border ${roleColors[u.role] || ''}`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">Add Staff Account</h2>
            <p className="text-white/30 text-xs mb-5">The user will be able to log in with these credentials</p>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-xs text-white/40 mb-1.5 font-bold uppercase tracking-wider">Select Role *</label>
                <div className="flex gap-2 flex-wrap">
                  {['registrar','accountant','principal','teacher','employee'].map(r => (
                    <button type="button" key={r} onClick={() => setForm({...form, role: r})}
                      className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${form.role === r ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-md shadow-indigo-500/5' : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/60 hover:bg-white/[0.04]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/40 mb-1 font-semibold">Full Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required className="input-field"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/40 mb-1 font-semibold">Email *</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required className="input-field"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/40 mb-1 font-semibold">Password</label>
                  <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Default: role@academix" className="input-field"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/40 mb-1 font-semibold">Phone</label>
                  <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input-field"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/40 mb-1 font-semibold">CNIC</label>
                  <input value={form.cnic} onChange={e=>setForm({...form,cnic:e.target.value})} className="input-field"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-white/40 mb-1 font-semibold">Salary (PKR)</label>
                  <input type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} className="input-field"/>
                </div>
              </div>

              {/* Teacher fields */}
              {form.role === 'teacher' && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.05]">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-white/40 mb-1 font-semibold">Qualification</label>
                    <input value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})} placeholder="MSc, MPhil, PhD" className="input-field"/>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-white/40 mb-1 font-semibold">Specialization</label>
                    <input value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} placeholder="Physics, Math..." className="input-field"/>
                  </div>
                </div>
              )}

              {/* Employee fields */}
              {form.role === 'employee' && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.05]">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-white/40 mb-1 font-semibold">Department</label>
                    <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} className="input-field bg-slate-950/80">
                      {['administration','accounts','security','canteen','library','lab','other'].map(d => (
                        <option key={d} value={d} className="capitalize">{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-white/40 mb-1 font-semibold">Designation</label>
                    <input value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} placeholder="Clerk, Guard..." className="input-field"/>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/[0.05]">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-2.5">
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center py-2.5">
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

export default Staff;
