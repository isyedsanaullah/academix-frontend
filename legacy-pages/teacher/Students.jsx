import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { 
  HiOutlineSearch, 
  HiOutlineUserGroup, 
  HiOutlineAcademicCap, 
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineIdentification
} from 'react-icons/hi';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const pageSize = 12;

  // Sections dynamic directories mapping
  const [sectionsList, setSectionsList] = useState([]);
  const [sectionMap, setSectionMap] = useState({});

  // Fetch sections directory for friendly names mapping
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const { data } = await api.get('/sections');
        if (data.success && data.data) {
          const map = {};
          const list = [];
          data.data.forEach(s => {
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
      } catch (err) {
        console.error('Failed to fetch sections directory:', err);
      }
    };
    fetchSections();
  }, []);

  // Search Debounce Handler
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when section tab or status filter changes
  useEffect(() => {
    setPage(1);
  }, [activeSectionTab, statusFilter]);

  // Main data fetcher
  useEffect(() => {
    fetchStudents();
  }, [page, debouncedSearch, activeSectionTab, statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch,
        status: statusFilter
      };

      if (activeSectionTab !== 'ALL') {
        const selectedSec = sectionsList.find(sec => sec.id === activeSectionTab);
        if (selectedSec) {
          params.class = selectedSec.className;
          params.section = selectedSec.code;
        }
      }

      const { data } = await api.get('/students', { params });
      setStudents(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalStudents(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            🎓 Students Directory
          </h1>
          <p className="text-white/40 text-xs mt-1">Manage and view student accounts, assigned classes, and active directory logs.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-4 py-2.5 rounded-2xl text-indigo-200 text-xs max-w-md shadow-lg">
          <HiOutlineSparkles size={20} className="shrink-0 text-indigo-400 animate-pulse" />
          <span>Active sections are synchronized from the central registrar panel.</span>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 backdrop-blur-md border border-indigo-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform duration-150">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Total Found</span>
            <HiOutlineUserGroup size={20} />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{totalStudents}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Students matching criteria</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/60 backdrop-blur-md border border-emerald-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform duration-150">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Sections</span>
            <HiOutlineAcademicCap size={20} />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{sectionsList.length}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Registered class groups</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-900/40 to-slate-900/60 backdrop-blur-md border border-violet-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform duration-150">
          <div className="flex items-center justify-between text-violet-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Database Roster</span>
            <HiOutlineIdentification size={20} />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{pageSize}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Records per page view</p>
          </div>
        </div>
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

      {/* Controls / Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl items-stretch md:items-center justify-between">
        
        {/* Name / Roll Number Search */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-lg">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Student</label>
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-col gap-1.5 self-start md:self-auto">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status State</label>
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5">
            {[
              { id: '', label: 'All' },
              { id: 'active', label: 'Active', activeColor: 'text-emerald-400' },
              { id: 'inactive', label: 'Inactive', activeColor: 'text-rose-400' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                  statusFilter === tab.id
                    ? `bg-slate-900 border border-white/10 ${tab.activeColor || 'text-indigo-400'} font-black shadow-md`
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="glass-card overflow-hidden shadow-2xl rounded-2xl border border-white/5">
        
        {/* Table Title and Count */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineUserGroup className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Student Directory Logs</h3>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {totalStudents} records
            </span>
          </div>
        </div>

        {/* Dynamic State: Loader, Empty, or Table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg" />
            <span className="text-slate-400 text-xs font-semibold tracking-wider">Loading student directory...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs font-medium space-y-2">
            <div className="text-4xl">📭</div>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">No students found</p>
            <p className="text-slate-600 mt-1">Try modifying your text search, section tab, or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/20 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="padding-table px-6 py-4.5">Name</th>
                  <th className="padding-table px-6 py-4.5">Roll Number</th>
                  <th className="padding-table px-6 py-4.5">Class</th>
                  <th className="padding-table px-6 py-4.5">Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map(s => {
                  const compKey = `${s.class}_${s.section}`;
                  const friendlySectionName = sectionMap[compKey] || `Section ${s.section}`;
                  
                  return (
                    <tr 
                      key={s._id} 
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      {/* Name Column with Embedded Status Coloured Dot */}
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
                          <span className="tracking-wide">{s.name}</span>
                        </div>
                      </td>
                      
                      {/* Roll Number Monospace Code Tag */}
                      <td className="px-6 py-4 font-mono font-bold text-indigo-400 tracking-wider">
                        {s.rollNumber}
                      </td>
                      
                      {/* Class */}
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {s.class}
                      </td>
                      
                      {/* Section (Friendly Section Name instead of raw section) */}
                      <td className="px-6 py-4 text-slate-400 font-medium italic">
                        {friendlySectionName}
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

    </div>
  );
};

export default TeacherStudents;
