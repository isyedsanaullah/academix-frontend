import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineCalendar, 
  HiOutlineChevronDown, 
  HiOutlineChevronUp, 
  HiOutlineSpeakerphone, 
  HiOutlineBell,
  HiOutlineExclamation
} from 'react-icons/hi';

const categoryConfig = {
  general: { bg: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', label: 'General' },
  academic: { bg: 'rgba(56, 189, 248, 0.12)', color: '#60a5fa', label: 'Academic' },
  fee: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', label: 'Finance' },
  exam: { bg: 'rgba(245, 158, 11, 0.12)', color: '#fb923c', label: 'Exams' },
  event: { bg: 'rgba(16, 185, 129, 0.12)', color: '#4ade80', label: 'Event' },
  admission: { bg: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', label: 'Admission' },
};

const priorityConfig = {
  urgent: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Urgent 🔥' },
  high: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'High Alert ⚠️' },
  medium: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'Medium' },
  low: { bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', label: 'Low' },
};

const RecentAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [user?.role]);

  const fetchAnnouncements = async () => {
    try {
      const { data: res } = await api.get('/announcements');
      if (res.success) {
        const list = res.data || [];
        
        // Dynamic audience matching based on user role
        const role = user?.role?.toLowerCase() || '';
        let allowedAudience = ['all'];
        if (role === 'teacher') {
          allowedAudience = ['all', 'teachers'];
        } else if (role === 'student') {
          allowedAudience = ['all', 'students'];
        } else if (role === 'admin' || role === 'principal' || role === 'superadmin') {
          allowedAudience = ['all', 'students', 'teachers', 'employees', 'public'];
        } else {
          // Accountant, Registrar, Employee, Guard
          allowedAudience = ['all', 'employees'];
        }

        const filtered = list.filter(ann => {
          const audience = ann.audience || 'all';
          return allowedAudience.includes(audience);
        });

        // Take only the 4 most recent announcements
        setAnnouncements(filtered.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[160px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Loading announcements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4 shadow-xl border border-white/5 relative overflow-hidden">
      
      {/* Title Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <HiOutlineSpeakerphone size={18} className="animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Announcements</h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Official updates & notices</span>
          </div>
        </div>
        <HiOutlineBell size={18} className="text-slate-400 animate-pulse" />
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 text-xs">
          <span className="text-2xl mb-1">📭</span>
          <p className="font-semibold uppercase tracking-wider text-[10px]">No active announcements</p>
          <p className="text-slate-600 mt-1">Check back later for any new notices.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((ann) => {
            const isExpanded = expandedId === ann._id;
            const cat = categoryConfig[ann.category] || categoryConfig.general;
            const prio = priorityConfig[ann.priority] || priorityConfig.medium;
            
            return (
              <div 
                key={ann._id} 
                className={`group p-3.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-200 cursor-pointer ${
                  ann.priority === 'urgent' ? 'shadow-[inset_0_0_12px_rgba(239,68,68,0.05)] border-red-500/20' : ''
                }`}
                onClick={() => toggleExpand(ann._id)}
              >
                {/* Notice Top Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span 
                    className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: cat.bg, color: cat.color }}
                  >
                    {cat.label}
                  </span>
                  
                  {ann.priority === 'urgent' || ann.priority === 'high' ? (
                    <span 
                      className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse border"
                      style={{ backgroundColor: prio.bg, color: prio.color, borderColor: `${prio.color}30` }}
                    >
                      {prio.label}
                    </span>
                  ) : null}

                  <span className="text-[10px] text-slate-400 font-mono ml-auto flex items-center gap-1">
                    <HiOutlineCalendar size={12} />
                    {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Announcement Title */}
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors">
                    {ann.title}
                  </h4>
                  <div className="text-slate-400 group-hover:text-white transition-colors shrink-0">
                    {isExpanded ? <HiOutlineChevronUp size={16} /> : <HiOutlineChevronDown size={16} />}
                  </div>
                </div>

                {/* Content Details */}
                <div 
                  className={`mt-2 overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-5 opacity-40'
                  }`}
                >
                  <p className={`text-slate-300 text-[11px] leading-relaxed ${isExpanded ? 'whitespace-pre-line' : 'truncate'}`}>
                    {ann.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentAnnouncements;
