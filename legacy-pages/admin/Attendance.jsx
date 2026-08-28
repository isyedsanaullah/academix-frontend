import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineInformationCircle, HiOutlineUsers, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [sectionMap, setSectionMap] = useState({});
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Fetch sections dynamically on mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const { data } = await api.get('/sections');
        if (data.success && data.data && data.data.length > 0) {
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
          if (list.length > 0) {
            setSelectedSection(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch sections:', err);
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (!selectedSection) return;
      setLoading(true);
      try {
        const selectedSec = sectionsList.find(sec => sec.id === selectedSection);
        const params = { date };
        const studentParams = { limit: 200 };
        if (selectedSec) {
          params.class = selectedSec.className;
          params.section = selectedSec.code;
          studentParams.class = selectedSec.className;
          studentParams.section = selectedSec.code;
        } else {
          params.section = selectedSection;
          studentParams.section = selectedSection;
        }

        const [attRes, stuRes] = await Promise.all([
          api.get('/attendance', { params }),
          api.get('/students', { params: studentParams })
        ]);
        if (active) {
          setRecords(attRes.data.data || []);
          setStudents(stuRes.data.data || []);
        }
      } catch {
        if (active) toast.error('Failed to load attendance records');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [date, selectedSection, sectionsList]);

  // Calculate statistics
  const selectedSec = sectionsList.find(sec => sec.id === selectedSection);
  const selectedSecName = selectedSec ? `${selectedSec.name} (${selectedSec.className.includes('Part 2') ? 'P2' : 'P1'} - ${selectedSec.code})` : 'Section';

  const total = students.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let unmarkedCount = 0;

  students.forEach(s => {
    const record = records.find(r => r.student_id?._id === s._id || r.student_id === s._id);
    const status = record?.status;
    if (status === 'present') presentCount++;
    else if (status === 'absent') absentCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'leave') leaveCount++;
    else unmarkedCount++;
  });

  const chartData = [
    { name: 'Present', value: presentCount, color: '#10B981' },
    { name: 'Absent', value: absentCount, color: '#EF4444' },
    { name: 'Late', value: lateCount, color: '#F59E0B' },
    { name: 'Leave', value: leaveCount, color: '#3B82F6' },
    { name: 'Not Marked', value: unmarkedCount, color: '#6B7280' }
  ].filter(item => item.value > 0);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold font-mono">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header and Info Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Section-wise automated entry dashboard.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-4 py-2.5 rounded-2xl text-indigo-200 text-xs max-w-md shadow-lg">
          <HiOutlineInformationCircle size={20} className="shrink-0 text-indigo-400 animate-pulse" />
          <span>Attendance is automatically registered when students scan their cards/QRs at the gate.</span>
        </div>
      </div>

      {/* Filter and Selection bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-md items-center">
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input-field w-full sm:w-44"
          />
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
        {sectionsList.map(sec => (
          <button
            key={sec.id}
            onClick={() => setSelectedSection(sec.id)}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t border-x ${
              selectedSection === sec.id
                ? 'bg-slate-950 text-indigo-400 border-white/10 font-black shadow-[0_-2px_10px_rgba(99,102,241,0.1)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {sec.name} ({sec.className.includes('Part 2') ? 'P2' : 'P1'} - {sec.code})
          </button>
        ))}
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modern Graph Panel */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col justify-between items-center min-h-[340px] shadow-xl border border-white/10 rounded-2xl relative overflow-hidden">
          <div className="w-full pb-2 border-b border-white/5 mb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Status Distribution</h3>
          </div>
          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-semibold">
              No students in {selectedSecName}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-semibold">
              No attendance data to plot
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
                    label={renderCustomizedLabel}
                    outerRadius={75}
                    innerRadius={35}
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
                    iconSize={10} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Statistic Cards Panel */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 backdrop-blur-md border border-indigo-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Total Enrolled</span>
              <HiOutlineUsers size={22} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{total}</span>
              <p className="text-[10px] text-slate-400 mt-1">Students in {selectedSecName}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/60 backdrop-blur-md border border-emerald-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Present</span>
              <HiOutlineCheckCircle size={22} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{presentCount}</span>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">
                {total > 0 ? `${((presentCount / total) * 100).toFixed(0)}%` : '0%'} Attendance rate
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-900/40 to-slate-900/60 backdrop-blur-md border border-rose-500/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-300">Absent</span>
              <HiOutlineXCircle size={22} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{absentCount}</span>
              <p className="text-[10px] text-rose-400 font-bold mt-1">
                {total > 0 ? `${((absentCount / total) * 100).toFixed(0)}%` : '0%'} Absence rate
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Late Entry</span>
              <span className="text-xl font-bold text-amber-500 mt-1 block">{lateCount}</span>
            </div>
            <HiOutlineClock size={20} className="text-amber-500" />
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">On Approved Leave</span>
              <span className="text-xl font-bold text-blue-400 mt-1 block">{leaveCount}</span>
            </div>
            <HiOutlineInformationCircle size={20} className="text-blue-400" />
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Unmarked</span>
              <span className="text-xl font-bold text-slate-400 mt-1 block">{unmarkedCount}</span>
            </div>
            <HiOutlineUsers size={20} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Student List Section */}
      <div className="glass-card overflow-hidden shadow-2xl rounded-2xl border border-white/5">
        <div className="px-6 py-4 border-b border-white/5 bg-slate-900/40">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Student Gate Log - {selectedSecName}</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No students found registered in {selectedSecName}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="bg-slate-950/60 text-slate-300 border-b border-white/10 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 text-left">Student</th>
                  <th className="py-3 px-4 text-left">Roll Number</th>
                  <th className="py-3 px-4 text-left">Class Name</th>
                  <th className="py-3 px-4 text-left">Section</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map(s => {
                  const record = records.find(r => r.student_id?._id === s._id || r.student_id === s._id);
                  const status = record?.status || '';
                  const studentCompoundKey = `${s.class}_${s.section}`;
                  const studentSecName = sectionMap[studentCompoundKey] || s.section;
                  return (
                    <tr key={s._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">{s.name}</td>
                      <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{s.rollNumber}</td>
                      <td className="py-3 px-4 text-slate-300 text-xs">{s.class}</td>
                      <td className="py-3 px-4 text-slate-300 font-bold">{studentSecName}</td>
                      <td className="py-3 px-4">
                        {status ? (
                          <span
                            className={`badge ${
                              status === 'present'
                                ? 'badge-success'
                                : status === 'absent'
                                ? 'badge-danger'
                                : status === 'late'
                                ? 'badge-warning'
                                : 'badge-info'
                            } text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider`}
                          >
                            {status}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Unmarked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
