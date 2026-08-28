import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiPlus } from 'react-icons/hi';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: 'teacher123', 
    phone: '', 
    cnic: '', 
    qualification: '', 
    specialization: '', 
    salary: 0,
    subjects: [] 
  });

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data.data);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setAllSubjects(data.data || []);
    } catch {
      toast.error('Failed to load subjects');
    }
  };

  useEffect(() => { 
    fetchTeachers(); 
    fetchSubjects();
  }, []);

  const handleSubjectToggle = (subjectId) => {
    setForm(prev => {
      const subjects = prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId];
      return { ...prev, subjects };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teachers', form);
      toast.success('Teacher added successfully');
      setShowForm(false);
      setForm({ 
        name: '', 
        email: '', 
        password: 'teacher123', 
        phone: '', 
        cnic: '', 
        qualification: '', 
        specialization: '', 
        salary: 0,
        subjects: [] 
      });
      fetchTeachers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const subjectsByGroup = allSubjects.reduce((acc, sub) => {
    const grp = sub.group || 'Common';
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(sub);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Teachers ({teachers.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
          <HiPlus size={16} /> Add Teacher
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-[#0d1117] border border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-4 shadow-2xl backdrop-blur-md">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" required className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" type="email" required className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} placeholder="CNIC" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} placeholder="Qualification" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="Specialization" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          <input type="number" value={form.salary} onChange={e => setForm({...form, salary: +e.target.value})} placeholder="Salary" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
          
          {/* Subjects Selection Pill Grid */}
          <div className="col-span-1 md:col-span-3 border-t border-white/[0.05] pt-4 mt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
              Subjects this Teacher will Teach
            </label>
            {allSubjects.length === 0 ? (
              <p className="text-xs text-white/30 italic">No active subjects found. Create subjects first in the Subjects panel.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(subjectsByGroup).map(([groupName, groupSubjects]) => (
                  <div key={groupName} className="space-y-2">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-white/40">
                      {groupName}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {groupSubjects.map(sub => {
                        const isSelected = form.subjects.includes(sub._id);
                        return (
                          <button
                            key={sub._id}
                            type="button"
                            onClick={() => handleSubjectToggle(sub._id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold select-none border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                              isSelected
                                ? 'border-indigo-500 text-indigo-300 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-bold'
                                : 'border-white/10 text-white/50 bg-[#161b22]/50 hover:border-white/20 hover:text-white/80 hover:bg-[#1f2631]/50'
                            }`}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            )}
                            <span>{sub.name}</span>
                            <span className="text-[10px] opacity-40 font-normal">({sub.class})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-3 flex gap-2 justify-end border-t border-white/[0.05] pt-4 mt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-sm font-semibold rounded-lg transition">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition shadow-lg shadow-indigo-500/10">Add Teacher</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Subjects</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Qualification</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Status</th>
          </tr></thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 font-medium">{t.user?.name || t.user_id?.name || '-'}</td>
                <td className="px-4 py-3 text-white/50">{t.user?.email || t.user_id?.email || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.subjects && t.subjects.length > 0 ? (
                      t.subjects.map(sub => (
                        <span key={sub._id} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[10px] font-semibold" title={`${sub.group} - ${sub.class}`}>
                          {sub.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/20 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/50">{t.qualification || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{t.status}</span>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30">No teachers found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Teachers;
