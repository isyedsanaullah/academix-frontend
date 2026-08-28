import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineExclamation, 
  HiOutlinePrinter, 
  HiOutlineSearch, 
  HiOutlineFilter, 
  HiOutlineRefresh,
  HiOutlinePhone,
  HiOutlineBookOpen,
  HiOutlineCurrencyRupee
} from 'react-icons/hi';
import Pagination from '../../components/common/Pagination';

const Defaulters = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 15;

  // Dynamic section tracking using class+code compound keys
  const [sectionsList, setSectionsList] = useState([]);
  const [sectionMap, setSectionMap] = useState({});

  // Fetch sections on mount and establish compound key mappings
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
        console.error('Failed to fetch sections:', err);
      }
    };
    fetchSections();
  }, []);

  // Fetch paginated defaulters
  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const params = {
        month,
        page,
        limit,
        class: classFilter || undefined,
        section: sectionFilter !== 'ALL' ? sectionFilter : undefined,
        search: search || undefined
      };
      
      const { data } = await api.get('/fees/defaulters', { params });
      setDefaulters(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load fee defaulters roster');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when parameters or pagination changes
  useEffect(() => {
    fetchDefaulters();
  }, [page, month, classFilter, sectionFilter]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDefaulters();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setMonth(new Date().toISOString().slice(0, 7));
    setClassFilter('');
    setSectionFilter('ALL');
    setSearch('');
    setPage(1);
  };

  // Calculate sum of dues for active defaulters page view
  const totalDueOnPage = defaulters.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

  // Get unique classes based on sections list
  const uniqueClasses = [...new Set(sectionsList.map(s => s.className))];

  // Filter sections belonging to selected class
  const classSections = sectionsList.filter(s => s.className === classFilter);

  // Print Defaulters Invoice List
  const handlePrintDefaulters = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is active. Please enable pop-ups to print.');
      return;
    }

    const classLabel = classFilter || 'All Classes';
    const sectionLabel = sectionFilter !== 'ALL' ? (sectionMap[sectionFilter] || sectionFilter) : 'All Sections';
    const activeMonth = new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

    const htmlContent = `
      <html>
        <head>
          <title>Fee Defaulters Notice Report - ${activeMonth}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 45px;
              line-height: 1.4;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #ef4444;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .college-title {
              font-size: 26px;
              font-weight: 700;
              color: #ef4444;
              margin: 0;
            }
            .report-title {
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748b;
              margin-top: 5px;
            }
            .notice-banner {
              background-color: #fef2f2;
              border-left: 4px solid #ef4444;
              color: #991b1b;
              font-size: 13px;
              padding: 12px 15px;
              border-radius: 6px;
              margin-bottom: 25px;
              font-weight: 500;
            }
            .metadata-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 30px;
              font-size: 13px;
            }
            .metadata-item span {
              display: block;
              color: #64748b;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .metadata-item strong {
              color: #0f172a;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 12px;
            }
            th {
              background-color: #f1f5f9;
              border-bottom: 2px solid #cbd5e1;
              color: #475569;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.5px;
              padding: 10px;
              text-align: left;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            tr:hover {
              background-color: #f8fafc;
            }
            .due-amount {
              color: #ef4444;
              font-weight: 700;
              font-size: 13px;
            }
            .totals-row {
              font-weight: 700;
              background-color: #f8fafc;
            }
            .totals-row td {
              border-top: 2px solid #cbd5e1;
              border-bottom: 2px solid #cbd5e1;
              font-size: 13px;
            }
            .footer-sig {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
            }
            .sig-block {
              border-top: 1px solid #cbd5e1;
              width: 200px;
              text-align: center;
              padding-top: 8px;
              font-size: 12px;
              color: #64748b;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="college-title">ACADEMIX DEFAULTERS ROSTER</h1>
              <div class="report-title">Formal Dues Ledger Notice</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <div>Notice Date: ${new Date().toLocaleDateString()}</div>
              <div>Period: ${activeMonth}</div>
            </div>
          </div>

          <div class="notice-banner">
            IMPORTANT: The following students have outstanding tuition and college fees that remain unpaid or partially paid for this billing period. Please issue immediate formal notifications to parents.
          </div>

          <div class="metadata-grid">
            <div class="metadata-item">
              <span>Billing Period</span>
              <strong>${activeMonth}</strong>
            </div>
            <div class="metadata-item">
              <span>Class filter</span>
              <strong>${classLabel}</strong>
            </div>
            <div class="metadata-item">
              <span>Section Filter</span>
              <strong>${sectionLabel}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Student Details</th>
                <th>Roll Number</th>
                <th>Class / Section</th>
                <th>Parent Phone</th>
                <th>Total Bill</th>
                <th>Paid Amount</th>
                <th>Outstanding Due</th>
              </tr>
            </thead>
            <tbody>
              ${defaulters.map(d => {
                const balance = d.totalAmount - d.paidAmount;
                const studentSection = d.student_id?.class && d.student_id?.section 
                  ? (sectionMap[`${d.student_id.class}_${d.student_id.section}`] || `Section ${d.student_id.section}`)
                  : '-';
                return `
                  <tr>
                    <td><strong>${d.student_id?.name || '-'}</strong></td>
                    <td style="font-family: monospace;">${d.student_id?.rollNumber || '-'}</td>
                    <td>${d.student_id?.class || '-'} (${studentSection})</td>
                    <td><span style="font-family: monospace;">${d.student_id?.phone || '-'}</span></td>
                    <td>Rs. ${d.totalAmount?.toLocaleString() || '0'}</td>
                    <td style="color: #166534;">Rs. ${d.paidAmount?.toLocaleString() || '0'}</td>
                    <td class="due-amount">Rs. ${balance.toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="totals-row">
                <td colspan="4" style="text-align: right; padding-right: 20px;">Roster Summary Totals:</td>
                <td>Rs. ${defaulters.reduce((acc, d) => acc + (d.totalAmount || 0), 0).toLocaleString()}</td>
                <td style="color: #166534;">Rs. ${defaulters.reduce((acc, d) => acc + (d.paidAmount || 0), 0).toLocaleString()}</td>
                <td style="color: #ef4444;">Rs. ${totalDueOnPage.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sig">
            <div class="sig-block">Prepared By Accountant</div>
            <div class="sig-block">Verified By Registrar</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Header and Banner Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <HiOutlineExclamation className="text-red-400" />
              <span>Outstanding Fee Defaulters</span>
            </h1>
            <span className="badge badge-danger py-0.5 px-2.5 text-[11px] font-semibold tracking-tight whitespace-nowrap">Alert</span>
          </div>
          <p className="text-surface-400 text-sm mt-1">
            Displaying students with incomplete or unpaid fee statuses for the active period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintDefaulters}
            disabled={defaulters.length === 0}
            className="btn-danger flex items-center gap-1.5 cursor-pointer text-xs py-2 px-3 font-semibold disabled:opacity-40 disabled:pointer-events-none"
            title="Print Defaulters Report"
          >
            <HiOutlinePrinter size={16} /> Print Defaulters
          </button>
        </div>
      </div>

      {/* Roster Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center justify-between border-white/[0.04] bg-[#0c1017]">
          <div>
            <p className="text-surface-400 text-xs font-bold uppercase tracking-wider">Total Defaulter Cases</p>
            <p className="text-2xl font-extrabold text-red-400 mt-1">{totalRecords}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <HiOutlineExclamation size={22} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between border-white/[0.04] bg-[#0c1017]">
          <div>
            <p className="text-surface-400 text-xs font-bold uppercase tracking-wider">Total Outstanding Dues</p>
            <p className="text-2xl font-extrabold text-red-400 mt-1">Rs. {totalDueOnPage.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <HiOutlineCurrencyRupee size={22} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between border-white/[0.04] bg-[#0c1017]">
          <div>
            <p className="text-surface-400 text-xs font-bold uppercase tracking-wider">Selected Month</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <HiOutlineBookOpen size={22} />
          </div>
        </div>
      </div>

      {/* Advanced Glassmorphic Query Filters */}
      <div className="glass-card p-5 bg-surface-900/60 border-white/[0.05] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <HiOutlineFilter size={16} className="text-red-400" />
            <span>Search & Roster Filters</span>
          </div>
          <button 
            onClick={handleResetFilters} 
            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <HiOutlineRefresh size={12} /> Clear Filters
          </button>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Student Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <span className="absolute left-3.5 text-surface-400">
              <HiOutlineSearch size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search student or roll #..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </form>

          {/* Month input */}
          <div>
            <input 
              type="month" 
              value={month} 
              onChange={e => { setMonth(e.target.value); setPage(1); }} 
              className="input-field w-full" 
            />
          </div>

          {/* Class Selector Dropdown */}
          <div className="relative">
            <select 
              value={classFilter} 
              onChange={e => { setClassFilter(e.target.value); setSectionFilter('ALL'); setPage(1); }} 
              className="input-field w-full"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Section Tabs (Visible only if a class filter is active) */}
        {classFilter && (
          <div className="pt-2 border-t border-white/[0.04] animate-slide-up">
            <div className="text-xs font-bold text-surface-400 mb-2 flex items-center gap-1.5">
              <HiOutlineBookOpen size={14} className="text-red-400" />
              <span>Available Section Classes:</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setSectionFilter('ALL'); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  sectionFilter === 'ALL'
                    ? 'bg-gradient-to-r from-red-500/80 to-red-600/90 text-white shadow-md border-transparent'
                    : 'bg-surface-800/80 border border-white/[0.05] text-surface-300 hover:text-white hover:bg-surface-700'
                }`}
              >
                All Sections
              </button>

              {classSections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => { setSectionFilter(sec.code); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    sectionFilter === sec.code
                      ? 'bg-gradient-to-r from-red-500/80 to-red-600/90 text-white shadow-md border-transparent'
                      : 'bg-surface-800/80 border border-white/[0.05] text-surface-300 hover:text-white hover:bg-surface-700'
                  }`}
                >
                  {sec.name} ({sec.code})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Glass Table */}
      <div className="glass-card overflow-hidden bg-surface-900/40 border-white/[0.05]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-400 text-xs font-medium">Fetching record sets from server...</p>
          </div>
        ) : defaulters.length === 0 ? (
          <div className="text-center py-20 text-surface-500 flex flex-col items-center gap-2">
            <p className="text-base font-semibold text-surface-300">No Defaulters Found for this month 🎉</p>
            <p className="text-xs text-surface-500 max-w-md">Everyone has cleared their dues under this query selection. Excellent work!</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Roll Number</th>
                    <th>Class & Section Name</th>
                    <th>Contact Phone</th>
                    <th>Monthly Billings</th>
                    <th>Amount Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {defaulters.map(d => {
                    const balance = d.totalAmount - d.paidAmount;
                    const studentSection = d.student_id?.class && d.student_id?.section 
                      ? (sectionMap[`${d.student_id.class}_${d.student_id.section}`] || `Section ${d.student_id.section}`)
                      : '-';
                    return (
                      <tr key={d._id} className="hover:bg-white/[0.02]">
                        <td className="font-semibold text-white py-4">
                          <span className="block text-sm">{d.student_id?.name || '-'}</span>
                          <span className="block text-[10px] text-surface-400 font-normal mt-0.5">{d.student_id?.email || 'No email registered'}</span>
                        </td>
                        <td className="font-mono text-xs font-semibold text-indigo-400">{d.student_id?.rollNumber || '-'}</td>
                        <td>
                          <span className="block text-xs font-medium">{d.student_id?.class || '-'}</span>
                          <span className="block text-[10px] text-surface-400 mt-0.5">{studentSection}</span>
                        </td>
                        <td className="font-mono text-xs text-surface-300">
                          {d.student_id?.phone ? (
                            <span className="flex items-center gap-1">
                              <HiOutlinePhone size={13} className="text-indigo-400" />
                              <span>{d.student_id.phone}</span>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="font-semibold text-white">Rs. {d.totalAmount?.toLocaleString()}</td>
                        <td className="text-emerald-400 font-semibold">Rs. {d.paidAmount?.toLocaleString()}</td>
                        <td className="text-red-400 font-extrabold">Rs. {balance.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${d.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Server-side Pagination Component */}
            <div className="px-4 pb-4">
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Defaulters;
