import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiPlus } from 'react-icons/hi';

const Certificates = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/certificates');
        setCerts(data.data);
      } catch { toast.error('Failed to load certificates'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Certificates</h1>
        <a 
          href="/admin/templates" 
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg border border-indigo-500/30 transition-colors"
        >
          Preview Templates
        </a>
      </div>
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Certificate #</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Student</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Issue Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase">Action</th>
          </tr></thead>
          <tbody>
            {certs.map(c => (
              <tr key={c._id || c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 font-mono text-xs">{c.certificateNumber}</td>
                <td className="px-4 py-3 text-white/80">{c.student_id?.name || c.student?.name || '-'} <span className="text-white/30 text-xs">({c.student_id?.rollNumber || c.student?.rollNumber})</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold capitalize">{c.type}</span></td>
                <td className="px-4 py-3 text-white/50">{new Date(c.issueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'issued' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{c.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/api/documents/certificate/${c._id || c.id}.pdf`}
                    download
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded border border-indigo-500/20 transition-colors"
                  >
                    Download PDF
                  </a>
                </td>
              </tr>
            ))}
            {certs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30">No certificates issued</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Certificates;
