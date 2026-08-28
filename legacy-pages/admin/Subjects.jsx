import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterGroup, setFilterGroup] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', group: ['Common'], class: 'Both', totalMarks: 100, passingMarks: 33 });

  const fetchSubjects = async () => {
    try {
      const params = filterGroup ? `?group=${filterGroup}` : '';
      const { data } = await api.get(`/subjects${params}`);
      setSubjects(data.data);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubjects(); }, [filterGroup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, form);
        toast.success('Subject updated');
      } else {
        await api.post('/subjects', form);
        toast.success('Subject created');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', code: '', group: ['Common'], class: 'Both', totalMarks: 100, passingMarks: 33 });
      fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleGroupToggle = (groupName) => {
    setForm(prev => {
      let currentGroups = Array.isArray(prev.group) ? prev.group : [prev.group];
      
      if (groupName === 'Common') {
        return { ...prev, group: ['Common'] };
      } else {
        let nextGroups = currentGroups.filter(g => g !== 'Common');
        if (nextGroups.includes(groupName)) {
          nextGroups = nextGroups.filter(g => g !== groupName);
        } else {
          nextGroups.push(groupName);
        }
        if (nextGroups.length === 0) {
          nextGroups = ['Common'];
        }
        return { ...prev, group: nextGroups };
      }
    });
  };

  const handleEdit = (s) => {
    const groupArr = s.group ? s.group.split(', ').map(g => g.trim()) : ['Common'];
    setForm({
      name: s.name,
      code: s.code || '',
      group: groupArr,
      class: s.class || 'Both',
      totalMarks: s.totalMarks || 100,
      passingMarks: s.passingMarks || 33
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', code: '', group: ['Common'], class: 'Both', totalMarks: 100, passingMarks: 33 });
  };

  const groupColors = { 'Pre-Medical': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', 'Pre-Engineering': 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 'Computer Science': 'bg-violet-500/10 text-violet-400 border border-violet-500/20', 'Common': 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">Subjects</h1>
        <div className="flex gap-2">
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none">
            <option value="">All Groups</option>
            <option value="Common">Common</option>
            <option value="Pre-Medical">Pre-Medical</option>
            <option value="Pre-Engineering">Pre-Engineering</option>
            <option value="Computer Science">Computer Science</option>
          </select>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
            <HiPlus size={16} /> Add Subject
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-[#0d1117] border border-white/[0.06] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-1">
            <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Subject' : 'Add New Subject'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Subject Name" required className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
            <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="Code (PHY, CHM)" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
            <select value={form.class} onChange={e => setForm({...form, class: e.target.value})} className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none">
              <option value="Both">Both Parts</option>
              <option value="FSC Part 1">FSC Part 1 Only</option>
              <option value="FSC Part 2">FSC Part 2 Only</option>
            </select>
            <input type="number" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: +e.target.value})} placeholder="Total Marks" className="px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none" />
            
            <div className="md:col-span-3 space-y-2 py-1">
              <span className="text-xs font-semibold text-white/50 block">Select Groups (Multiple allowed)</span>
              <div className="flex flex-wrap gap-2">
                {['Common', 'Pre-Medical', 'Pre-Engineering', 'Computer Science'].map((g) => {
                  const currentGroups = Array.isArray(form.group) ? form.group : [form.group];
                  const isSelected = currentGroups.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGroupToggle(g)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition duration-200 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-[#1a2230] border-white/10 text-white/70 hover:border-white/20'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isSelected ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-white/20'
                      }`} />
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/[0.06] mt-1">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">{editingId ? 'Update Subject' : 'Create Subject'}</button>
            <button type="button" onClick={handleCancel} className="px-4 py-2 bg-white/5 text-white/50 text-sm font-medium rounded-lg hover:bg-white/10 transition">Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Subject</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Groups</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Class</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Marks</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-white/50 font-mono text-xs">{s.code || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(s.group || 'Common').split(',').map(g => {
                      const trimmed = g.trim();
                      return (
                        <span key={trimmed} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${groupColors[trimmed] || 'bg-white/10 text-white/70 border border-white/5'}`}>
                          {trimmed}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/50">{s.class}</td>
                <td className="px-4 py-3 text-white/50">{s.totalMarks} ({s.passingMarks} pass)</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <button onClick={() => handleEdit(s)} title="Edit Subject" className="text-white/40 hover:text-indigo-400 transition">
                      <HiPencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(s._id)} title="Delete Subject" className="text-white/40 hover:text-rose-400 transition">
                      <HiTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30">No subjects found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subjects;
