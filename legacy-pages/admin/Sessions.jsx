import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiCheckCircle, HiCalendar, HiTrash } from 'react-icons/hi';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data.data);
    } catch (err) { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sessions', form);
      toast.success('Session created');
      setShowForm(false);
      setForm({ name: '', startDate: '', endDate: '', isCurrent: false });
      fetchSessions();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating session'); }
  };

  const setAsCurrent = async (id) => {
    try {
      await api.put(`/sessions/${id}`, { isCurrent: true });
      toast.success('Current session updated');
      fetchSessions();
    } catch (err) { toast.error('Error updating session'); }
  };

  const deleteSession = async (id) => {
    if (!confirm('Delete this session?')) return;
    try {
      await api.delete(`/sessions/${id}`);
      toast.success('Session deleted');
      fetchSessions();
    } catch (err) { toast.error('Error deleting session'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Academic Sessions</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
          <HiPlus size={16} /> New Session
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-[#0d1117] border border-white/[0.06] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Session Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="2026-2027" required className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required className="w-full px-3 py-2 bg-[#1a2230] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={form.isCurrent} onChange={e => setForm({...form, isCurrent: e.target.checked})} className="rounded" /> Set as current session
          </label>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 text-white/50 text-sm rounded-lg hover:bg-white/10 transition">Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Session</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Duration</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
          </tr></thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-white/50">{new Date(s.startDate).toLocaleDateString()} — {new Date(s.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {s.isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold"><HiCheckCircle size={12} /> Current</span>
                  ) : (
                    <span className="text-white/30 text-xs">{s.status}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {!s.isCurrent && <button onClick={() => setAsCurrent(s._id)} className="text-xs text-indigo-400 hover:text-indigo-300">Set Current</button>}
                  <button onClick={() => deleteSession(s._id)} className="text-xs text-red-400 hover:text-red-300"><HiTrash size={14} /></button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30">No sessions found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sessions;
