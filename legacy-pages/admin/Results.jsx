import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus, HiOutlinePrinter, HiOutlineSearch, HiOutlineCloudUpload } from 'react-icons/hi';

const Results = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState('');
  
  // Section and search states
  const [sectionsList, setSectionsList] = useState([]);
  const [activeSectionTab, setActiveSectionTab] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchExamsAndSections = async () => {
      try {
        const [examsRes, sectionsRes] = await Promise.all([
          api.get('/exams'),
          api.get('/sections')
        ]);
        
        setExams(examsRes.data.data || []);
        if (examsRes.data.data?.length) { 
          setExamFilter(examsRes.data.data[0]._id); 
        }

        if (sectionsRes.data.success && sectionsRes.data.data && sectionsRes.data.data.length > 0) {
          const list = [];
          sectionsRes.data.data.forEach(s => {
            const className = s.class_id?.name || '';
            if (s.code && className) {
              const compoundKey = `${className}_${s.code}`;
              list.push({
                id: compoundKey,
                code: s.code,
                className: className,
                name: s.name || `Section ${s.code}`
              });
            }
          });
          setSectionsList(list);
        }
      } catch (err) {}
      setLoading(false);
    };
    fetchExamsAndSections();
  }, []);

  useEffect(() => { 
    if (examFilter) fetchResults(); 
  }, [examFilter]);

  const fetchResults = async () => {
    try { 
      const { data } = await api.get('/results', { params: { exam_id: examFilter } }); 
      setResults(data.data || []); 
    } catch { 
      toast.error('Failed to load results'); 
    }
  };

  // Perform reactive client-side filtering on results
  const filteredResults = results.filter(r => {
    // 1. Section Filter
    if (activeSectionTab !== 'ALL') {
      const studentClass = r.student_id?.class || '';
      const studentSec = r.student_id?.section || '';
      const key = `${studentClass}_${studentSec}`;
      if (key !== activeSectionTab) return false;
    }
    // 2. Student Search Filter
    if (search.trim()) {
      const query = search.toLowerCase();
      const studentName = r.student_id?.name?.toLowerCase() || '';
      const rollNum = r.student_id?.rollNumber?.toLowerCase() || '';
      if (!studentName.includes(query) && !rollNum.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Results</h1>
          <p className="text-surface-400 text-sm mt-1">View student examination results</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['admin', 'teacher'].includes(user?.role) && (
            <>
              <button 
                onClick={() => navigate(user?.role === 'teacher' ? '/teacher/results/upload' : '/admin/results/upload')} 
                className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 font-semibold"
              >
                <HiOutlineCloudUpload size={16} /> Bulk Upload Marks
              </button>
              <button 
                onClick={() => navigate('/admin/results/entry')} 
                className="btn-primary flex items-center gap-1.5"
              >
                <HiOutlinePlus size={18} /> Enter Results
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls: Premium Select & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gradient-to-br from-slate-900/50 to-slate-950/30 border border-white/10 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md">
        
        {/* Exam Selector */}
        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block ml-1">
            Active Examination
          </label>
          <div className="relative group">
            <select 
              value={examFilter} 
              onChange={e => setExamFilter(e.target.value)} 
              className="w-full pr-10 pl-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-white/20 transition-all duration-300 appearance-none font-medium shadow-inner"
            >
              <option value="" className="bg-slate-950 text-surface-400">Select Exam</option>
              {exams.map(e => (
                <option key={e._id} value={e._id} className="bg-slate-950 text-white">
                  {e.name} ({e.class})
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow icon */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Student Search Bar */}
        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block ml-1">
            Search Student
          </label>
          <div className="relative group">
            <HiOutlineSearch 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/60 group-hover:text-emerald-400 transition-colors" 
              size={18} 
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 hover:border-white/20 transition-all duration-300 font-medium shadow-inner"
              placeholder="Search student by name or roll number..."
            />
          </div>
        </div>

      </div>

      {/* Section Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveSectionTab('ALL')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t border-x ${
            activeSectionTab === 'ALL'
              ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
              : 'bg-transparent text-slate-400 border-transparent hover:text-white'
          }`}
        >
          All Sections
        </button>
        {sectionsList.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSectionTab(sec.id)}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t border-x ${
              activeSectionTab === sec.id
                ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {sec.name} ({sec.className.includes('Part 2') ? 'P2' : 'P1'} - {sec.code})
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-12 text-surface-500">No results found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll #</th>
                  <th>Obtained</th>
                  <th>Total</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(r => (
                  <tr key={r._id}>
                    <td className="font-medium text-surface-200">{r.student_id?.name || 'N/A'}</td>
                    <td className="font-mono text-primary-400">{r.student_id?.rollNumber || 'N/A'}</td>
                    <td>{r.totalObtained}</td>
                    <td>{r.totalMarks}</td>
                    <td className="font-semibold">{r.percentage}%</td>
                    <td>
                      <span 
                        className={`badge ${
                          r.grade === 'F' 
                            ? 'badge-danger' 
                            : r.percentage >= 70 
                            ? 'badge-success' 
                            : 'badge-warning'
                        }`}
                      >
                        {r.grade}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => navigate(`/admin/results/card/${r._id}`)} 
                        className="text-primary-400 hover:text-primary-300 p-1"
                        title="Print Result Card"
                      >
                        <HiOutlinePrinter size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
