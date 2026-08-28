import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiPlus } from 'react-icons/hi';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'employee123', phone: '', department: 'other', designation: '', salary: 0 });

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data.data);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', form);
      toast.success('Employee added');
      setShowForm(false);
      setForm({ name: '', email: '', password: 'employee123', phone: '', department: 'other', designation: '', salary: 0 });
      fetchEmployees();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const deptColors = { security: 'bg-rose-500/10 text-rose-400', canteen: 'bg-amber-500/10 text-amber-400', administration: 'bg-indigo-500/10 text-indigo-400', accounts: 'bg-emerald-500/10 text-emerald-400', library: 'bg-violet-500/10 text-violet-400', lab: 'bg-blue-500/10 text-blue-400', other: 'bg-white/5 text-white/40' };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Employees ({employees.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
          <HiPlus size={16} /> Add Employee
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-[#0d1117] border border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-4">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" required className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" type="email" required className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none">
            <option value="security">Security</option>
            <option value="canteen">Canteen</option>
            <option value="administration">Administration</option>
            <option value="accounts">Accounts</option>
            <option value="library">Library</option>
            <option value="lab">Lab</option>
            <option value="other">Other</option>
          </select>
          <input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Designation" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input type="number" value={form.salary} onChange={e => setForm({...form, salary: +e.target.value})} placeholder="Salary" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none" />
          <div className="flex gap-2 items-end">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 text-white/50 text-sm rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Department</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Designation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Status</th>
          </tr></thead>
          <tbody>
            {employees.map(e => (
              <tr key={e._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 font-medium">{e.user_id?.name || '-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${deptColors[e.department] || ''}`}>{e.department}</span></td>
                <td className="px-4 py-3 text-white/50">{e.designation || '-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${e.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{e.status}</span></td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30">No employees found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;
