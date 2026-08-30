import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlinePlus, 
  HiOutlineCash, 
  HiOutlineExclamation, 
  HiOutlinePrinter, 
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineBookOpen,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineClock
} from 'react-icons/hi';
import Pagination from '../../components/common/Pagination';

const Fees = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAccountant = user?.role === 'accountant';
  const canManageFees = user?.role === 'accountant' || user?.role === 'admin';

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('');
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

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [students, setStudents] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  
  const [form, setForm] = useState({
    student_id: '',
    month: '',
    tuitionFee: 0,
    functionFee: 0,
    labFee: 0,
    fine: 0,
    scholarshipDeduction: 0,
    canteenDues: 0,
    otherCharges: 0,
    paidAmount: 0,
    remarks: ''
  });

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

  // Fetch fees list
  const fetchFees = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        month,
        status: statusFilter || undefined,
        class: classFilter || undefined,
        section: sectionFilter !== 'ALL' ? sectionFilter : undefined,
        search: search || undefined
      };

      const { data } = await api.get('/fees', { params });
      setFees(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when parameters or pagination changes
  useEffect(() => {
    fetchFees();
  }, [page, month, statusFilter, classFilter, sectionFilter]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFees();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setMonth(new Date().toISOString().slice(0, 7));
    setStatusFilter('');
    setClassFilter('');
    setSectionFilter('ALL');
    setSearch('');
    setPage(1);
  };

  // Open Create Fee Modal
  const openCreate = async () => {
    if (!canManageFees) return;
    try {
      const { data } = await api.get('/students?limit=300');
      setStudents(data.data || []);
    } catch {
      toast.error('Failed to load students list');
    }
    setForm({
      student_id: '',
      month: month,
      tuitionFee: 5000,
      functionFee: 0,
      labFee: 0,
      fine: 0,
      scholarshipDeduction: 0,
      canteenDues: 0,
      otherCharges: 0,
      paidAmount: 0,
      remarks: ''
    });
    setShowCreateModal(true);
  };

  // Submit Create Fee Record
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canManageFees) return;
    try {
      await api.post('/fees', form);
      toast.success('Fee record created successfully');
      setShowCreateModal(false);
      fetchFees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create fee record');
    }
  };

  // Open Pay Modal
  const openPayModal = (fee) => {
    if (!canManageFees) return;
    setSelectedFee(fee);
    const balance = fee.totalAmount - fee.paidAmount;
    setPayAmount(balance > 0 ? balance.toString() : '');
    setShowPayModal(true);
  };

  // Submit recorded payment to backend
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!canManageFees || !selectedFee) return;

    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive payment amount');
      return;
    }

    try {
      await api.put(`/fees/${selectedFee._id}/payment`, { amount });
      toast.success('Payment successfully recorded');
      setShowPayModal(false);
      fetchFees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    }
  };

  // Dynamic calculated stats for page view
  const stats = fees.reduce((acc, f) => {
    const total = f.totalAmount || 0;
    const paid = f.paidAmount || 0;
    acc.total += total;
    acc.paid += paid;
    acc.due += (total - paid);
    return acc;
  }, { total: 0, paid: 0, due: 0 });

  // Get unique classes based on sections list
  const uniqueClasses = [...new Set(sectionsList.map(s => s.className))];

  // Filter sections belonging to selected class
  const classSections = sectionsList.filter(s => s.className === classFilter);

  // Custom Styled Browser Printing
  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is active. Please enable pop-ups to print.');
      return;
    }

    const classLabel = classFilter || 'All Classes';
    const sectionLabel = sectionFilter !== 'ALL' ? (sectionMap[sectionFilter] || sectionFilter) : 'All Sections';
    const statusLabel = statusFilter ? statusFilter.toUpperCase() : 'ALL';
    const activeMonth = new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

    const htmlContent = `
      <html>
        <head>
          <title>Fee Ledger Report - ${activeMonth}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.4;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .college-title {
              font-size: 26px;
              font-weight: 700;
              color: #4f46e5;
              margin: 0;
            }
            .report-title {
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748b;
              margin-top: 5px;
            }
            .metadata-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
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
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 99px;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .badge-paid { background-color: #dcfce7; color: #15803d; }
            .badge-partial { background-color: #fef3c7; color: #b45309; }
            .badge-unpaid { background-color: #fee2e2; color: #b91c1c; }
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
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="college-title">ACADEMIX COLLEGE</h1>
              <div class="report-title">Student Fee Ledger Report</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <div>Date: ${new Date().toLocaleDateString()}</div>
              <div>Time: ${new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <div class="metadata-grid">
            <div class="metadata-item">
              <span>Month</span>
              <strong>${activeMonth}</strong>
            </div>
            <div class="metadata-item">
              <span>Class Filter</span>
              <strong>${classLabel}</strong>
            </div>
            <div class="metadata-item">
              <span>Section Filter</span>
              <strong>${sectionLabel}</strong>
            </div>
            <div class="metadata-item">
              <span>Status Filter</span>
              <strong>${statusLabel}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Class / Section</th>
                <th>Total Fee</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${fees.map(f => {
                const balance = f.totalAmount - f.paidAmount;
                const statusClass = f.status === 'paid' ? 'badge-paid' : f.status === 'partial' ? 'badge-partial' : 'badge-unpaid';
                return `
                  <tr>
                    <td><strong>${f.student_id?.name || '-'}</strong></td>
                    <td style="font-family: monospace;">${f.student_id?.rollNumber || '-'}</td>
                    <td>${f.student_id?.class || '-'} (${f.student_id?.section || '-'})</td>
                    <td>Rs. ${f.totalAmount?.toLocaleString() || '0'}</td>
                    <td style="color: #166534;">Rs. ${f.paidAmount?.toLocaleString() || '0'}</td>
                    <td style="color: #991b1b; font-weight: 600;">Rs. ${balance.toLocaleString()}</td>
                    <td><span class="badge ${statusClass}">${f.status}</span></td>
                  </tr>
                `;
              }).join('')}
              <tr class="totals-row">
                <td colspan="3" style="text-align: right; padding-right: 20px;">Page Summary Totals:</td>
                <td>Rs. ${stats.total.toLocaleString()}</td>
                <td style="color: #166534;">Rs. ${stats.paid.toLocaleString()}</td>
                <td style="color: #991b1b;">Rs. ${stats.due.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sig">
            <div class="sig-block">Prepared By</div>
            <div class="sig-block">Verified By Principal</div>
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
      
      {/* Upper header action banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Fee Management Dashboard</h1>
            <span className="badge badge-primary py-0.5 px-2.5 text-[11px] font-semibold tracking-tight whitespace-nowrap">Finance</span>
          </div>
          <p className="text-surface-400 text-sm mt-1">Configure class structures, track monthly student billings, and log payments</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {canManageFees && (
            <button 
              onClick={openCreate} 
              className="btn-primary cursor-pointer transition-all hover:opacity-95"
            >
              <HiOutlinePlus size={16} /> Add Fee Record
            </button>
          )}
          <button 
            onClick={() => navigate(user?.role === 'accountant' ? '/accountant/fees/defaulters' : '/admin/fees/defaulters')} 
            className="btn-secondary flex items-center gap-1.5 cursor-pointer text-xs py-2 px-3 font-semibold"
          >
            <HiOutlineExclamation size={16} className="text-red-400" /> Defaulters List
          </button>
          <button 
            onClick={handlePrintList} 
            disabled={fees.length === 0}
            className="btn-secondary flex items-center gap-1.5 cursor-pointer text-xs py-2 px-3 font-semibold disabled:opacity-40 disabled:pointer-events-none"
            title="Print Current List"
          >
            <HiOutlinePrinter size={16} className="text-indigo-400" /> Print List
          </button>
        </div>
      </div>

      {/* Mini Stats Display Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center justify-between border-white/[0.04] bg-[#0c1017]">
          <div>
            <p className="text-surface-400 text-xs font-bold uppercase tracking-wider">Page Billings</p>
            <p className="text-2xl font-extrabold text-white mt-1">Rs. {stats.total.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <HiOutlineCurrencyRupee size={22} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between border-white/[0.04] bg-[#0c1017]">
          <div>
            <p className="text-surface-400 text-xs font-bold uppercase tracking-wider">Page Amount Collected</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">Rs. {stats.paid.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <HiOutlineCheckCircle size={22} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between border-white/[0.04] bg-[#0c1017]">
          <div>
            <p className="text-surface-400 text-xs font-bold uppercase tracking-wider">Page Outstanding Balance</p>
            <p className="text-2xl font-extrabold text-red-400 mt-1">Rs. {stats.due.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <HiOutlineClock size={22} />
          </div>
        </div>
      </div>

      {/* Advanced Glassmorphic Filter Box */}
      <div className="glass-card p-5 bg-surface-900/60 border-white/[0.05] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <HiOutlineFilter size={16} className="text-indigo-400" />
            <span>Search & Query Filters</span>
          </div>
          <button 
            onClick={handleResetFilters} 
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <HiOutlineRefresh size={12} /> Clear Filters
          </button>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
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

          {/* Status Filter */}
          <div>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }} 
              className="input-field w-full"
            >
              <option value="">All Fee Statuses</option>
              <option value="paid">Paid Only</option>
              <option value="partial">Partial Dues</option>
              <option value="unpaid">Unpaid Dues</option>
            </select>
          </div>
        </div>

        {/* Custom Section Tabs (Visible only if a class filter is active) */}
        {classFilter && (
          <div className="pt-2 border-t border-white/[0.04] animate-slide-up">
            <div className="text-xs font-bold text-surface-400 mb-2 flex items-center gap-1.5">
              <HiOutlineBookOpen size={14} className="text-indigo-400" />
              <span>Available Section Classes:</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setSectionFilter('ALL'); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  sectionFilter === 'ALL'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md border-transparent'
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
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md border-transparent'
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
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-400 text-xs font-medium">Fetching record sets from server...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="text-center py-20 text-surface-500 flex flex-col items-center gap-2">
            <p className="text-base font-semibold text-surface-300">No Fee Records Found</p>
            <p className="text-xs text-surface-500 max-w-md">No billing items match your active filters. Try adjusting the query fields or create a new student record entry.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Roll Number</th>
                    <th>Class / Section</th>
                    <th>Month</th>
                    <th>Billing Total</th>
                    <th>Amount Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map(f => {
                    const balance = f.totalAmount - f.paidAmount;
                    return (
                      <tr key={f._id} className="hover:bg-white/[0.02]">
                        <td className="font-semibold text-white py-4">
                          <span className="block text-sm">{f.student_id?.name || '-'}</span>
                          <span className="block text-[10px] text-surface-400 font-normal mt-0.5">{f.student_id?.email || 'No email registered'}</span>
                        </td>
                        <td className="font-mono text-xs font-semibold text-indigo-400">{f.student_id?.rollNumber || '-'}</td>
                        <td>
                          <span className="block text-xs font-medium">{f.student_id?.class || '-'}</span>
                          <span className="block text-[10px] text-surface-400 mt-0.5">
                            {f.student_id?.class && f.student_id?.section 
                              ? (sectionMap[`${f.student_id.class}_${f.student_id.section}`] || `Section ${f.student_id.section}`)
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="text-xs font-medium text-surface-300">
                          {new Date(f.month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="font-semibold text-white">Rs. {f.totalAmount?.toLocaleString()}</td>
                        <td className="text-emerald-400 font-semibold">Rs. {f.paidAmount?.toLocaleString()}</td>
                        <td className={`font-semibold ${balance > 0 ? 'text-red-400' : 'text-surface-400'}`}>
                          Rs. {balance.toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${
                            f.status === 'paid' 
                              ? 'badge-success' 
                              : f.status === 'partial' 
                                ? 'badge-warning' 
                                : 'badge-danger'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {canManageFees && f.status !== 'paid' && (
                              <button 
                                onClick={() => openPayModal(f)} 
                                className="btn-secondary text-[11px] font-bold py-1.5 px-3 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                              >
                                <HiOutlineCash size={14} className="text-emerald-400" /> Pay
                              </button>
                            )}
                            {f.paidAmount > 0 && (
                              <button
                                onClick={() => {
                                  const rolePrefix = user?.role === 'accountant' ? '/accountant' : '/admin';
                                  navigate(`${rolePrefix}/fees/receipt/${f._id}`);
                                }}
                                className="p-2 rounded-xl bg-surface-800 border border-white/[0.05] hover:border-indigo-500 hover:text-indigo-400 transition cursor-pointer"
                                title="View Receipt Document"
                              >
                                <HiOutlinePrinter size={15} />
                              </button>
                            )}
                          </div>
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

      {/* =======================================
          MODAL: RECORD PAYMENT (Accountant Only)
          ======================================= */}
      {showPayModal && selectedFee && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content border-white/10 bg-[#0c1017]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HiOutlineCash size={22} className="text-emerald-400" />
                <span>Log Student Payment</span>
              </h2>
              <button onClick={() => setShowPayModal(false)} className="text-surface-400 hover:text-white text-lg bg-transparent border-none cursor-pointer">×</button>
            </div>

            <div className="p-4 bg-surface-900/60 rounded-xl border border-white/[0.04] mb-5 space-y-2 text-sm text-surface-300">
              <div className="flex justify-between">
                <span>Student:</span>
                <strong className="text-white">{selectedFee.student_id?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Roll Number:</span>
                <strong className="text-indigo-400 font-mono">{selectedFee.student_id?.rollNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Class / Section:</span>
                <strong className="text-white">
                  {selectedFee.student_id?.class} ({selectedFee.student_id?.section})
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Billing Period:</span>
                <strong className="text-white">{selectedFee.month}</strong>
              </div>
              <div className="border-t border-white/[0.04] my-2 pt-2 flex justify-between">
                <span>Billing Total:</span>
                <strong className="text-white">Rs. {selectedFee.totalAmount?.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Amount Paid Already:</span>
                <strong>Rs. {selectedFee.paidAmount?.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-red-400 font-bold text-base">
                <span>Remaining Balance Due:</span>
                <span>Rs. {(selectedFee.totalAmount - selectedFee.paidAmount).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Payment Amount (Rs.) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedFee.totalAmount - selectedFee.paidAmount}
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)} 
                  className="input-field" 
                  placeholder="Enter amount to pay..."
                  required 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center py-3 cursor-pointer">
                  Log Payment
                </button>
                <button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary flex-1 justify-center py-3 cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CREATE FEE RECORD (Accountant Only)
          ========================================== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-[620px] border-white/10 bg-[#0c1017]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HiOutlinePlus size={22} className="text-indigo-400" />
                <span>Create Fee Record</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-surface-400 hover:text-white text-lg bg-transparent border-none cursor-pointer">×</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Select Student *</label>
                <select 
                  value={form.student_id} 
                  onChange={e => setForm({ ...form, student_id: e.target.value })} 
                  className="input-field w-full" 
                  required
                >
                  <option value="">Choose Student from Roster...</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.rollNumber}) - {s.class} ({s.section})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Billing Month *</label>
                  <input 
                    type="month" 
                    value={form.month} 
                    onChange={e => setForm({ ...form, month: e.target.value })} 
                    className="input-field" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Tuition Fee (Rs.)</label>
                  <input 
                    type="number" 
                    value={form.tuitionFee} 
                    onChange={e => setForm({ ...form, tuitionFee: Number(e.target.value) })} 
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-surface-300 uppercase tracking-wider mb-1">Lab Fee</label>
                  <input 
                    type="number" 
                    value={form.labFee} 
                    onChange={e => setForm({ ...form, labFee: Number(e.target.value) })} 
                    className="input-field text-xs px-2.5" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-surface-300 uppercase tracking-wider mb-1">Function Fee</label>
                  <input 
                    type="number" 
                    value={form.functionFee} 
                    onChange={e => setForm({ ...form, functionFee: Number(e.target.value) })} 
                    className="input-field text-xs px-2.5" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-surface-300 uppercase tracking-wider mb-1">Fine</label>
                  <input 
                    type="number" 
                    value={form.fine} 
                    onChange={e => setForm({ ...form, fine: Number(e.target.value) })} 
                    className="input-field text-xs px-2.5" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-surface-300 uppercase tracking-wider mb-1">Canteen Dues</label>
                  <input 
                    type="number" 
                    value={form.canteenDues} 
                    onChange={e => setForm({ ...form, canteenDues: Number(e.target.value) })} 
                    className="input-field text-xs px-2.5" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Scholarship/Deduction (Rs.)</label>
                  <input 
                    type="number" 
                    value={form.scholarshipDeduction} 
                    onChange={e => setForm({ ...form, scholarshipDeduction: Number(e.target.value) })} 
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Other Charges (Rs.)</label>
                  <input 
                    type="number" 
                    value={form.otherCharges} 
                    onChange={e => setForm({ ...form, otherCharges: Number(e.target.value) })} 
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-white/[0.04] pt-3.5">
                <div>
                  <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Paid Amount initially (Rs.)</label>
                  <input 
                    type="number" 
                    value={form.paidAmount} 
                    onChange={e => setForm({ ...form, paidAmount: Number(e.target.value) })} 
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Calculated Total Billings</label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-surface-900 text-sm text-indigo-300 font-bold">
                    Rs. {(
                      form.tuitionFee + 
                      form.functionFee + 
                      form.labFee + 
                      form.fine - 
                      form.scholarshipDeduction + 
                      form.canteenDues + 
                      form.otherCharges
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">Remarks / Ledger Notes</label>
                <textarea 
                  value={form.remarks} 
                  onChange={e => setForm({ ...form, remarks: e.target.value })} 
                  className="input-field min-h-[60px]" 
                  placeholder="Optional billing remarks..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center py-3 cursor-pointer">
                  Save Fee Entry
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 justify-center py-3 cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Fees;
