import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  HiOutlineCalendar, 
  HiOutlineUserGroup, 
  HiOutlineSearch, 
  HiOutlineUsers, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineClock, 
  HiOutlineInformationCircle
} from 'react-icons/hi';

const statusConfig = {
  present: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)', icon: '✅', label: 'Present' },
  absent: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', icon: '❌', label: 'Absent' },
  leave: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)', icon: '📋', label: 'Leave' },
  late: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)', icon: '⏰', label: 'Late' },
};

const TeacherAttendance = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, leave: 0, late: 0 });
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSectionTab, setActiveSectionTab] = useState('ALL');
  const [availableTabs, setAvailableTabs] = useState([]);
  const pageSize = 12;

  const [filters, setFilters] = useState({ 
    date: new Date().toISOString().slice(0, 10), 
    search: '', 
    status: '' 
  });

  useEffect(() => { 
    fetchAttendance(); 
  }, [filters.date, activeSectionTab]);

  // Reset page when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.date, activeSectionTab]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = { date: filters.date };
      
      // Resolve class/section criteria based on active tab
      if (activeSectionTab !== 'ALL') {
        const tab = availableTabs.find(t => t.id === activeSectionTab);
        if (tab) {
          params.class = tab.className;
          params.section = tab.sectionCode;
        }
      }
      
      const { data: res } = await api.get('/attendance/teacher-view', { params });
      const fetchedData = res.data || [];
      setData(fetchedData);
      setSummary(res.summary || { total: 0, present: 0, absent: 0, leave: 0, late: 0 });
      
      const rawAssigned = res.assignedClasses || [];
      setAssignedClasses(rawAssigned);

      // Build available section tabs dynamically (only in ALL state or on initial load to preserve full list)
      if (activeSectionTab === 'ALL' || availableTabs.length === 0) {
        const tabs = [];
        const seenTabs = new Set();

        if (rawAssigned.length > 0) {
          rawAssigned.forEach(ac => {
            const className = ac.class_id?.name || '';
            const sectionCode = ac.section_id?.code || '';
            const sectionName = ac.section_id?.name || '';
            if (className && sectionCode) {
              const id = `${className}_${sectionCode}`;
              if (!seenTabs.has(id)) {
                seenTabs.add(id);
                tabs.push({
                  id,
                  className,
                  sectionCode,
                  displayName: sectionName ? `${sectionName} (${className.includes('Part 2') ? 'P2' : 'P1'} - ${sectionCode})` : `${className} - Sec ${sectionCode}`
                });
              }
            }
          });
        }

        // Fallback scan of retrieved students
        if (tabs.length === 0) {
          fetchedData.forEach(d => {
            const c = d.student?.class;
            const s = d.student?.section;
            if (c && s) {
              const id = `${c}_${s}`;
              if (!seenTabs.has(id)) {
                seenTabs.add(id);
                tabs.push({
                  id,
                  className: c,
                  sectionCode: s,
                  displayName: `${c} - Sec ${s}`
                });
              }
            }
          });
        }

        if (tabs.length > 0) {
          setAvailableTabs(tabs);
        }
      }
    } catch { 
      toast.error('Failed to load attendance'); 
    } finally { 
      setLoading(false); 
    }
  };

  // Stats over loaded class/section data (unaffected by text search & status tabs)
  const totalStudents = data.length;
  const presentCount = data.filter(c => c.status === 'present').length;
  const absentCount = data.filter(c => c.status === 'absent').length;
  const leaveCount = data.filter(c => c.status === 'leave').length;
  const lateCount = data.filter(c => c.status === 'late').length;

  const attendancePct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Recharts Pie Data
  const chartData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Leave', value: leaveCount, color: '#3b82f6' }
  ].filter(item => item.value > 0);

  // Client-side filtration
  const filteredData = data.filter(item => {
    // Search Filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const nameMatch = item.student?.name?.toLowerCase().includes(query);
      const rollMatch = item.student?.rollNumber?.toLowerCase().includes(query);
      if (!nameMatch && !rollMatch) return false;
    }
    // Status Filter Tab
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    return true;
  });

  // Client-side Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold font-mono">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            📋 Attendance Roster & Insights
          </h1>
          <p className="text-white/40 text-xs mt-1">Real-time gate scans and registration records for your class groups.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-4 py-2.5 rounded-2xl text-indigo-200 text-xs max-w-md shadow-lg">
          <HiOutlineInformationCircle size={20} className="shrink-0 text-indigo-400 animate-pulse" />
          <span>Attendance logs are compiled from smart card and QR gate scans.</span>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Recharts Donut */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col justify-between items-center min-h-[340px] shadow-xl border border-white/10 rounded-2xl relative overflow-hidden">
          <div className="w-full pb-2 border-b border-white/5 mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Status Distribution</h3>
          </div>
          {totalStudents === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-semibold">
              No students enrolled in selected class group
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-semibold">
              No attendance logs registered today
            </div>
          ) : (
            <div className="w-full h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={75}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={8} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Stats Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 backdrop-blur-md border border-indigo-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Total Enrolled</span>
              <HiOutlineUsers size={22} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{totalStudents}</span>
              <p className="text-[10px] text-slate-400 mt-1">Students in active groups</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/60 backdrop-blur-md border border-emerald-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Present</span>
              <HiOutlineCheckCircle size={22} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{presentCount}</span>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">
                {attendancePct}% Present rate
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-900/40 to-slate-900/60 backdrop-blur-md border border-rose-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-300">Absent</span>
              <HiOutlineXCircle size={22} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{absentCount}</span>
              <p className="text-[10px] text-rose-400 font-bold mt-1">
                {totalStudents > 0 ? `${Math.round((absentCount / totalStudents) * 100)}%` : '0%'} Absent rate
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Late Arrival</span>
              <span className="text-xl font-bold text-amber-500 mt-1 block">{lateCount}</span>
            </div>
            <HiOutlineClock size={20} className="text-amber-500" />
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Approved Leave</span>
              <span className="text-xl font-bold text-blue-400 mt-1 block">{leaveCount}</span>
            </div>
            <HiOutlineUserGroup size={20} className="text-blue-400" />
          </div>

          {/* Core Attendance Rate Progress Card */}
          <div className="col-span-2 md:col-span-1 bg-slate-900/60 border border-white/5 p-4 rounded-xl shadow-md flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attendance Health</span>
              <span className={`text-xs font-bold ${attendancePct >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>{attendancePct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${attendancePct >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-rose-500 to-red-400'}`}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Section Tabs */}
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
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSectionTab(tab.id)}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t border-x ${
              activeSectionTab === tab.id
                ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {tab.displayName}
          </button>
        ))}
      </div>

      {/* Control Filter Bar (Shifted below analytics and section tabs) */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl items-stretch md:items-center">
        {/* Date Selector */}
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <HiOutlineCalendar size={12} /> Date
          </label>
          <input 
            type="date" 
            value={filters.date} 
            onChange={e => setFilters({ ...filters, date: e.target.value })} 
            className="input-field" 
          />
        </div>

        {/* Name / Roll Number Search */}
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Student</label>
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search by student name or roll number..." 
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="input-field pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Roster Table Section */}
      <div className="glass-card overflow-hidden shadow-2xl rounded-2xl border border-white/5">
        
        {/* Table Navigation and Search Tabs */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineUserGroup className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Student Roster</h3>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {filteredData.length} records
            </span>
          </div>

          {/* Quick status selection filters styled as tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5 self-start md:self-auto">
            {[
              { id: '', label: 'All', count: totalStudents },
              { id: 'present', label: 'Present', count: presentCount, activeColor: 'text-emerald-400' },
              { id: 'absent', label: 'Absent', count: absentCount, activeColor: 'text-rose-400' },
              { id: 'leave', label: 'Leave', count: leaveCount, activeColor: 'text-blue-400' },
              { id: 'late', label: 'Late', count: lateCount, activeColor: 'text-amber-400' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilters({ ...filters, status: tab.id })}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                  filters.status === tab.id
                    ? `bg-slate-900 border border-white/10 ${tab.activeColor || 'text-indigo-400'} font-black shadow-md`
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                  filters.status === tab.id 
                    ? 'bg-indigo-500/20 text-white/90' 
                    : 'bg-white/5 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loader or Table Data */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg" />
            <span className="text-slate-400 text-xs font-semibold tracking-wider">Syncing roster from database...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs font-medium space-y-2">
            <div className="text-3xl">📭</div>
            <p>No students match the selected filter conditions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/20 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6">#</th>
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-6">Roll No</th>
                  <th className="py-4 px-6">Class</th>
                  <th className="py-4 px-6">Section</th>
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Entry Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedData.map((d, index) => {
                  const sc = statusConfig[d.status] || statusConfig.absent;
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr 
                      key={d.student?._id || index} 
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <td className="py-4 px-6 text-slate-500 font-mono">{globalIndex}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-500/10">
                            {d.student?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="font-extrabold text-white block text-sm">{d.student?.name || '—'}</span>
                            <span className="text-[10px] text-slate-400">{d.student?.group || 'Pre-Medical'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono font-bold tracking-tight">{d.student?.rollNumber || '—'}</td>
                      <td className="py-4 px-6 text-slate-400 font-semibold">{d.student?.class || '—'}</td>
                      <td className="py-4 px-6 text-slate-400 font-semibold">Section {d.student?.section || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/40 px-2 py-0.5 rounded border border-white/5">
                          {d.attendance?.method === 'qr' ? '⚡ QR Scan' : '✍️ Manual'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border shadow-sm transition-all"
                          style={{ 
                            backgroundColor: sc.bg, 
                            color: sc.color, 
                            borderColor: sc.border,
                            boxShadow: `0 2px 6px ${sc.bg}`
                          }}
                        >
                          <span>{sc.icon}</span>
                          <span>{sc.label}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400 font-bold font-mono">
                        {d.attendance?.entryTime ? (
                          new Date(d.attendance.entryTime).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        ) : (
                          <span className="text-slate-600 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Shared Pagination component */}
        {!loading && filteredData.length > 0 && (
          <div className="p-4 border-t border-white/5">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
