import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiPlus } from 'react-icons/hi';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/assignments');
        setAssignments(data.data);
      } catch { toast.error('Failed to load assignments'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Assignments ({assignments.length})</h1>
      </div>
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Title</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Subject</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Class</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Due Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Submissions</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Status</th>
          </tr></thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 font-medium">{a.title}</td>
                <td className="px-4 py-3 text-white/50">{a.subject_id?.name || '-'}</td>
                <td className="px-4 py-3 text-white/50">{a.class_id?.name || '-'}</td>
                <td className="px-4 py-3 text-white/50">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 text-white/50">{a.submissions?.length || 0}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>{a.status}</span></td>
              </tr>
            ))}
            {assignments.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30">No assignments yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assignments;
