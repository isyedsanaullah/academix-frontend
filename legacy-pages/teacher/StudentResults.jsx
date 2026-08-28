import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { 
  HiOutlineChartBar, 
  HiOutlineSearch, 
  HiOutlineAcademicCap, 
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineStar,
  HiOutlineDocumentText,
  HiOutlineIdentification,
  HiOutlineCloudUpload
} from 'react-icons/hi';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Sections dynamic directories mapping
  const [sectionsList, setSectionsList] = useState([]);
  const [sectionMap, setSectionMap] = useState({});

  // Fetch initial data: results, exams, and sections directory
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, eRes, sRes] = await Promise.all([
        api.get('/results'),
        api.get('/exams').catch(() => ({ data: { data: [] } })),
        api.get('/sections').catch(() => ({ data: { data: [] } }))
      ]);
      
      setResults(rRes.data.data || []);
      setExams(eRes.data.data || []);

      if (sRes.data?.success && sRes.data?.data) {
        const map = {};
        const list = [];
        sRes.data.data.forEach(s => {
          const className = s.class_id?.name || '';
          if (s.code && className) {
            const compoundKey = `${className}_${s.code}`;
            map[compoundKey] = s.name || `Section ${s.code}`;
            list.push({
              id: compoundKey,
              code: s.code,
              className: className,
              name: s.name || `Section ${s.code}`
            });
          }
        });
        setSectionMap(map);
        setSectionsList(list);
      }
    } catch {
      toast.error('Failed to load academic records');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filter criteria changes
  useEffect(() => {
    setPage(1);
  }, [search, examFilter, activeSectionTab]);

  // Client-side filtering logic
  const filteredResults = results.filter(r => {
    // 1. Search Query (Name or Roll Number)
    if (search) {
      const query = search.toLowerCase();
      const nameMatch = r.student_id?.name?.toLowerCase().includes(query);
      const rollMatch = r.student_id?.rollNumber?.includes(query);
      if (!nameMatch && !rollMatch) return false;
    }

    // 2. Class / Section Tabs Filter
    if (activeSectionTab !== 'ALL') {
      const selectedSec = sectionsList.find(sec => sec.id === activeSectionTab);
      if (selectedSec) {
        if (r.student_id?.class !== selectedSec.className || r.student_id?.section !== selectedSec.code) {
          return false;
        }
      }
    }

    // 3. Exam Selection Filter
    if (examFilter && r.exam_id?._id !== examFilter) {
      return false;
    }

    return true;
  });

  // Calculate dynamic dashboard stats based on filtered results
  const totalResultsCount = filteredResults.length;
  const avgPct = totalResultsCount > 0 
    ? Math.round(filteredResults.reduce((s, r) => s + (r.percentage || 0), 0) / totalResultsCount) 
    : 0;
  const passCount = filteredResults.filter(r => r.grade !== 'F').length;
  const failCount = filteredResults.filter(r => r.grade === 'F').length;

  // Pagination bounds
  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedResults = filteredResults.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="animate-fade-in space-y-6">

      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            📊 Student Academic Results
          </h1>
          <p className="text-white/40 text-xs mt-1">Review student grade sheets, performance metrics, and exam evaluations.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/teacher/results/upload" className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wide shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <HiOutlineCloudUpload size={16} />
            Bulk Import Results
          </Link>
          <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-4 py-2.5 rounded-2xl text-indigo-200 text-xs max-w-md shadow-lg">
            <HiOutlineSparkles size={20} className="shrink-0 text-indigo-400 animate-pulse" />
            <span>Need custom analytics? Head to AI Chat for automated cohort reporting.</span>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sheets', value: totalResultsCount, icon: HiOutlineDocumentText, color: '#818cf8', bg: 'rgba(99,102,241,0.12)', desc: 'Graded exam papers' },
          { label: 'Avg Percentage', value: `${avgPct}%`, icon: HiOutlineChartBar, color: avgPct >= 50 ? '#4ade80' : '#f87171', bg: avgPct >= 50 ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)', desc: 'Cohorts mean score' },
          { label: 'Passed Students', value: passCount, icon: HiOutlineCheckCircle, color: '#4ade80', bg: 'rgba(34,197,94,0.10)', desc: 'Exams with grade > F' },
          { label: 'Failed Students', value: failCount, icon: HiOutlineXCircle, color: '#f87171', bg: 'rgba(248,113,113,0.10)', desc: 'Exams with F grade' },
        ].map((c, i) => (
          <div key={i} className="bg-gradient-to-br from-slate-900/80 to-slate-950/40 backdrop-blur-md border border-white/5 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform duration-150">
            <div className="flex items-center justify-between" style={{ color: c.color }}>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest block" style={{ color: `${c.color}cc` }}>{c.label}</span>
              <c.icon size={20} />
            </div>
            <div className="mt-3 sm:mt-4">
              <span className="text-2xl font-black text-white">{loading ? '—' : c.value}</span>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Class/Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1 mt-6">
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
        {sectionsList.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSectionTab(tab.id)}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t border-x ${
              activeSectionTab === tab.id
                ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {tab.name} <span className="text-[9px] font-medium opacity-60">({tab.className.includes('Part 2') ? 'P2' : 'P1'}-{tab.code})</span>
          </button>
        ))}
      </div>

      {/* Controls & Filtration Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl items-stretch md:items-center justify-between">
        
        {/* Name / Roll Number Search */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-lg">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Student</label>
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search by student name or roll number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>
        </div>

        {/* Dynamic Exams Select Filter */}
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Exam Campaign</label>
          <select 
            value={examFilter} 
            onChange={e => setExamFilter(e.target.value)} 
            className="input-field w-full font-medium"
          >
            <option value="">All Exams</option>
            {exams.map(e => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Performance Distribution Visual Widget */}
      {filteredResults.length > 0 && (
        <div className="glass-card p-5 border border-white/5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="pb-3 border-b border-white/5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineChartBar className="text-indigo-400 animate-pulse" size={16} />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cohort Percentage Distribution</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Showing top records</span>
          </div>
          
          <div className="flex items-end gap-3 height-distribution-chart h-[110px] px-2 pt-4">
            {filteredResults.slice(0, 36).map((r, i) => (
              <div 
                key={i} 
                className="group flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer"
                title={`${r.student_id?.name || 'Student'}: ${r.percentage || 0}% (${r.grade || 'No Grade'})`}
              >
                <div className="w-full bg-slate-900/60 rounded-lg overflow-hidden h-[80px] border border-white/[0.03] group-hover:border-white/10 transition-colors">
                  <div 
                    className="w-full rounded-t-lg transition-all duration-300 group-hover:scale-y-[1.04]"
                    style={{ 
                      height: `${r.percentage || 0}%`, 
                      background: r.grade === 'F' 
                        ? 'linear-gradient(to top, #ef4444, #f87171)' 
                        : 'linear-gradient(to top, #4f46e5, #818cf8)',
                      boxShadow: r.grade === 'F' 
                        ? '0 0 10px rgba(239, 68, 68, 0.2)' 
                        : '0 0 10px rgba(99, 102, 241, 0.2)',
                      position: 'relative',
                      top: `${100 - (r.percentage || 0)}%`
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
          {filteredResults.length > 36 && (
            <p className="text-[10px] text-slate-500 font-medium text-center mt-3 tracking-wide">
              Showing first 36 student percentages in cohort order
            </p>
          )}
        </div>
      )}

      {/* Roster Table Card */}
      <div className="glass-card overflow-hidden shadow-2xl rounded-2xl border border-white/5">
        
        {/* Table Title and Count */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineAcademicCap className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Exam Grade Sheets</h3>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {totalResultsCount} records
            </span>
          </div>
        </div>

        {/* Dynamic State: Loader, Empty, or Table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg" />
            <span className="text-slate-400 text-xs font-semibold tracking-wider">Loading grade logs...</span>
          </div>
        ) : paginatedResults.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs font-medium space-y-2">
            <div className="text-4xl">📭</div>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">No results found</p>
            <p className="text-slate-600 mt-1">Try modifying your student search, section tab, or exam filter campaigns.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/20 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="px-6 py-4.5">#</th>
                  <th className="px-6 py-4.5">Student</th>
                  <th className="px-6 py-4.5">Roll Number</th>
                  <th className="px-6 py-4.5">Class</th>
                  <th className="px-6 py-4.5">Section</th>
                  <th className="px-6 py-4.5">Exam Campaign</th>
                  <th className="px-6 py-4.5">Obtained</th>
                  <th className="px-6 py-4.5">Total</th>
                  <th className="px-6 py-4.5">Percentage</th>
                  <th className="px-6 py-4.5">Grade</th>
                  <th className="px-6 py-4.5">Cohort Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedResults.map((r, i) => {
                  const s = r.student_id || {};
                  const compKey = `${s.class}_${s.section}`;
                  const friendlySectionName = sectionMap[compKey] || `Section ${s.section}`;
                  
                  return (
                    <tr 
                      key={r._id} 
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      {/* # Index Row */}
                      <td className="px-6 py-4 text-slate-500 font-mono font-medium">
                        {(page - 1) * pageSize + i + 1}
                      </td>

                      {/* Student Name with Embedded Pulsing Status Dot */}
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <span 
                            className={`w-2 h-2 rounded-full shrink-0 shadow-md ${
                              s.status === 'active' 
                                ? 'bg-emerald-500 shadow-emerald-500/40 animate-pulse' 
                                : 'bg-rose-500 shadow-rose-500/40'
                            }`}
                            title={s.status === 'active' ? 'Active' : 'Inactive'}
                          />
                          <span className="tracking-wide">{s.name || '—'}</span>
                        </div>
                      </td>
                      
                      {/* Roll Number Monospace Tag */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-400 tracking-wider">
                        {s.rollNumber || '—'}
                      </td>
                      
                      {/* Class */}
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {s.class || '—'}
                      </td>
                      
                      {/* Section (Friendly Section Name instead of raw section) */}
                      <td className="px-6 py-4 text-slate-400 font-medium italic">
                        {friendlySectionName}
                      </td>

                      {/* Exam Campaign Name */}
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {r.exam_id?.name || '—'}
                      </td>

                      {/* Obtained Marks */}
                      <td className="px-6 py-4 text-white font-bold">
                        {r.totalObtained}
                      </td>

                      {/* Total Marks */}
                      <td className="px-6 py-4 text-slate-500 font-bold">
                        {r.totalMarks}
                      </td>

                      {/* Score Percentage Tag */}
                      <td className={`px-6 py-4 font-black font-mono text-[13px] ${
                        r.percentage >= 50 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {r.percentage}%
                      </td>

                      {/* Grade Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase font-mono border ${
                          r.grade === 'F' 
                            ? 'bg-rose-950/40 border-rose-500/30 text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]' 
                            : r.grade === 'A+' || r.grade === 'A'
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                              : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'
                        }`}>
                          {r.grade || '—'}
                        </span>
                      </td>

                      {/* Cohort Rank Position */}
                      <td className="px-6 py-4 font-mono font-bold text-amber-400">
                        {r.position ? `Rank #${r.position}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination component */}
      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />

      {/* AI Bot Advisory Tip */}
      <div className="glass-card p-4.5 border border-violet-500/20 bg-violet-950/5 flex items-start gap-3 rounded-2xl">
        <span className="text-xl">🤖</span>
        <div>
          <p className="text-xs font-bold text-violet-300">AI Cohort Advisory Engine</p>
          <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
            Need a visual summary or a breakdown report? Head over to the **AI Chat** interface and say:
            <span className="font-mono text-indigo-300 bg-slate-900/60 border border-white/5 px-1.5 py-0.5 rounded ml-1 text-[10px]">
              "Create a cohort grade distribution report for FSC Part 1 Section A"
            </span>
            for deep analytical graphs.
          </p>
        </div>
      </div>

    </div>
  );
};

export default StudentResults;
